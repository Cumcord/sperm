const buildPlugin = require("../helpers/builder.js");
const ws = require("ws");
const chalk = require("chalk");
const chokidar = require("chokidar");
const fs = require("fs").promises;
const path = require("path");

// a function that finds an open websocket port using a port range
async function findPort(start, increment) {
  let port = start -1;
  let promiseList = [];
  while (port < start + increment) {
    port += 1;

    promiseList.push(new Promise((resolve, reject) => {
      let socket = new ws(`ws://127.0.0.1:${port}/cumcord`);

      socket.on("error", () => {
        socket.close();
        resolve(false);
      });

      socket.on("open", () => {
        socket.close();
        resolve(port);
      })
    }))

    for (let promise of promiseList) {
      let resolution = await promise;
      if (resolution != false) {
        return resolution;
      }
    }
  }
}

async function dev(args) {
  let watchFiles;
  const port = (await findPort(args.port, 10));

  if (!port) {
    throw new Error("Could not find an open port.");
  }

  let server = `ws://127.0.0.1:${port}/cumcord`;
  const client = new ws(server);
  console.log(chalk`{green [CONNECT]} {white Connected to development websocket at} {yellow ${server}}{white .}`);


  await fs.access(args.manifest).catch(() => {
    throw new Error(`${args.manifest} does not exist`);
  });

  let manifestJson;
  try {
    manifestJson = JSON.parse(await fs.readFile(args.manifest, "utf8"));
  } catch {
    throw new Error(`${args.manifest} is not valid json`);
  }

  // cleanup on exit
  process.on("SIGINT", () => {
    client.close();
    console.log(chalk`{red [DISCONNECT]} {white Disconnected from development websocket.}`);
    process.exit();
  });

  chokidar.watch(".", { ignoreInitial: true }).on("all", async () => {
    console.log(chalk`{blue [REBUILD]} {white Rebuilding plugin...}`);
    let data;
    try {
      data = await (await buildPlugin(manifestJson.file)).get();
    } catch {
      console.log(chalk`{red [ERROR]} {white Failed to rebuild plugin.}`);
      return;
    }
    
    console.log(chalk`{green [SEND]} {white Sending plugin to client...}`);
    client.send(JSON.stringify({
      action: "INSTALL_PLUGIN_DEV",
      code: data[0].code
    }));
  })
  
  client.on("message", (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch {
      console.log(chalk`{red [ERROR]} {white Could not parse message from development websocket.}`);
      return;
    }

    if (data.status == "ERROR") {
      console.log(chalk`{red [ERROR]} {white ${data.message}}`);
      return;
    }
  })
}

module.exports = dev;