const fs = require("fs").promises;
const rollup = require("rollup");
const path = require("path");

// rollup plugins
const esbuild = require("rollup-plugin-esbuild");
const nodeResolve = require("@rollup/plugin-node-resolve").nodeResolve;
const json = require("@rollup/plugin-json");

module.exports = async function buildPlugin(
  inputFile = "cumcord_manifest.json",
) {
  await fs.access(inputFile).catch(() => {
    throw new Error(`${inputFile} does not exist`);
  });

  let importObj = {};
  const bundle = await rollup.rollup({
    input: inputFile,
    onwarn: () => { },
    external: (importpath) => {
      if (importpath.startsWith("@cumcord")) {
        importObj[importpath] = ("cumcord" + importpath.split("@cumcord")[1].replaceAll("/", "."));
      } /* 
        I'll be honest: every single Rollup hack I'm using makes no fucking sense whatsoever.
        Do I care? Not really.
        Does it matter? Probably, but I don't care.
        Does it work? Yes.

        If it works, I don't care.
      */
      else if (importpath == "react") {
        importObj["react"] = "cumcord.modules.common.React";
        return "cumcord.modules.common.React"
      } else if (importpath == "react-dom") {
        importObj["react-dom"] = "cumcord.modules.common.ReactDOM";
        return "cumcord.modules.common.ReactDOM"
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
        target: ["es2021"]
      }),
      json()
    ],
  });

  let outputOptions = {
    format: "iife",
    compact: true,
    globals: importObj,
  }

  return {
    async write(outDir) {
      await bundle.write({
        ...outputOptions,
        file: path.join(outDir, "plugin.js"),
      });

      await bundle.close();
    },

    async get() {
      const { output } = await bundle.generate(outputOptions);
      await bundle.close();
      return output;
    },
    
    watchFiles: bundle.watchFiles,
  }
};
