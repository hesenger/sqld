export function parseAndValidateSchema(schema: string) {
  const parsedSchema = JSON.parse(schema);
  const errors: string[] = [];

  if (!Array.isArray(parsedSchema.schemas)) {
    errors.push("sqld schema invalid: schemas must be an array");
  } else if (parsedSchema.schemas.length === 0) {
    errors.push("sqld schema invalid: schemas must not be empty");
  }

  if (!Array.isArray(parsedSchema.queries)) {
    errors.push("sqld schema invalid: queries must be an array");
  } else if (parsedSchema.queries.length === 0) {
    errors.push("sqld schema invalid: queries must not be empty");
  }

  return { parsedSchema, errors };
}
