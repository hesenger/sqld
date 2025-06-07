import { describe, it } from "node:test";
import assert from "assert";
import {
  parseAndValidateConfig,
  parseAndValidateQuery,
  parseAndValidateSchema,
} from "./parser";

describe("config parser", () => {
  it("validates config object", () => {
    const config = `{
        "schemas": ["schema.sql"],
        "queries": ["queries.sql"]
    }`;

    const { parsedConfig, errors } = parseAndValidateConfig(config);

    assert(errors.length === 0);
    assert.equal(parsedConfig?.schemas.length, 1);
    assert.equal(parsedConfig?.queries.length, 1);
  });

  it("validates config object with invalid schemas", () => {
    const config = `{
      "schemas": "schema.sql",
      "queries": "queries.sql"
    }`;

    const { parsedConfig, errors } = parseAndValidateConfig(config);

    assert(errors.length === 2);
    assert.equal(errors[0], "sqld config invalid: schemas must be an array");
    assert.equal(errors[1], "sqld config invalid: queries must be an array");
    assert.equal(parsedConfig, null);
  });
});

describe("schema parser", () => {
  it("parses schema", () => {
    const schema = `
        CREATE TABLE users (
            id INT PRIMARY KEY,
            name VARCHAR(255)
        );

        CREATE TABLE posts (
            id INT PRIMARY KEY,
            title VARCHAR(255),
            content TEXT
        );
    `;

    const { parsedSchema, errors } = parseAndValidateSchema(schema);

    assert.equal(errors.length, 0, "errors is not empty: " + errors.join(", "));
    assert.equal(parsedSchema?.tables.length, 2);

    assert.equal(parsedSchema?.tables[0].name, "users");
    assert.equal(parsedSchema?.tables[0].columns.length, 2);
    assert.equal(parsedSchema?.tables[0].columns[0].name, "id");
    assert.equal(parsedSchema?.tables[0].columns[0].type, "INT");
    assert.equal(parsedSchema?.tables[0].columns[1].name, "name");
    assert.equal(parsedSchema?.tables[0].columns[1].type, "VARCHAR(255)");

    assert.equal(parsedSchema?.tables[1].name, "posts");
    assert.equal(parsedSchema?.tables[1].columns.length, 3);
    assert.equal(parsedSchema?.tables[1].columns[0].name, "id");
    assert.equal(parsedSchema?.tables[1].columns[0].type, "INT");
    assert.equal(parsedSchema?.tables[1].columns[1].name, "title");
    assert.equal(parsedSchema?.tables[1].columns[1].type, "VARCHAR(255)");
  });

  it("detects invalid create table statements", () => {
    const schema = `
        CREATE TABLE users (
            id INT PRIMARY KEY,
            name VARCHAR(255)
        );

        CREATE TABLE posts ()
    `;

    const { parsedSchema, errors } = parseAndValidateSchema(schema);

    assert.equal(errors.length, 1);
    assert.equal(errors[0], "sqld schema invalid: tables count does not match");
    assert.equal(parsedSchema, null);
  });
});

describe("query parser", () => {
  it("parses query select *", () => {
    const schema = `
        CREATE TABLE users (
            id INT PRIMARY KEY,
            name VARCHAR(255)
        );
    `;

    const query = `
        -- name: listUsers :many
        SELECT * FROM users;
    `;

    const { parsedSchema } = parseAndValidateSchema(schema);
    const { parsedQueries, errors } = parseAndValidateQuery(
      query,
      parsedSchema!,
    );

    assert.equal(errors.length, 0, "errors is not empty: " + errors.join(", "));
    assert.equal(parsedQueries.length, 1);

    assert.equal(parsedQueries[0].name, "listUsers");
    assert.equal(parsedQueries[0].type, "many");
    assert.equal(parsedQueries[0].input.length, 0);
    assert.equal(parsedQueries[0].output.length, 2);
  });
});
