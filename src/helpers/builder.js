const fs = require("fs").promises;
const rollup = require("rollup");
const path = require("path");

// rollup plugins
const esbuildPlugin = require("rollup-plugin-esbuild");
const esbuild = require("esbuild");
const nodeResolve = require("@rollup/plugin-node-resolve").nodeResolve;
const commonjs = require("@rollup/plugin-commonjs");
const json = require("@rollup/plugin-json");

module.exports = async function buildPlugin(
  inputFile = "cumcord_manifest.json",
) {
  await fs.access(inputFile).catch(() => {
    throw new Error(`${inputFile} does not exist`);
  });

  let importObj = {
    "react": "cumcord.modules.common.React",
    "react-dom": "cumcord.modules.common.ReactDOM",
  };

  const bundle = await rollup.rollup({
    input: inputFile,
    onwarn: () => { },
    external: [
      "react",
      "react-dom"
    ],
    plugins: [
      (() => {
        return {
          name: "cumcord-transforms",
          async transform(code, id) {
            if (id.endsWith(".jsx") || id.endsWith(".tsx")) {
              return {
                code: `${code}
import { React } from "@cumcord/modules/common";`,
                map: { mappings: "" }
              };
            } else if (id.endsWith(".css")) {
              let minifiedCSS = (await esbuild.transform(code, {minify: true, loader: "css"})).code;
              
              return {
                code: `export default () => cumcord.patcher.injectCSS(${JSON.stringify(minifiedCSS)});`,
                map: { mappings: "" }
              };
            }
          },
          resolveId(source) {
            if (source.startsWith("@cumcord")) {
              importObj[source] = ("cumcord" + source.split("@cumcord")[1].replaceAll("/", "."));
            }

            return null;
          },
        };
      })(),
      json(),
      nodeResolve({ browser: true }),
      commonjs({
        include: "node_modules/**",
        exclude: "!node_modules/**"
      }),
      esbuildPlugin({
        minify: true,
        target: ["es2021"]
      })
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
