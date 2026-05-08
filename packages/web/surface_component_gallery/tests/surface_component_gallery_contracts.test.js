const fs = require("fs");
const path = require("path");
const vm = require("vm");

const packageRoot = path.resolve(__dirname, "..");
const jsPath = path.join(packageRoot, "sources", "component_gallery.js");
const cssPath = path.join(packageRoot, "sources", "component_gallery.css");
const jsSource = fs.readFileSync(jsPath, "utf8");
const cssSource = fs.readFileSync(cssPath, "utf8");

const sandbox = {
  globalThis: {},
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(jsSource, sandbox, {filename: jsPath});

if (!sandbox.odooCommonComponentGallery) {
  throw new Error("odooCommonComponentGallery API was not exported");
}

for (const exportName of [
  "mountCommonComponentGallery",
  "normalizeCommonComponentGalleryModel",
  "renderCommonComponentGalleryMarkup",
]) {
  if (typeof sandbox.odooCommonComponentGallery[exportName] !== "function") {
    throw new Error(`Missing gallery export: ${exportName}`);
  }
}

const model = sandbox.odooCommonComponentGallery.normalizeCommonComponentGalleryModel({
  title: "Common",
  sections: [
    {
      key: "web",
      title: "Web Surfaces",
      components: [
        {
          key: "surface-workspace-shell",
          title: "Native Surface Workspace Shell",
          runtime: "web",
          status: "canonical",
          package_path: "packages/web/surface_workspace_shell",
          features: ["workspace", "collapsible rows"],
          origins: [{project: "odoo_common", path: "packages/web/surface_workspace_shell"}],
        },
      ],
    },
  ],
});
const markup = sandbox.odooCommonComponentGallery.renderCommonComponentGalleryMarkup(model, {
  target: {consumer_key: "odoo_fiax", target_root: "C:/git/customers/yo/odoo_fiax"},
  plan: {
    steps: [
      {key: "sync-common-package", title: "Sync common package", kind: "sync"},
      {key: "run-design-audit", title: "Run design audit", kind: "audit"},
    ],
  },
});

for (const token of [
  "data-ocg-component-key",
  "data-ocg-build-plan",
  "data-ocg-ai-review",
  "surface-workspace-shell",
  "collapsible rows",
]) {
  if (!markup.includes(token)) {
    throw new Error(`Expected gallery markup token: ${token}`);
  }
}

for (const token of [
  ".ocg-shell",
  "grid-template-columns: minmax(15rem, 18rem) minmax(24rem, 1fr) minmax(19rem, 24rem)",
  ".ocg-nav-item.is-selected",
  ".ocg-wizard",
  ".ocg-step",
  "@media (max-width: 720px)",
]) {
  if (!cssSource.includes(token)) {
    throw new Error(`Expected gallery css token: ${token}`);
  }
}

console.log("OK: surface component gallery contracts passed");
