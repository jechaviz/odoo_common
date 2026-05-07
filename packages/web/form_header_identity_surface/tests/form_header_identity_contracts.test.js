"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const sourcePath = path.resolve(__dirname, "..", "sources", "form_header_identity.js");
const source = fs.readFileSync(sourcePath, "utf8");

assert.ok(
  source.includes("function resolveFormRoot(runtimeContext, adapter)"),
  "form header identity must keep an explicit form-root resolver"
);
assert.ok(
  source.includes("allowFallback: false"),
  "form header identity must require scoped Odoo form ownership"
);
assert.ok(
  !source.includes("allowFallback: true"),
  "form header identity must not activate through legacy broad form fallback"
);

console.log("OK: form header identity contracts passed");
