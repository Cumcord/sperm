import buildPlugin from "../helpers/builder.js"
import path from "path"
import {existsSync} from "fs"
import fs from "fs/promises"
import crypto from "crypto";

export default async function (args) {
  console.log("Building plugin...");

  await fs.access(args.manifest).catch(() => {
    throw new Error(`${args.manifest} does not exist`);
  });

  let manifestJson;
  try {
    manifestJson = JSON.parse(await fs.readFile(args.manifest, "utf8"));
  } catch {
    throw new Error(`${args.manifest} is not valid json`);
  }

  let spermConfig;
  if (existsSync(args.config)) {
    spermConfig = require(path.resolve(args.config))
  }

  try {
    await (await buildPlugin(manifestJson.file, false, spermConfig, args.esbuild)).write(args.outdir);
  } catch (e) {
    console.log(e.stack)
    process.exit(1)
  }

  await fs.access(args.outdir).catch(() => fs.mkdir(args.outdir));

  let manifestCopy = manifestJson;
  delete manifestCopy.file;

  // get sha265 hash of plugin.js file
  manifestCopy.hash = await fs
    .readFile(path.join(args.outdir, "plugin.js"), "utf8")
    .then((data) => {
      return crypto.createHash("sha256").update(data).digest("hex");
    });

  await fs.writeFile(
    path.join(args.outdir, "plugin.json"),
    JSON.stringify(manifestCopy)
  );

  console.log(`Built plugin to ${path.join(args.outdir, "/")}.`);
};
