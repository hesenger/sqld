export interface Config {
  schemas: string[];
  queries: string[];
}

export function parseAndValidateConfig(schema: string): {
  parsedConfig: Config | null;
  errors: string[];
} {
  const parsedSchema = JSON.parse(schema);
  const errors: string[] = [];

  if (!Array.isArray(parsedSchema.schemas)) {
    errors.push("sqld config invalid: schemas must be an array");
  } else if (parsedSchema.schemas.length === 0) {
    errors.push("sqld config invalid: schemas must not be empty");
  }

  if (!Array.isArray(parsedSchema.queries)) {
    errors.push("sqld config invalid: queries must be an array");
  } else if (parsedSchema.queries.length === 0) {
    errors.push("sqld config invalid: queries must not be empty");
  }

  if (errors.length > 0) {
    return { parsedConfig: null, errors };
  }

  return { parsedConfig: parsedSchema, errors: [] };
}

interface Schema {
  tables: Table[];
}

interface Table {
  name: string;
  columns: Column[];
}

interface Column {
  name: string;
  type: string;
}

export function parseAndValidateSchema(schema: string): {
  parsedSchema: Schema | null;
  errors: string[];
} {
  const errors: string[] = [];

  const parsedSchema: Schema = {
    tables: [],
  };

  const createTableRegex = /CREATE TABLE (\w+)\s*\(([\s\S]*?)\);/gim;
  const matches = schema.matchAll(createTableRegex);

  for (const match of matches) {
    if (!match) {
      errors.push("sqld schema invalid: invalid schema content");
      break;
    }

    const tableName = match[1];
    const columns = match[2].split(",").map((column) => column.trim());

    const columnRegex = /(\w+)\s+([\w\(\)]+)/;
    const columnMatches = columns
      .map((column) => column.match(columnRegex))
      .filter((column) => column !== null);

    parsedSchema.tables.push({
      name: tableName,
      columns: columnMatches.map((column) => ({
        name: column[1],
        type: column[2],
      })),
    });
  }

  if (parsedSchema.tables.length === 0) {
    errors.push("sqld schema invalid: no tables found");
  }

  const countCreateTableStatements = schema.match(/CREATE TABLE/g)?.length;
  if (countCreateTableStatements !== parsedSchema.tables.length) {
    errors.push("sqld schema invalid: tables count does not match");
  }

  if (errors.length > 0) {
    return { parsedSchema: null, errors };
  }

  return { parsedSchema, errors };
}
