const buildPlugin = require("../helpers/builder.js");
const path = require("path");

async function build(args) {
  console.log("Building plugin...");
  await buildPlugin(args.manifest, args.outdir);
  console.log(`Built plugin to ${path.join(args.outdir, "/")}.`);
}

module.exports = build;
