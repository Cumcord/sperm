#!/usr/bin/env node

// require commands
const yargs = require('yargs');

const argumentParser = yargs
  .scriptName('sperm')
  .usage('$0 <cmd> [args]')
  .alias('h', 'help')
  .showHelpOnFail(false)

// init command
argumentParser.command(
  'init [outfile]',
  'Creates a Cumcord manifest file at [outfile]',

  (yargs) => {
    // plugin name option
    yargs.positional('outfile', {
      type: 'string',
      default: 'cumcord_manifest.json',
    });

    yargs.option('name', {
      alias: 'n',
      type: 'string',
      default: undefined,
      describe: 'the name of the plugin',
    });

    // plugin description option
    yargs.option('description', {
      alias: 'd',
      type: 'string',
      default: undefined,
      describe: 'the description of the plugin',
    });

    // author option
    yargs.option('a', {
      alias: 'author',
      type: 'string',
      default: undefined,
      describe: 'the author of the plugin',
    });

    // main file option
    yargs.option('f', {
      alias: 'file',
      type: 'string',
      default: undefined,
      describe: 'the main file of the plugin',
    });

    // license option
    yargs.option('l', {
      alias: 'license',
      type: 'string',
      default: undefined,
      describe: 'the license of the plugin',
    });
  },
  (args) => {
    return require('./commands/init')(args);
  },
);

// build command
argumentParser.command(
  'build [manifest]',
  'Builds a Cumcord plugin from a [manifest] file',
  (yargs) => {
    yargs.positional('manifest', {
      type: 'string',
      default: 'cumcord_manifest.json',
      describe: 'a cumcord manifest file',
    });

    // outfile option
    yargs.option('o', {
      alias: 'outdir',
      type: 'string',
      default: 'dist',
    });

    yargs.option('c', {
      alias: 'config',
      type: 'string',
      default: 'sperm.config.js',
      describe: 'the path to a sperm config file',
    })

    yargs.option('esbuild', {
      type: 'boolean',
      default: false,
      describe: '(experimental) whether to use esbuild to bundle the plugin',
    })
  },
  (args) => {
    return require('./commands/build')(args);
  },
);

// dev command
argumentParser.command(
  'dev [manifest]',
  'Hot-rebuilds your plugin and sends it to the client',
  (yargs) => {
    yargs.positional('manifest', {
      type: 'string',
      default: 'cumcord_manifest.json',
      describe: 'a cumcord manifest file',
    });
    yargs.option('p', {
      alias: 'port',
      type: 'number',
      default: 6463,
      describe: 'the port to connect to',
    });
    yargs.option('c', {
      alias: 'config',
      type: 'string',
      default: 'sperm.config.js',
      describe: 'the path to a sperm config file',
    });
    yargs.option('esbuild', {
      type: 'boolean',
      default: false,
      describe: '(experimental) whether to use esbuild to bundle the plugin',
    });
  },
  (args) => {
    return require('./commands/dev')(args);
  },
);

// sitegen
argumentParser.command(
  'sitegen [manifest]',
  'Builds a static site for your plugin',
  (yargs) => {
    yargs.positional('manifest', {
      type: 'string',
      default: 'cumcord_manifest.json',
      describe: 'a cumcord manifest file',
    });

    yargs.option('o', {
      alias: 'outdir',
      type: 'string',
      default: 'dist',
    });
  },
  (args) => {
    return require('./commands/gensite')(args);
  },
);

argumentParser.parse();

if (argumentParser.argv._.length === 0) {
  argumentParser.showHelp();
}