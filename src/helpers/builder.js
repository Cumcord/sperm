import fs from "fs/promises"
import * as rollup from "rollup"
import path from "path"

// rollup plugins
import esbuildPlugin from "rollup-plugin-esbuild";
import esbuild from "esbuild";
import {nodeResolve} from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import injectPlugin from "@rollup/plugin-inject";
import sass from "sass";

export default async function buildPlugin(
  inputFile = "cumcord_manifest.json",
  dev = false,
  config
) {
  if (!config) {
    config = {
      rollup: {
        inPlugins: [],
        outPlugins: [],
      },
    };
  }

  await fs.access(inputFile).catch(() => {
    throw new Error(`${inputFile} does not exist`);
  });

  const rollupPlugins = [
    ...(config?.rollup?.inPlugins ? config.rollup.inPlugins : []),
    {
      name: "cumcord-transforms",
      // S/CSS compilation
      async transform(code, id) {
        const isSass = id.endsWith(".sass") || id.endsWith(".scss")
        if (id.endsWith(".css") || isSass) {
          const cssCode = isSass ? sass.compile(id).css : code;

          const minifiedCSS = (
            await esbuild.transform(cssCode, {
              minify: true,
              loader: "css",
            })
          ).code.trim();

          return {
            code: `import { injectCSS } from "@cumcord/patcher";
            export default () => injectCSS(${JSON.stringify(minifiedCSS)});`,
            map: { mappings: "" },
          };
        }

        return null;
      },
      // pack :static imports as strings
      async load(id) {
        if (!id.endsWith(":static")) return null;

        const code = await fs.readFile(id.slice(0, -":static".length), "utf-8");
        return {
          code: `export default ${JSON.stringify(code)}`,
          map: {mappings: ""},
        };
      },
    },
    injectPlugin({
      React: ["@cumcord/modules/common/React", "*"],
    }),
    json(),
    nodeResolve({ browser: true }),
    // allow require() in deps for compat but not in user code - use ESM!!!!
    commonjs({
      include: /.*\/node_modules\/.*/,
    }),
  ];

  const rollupConfig = {
    input: inputFile,
    onwarn: () => {},
    external: ["react", "react-dom"],
    plugins: [
      // first esbuild step
      // bundles without minifying
      esbuildPlugin({
        // minifying here breaks IIFEs (???)
        //minify: !dev,
        target: "esnext"
      }),
      ...rollupPlugins,
    ],
  };

  const bundle = await rollup.rollup(rollupConfig);

  let outputOptions = {
    format: "iife",
    compact: !dev,
    globals(id) {
      if (id.startsWith("@cumcord")) return id.substring(1).replace(/\//g, ".");

      const map = {
        react: "cumcord.modules.common.React",
        "react-dom": "cumcord.modules.common.ReactDOM",
      };

      return map[id] || null;
    },
    plugins: [
      ...(config?.rollup?.outPlugins ? config.rollup.outPlugins : []),
      // second esbuild step
      // minifies as the last step without killing the IIFE
      esbuildPlugin({
        target: "esnext",
        minify: !dev
      })
    ],
  };

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
  };
};
