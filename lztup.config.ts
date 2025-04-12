export default {
  ignoredDirs: ["node_modules", "themes"],
  minify: Boolean(Bun.env.MINIFY),
  metaFile: "headers.json",
};
