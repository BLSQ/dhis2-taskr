function isString(r) {
  return typeof r == "string";
}
function isPrimitive(r) {
  return typeof r == "number" || isString(r) || typeof r == "boolean";
}
function isBoolean(r) {
  return typeof r == "boolean";
}

export function AsPrimitive({ value }) {
  if (value === undefined || value === null) {
    return "";
  }
  if (isString(value) && value.length > 100) {
    return value.slice(0, 100) + " ...";
  }

  const rendered = isPrimitive(value)
    ? isBoolean(value)
      ? value.toString()
      : value
    : JSON.stringify(value);
  return rendered;
}
