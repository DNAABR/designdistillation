export function validateJsonSchemaSubset(schema, value, { path = "$" } = {}) {
  const errors = [];
  visit(schema, value, path, errors);
  return errors;
}

export function assertJsonSchemaSubset(schema, value, label) {
  const errors = validateJsonSchemaSubset(schema, value);
  if (errors.length) {
    throw new Error(label + " invalid:\n- " + errors.join("\n- "));
  }
}

function visit(schema, value, path, errors) {
  if (!schema || typeof schema !== "object") return;

  if (Object.hasOwn(schema, "const") && !same(value, schema.const)) {
    errors.push(path + " must equal " + JSON.stringify(schema.const));
    return;
  }

  if (Array.isArray(schema.enum) && !schema.enum.some((candidate) => same(value, candidate))) {
    errors.push(path + " must be one of " + schema.enum.map((item) => JSON.stringify(item)).join(", "));
    return;
  }

  if (schema.type && !matchesType(schema.type, value)) {
    errors.push(path + " must be " + schema.type);
    return;
  }

  if (typeof value === "string") {
    if (Number.isInteger(schema.minLength) && value.length < schema.minLength) {
      errors.push(path + " must contain at least " + schema.minLength + " character(s)");
    }
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    if (typeof schema.minimum === "number" && value < schema.minimum) {
      errors.push(path + " must be >= " + schema.minimum);
    }
    if (typeof schema.maximum === "number" && value > schema.maximum) {
      errors.push(path + " must be <= " + schema.maximum);
    }
    if (typeof schema.exclusiveMinimum === "number" && value <= schema.exclusiveMinimum) {
      errors.push(path + " must be > " + schema.exclusiveMinimum);
    }
  }

  if (Array.isArray(value)) {
    if (Number.isInteger(schema.minItems) && value.length < schema.minItems) {
      errors.push(path + " must contain at least " + schema.minItems + " item(s)");
    }
    if (Number.isInteger(schema.maxItems) && value.length > schema.maxItems) {
      errors.push(path + " must contain at most " + schema.maxItems + " item(s)");
    }
    if (schema.items) {
      value.forEach((item, index) => visit(schema.items, item, path + "[" + index + "]", errors));
    }
  }

  if (isPlainObject(value)) {
    const properties = schema.properties ?? {};
    for (const key of schema.required ?? []) {
      if (!Object.hasOwn(value, key) || value[key] === undefined) {
        errors.push(path + "." + key + " is required");
      }
    }
    for (const [key, child] of Object.entries(value)) {
      if (child === undefined) continue;
      if (Object.hasOwn(properties, key)) {
        visit(properties[key], child, path + "." + key, errors);
      } else if (schema.additionalProperties === false) {
        errors.push(path + "." + key + " is not allowed");
      } else if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
        visit(schema.additionalProperties, child, path + "." + key, errors);
      }
    }
  }
}

function matchesType(type, value) {
  if (type === "object") return isPlainObject(value);
  if (type === "array") return Array.isArray(value);
  if (type === "string") return typeof value === "string";
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  if (type === "integer") return Number.isInteger(value);
  if (type === "boolean") return typeof value === "boolean";
  if (type === "null") return value === null;
  return true;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
