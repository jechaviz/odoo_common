# Surface Workspace Shell

Canonical Odoo shell runtime for sidebar, breadcrumb, route state, and managed workspace lifecycles.

## Sidebar Ownership

The sidebar current section must come from explicit identity:

- `data-surface-sidebar-section-key`
- `data-section`
- breadcrumb section key (`shared.surfaceBreadcrumbSectionKey`)
- `registerSidebarShellSectionResolver(resolver)`

`registerSidebarShellRootSectionKeys(entries)` only annotates DOM nodes from explicit `{ selector, key }` entries. It does not map navbar labels to section keys.

Popover ownership is tied to the live trigger that opened the menu through `data-surface-sidebar-owner-trigger-id`; the shell does not reconstruct owner state from labels or stale popover metadata.

Registered sidebar trees bind leaves by explicit item key or href-derived key. Labels remain display copy only.
