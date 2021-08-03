const fs = require("fs").promises;
const rollup = require("rollup");
const path = require("path");
const crypto = require("crypto");

// rollup plugins
const nodeResolve = require("@rollup/plugin-node-resolve").nodeResolve;
const babel = require("@rollup/plugin-babel").babel;
const terser = require("rollup-plugin-terser").terser;
const alias = require("@rollup/plugin-alias");
const objectExists = require("rollup-plugin-object-exists");

// Babel is whiny and doesn't like using presets that aren't inside of the plugin's node_modules directory.
const babel_preset_react = require("@babel/preset-react");

const modPrefix = "@cumcord";
const aliases = [
  {
    find: `${modPrefix}`,
    replacement: path.join(__dirname, "../bindings/base"),
  },
];

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

  const bundle = await rollup.rollup({
    input: manifestJson.file,
    onwarn: () => {},
    plugins: [
      nodeResolve(),

      alias({ entries: aliases }),

      babel({
        babelHelpers: "bundled",
        presets: [babel_preset_react],
      }),

      objectExists(["BdApi", "ZeresPluginLibrary", "BDFDB_Global", "powercord"], (modApis) => {
        throw new Error(`Using client mod / library specific APIs (${modApis.join(", ")}) goes against Cumcord's core philosophy of making plugins that work everywhere.`)
      }),
    ],
  });

  // check if outDir exists with fs.promises and if not create it
  await fs.access(outDir).catch(() => fs.mkdir(outDir));

  await bundle.write({
    file: path.join(outDir, "plugin.js"),
    format: "iife",
    compact: true,
    plugins: [
      terser({
        mangle: true,
        compress: {
          side_effects: false,
          negate_iife: false,
        },
      }),
    ],
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
