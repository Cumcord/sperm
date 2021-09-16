#!/usr/bin/env node

const yargs = require('yargs');
const inquirer = require('inquirer');

// require commands
const init = require('./commands/init');
const build = require('./commands/build');
const dev = require('./commands/dev');
const gensite = require('./commands/gensite');

const argumentParser = yargs
  .scriptName('sperm')
  .usage('$0 <cmd> [args]')
  .help()
  .alias('h', 'help')
  .strict()
  .demand(1);

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
    return init(args);
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
  },
  build,
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
  },
  dev,
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
  gensite,
);

argumentParser.argv;
