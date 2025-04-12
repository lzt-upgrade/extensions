# lztup-extensions

Monorepo for all lztup extensions

## Guide

1. Use css / scss files instead of GM_addStyle.

`GM_addStyle` may not be available in some user script managers, or it may work differently. Therefore, we provide our own API to replace it, instead of the usual polyfiles.

```ts
import "./style.css";
import "./style.scss";
```

or you can use `injectStyle` function, but this isn't recommended for static code because it doesn't prepare css with lightningcss.

```ts
import { injectStyle } from "__style_helper__";

// text (string) - style code
// hash (string) - uniq hash or id of styles
injectStyle(text, hash);
```

## Install

1. Install Bun
2. Run `bun install` in the root directory
3. Build

```bash
bun run build:bun
```

## New UserScripts

You can easily add new userscripts by simply creating a new folder in root and adding `headers.json` and `index.ts` (or `index.js`) as entrypoint to it.

To ignore you can add folder to `ignoredDirs` in `lztup.config.ts` file
