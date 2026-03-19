# Final Semester Validation Checklist

Use this checklist to prove the key modules are working for evaluation/demo.

## 1) Pre-check setup

- Start backend: `.\mvnw.cmd spring-boot:run`
- Start frontend: `cd frontend && npm run dev`
- Login as admin in UI (`/login`).
- If needed, seed products using `POST /api/v1/seed/csv`.

## 2) Purchase Order lifecycle (Create -> Approve/Reject -> Receive)

1. Open `Purchase Orders` page.
2. Create a purchase order with 1-2 products.
3. Verify status = `PENDING_APPROVAL`.
4. Click `Approve` and verify status = `APPROVED`.
5. Click `Receive` and verify status = `RECEIVED`.
6. Create another PO and click `Reject`; verify status = `CANCELLED`.
7. Confirm rejected/received orders no longer show invalid actions.

Expected:
- Status transitions are correct.
- API errors are shown in UI if action is invalid.

## 3) Inventory at scale (10k+ rows)

1. Open `Inventory`.
2. Use search input (SKU/name) and check results update quickly.
3. Filter by category and warehouse.
4. Change page size (`20`, `50`, `100`) and paginate.
5. Confirm total pages navigation works and no empty jump pages.

Expected:
- Filters reset to page 1.
- Pagination is stable and responsive.

## 4) Ledger readability and paging

1. Open `Ledger`.
2. Verify `Product` column shows SKU where available (instead of only productId).
3. Trigger transactions (PO receive or Sales Order create) and refresh.
4. Move between ledger pages.

Expected:
- Entries show readable product reference (`productSku`).
- New transactions appear with correct type and quantity sign.

## 5) Dashboard performance smoke test

1. Open `Dashboard`.
2. In browser DevTools -> Network, check only one dashboard request (`/api/v1/dashboard/overview`) is used for main data.
3. Click `Refresh` multiple times.

Expected:
- Faster load compared to old split calls.
- No UI freeze with large product counts.

## 6) Security/config checks

1. Ensure `MONGODB_URI` and `JWT_SECRET` are set via env vars (not hardcoded credentials).
2. Verify CORS origins come from `APP_CORS_ALLOWED_ORIGINS`.
3. Confirm admin password behavior:
   - `APP_ADMIN_RESET_ON_START=false` keeps existing admin password.
   - `APP_ADMIN_RESET_ON_START=true` resets to `APP_ADMIN_INITIAL_PASSWORD`.

## 7) MongoDB index verification

In Mongo shell / Atlas Data Explorer, confirm indexes were created:
- `products`: `idx_products_active_category`, `idx_products_active_qty_reorder` (+ indexed fields like `sku`)
- `inventory_transactions`: `idx_tx_product_date`, `idx_tx_type_date`

## 8) Suggested evidence for final submission

- Screenshots of each module page with successful flow.
- 1 short screen recording showing PO lifecycle and ledger updates.
- Postman run/export for core APIs.
- Atlas screenshot of indexes.
