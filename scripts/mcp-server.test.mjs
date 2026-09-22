import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const root = process.cwd();

test("MCP stdio server negotiates, lists focused tools, and executes retrieval", async () => {
  const client = new Client({ name:"design-distillation-test", version:"0.9.0" });
  const transport = new StdioClientTransport({
    command:process.execPath,
    args:[path.join(root, "scripts", "mcp-server.mjs")],
    env:{ ...process.env, DESIGN_DISTILLATION_ROOT:root }
  });

  try {
    await client.connect(transport);
    const listed = await client.listTools();
    assert.deepEqual(listed.tools.map((tool) => tool.name).sort(), [
      "audit_sources",
      "compose_design_profile",
      "get_design_entry",
      "get_design_recipe",
      "get_token",
      "search_patterns",
      "search_references",
      "search_registry",
      "select_design_recipes"
    ]);

    const search = await client.callTool({
      name:"search_patterns",
      arguments:{ query:"destructive confirmation delete", limit:3 }
    });
    assert.equal(search.isError, undefined);
    assert.equal(search.structuredContent.results[0].id, "destructive-confirmation");

    const token = await client.callTool({
      name:"get_token",
      arguments:{ path:"semantic.color.text.primary", theme:"dark" }
    });
    assert.equal(token.structuredContent.token.value.hex, "#f9fafc");
  } finally {
    await client.close();
  }
});
