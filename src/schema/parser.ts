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

export interface Schema {
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
    const tableName = match[1];
    const columns = match[2].split(",").map((column) => column.trim());

    const columnRegex = /(\w+)\s+([\w\(\)]+)/;
    const columnMatches = columns
      .map((column) => column.match(columnRegex))
      .filter((column) => column !== null);

    parsedSchema.tables.push({
      name: tableName.toLowerCase(),
      columns: columnMatches.map((column) => ({
        name: column[1].toLowerCase(),
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

interface Parameter {
  name: string;
  origin: string;
  type: string;
}

interface Query {
  name: string;
  type: string;
  tableAliases: Record<string, string>;
  input: Parameter[];
  output: Column[];
}

export function parseAndValidateQueries(
  query: string,
  schema: Schema,
): {
  parsedQueries: Query[];
  errors: string[];
} {
  const errors: string[] = [];
  const parsedQueries: Query[] = [];

  const queryRegex = /-- name: (\w+)\s*:\s*(\w+)\s*([\s\S]*)/gim;
  const matches = query.matchAll(queryRegex);

  for (const match of matches) {
    const name = match[1];
    const type = match[2];
    const content = match[3];

    const fromAliasRegex = /from\s+(\w+)\s*(?:as\s*)?(\w+)/gim;
    const joinAliasRegex = /join\s+(\w+)\s*(?:as\s*)?(\w+)/gim;
    const tableAliasesMatches = [
      ...content.matchAll(fromAliasRegex),
      ...content.matchAll(joinAliasRegex),
    ];
    const tableAliases: Record<string, string> = {};
    for (const tableAliasMatch of tableAliasesMatches) {
      tableAliases[tableAliasMatch[2].toLowerCase()] =
        tableAliasMatch[1].toLowerCase();
    }

    const inputRexes = /([\.\w]+)\s*[=<>]\s*:(\w+)/gim;
    const inputMatches = content.matchAll(inputRexes);
    const input: Parameter[] = [];
    for (const inputMatch of inputMatches) {
      const origin = inputMatch[1];
      const tableOrAlias = origin.split(".")[0].toLowerCase();
      const isTableAlias = Object.keys(tableAliases).includes(tableOrAlias);
      const table = isTableAlias
        ? schema.tables.find(
            (table) => table.name === tableAliases[tableOrAlias],
          )
        : schema.tables.find((table) => table.name === tableOrAlias);
      if (!table) {
        errors.push(
          `sqld query invalid: table ${tableOrAlias} not found on schema`,
        );
        continue;
      }

      const columnName = inputMatch[2].toLowerCase();
      const column = table.columns.find((column) => column.name === columnName);
      if (!column) {
        errors.push(
          `sqld query invalid: column ${columnName} not found on table ${table.name}`,
        );
        continue;
      }

      input.push({
        name: inputMatch[2],
        origin,
        type: column.type,
      });
    }

    const parsedQuery: Query = {
      name,
      type,
      tableAliases,
      input,
      output: [],
    };

    parsedQueries.push(parsedQuery);
  }

  return { parsedQueries, errors };
}
