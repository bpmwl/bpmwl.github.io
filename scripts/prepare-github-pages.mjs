import { copyFile, writeFile } from "node:fs/promises";
import path from "node:path";

const client = path.join(process.cwd(), "dist/client");
await copyFile(path.join(client, "index.html"), path.join(client, "404.html"));
await writeFile(path.join(client, ".nojekyll"), "");
