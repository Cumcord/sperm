# sperm

sperm is a Discord plugin builder that makes plugins that work with every Discord client mod through [Cumcord](https://github.com/Cumcord/Cumcord).

# Installation

`npm i -g sperm`

# Usage

All CLI functionality of sperm can be done via CLI switches to allow users to automate plugin builds using scripts or CI tools.

Use `sperm --help [command]` to get information on what a command does and what CLI switches it can use.

- `sperm init` will prompt you for information regarding your plugin and create a manifest.
- `sperm build` will build a plugin from `cumcord_manifest.json` to `dist/` by default.
- `sperm dev` will automatically open a connection to Cumcord's built-in development websocket to hot-reload your plugin and report errors.
- `sperm helper` will automatically generate "installation helper" plugins for GooseMod, BetterDiscord, Powercord, or Vizality ([NOT RECOMMENDED](https://cumcord.github.io/why-vizality-sucks)) that install Cumcord and your plugins seamlessly without any work from you or your users.

# Distributing Builds

Distributing built plugins can be done in 3 ways:

1. Distributing a helper plugin generated through `sperm helper`.
2. Distributing a link to your plugin's `dist` folder and telling users to install it through Cumcord's settings UI. (example: `https://cumcord-plugin.github.io/dist/`)
3. Distributing a link to Cumcord's "web plugin installer" for users who already have Cumcord, which will talk to Cumcord's websocket to prompt the user to install a plugin in Discord itself. (example `https://cumcord.github.io/install-plugin#https://cumcord-plugin.github.io/dist/`)

# What is supported?

sperm uses [Rollup](https://rollupjs.org/) and [Babel](https://babeljs.io/) to do the heavy-lifting and as a result your plugin may include these file types:

- .js (Obviously.)
- .jsx (REQUIRES YOU IMPORT REACT FROM "@cumcord/modules/commonModules")
- .es6
- .es
- .mjs

# Contributing

You can submit patches and development ideas on our [development mailing list](https://lists.sr.ht/~creatable/cumcord-devel).  
You can talk about Cumcord on our [discussion mailing list](https://lists.sr.ht/~creatable/cumcord-discuss).  
Announcements can be found on our [announcements mailing list](https://lists.sr.ht/~creatable/cumcord-announce).
