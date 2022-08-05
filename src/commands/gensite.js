import fs from "fs/promises";
import path from "path";

export default async function (args) {
  console.log('Building site...');

  await fs.access(args.manifest).catch(() => {
    throw new Error(`${args.manifest} does not exist`);
  });

  let manifestJson;
  try {
    manifestJson = JSON.parse(await fs.readFile(args.manifest, 'utf8'));
  } catch {
    throw new Error(`${args.manifest} is not valid json`);
  }

  let html =
    '<html><head><title>[TITLE]</title></head><body><h1>[TITLE]</h1><h2>[DESC]</h2></body></html>';
  html = html.replace(/\[TITLE\]/g, manifestJson.name);
  html = html.replace(/\[DESC\]/g, manifestJson.description);

  await fs.writeFile(path.join(args.outdir, 'index.html'), html);

  console.log(`Wrote static site to ${path.join(args.outdir, '/')}.`);
};
