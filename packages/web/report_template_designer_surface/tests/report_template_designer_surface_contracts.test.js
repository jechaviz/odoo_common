"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const packageRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(packageRoot, "..", "..", "..");
const sourcesRoot = path.join(packageRoot, "sources");
const manifestPath = path.join(packageRoot, "manifest.json");
const catalogPath = path.join(repoRoot, "catalog", "components.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeRelativePath(value) {
  return String(value || "").replace(/\\/g, "/").replace(/^\/+/, "").trim();
}

function listSourceFiles() {
  return fs.readdirSync(sourcesRoot)
    .filter((fileName) => fs.statSync(path.join(sourcesRoot, fileName)).isFile())
    .sort();
}

const manifest = readJson(manifestPath);
const catalog = readJson(catalogPath);
const sourceFiles = listSourceFiles();
const script = fs.readFileSync(path.join(sourcesRoot, "report_template_designer_surface.js"), "utf8");
const styles = fs.readFileSync(path.join(sourcesRoot, "report_template_designer_surface.css"), "utf8");

assert.equal(manifest.key, "report-template-designer-surface");
assert.equal(manifest.language, "web");
assert.equal(manifest.sync_root, "sources");
assert.equal(manifest.sync_mode, "tree");
assert.deepEqual(manifest.exports.slice().sort(), sourceFiles);
assert.deepEqual(manifest.publish_order, [
  "report_template_designer_surface.css",
  "report_template_designer_surface.js",
]);

const catalogComponent = catalog.find((component) => component.key === manifest.key);
assert.ok(catalogComponent, "catalog must include report-template-designer-surface");
assert.equal(normalizeRelativePath(catalogComponent.package_path), "packages/web/report_template_designer_surface");

for (const capability of [
  "report-test-data-table",
  "report-test-data-code-modal",
  "report-test-data-copy",
  "report-test-data-pretty-format",
]) {
  assert.ok(manifest.capabilities.includes(capability), `manifest must expose ${capability}`);
}

for (const expectedToken of [
  "openCodeModal",
  "prettyFormat",
  "data-oc-report-test-open",
  "data-oc-report-test-copy-modal",
  "data-oc-report-test-format-modal",
  "data-oc-report-test-code",
]) {
  assert.ok(script.includes(expectedToken), `surface script must keep ${expectedToken}`);
}

for (const forbiddenToken of [
  "drawerRow",
  "nextElementSibling",
  "oc_report_test_data__drawer",
  "oc_report_test_data__pre",
]) {
  assert.ok(!script.includes(forbiddenToken), `surface script must not reintroduce ${forbiddenToken}`);
}

for (const expectedSelector of [
  ".oc_report_test_data",
  ".oc_report_test_data__payload",
  ".oc_report_test_data_native_actions",
  ".oc_report_test_data_modal",
  ".oc_report_test_data_modal__pre",
]) {
  assert.ok(styles.includes(expectedSelector), `surface CSS must style ${expectedSelector}`);
}

for (const forbiddenSelector of [
  ".oc_report_test_data__drawer",
  ".oc_report_test_data__drawer-row",
  ".oc_report_test_data__pre",
]) {
  assert.ok(!styles.includes(forbiddenSelector), `surface CSS must not keep ${forbiddenSelector}`);
}

console.log("OK: report template designer surface contracts passed");
