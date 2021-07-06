const inquirer = require("inquirer");
const fs = require("fs").promises;

async function promptArg(arg, name, message) {
  return await inquirer
    .prompt([
      {
        type: "input",
        name,
        message,
      },
    ])
    .then((answers) => {
      return answers[name];
    });
}

async function init(args) {
  let argumentList = {
    name: args.name
      ? args.name
      : await promptArg(args.name, "name", "What is your plugin's name?"),
    description: args.description
      ? args.description
      : await promptArg(
          args.description,
          "description",
          "What is your plugin's description?"
        ),
    author: args.author
      ? args.author
      : await promptArg(args.author, "author", "Who created your plugin?"),
    file: args.file
      ? args.file
      : await promptArg(
          args.file,
          "file",
          "What is your plugin's main file path?"
        ),
  };

  if (!args.license) {
    license = await promptArg(
      args.license,
      "license",
      "What license does your plugin use?"
    );

    if (license != "" && license.toLowerCase() != "none") {
      argumentList.license = license;
    }
  } else {
    license = args.license;
  }

  try {
    await fs.writeFile(args.outfile, JSON.stringify(argumentList, null, 2));
    console.log(`Wrote manifest to ${args.outfile}.`);
    return true;
  } catch (e) {
    throw e;
  }
}

module.exports = init;
