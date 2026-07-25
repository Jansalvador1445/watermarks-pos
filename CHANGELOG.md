# Changelog

## 2026-07-25
- Scope: web inventory, web walk-in (POS), backend inventory API, docs
- **Inventory → Movement Log** tab: added **Export CSV** and **Export PDF** (same helpers as Reports), respecting movement type and date filters and exporting all matching rows across pages.
- Renamed the **POS (Sales)** page to **Walk-In** in the UI (sidebar, page header, permissions, settings). Route `/pos` and permission `pos:*` are unchanged.
- **Inventory** items list now uses stock and catalog status dropdown filters (replacing the low-stock toggle) and shows a Catalog Status column (Active / Disabled / No Catalog).
- Combined **Add Item** and product catalog into one always-visible modal ([`InventoryItemFormModal`](web/src/components/InventoryItemFormModal.tsx)): inventory fields + ABC tier pricing, product category, **Affect Item stock count**, and catalog status. **Cost / base price** is separate from retail/wholesale/special selling prices.
- Renamed the product stock switch label to **Affect Item stock count**.
- **Walk-In → Product Catalog** picker: fixed empty inventory list (`notInCatalog` param coercion, ID normalization), **Select + Add** button (invoice-style inline add), opens full combined form modal.
- Backend `GET /api/inventory` supports `catalogStatus` (`active` | `disabled` | `none`) and `notInCatalog=true`, returns `linkedProduct` on each row, and normalizes aggregation `_id` values.
- Added [`docs/INVENTORY_AND_WALKIN.md`](docs/INVENTORY_AND_WALKIN.md).

## 2026-07-14
- Scope: desktop launcher, build script, docs
- Added a standalone hidden `start-pos.exe` launcher that embeds the batch startup logic, generates a branded Windows icon from `web/src/assets/Watermarks POS icon.png`, and updates the desktop build and deployment docs to use the EXE as the primary entrypoint.

## 2026-07-10
- Scope: web reports, backend reports, docs
- Added sales report grouping for daily, weekly, and monthly views, expanded inventory filters on the Reports page, and switched reports export to PDF while keeping CSV export available.