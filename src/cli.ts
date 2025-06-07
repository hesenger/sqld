#!/usr/bin/env node

import { existsSync, readFileSync } from "fs";

const args = process.argv.slice(2);
const configPath = args[0] + "/sqld.json";
if (!existsSync(configPath)) {
  console.error("sqld.json not found");
  process.exit(1);
}

const sqldConfig = JSON.parse(readFileSync(configPath, "utf8"));
console.log(sqldConfig);
