import path from "node:path";
import { pathToFileURL } from "node:url";
import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";
import {
  auditSourceFiles,
  composeProfile,
  getDesignEntry,
  getDesignRecipe,
  getToken,
  searchPatterns,
  searchReferences,
  searchRegistry,
  selectDesignRecipes
} from "./retrieval.mjs";

export function createDesignDistillationServer({
  root = process.env.DESIGN_DISTILLATION_ROOT || process.cwd()
} = {}) {
  const server = new McpServer({ name:"design-distillation", version:"0.9.0" });
  const readOnly = {
    readOnlyHint:true,
    destructiveHint:false,
    idempotentHint:true,
    openWorldHint:false
  };

  server.registerTool("search_patterns", {
    title:"Search Design Patterns",
    description:"Search canonical UX patterns and return ranked compact summaries instead of the full corpus.",
    annotations:readOnly,
    inputSchema:z.object({
      query:z.string().min(1),
      family:z.string().min(1).optional(),
      limit:z.number().int().min(1).max(20).default(5)
    })
  }, async ({ query, family, limit }) => result({
    results:searchPatterns({ root, query, family, limit })
  }));

  server.registerTool("search_references", {
    title:"Search Design References",
    description:"Search canonical structured design-reference entries. Results may be empty until reference entries exist.",
    annotations:readOnly,
    inputSchema:z.object({
      query:z.string().min(1),
      limit:z.number().int().min(1).max(20).default(5)
    })
  }, async ({ query, limit }) => result({
    results:searchReferences({ root, query, limit })
  }));

  server.registerTool("get_design_entry", {
    title:"Get Design Entry",
    description:"Fetch one full canonical corpus entry by ID after a focused search.",
    annotations:readOnly,
    inputSchema:z.object({
      id:z.string().min(1),
      kind:z.string().min(1).optional()
    })
  }, async ({ id, kind }) => safe(() => ({
    entry:getDesignEntry({ root, id, kind })
  })));

  server.registerTool("get_design_recipe", {
    title:"Get Design Recipe",
    description:"Fetch one full canonical product-archetype recipe by ID.",
    annotations:readOnly,
    inputSchema:z.object({ id:z.string().min(1) })
  }, async ({ id }) => safe(() => ({
    recipe:getDesignRecipe({ root, id })
  })));

  server.registerTool("select_design_recipes", {
    title:"Select Design Recipes",
    description:"Rank relevant recipes and return the deterministic Composer selection, rationale, and conflicts without the full profile.",
    annotations:readOnly,
    inputSchema:z.object({
      input:z.record(z.string(), z.unknown()),
      limit:z.number().int().min(1).max(11).default(5)
    })
  }, async ({ input, limit }) => safe(() =>
    selectDesignRecipes({ root, input, limit })
  ));

  server.registerTool("compose_design_profile", {
    title:"Compose Design Profile",
    description:"Run the deterministic Composer and return the full design profile, human DESIGN.md text, and coding-agent instructions.",
    annotations:readOnly,
    inputSchema:z.object({
      input:z.record(z.string(), z.unknown())
    })
  }, async ({ input }) => safe(() => composeProfile({ root, input })));

  server.registerTool("search_registry", {
    title:"Search Reusable Registry",
    description:"Search source-owned reusable components and compositions using compact ranked metadata.",
    annotations:readOnly,
    inputSchema:z.object({
      query:z.string().min(1),
      kind:z.enum(["component","composition"]).optional(),
      limit:z.number().int().min(1).max(20).default(5)
    })
  }, async ({ query, kind, limit }) => result({
    results:searchRegistry({ root, query, kind, limit })
  }));

  server.registerTool("get_token", {
    title:"Resolve Design Token",
    description:"Resolve one canonical DTCG token path for light, dark, or high-contrast theme.",
    annotations:readOnly,
    inputSchema:z.object({
      path:z.string().min(1),
      theme:z.enum(["light","dark","high-contrast"]).default("light")
    })
  }, async ({ path:tokenPath, theme }) => safe(() => ({
    token:getToken({ root, tokenPath, theme })
  })));

  server.registerTool("audit_sources", {
    title:"Audit Source Files",
    description:"Audit explicitly supplied source files against a Design Distillation profile. The tool cannot browse arbitrary local paths.",
    annotations:readOnly,
    inputSchema:z.object({
      sources:z.array(z.object({
        path:z.string().min(1),
        content:z.string()
      })).min(1).max(100),
      profile:z.record(z.string(), z.unknown()),
      exceptions:z.array(z.object({
        rule:z.string().min(1),
        file:z.string().min(1).optional(),
        reason:z.string().min(10)
      })).default([])
    })
  }, async ({ sources, profile, exceptions }) => safe(() => ({
    report:auditSourceFiles({ root, sources, profile, exceptions })
  })));

  return server;
}

function result(structuredContent) {
  return {
    content:[{ type:"text", text:JSON.stringify(structuredContent) }],
    structuredContent
  };
}
async function safe(fn) {
  try {
    return result(await fn());
  } catch (error) {
    return {
      content:[{ type:"text", text:"Design Distillation tool error: " + error.message }],
      isError:true
    };
  }
}

const launchedDirectly = process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (launchedDirectly) {
  void serveStdio(() => createDesignDistillationServer());
  console.error("Design Distillation MCP server running on stdio");
}
