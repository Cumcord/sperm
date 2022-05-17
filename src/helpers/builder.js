const fs = require("fs").promises;
const rollup = require("rollup");
const path = require("path");

// rollup plugins
const esbuildPlugin = require("rollup-plugin-esbuild").default;
const esbuild = require("esbuild");
const nodeResolve = require("@rollup/plugin-node-resolve").nodeResolve;
const commonjs = require("@rollup/plugin-commonjs");
const json = require("@rollup/plugin-json");
const injectPlugin = require("@rollup/plugin-inject");

const sass = require("sass");

module.exports = async function buildPlugin(
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
      async transform(code, id) {
        if (id.endsWith(".css")) {
          let minifiedCSS = (
            await esbuild.transform(code, {
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

        if (id.endsWith(".scss") || id.endsWith(".sass")) {
          const built = sass.compile(id).css;
          const minified = (
            await esbuild.transform(built, {
              minify: true,
              loader: "css",
            })
          ).code.trim();

          return {
            code: `import { injectCSS } from "@cumcord/patcher";
            export default () => injectCSS(${JSON.stringify(minified)});`,
          };
        }

        return null;
      },
      async load(id) {
        if (id.endsWith(":static")) {
          let code = await fs.readFile(id.slice(0, -":static".length), "utf-8");
          return {
            code: `export default ${JSON.stringify(code)}`,
            map: { mappings: "" },
          };
        }

        return null;
      },
    },
    injectPlugin({
      React: ["@cumcord/modules/common/React", "*"],
    }),
    json(),
    nodeResolve({ browser: true }),
    commonjs({
      include: /.*\/node_modules\/.*/,
    }),
  ];

  const rollupConfig = {
    input: inputFile,
    onwarn: () => {},
    external: ["react", "react-dom"],
    plugins: [
      esbuildPlugin({
        minify: !dev,
        target: ["es2021"],
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
    plugins: [...(config?.rollup?.outPlugins ? config.rollup.outPlugins : [])],
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
