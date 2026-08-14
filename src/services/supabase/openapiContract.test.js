import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../../../");

function read(path) {
  return readFileSync(resolve(root, path), "utf8");
}

function listSqlRpcNames(...sources) {
  const names = new Set();
  const functionPattern = /create\s+or\s+replace\s+function\s+public\.([a-z0-9_]+)\s*\(/gi;
  const internalFunctionNames = new Set([
    "profitability_build_costing",
    "profitability_component_cost",
    "profitability_normalize_percent",
  ]);

  for (const source of sources) {
    for (const match of source.matchAll(functionPattern)) {
      const functionName = match[1];
      if (
        !functionName.startsWith("assert_") &&
        !functionName.includes("_assert_") &&
        !internalFunctionNames.has(functionName)
      ) {
        names.add(functionName);
      }
    }
  }

  return [...names].sort();
}

describe("Supabase OpenAPI contract", () => {
  const openApi = JSON.parse(read("docs/openapi.json"));

  it("is a Swagger/OpenAPI 3 contract with Supabase auth", () => {
    expect(openApi.openapi).toMatch(/^3\./);
    expect(openApi.info.title).toContain("SmartProfit");
    expect(openApi.components.securitySchemes.bearerAuth.scheme).toBe("bearer");
    expect(openApi.components.securitySchemes.apiKeyAuth.name).toBe("apikey");
  });

  it("documents every public business RPC implemented in SQL", () => {
    const sqlRpcNames = listSqlRpcNames(
      read("database/supabase/rpc-core.sql"),
      read("database/supabase/rpc-operational.sql"),
      read("database/supabase/rpc-finance.sql"),
      read("database/supabase/rpc-profitability.sql")
    );
    const documentedRpcNames = Object.keys(openApi.paths)
      .map((path) => path.match(/^\/rest\/v1\/rpc\/([a-z0-9_]+)$/)?.[1])
      .filter(Boolean)
      .sort();

    expect(documentedRpcNames).toEqual(sqlRpcNames);
  });

  it("keeps every RPC path protected and backed by a schema", () => {
    for (const [path, pathItem] of Object.entries(openApi.paths)) {
      expect(path).toMatch(/^\/rest\/v1\/rpc\/[a-z0-9_]+$/);
      expect(pathItem.post).toBeDefined();
      expect(pathItem.post.operationId).toBeTruthy();
      expect(pathItem.post.tags.length).toBeGreaterThan(0);

      const requestSchema = pathItem.post.requestBody?.content?.["application/json"]?.schema;
      if (requestSchema) {
        expect(requestSchema.$ref).toMatch(/^#\/components\/schemas\//);
      }

      expect(pathItem.post.responses["401"]).toEqual({ $ref: "#/components/responses/Unauthorized" });
      expect(pathItem.post.responses["403"]).toEqual({ $ref: "#/components/responses/Forbidden" });
    }
  });
});
