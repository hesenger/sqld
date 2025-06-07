import { describe, it } from "node:test";
import assert from "assert";
import { parseAndValidateSchema } from "./parser";

describe("schema", () => {
  it("validates schema object", () => {
    const schema = `{
        "schemas": ["schema.sql"],
        "queries": ["queries.sql"]
    }`;

    const { parsedSchema, errors } = parseAndValidateSchema(schema);

    assert(errors.length === 0);
    assert.equal(parsedSchema.schemas.length, 1);
    assert.equal(parsedSchema.queries.length, 1);
  });
});
