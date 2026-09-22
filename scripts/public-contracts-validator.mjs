import fs from "node:fs";
import path from "node:path";

export function validatePublicContracts({ root = process.cwd(), errors = [] } = {}) {
  const manifest = readJson(path.join(root, "schemas", "public-manifest.json"), root, errors);
  const migrations = readJson(path.join(root, "migrations", "manifest.json"), root, errors);
  const packageJson = readJson(path.join(root, "package.json"), root, errors);
  if (!manifest || !migrations || !packageJson) return { schemaCount:0, commandCount:0, toolCount:0, migrationCount:0 };

  if (manifest.status !== "stable") errors.push("schemas/public-manifest.json: v1.0 public manifest must be stable");
  if (manifest.stable_on_release_tag !== "v1.0.0") errors.push("schemas/public-manifest.json: stable_on_release_tag must be v1.0.0");
  if ((manifest.blocking_decisions ?? []).length !== 0) errors.push("schemas/public-manifest.json: stable v1.0 must not have unresolved blocking decisions");
  if (manifest.distribution !== "proprietary") errors.push("schemas/public-manifest.json: v1.0 distribution must be explicitly proprietary");
  if (manifest.package_license !== "UNLICENSED") errors.push("schemas/public-manifest.json: v1.0 package license must be UNLICENSED");
  if (packageJson.license !== manifest.package_license) errors.push("package.json license must match public manifest package_license");
  if (packageJson.version !== manifest.version) errors.push("package.json and public manifest version must match");

  const ids = new Set();
  const surfaces = new Set();
  for (const item of manifest.schemas ?? []) {
    if (!fs.existsSync(path.join(root, item.path))) errors.push("schemas/public-manifest.json: missing schema " + item.path);
    const schema = fs.existsSync(path.join(root, item.path)) ? readJson(path.join(root, item.path), root, errors) : null;
    if (schema?.$id !== item.id) errors.push("schemas/public-manifest.json: schema ID mismatch for " + item.path);
    if (ids.has(item.id)) errors.push("schemas/public-manifest.json: duplicate schema ID " + item.id);
    if (surfaces.has(item.surface)) errors.push("schemas/public-manifest.json: duplicate public surface " + item.surface);
    ids.add(item.id);
    surfaces.add(item.surface);
    if (item.stability !== "v1-stable") errors.push("schemas/public-manifest.json: public schema stability must be v1-stable");
  }

  const commandNames = new Set();
  for (const command of manifest.commands ?? []) {
    if (commandNames.has(command.name)) errors.push("schemas/public-manifest.json: duplicate command " + command.name);
    commandNames.add(command.name);
    if (command.stability !== "v1-stable") errors.push("schemas/public-manifest.json: public command stability must be v1-stable");
  }
  const toolNames = new Set(manifest.mcp_tools ?? []);
  if (toolNames.size !== (manifest.mcp_tools ?? []).length) errors.push("schemas/public-manifest.json: duplicate MCP tool names");

  if (migrations.version !== manifest.version) errors.push("migrations/manifest.json: version must match public manifest");
  for (const migration of migrations.migrations ?? []) {
    if (!migration.id || !migration.from || !migration.to) errors.push("migrations/manifest.json: each migration needs id/from/to");
    if (!Array.isArray(migration.notes) || migration.notes.length === 0) errors.push("migrations/manifest.json: each migration needs notes");
  }

  return {
    schemaCount:(manifest.schemas ?? []).length,
    commandCount:(manifest.commands ?? []).length,
    toolCount:(manifest.mcp_tools ?? []).length,
    migrationCount:(migrations.migrations ?? []).length
  };
}

function readJson(file, root, errors) {
  try {
    const text = fs.readFileSync(file, "utf8");
    return JSON.parse(text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text);
  } catch (error) {
    errors.push(path.relative(root, file).replaceAll("\\", "/") + ": invalid JSON (" + error.message + ")");
    return null;
  }
}
