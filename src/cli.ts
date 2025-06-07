#!/usr/bin/env node

import { existsSync, readFileSync } from "fs";
import {
  parseAndValidateConfig,
  parseAndValidateSchema,
  Schema,
} from "./schema/parser";
import path from "path";

const args = process.argv.slice(2);
const configPath = path.resolve(args[0], "sqld.json");
if (!existsSync(configPath)) {
  console.error("sqld.json not found");
  process.exit(1);
}

const sqldConfig = readFileSync(configPath, "utf8");
const { parsedConfig, errors } = parseAndValidateConfig(sqldConfig);

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const schemas: Schema[] = [];
for (const schema of parsedConfig?.schemas ?? []) {
  const { parsedSchema, errors } = parseAndValidateSchema(
    readFileSync(path.resolve(args[0], schema), "utf8"),
  );

  if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exit(1);
  }

  schemas.push(parsedSchema!);
}

console.log(JSON.stringify(schemas, null, 2));
