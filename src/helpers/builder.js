const fs = require("fs").promises;
const rollup = require("rollup");
const path = require("path");
const crypto = require("crypto");

// rollup plugins
const esbuild = require("rollup-plugin-esbuild");
const nodeResolve = require("@rollup/plugin-node-resolve").nodeResolve;

module.exports = async function buildPlugin(
  manifest = "cumcord_manifest.json",
  outDir = "dist"
) {
  await fs.access(manifest).catch(() => {
    throw new Error(`${manifest} does not exist`);
  });

  let manifestJson;
  try {
    manifestJson = JSON.parse(await fs.readFile(manifest, "utf8"));
  } catch {
    throw new Error(`${manifest} is not valid json`);
  }

  let importObj = {};
  const bundle = await rollup.rollup({
    input: manifestJson.file,
    onwarn: () => { },
    external: (importpath) => {
      if (importpath.startsWith("@cumcord")) {
        importObj[importpath] = ("cumcord" + importpath.split("@cumcord")[1].replaceAll("/", "."));
      }
    },
    plugins: [
      nodeResolve({ browser: true }),
      (() => {
        return {
          name: "add-react",
          transform(code, id) {
            if (id.endsWith(".jsx") || id.endsWith(".tsx")) {
              return {
                code: `import { React } from "@cumcord/modules/common";
${code}`,
                map: { mappings: "" }
              };
            }
          }
        };
      })(),
      esbuild({
        minify: true,
      })
    ],
  });
  // check if outDir exists with fs.promises and if not create it
  await fs.access(outDir).catch(() => fs.mkdir(outDir));

  await bundle.write({
    file: path.join(outDir, "plugin.js"),
    format: "iife",
    compact: true,
    globals: importObj,
  });

  await bundle.close();

  let manifestCopy = manifestJson;
  delete manifestCopy.file;

  // get sha265 hash of plugin.js file
  manifestCopy.hash = await fs
    .readFile(path.join(outDir, "plugin.js"), "utf8")
    .then((data) => {
      return crypto.createHash("sha256").update(data).digest("hex");
    });

  await fs.writeFile(
    path.join(outDir, "plugin.json"),
    JSON.stringify(manifestCopy)
  );
};
