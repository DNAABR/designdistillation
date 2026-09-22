# Retrieval and MCP

v0.9 adds focused retrieval and a real Model Context Protocol server so coding agents can ask for only the Design Distillation knowledge needed for the current task.

## Protocol target

The server uses the official MCP TypeScript SDK v2 and stdio transport.

Pinned runtime dependencies:

- @modelcontextprotocol/server 2.0.0
- zod 4.6.5

The integration test uses @modelcontextprotocol/client 2.0.0 and launches the server over stdio, completes the protocol connection, lists tools, and executes real tool calls.

The server uses the v2 registerTool API with explicit Zod schema objects and serveStdio. Stdout is reserved for protocol traffic; startup diagnostics go to stderr.

## Run

Install dependencies, then point a compatible local MCP host at:

~~~bash
npm install
npm run mcp
~~~

Example host configuration:

~~~json
{
  "mcpServers": {
    "design-distillation": {
      "command": "npm",
      "args": ["run", "mcp"],
      "cwd": "/path/to/designdistillation"
    }
  }
}
~~~

Host configuration formats differ; the important contract is the local command and working directory.

## Tools

### search_patterns

Compact ranked UX-pattern search with optional family filtering.

### search_references

Compact ranked reference search. An empty result is valid until reference entries are populated.

### get_design_entry

Fetch one complete canonical corpus entry by ID.

### get_design_recipe

Fetch one complete canonical recipe by ID.

### select_design_recipes

Run deterministic recipe ranking/selection and return the selected blend, rankings, rationale, and conflicts without the full profile.

### compose_design_profile

Run the real deterministic Composer and return the complete design profile plus generated human and coding-agent guidance.

### search_registry

Search reusable component/composition metadata without loading every registry entry.

### get_token

Resolve one canonical DTCG token for light, dark, or high-contrast theme.

### audit_sources

Audit source files explicitly supplied in the tool call against a profile.

This MCP tool intentionally does not accept a local directory path or browse the host filesystem. A host decides which source text to provide. The standalone npm run audit CLI still supports local-directory scanning when explicitly invoked in a development workflow.

## Retrieval model

Search results are compact projections containing ID, kind, title, summary, family/category/platform metadata when present, ranking score, matched fields, and source path.

Detailed rationale, constraints, full states, recipe DNA, and provenance are fetched only when the caller requests the full entry.

Search scoring is deterministic and favors title/ID matches, then family/category/tags, summary/problem, and lower-weight contextual fields.

## Benchmarks

~~~bash
npm run benchmark:retrieval
~~~

The v0.9 benchmark checks eight representative retrieval tasks across UX patterns and recipes.

It enforces:

- 100% recall at each case's requested result limit;
- average compact response size no greater than 12% of the serialized full corpus.

The benchmark is also part of npm run check.

## Safety and scope

Every MCP tool is read-only. Retrieval tools operate over the closed Design Distillation corpus. The audit tool accepts explicit source content rather than arbitrary local paths.

The server does not publish files, change source code, call external services, or merge design decisions automatically.

v0.9 is a local stdio server. Hosted HTTP MCP, authentication, remote persistence, and public package publication remain out of scope.
