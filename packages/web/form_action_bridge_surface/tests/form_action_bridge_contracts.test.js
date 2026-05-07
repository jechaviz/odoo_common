"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const sourcePath = path.resolve(__dirname, "..", "sources", "form_action_bridge.js");
const source = fs.readFileSync(sourcePath, "utf8");

for (const expectedToken of [
  "function resolveFormRoot(runtimeContext, adapter)",
  "allowFallback: false",
  "function findNativeSaveButton(meta, formRoot, adapter)",
  "return null;",
]) {
  assert.ok(
    source.includes(expectedToken),
    `form action bridge must require scoped form ownership through token ${expectedToken}`
  );
}

for (const forbiddenToken of [
  "fallbackCandidate",
  "querySelectorElement(document.documentElement, adapter.saveButtonSelector)",
  "allowFallback: true",
]) {
  assert.ok(
    !source.includes(forbiddenToken),
    `form action bridge must not keep global legacy fallback token ${forbiddenToken}`
  );
}

console.log("OK: form action bridge contracts passed");
