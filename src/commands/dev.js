const buildPlugin = require("../helpers/builder.js");
const ws = require("ws");
const chalk = require("chalk");
const chokidar = require("chokidar");
const fs = require("fs").promises;
const http = require("http");

function initializeServer() {
  let pluginData = "";

  const server = http.createServer((_, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.writeHead(200);
    res.end(pluginData);
  });

  server.listen(42069, "127.0.0.1");

  return {
    httpserver: server,
    update(data) {
      pluginData = data;
    },
  };
}

// a function that finds an open websocket port using a port range
async function findPort(start, increment) {
  let port = start - 1;
  while (port < start + increment) {
    port += 1;

    let val = await new Promise((resolve) => {
      let socket = new ws(`ws://127.0.0.1:${port}/cumcord`);
      socket.on("open", () => {
        socket.close();
        resolve(port);
      });

      socket.on("error", () => {
        resolve(false);
      });

      socket.on("close", () => {
        resolve(false);
      });

      setInterval(() => {
        resolve(false);
      }, 50);
    });

    if (val) {
      return val;
    } else if (port == start + increment) {
      throw new Error("Could not find an open port.");
    }
  }
}

async function dev(args) {
  let manifestJson;
  try {
    manifestJson = JSON.parse(await fs.readFile(args.manifest, "utf8"));
  } catch {
    throw new Error(`${args.manifest} is not valid json`);
  }

  const port = await findPort(args.port, 10);

  if (!port) {
    throw new Error("Could not find an open port.");
  }

  let { httpserver, update } = initializeServer();
  let server = `ws://127.0.0.1:${port}/cumcord`;
  const client = new ws(server);

  function sendToClient(code) {
    update(code);
    client.send(
      JSON.stringify({
        action: "UPDATE_PLUGIN_DEV",
      })
    );
  }

  console.log(
    chalk`{green [CONNECT]} {white Connected to development websocket at} {yellow ${server}}{white .}`
  );

  client.on("open", async () => {
    console.log(chalk`{green [BUILD]} {white Building plugin...}`);
    let data = await getBuild();

    if (data) {
      console.log(chalk`{green [SEND]} {white Sending plugin to client...}`);
      sendToClient(data[0].code);
    }
  });

  await fs.access(args.manifest).catch(() => {
    throw new Error(`${args.manifest} does not exist`);
  });

  async function getBuild() {
    try {
      return await (await buildPlugin(manifestJson.file, true)).get();
    } catch (err) {
      console.log(chalk`{red [ERROR]} {white Failed to rebuild plugin.}`);
      console.log(chalk`{red ${err}}`);
    }
  }

  // cleanup on exit
  process.on("SIGINT", () => {
    httpserver.close();
    client.close();
    console.log(
      chalk`{red [DISCONNECT]} {white Disconnected from development websocket.}`
    );
    process.exit();
  });

  chokidar.watch(".", { ignoreInitial: true }).on("all", async () => {
    console.log(chalk`{blue [REBUILD]} {white Rebuilding plugin...}`);

    let data = await getBuild();
    if (!data) return;

    console.log(chalk`{green [SEND]} {white Sending plugin to client...}`);
    sendToClient(data[0].code);
  });

  client.on("message", (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch {
      console.log(
        chalk`{red [ERROR]} {white Could not parse message from development websocket.}`
      );
      return;
    }

    if (data.status == "ERROR") {
      console.log(chalk`{red [ERROR]} {white ${data.message}}`);
      return;
    }
  });
}

module.exports = dev;
