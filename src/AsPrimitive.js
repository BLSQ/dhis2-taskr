import React from "react";
import ErrorBoundary from "./ErrorBoundary";

function isString(r) {
  return typeof r == "string";
}
function isPrimitive(r) {
  return typeof r == "number" || isString(r) || typeof r == "boolean";
}
function isBoolean(r) {
  return typeof r == "boolean";
}
function isFunction(r) {
  return typeof r == "function";
}

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

export function AsPrimitive({ value }) {
  if (value === undefined || value === null) {
    return "";
  }
  if (isFunction(value)) {
    return "can't render functions";
  }
  if (
    isString(value) &&
    (value.startsWith("http://") || value.startsWith("https://"))
  ) {
    return (
      <a href={value} target="_blank" rel="noopener noreferrer">
        {value.slice(0, 100)}...
      </a>
    );
  }

  if (isString(value) && value.length > 100) {
    return <span title={value}>{value.slice(0, 100)}...</span>;
  }

  const rendered = isPrimitive(value)
    ? isBoolean(value)
      ? value.toString()
      : value
    : JSON.stringify(value, getCircularReplacer(), 2);
  return <ErrorBoundary>{rendered}</ErrorBoundary>;
}
