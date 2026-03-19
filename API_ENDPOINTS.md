# Smart Inventory Management – API endpoints

**Base URL:** `http://localhost:8080`  
Use **Bearer Token** (from login) for all endpoints except auth and health.

---

## Auth (no token)

| Method | URL | Description |
|--------|-----|-------------|
| POST | http://localhost:8080/api/v1/auth/login | Login → returns JWT token. Body: `{"username":"admin","password":"admin123"}` |
| POST | http://localhost:8080/api/v1/auth/setup | Create/reset admin user. Body: `{"secret":"setup"}` |

---

## Categories

| Method | URL | Description |
|--------|-----|-------------|
| POST | http://localhost:8080/api/v1/categories | Create or update by name. Body: `{"name":"Electronics","description":"..."}` |
| GET | http://localhost:8080/api/v1/categories | List (optional: `?search=...&page=0&size=50`) |
| GET | http://localhost:8080/api/v1/categories/{id} | Get one by ID |
| PUT | http://localhost:8080/api/v1/categories/{id} | Update. Body: `{"name":"...","description":"..."}` |

---

## Suppliers

| Method | URL | Description |
|--------|-----|-------------|
| POST | http://localhost:8080/api/v1/suppliers | Create. Body: supplier JSON (name, email, phone, address) |
| GET | http://localhost:8080/api/v1/suppliers | List (optional: `?search=...&page=0&size=20`) |
| GET | http://localhost:8080/api/v1/suppliers/{id} | Get one by ID |

---

## Products

| Method | URL | Description |
|--------|-----|-------------|
| POST | http://localhost:8080/api/v1/products | Create. Body: sku, name, description, categoryId, supplierId, unitPrice, currentQuantity, reorderLevel, warehouseLocation, active |
| GET | http://localhost:8080/api/v1/products | List (optional: `?search=...&categoryId=...&page=0&size=20&sortBy=id&sortDir=asc`) |
| GET | http://localhost:8080/api/v1/products/low-stock | List low-stock products |
| GET | http://localhost:8080/api/v1/products/export/csv | Download products CSV (Admin/Manager) |
| GET | http://localhost:8080/api/v1/products/export/excel | Download products Excel (Admin/Manager) |
| GET | http://localhost:8080/api/v1/products/{id} | Get one by ID |
| PUT | http://localhost:8080/api/v1/products/{id} | Update product |

---

## Purchase orders

| Method | URL | Description |
|--------|-----|-------------|
| POST | http://localhost:8080/api/v1/purchase-orders | Create. Body: `{"supplierId":1,"items":[{"productId":1,"quantity":5,"unitPrice":60000}]}` |
| POST | http://localhost:8080/api/v1/purchase-orders/{id}/approve | Approve PO (increases stock) |
| GET | http://localhost:8080/api/v1/purchase-orders | List (optional: `?search=...&status=...&page=0&size=20`) |
| GET | http://localhost:8080/api/v1/purchase-orders/{id} | Get one by ID |

---

## Sales orders

| Method | URL | Description |
|--------|-----|-------------|
| POST | http://localhost:8080/api/v1/sales-orders | Create. Body: `{"customerName":"...","customerEmail":"...","items":[{"productId":1,"quantity":2,"unitPrice":60000}]}` |
| GET | http://localhost:8080/api/v1/sales-orders | List (optional: `?search=...&page=0&size=20`) |
| GET | http://localhost:8080/api/v1/sales-orders/{id} | Get one by ID |
| POST | http://localhost:8080/api/v1/sales-orders/confirm/{id} | Confirm order (PENDING → CONFIRMED). Admin/Manager. Body: `{}` optional |
| POST | http://localhost:8080/api/v1/sales-orders/ship/{id} | Mark shipped (CONFIRMED → SHIPPED). Admin/Manager. Body: `{}` optional |
| POST | http://localhost:8080/api/v1/sales-orders/deliver/{id} | Mark delivered (SHIPPED → DELIVERED). Admin/Manager. Body: `{}` optional |
| POST | http://localhost:8080/api/v1/sales-orders/{id}/confirm | Same as confirm (alternate path) |
| POST | http://localhost:8080/api/v1/sales-orders/{id}/ship | Same as ship (alternate path) |
| POST | http://localhost:8080/api/v1/sales-orders/{id}/deliver | Same as deliver (alternate path) |

---

## Dashboard

| Method | URL | Description |
|--------|-----|-------------|
| GET | http://localhost:8080/api/v1/dashboard/stats | Dashboard stats (totalProducts, lowStockCount, etc.) |
| GET | http://localhost:8080/api/v1/dashboard/charts | Product charts (by category, stock status) for visualizations |

---

## Seed data (Admin)

| Method | URL | Description |
|--------|-----|-------------|
| POST | http://localhost:8080/api/v1/seed | Load sample dataset (categories, suppliers, products) from `seed-data.json` |

---

## Inventory ledger

| Method | URL | Description |
|--------|-----|-------------|
| GET | http://localhost:8080/api/v1/ledger | List transactions (optional: `?productId=...&transactionType=IN|OUT&page=0&size=20`) |

---

## Notifications

| Method | URL | Description |
|--------|-----|-------------|
| GET | http://localhost:8080/api/v1/notifications | List (optional: `?page=0&size=20&unreadOnly=true`) |
| GET | http://localhost:8080/api/v1/notifications/unread-count | Unread count |
| PATCH | http://localhost:8080/api/v1/notifications/{id}/read | Mark as read |

---

## Audit logs (Admin)

| Method | URL | Description |
|--------|-----|-------------|
| GET | http://localhost:8080/api/v1/audit-logs | List (optional: `?action=...&entityType=...&page=0&size=50`) |

---

## Settings (Admin)

| Method | URL | Description |
|--------|-----|-------------|
| GET | http://localhost:8080/api/v1/settings | List all settings |
| GET | http://localhost:8080/api/v1/settings/{key} | Get one by key |
| PUT | http://localhost:8080/api/v1/settings/{key} | Update. Body: `{"settingValue":"..."}` |

---

## Other

| Method | URL | Description |
|--------|-----|-------------|
| GET | http://localhost:8080/ | API info message |
| GET | http://localhost:8080/actuator/health | Health check (no auth) |
