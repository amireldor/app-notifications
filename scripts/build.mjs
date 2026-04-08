import { mkdir, rm, writeFile } from "node:fs/promises";

await rm(new URL("../dist/", import.meta.url), { recursive: true, force: true });

await mkdir(new URL("../dist/cjs/", import.meta.url), { recursive: true });

await writeFile(
  new URL("../dist/cjs/package.json", import.meta.url),
  `${JSON.stringify({ type: "commonjs" }, null, 2)}\n`,
  "utf8",
);
