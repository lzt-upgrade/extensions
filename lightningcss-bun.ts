import path from "node:path";
import browserslist from "browserslist";
import { browserslistToTargets, bundle, transform } from "lightningcss";
import type { CustomAtRules, TransformOptions } from "lightningcss";

import * as sass from "sass";

export type LightningcssPluginOptions<C extends CustomAtRules> = Omit<
  TransformOptions<C>,
  "filename" | "code"
> & {
  browserslist?: string | readonly string[];
};

// Modified for supporting sass https://github.com/wobsoriano/bun-lightningcss/
export default function lightningcssPlugin<C extends CustomAtRules>(
  options: LightningcssPluginOptions<C> = {},
): import("bun").BunPlugin {
  return {
    name: "bun-lightningcss",
    setup({ onLoad, onResolve, config }) {
      const defaultOptions: LightningcssPluginOptions<C> = {
        minify: true,
        sourceMap: true,
        cssModules: true,
        projectRoot: path.join(process.cwd(), config.outdir || "dist"),
      };
      const { browserslist: browserslistOpts, ...lightningOpts } =
        options ?? {};
      const targets = browserslistToTargets(browserslist(browserslistOpts));

      onResolve({ filter: /^__style_helper__$/ }, (args) => {
        return {
          path: args.path,
          namespace: "style-helper",
        };
      });

      onLoad({ filter: /.*/, namespace: "style-helper" }, async () => {
        return {
          contents: `
            export function injectStyle(text, hash) {
              if (typeof document === 'undefined') {
                return;
              }

              const styleTag = document.getElementById(\`lztup_\${hash}\`)
              if (styleTag) {
                return;
              }

              const style = document.createElement('style');
              style.id = \`lztup_\${hash}\`;
              style.innerText = text;
              document.head.appendChild(style);
            }
          `,
          loader: "js",
        };
      });

      const quote = JSON.stringify;
      const escape = (string: string) => quote(string).slice(1, -1);
      const getHash = (code: string) =>
        // quote(Bun.hash.wyhash(code + Date.now()).toString(16));
        quote(Bun.hash.wyhash(code).toString(16));

      if (defaultOptions.cssModules) {
        onLoad({ filter: /\.module\.css$/ }, ({ path }) => {
          const { code, exports = {} } = bundle({
            filename: path,
            ...defaultOptions,
            targets,
            ...lightningOpts,
          });

          let contents = "";

          const dependencies = new Map<string, string>();

          const importDependency = (path: string) => {
            if (dependencies.has(path)) return dependencies.get(path);

            const dependenciesName = `dependency_${dependencies.size}`;
            // prepend dependency to to the contents
            contents = `import ${dependenciesName} from ${quote(
              path,
            )}\n${contents}`;
            dependencies.set(path, dependenciesName);
            return dependenciesName;
          };

          const styles = quote(code.toString());
          const hash = getHash(styles);

          contents += "import { injectStyle } from '__style_helper__'\n";
          contents += `injectStyle(${styles}, ${hash})\n`;
          contents += "export default {";

          // Credits to https://github.com/mhsdesign/esbuild-plugin-lightningcss-modules
          for (const [cssClassReadableName, cssClassExport] of Object.entries(
            exports,
          )) {
            let compiledCssClasses = `"${escape(cssClassExport.name)}`;

            if (cssClassExport.composes) {
              for (const composition of cssClassExport.composes) {
                switch (composition.type) {
                  case "local":
                  case "global":
                    compiledCssClasses += ` ${escape(composition.name)}`;
                    break;
                  case "dependency":
                    compiledCssClasses += ` " + ${importDependency(
                      composition.specifier,
                    )}[${quote(composition.name)}] + "`;
                    break;
                }
              }
            }

            compiledCssClasses += '"';

            contents += `${JSON.stringify(
              cssClassReadableName,
            )}:${compiledCssClasses},`;
          }

          contents += "}";

          // https://github.com/evanw/esbuild/issues/2943#issuecomment-1439755408
          const emptyishSourceMap =
            "data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIiJdLCJtYXBwaW5ncyI6IkEifQ==";
          contents += `\n//# sourceMappingURL=${emptyishSourceMap}`;

          return {
            contents,
            loader: "js",
          };
        });
      }

      onLoad({ filter: /^.*\.css(?!\.module\.css)$/ }, ({ path }) => {
        const { code } = bundle({
          filename: path,
          ...defaultOptions,
          targets,
          ...lightningOpts,
          cssModules: false,
        });

        const styles = quote(code.toString());
        const hash = getHash(styles);

        const contents = `
        import { injectStyle } from '__style_helper__'
        injectStyle(${styles}, ${hash})

        export default {}
        `;

        return {
          contents,
          loader: "js",
        };
      });

      onLoad({ filter: /^.*\.(sc|sa)ss$/ }, ({ path }) => {
        const { css: sassCode } = sass.compile(path);
        const { code } = transform({
          filename: path,
          code: new Uint8Array(Buffer.from(sassCode)),
          ...defaultOptions,
          targets,
          ...lightningOpts,
          cssModules: false,
        });

        const styles = quote(code.toString());
        const hash = getHash(styles);

        const contents = `
        import { injectStyle } from '__style_helper__'
        injectStyle(${styles}, ${hash})

        export default {}
        `;

        return {
          contents,
          loader: "js",
        };
      });
    },
  };
}
