# Mid-Term Project Report

## Smart Inventory Management System

**Course:** [Course Name]  
**Date:** March 19, 2025  
**Project Phase:** Mid-Term

---

## 1. Executive Summary

The Smart Inventory Management System is a full-stack enterprise application designed to streamline inventory operations, purchase orders, sales orders, and real-time stock monitoring. The system implements a modern layered architecture with a Java Spring Boot backend and a React TypeScript frontend, utilizing MongoDB for data persistence and WebSocket for real-time notifications.

At the mid-term stage, the project has achieved substantial completion of core features including authentication, role-based access control, inventory management, purchase and sales order workflows, inventory ledger, audit logging, and a responsive dashboard with analytics.

---

## 2. Project Overview

### 2.1 Objectives

- Build a scalable inventory management system for retail and warehouse operations
- Implement secure authentication and role-based access control (RBAC)
- Provide real-time low-stock alerts and notifications
- Support purchase order approval workflows and sales order processing
- Maintain a complete audit trail of inventory transactions and user actions
- Enable data export (CSV/Excel) for reporting and analysis

### 2.2 Scope

| Module | Description | Status |
|--------|-------------|--------|
| Authentication & Authorization | JWT-based login, RBAC (Admin, Manager, Staff) | ✅ Complete |
| Dashboard | KPIs, charts, low-stock alerts | ✅ Complete |
| Inventory Management | Product CRUD, search, pagination, stock status | ✅ Complete |
| Categories | Product category management | ✅ Complete |
| Suppliers | Supplier management | ✅ Complete |
| Purchase Orders | Create, approve, receive workflow | ✅ Complete |
| Sales Orders | Create and manage sales orders | ✅ Complete |
| Inventory Ledger | Transaction history (IN, OUT, RETURN, etc.) | ✅ Complete |
| Notifications | Low-stock alerts, WebSocket push | ✅ Complete |
| Audit Logs | User action and entity change tracking | ✅ Complete |
| System Settings | Tax, currency, warehouse configuration | ✅ Complete |
| Reports & Export | CSV/Excel export, charts | ✅ Complete |
| User Management | User CRUD | 🔄 Placeholder |
| Reports Page | Advanced reporting | 🔄 Placeholder |

---

## 3. Technology Stack

### 3.1 Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Java | 17 | Core language |
| Spring Boot | 3.5.11 | Application framework |
| Spring Security | (included) | Authentication & authorization |
| Spring Data MongoDB | (included) | Data persistence |
| Spring WebSocket | (included) | Real-time notifications |
| JWT (jjwt) | 0.12.5 | Token-based authentication |
| Apache POI | 5.2.5 | Excel export |
| Spring Boot Actuator | (included) | Health & monitoring |
| Lombok | (included) | Boilerplate reduction |

### 3.2 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI framework |
| TypeScript | 5.3.3 | Type safety |
| Vite | 5.0.8 | Build tool & dev server |
| Tailwind CSS | 3.3.6 | Styling |
| React Router DOM | 6.20.0 | Client-side routing |
| Recharts | 2.10.3 | Charts & visualizations |
| Lucide React | 0.294.0 | Icons |
| Axios | 1.6.2 | HTTP client |

### 3.3 Database

- **MongoDB** — Primary database (with support for Supabase/PostgreSQL and MySQL via configuration)
- Collections: `categories`, `suppliers`, `products`, `users`, `roles`, `purchase_orders`, `sales_orders`, `inventory_transactions`, `notifications`, `audit_logs`, `system_settings`

---

## 4. System Architecture

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Frontend (Vite)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Dashboard│ │Inventory │ │  Orders  │ │ Settings/Reports │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API / WebSocket
┌────────────────────────────▼────────────────────────────────────┐
│                  Spring Boot Backend                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                 │
│  │ Controllers│─▶│  Services  │─▶│ Repositories│                 │
│  └────────────┘  └────────────┘  └──────┬─────┘                 │
│  ┌────────────┐  ┌────────────┐        │                        │
│  │ JWT Filter │  │  WebSocket │        │                        │
│  └────────────┘  └────────────┘        │                        │
└─────────────────────────────────────────┼────────────────────────┘
                                         │
                                         ▼
                              ┌──────────────────┐
                              │     MongoDB       │
                              └──────────────────┘
```

### 4.2 Layered Architecture

- **Controller Layer:** REST endpoints, request validation, response mapping
- **Service Layer:** Business logic, transaction management, audit integration
- **Repository Layer:** Spring Data MongoDB repositories for data access
- **Security Layer:** JWT validation, role-based access via `@PreAuthorize`

### 4.3 API Structure

- **Base Path:** `/api/v1`
- **Authentication:** Bearer token (`Authorization: Bearer <JWT>`)
- **Public Endpoints:** `/auth/login`, `/auth/setup`
- **Protected Endpoints:** All other APIs require valid JWT

---

## 5. Implemented Features

### 5.1 Authentication & Authorization

- **JWT Login:** Secure token-based authentication with configurable expiration
- **Setup Endpoint:** One-time admin creation via `/auth/setup` (body: `{"secret":"setup"}`)
- **Roles:** ADMIN, MANAGER, STAFF with granular permissions
- **Default Credentials:** admin / admin123 (created on first run)

### 5.2 Dashboard

- **KPI Cards:** Total products, low-stock count, revenue, pending orders, suppliers
- **Bar Chart:** Products by category
- **Pie Chart:** Stock status breakdown (STOCKED, LOW, CRITICAL)
- **Low-Stock Alerts:** Table of products below reorder level

### 5.3 Inventory Management

- **CRUD Operations:** Create, read, update products (Admin/Manager)
- **Search & Filter:** By name, SKU, category
- **Pagination:** Configurable page size
- **Stock Status:** Automatic classification (STOCKED, LOW, CRITICAL) based on reorder level and safety stock
- **Export:** CSV and Excel export (Admin/Manager)

### 5.4 Purchase Orders

- **Create Orders:** Select supplier, add line items (product, quantity, unit price)
- **Approval Workflow:** PENDING_APPROVAL → APPROVED → RECEIVED
- **Role Restriction:** Only Manager/Admin can approve
- **Stock Update:** On receive, inventory is updated and ledger entries created

### 5.5 Sales Orders

- **Create Orders:** Customer info, line items
- **Status Flow:** Order lifecycle management
- **Inventory Deduction:** Stock reduced on order completion

### 5.6 Inventory Ledger

- **Transaction Types:** IN, OUT, RETURN, ADJUSTMENT, DAMAGE, TRANSFER
- **Audit Trail:** Full history with quantity before/after, reference to source (PO, SO, etc.)
- **Filtering:** By product, transaction type, date range

### 5.7 Notifications

- **Low-Stock Alerts:** Triggered when product falls below reorder level
- **Scheduled Job:** Daily check at 8 AM
- **WebSocket Push:** Real-time delivery to connected clients
- **Read/Unread:** User notification management

### 5.8 Audit Logs

- **User Actions:** Login, CRUD operations
- **Entity Changes:** Old and new values for updates
- **Metadata:** IP address, user agent, timestamp
- **Access:** Admin only

### 5.9 System Settings

- **Configurable:** Tax rate, currency (INR), warehouse name
- **Reorder Defaults:** Default reorder level and safety stock
- **Admin-Only:** Update restricted to Admin role

### 5.10 Data Seeding

- **JSON Seed:** Load from `seed-data.json` via `/api/v1/seed`
- **CSV Import:** Import from `retail_store_inventory.csv` via `/api/v1/seed/csv`
- **Initialization:** Roles, admin user, default settings, default supplier on first run

---

## 6. Database Schema (MongoDB Collections)

| Collection | Key Fields |
|------------|------------|
| **categories** | id, name, description, createdAt, updatedAt |
| **suppliers** | id, name, contactPerson, email, phone, address |
| **products** | id, sku, name, categoryId, supplierId, unitPrice, currentQuantity, reorderLevel, safetyStock, leadTimeDays, warehouseLocation |
| **users** | id, username, email, password (BCrypt), fullName, roles |
| **roles** | id, name (ADMIN, MANAGER, STAFF) |
| **purchase_orders** | id, orderNumber, supplierId, status, items[], totalAmount |
| **sales_orders** | id, orderNumber, status, customerName, items[], totalAmount |
| **inventory_transactions** | id, productId, transactionType, quantity, quantityAfter, referenceType, referenceId |
| **notifications** | id, userId, title, message, type, read |
| **audit_logs** | id, userId, action, entityType, entityId, oldValue, newValue |
| **system_settings** | id, settingKey, settingValue, dataType |

---

## 7. Project Structure

```
Smart_Inventory_Management System/
├── src/main/java/com/example/demo/
│   ├── config/          # SecurityConfig, WebSocketConfig, DataInitializer
│   ├── controller/      # REST controllers (Auth, Dashboard, Product, etc.)
│   ├── dto/             # Request/response DTOs
│   ├── entity/          # MongoDB document entities
│   ├── exception/       # GlobalExceptionHandler, custom exceptions
│   ├── repository/      # MongoRepository interfaces
│   ├── security/        # JwtUtil, JwtAuthFilter, UserPrincipal
│   └── service/         # Business logic, audit, export, notifications
├── src/main/resources/
│   ├── application.properties
│   ├── application-local.properties
│   └── seed-data.json
├── frontend/
│   └── src/
│       ├── api/         # Axios client, API helpers
│       ├── components/  # Layout, sidebar
│       ├── context/     # AuthContext
│       └── pages/       # Dashboard, Inventory, Categories, etc.
├── README.md
├── CLOUD_SETUP.md
├── DATASET.md
├── MONGODB_MIGRATION.md
└── RUN_IN_INTELLIJ.md
```

---

## 8. Testing & Quality

- **Backend Tests:** Spring Boot Test, Spring Security Test (in scope)
- **Exception Handling:** GlobalExceptionHandler for consistent error responses
- **Validation:** Bean Validation on DTOs
- **CORS:** Configured for frontend origin

---

## 9. Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| Database migration (PostgreSQL → MongoDB) | Documented migration path in MONGODB_MIGRATION.md; MongoDB chosen for flexibility |
| Real-time notifications | WebSocket (STOMP over SockJS) for push notifications |
| Role-based access | Spring Security + @PreAuthorize on controller methods |
| Audit trail | AuditService with entity change capture and user action logging |
| Low-stock automation | Scheduled job (cron) at 8 AM with NotificationPushService |

---

## 10. Future Work (Post Mid-Term)

1. **User Management:** Full CRUD for users (Admin)
2. **Advanced Reports:** Custom date range reports, revenue analytics
3. **Barcode/QR Support:** Product scanning for inventory
4. **Multi-warehouse:** Support for multiple warehouse locations
5. **Email Notifications:** Low-stock alerts via email
6. **Mobile App:** React Native or PWA for mobile access
7. **Unit & Integration Tests:** Automated test coverage

---

## 11. Conclusion

The Smart Inventory Management System has achieved a solid mid-term milestone with a comprehensive set of features covering authentication, inventory management, purchase and sales orders, reporting, and real-time notifications. The architecture is scalable, maintainable, and follows industry best practices. The project is well-documented with README, cloud setup guides, and migration documentation.

**Overall Progress:** Approximately 85% of planned core features are complete. Remaining work focuses on user management, advanced reporting, and testing.

---

## Appendix A: API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login, returns JWT |
| POST | `/api/v1/auth/setup` | Create/reset admin |
| GET | `/api/v1/dashboard/stats` | KPIs + low stock |
| GET | `/api/v1/dashboard/charts` | Chart data |
| GET/POST | `/api/v1/products` | Product CRUD |
| GET | `/api/v1/products/low-stock` | Low-stock products |
| GET | `/api/v1/products/export/csv` | CSV export |
| GET | `/api/v1/products/export/excel` | Excel export |
| GET/POST | `/api/v1/categories` | Categories |
| GET/POST | `/api/v1/suppliers` | Suppliers |
| GET/POST | `/api/v1/purchase-orders` | Purchase orders |
| POST | `/api/v1/purchase-orders/{id}/approve` | Approve PO |
| GET/POST | `/api/v1/sales-orders` | Sales orders |
| GET | `/api/v1/ledger` | Inventory transactions |
| GET | `/api/v1/notifications` | Notifications |
| GET | `/api/v1/audit-logs` | Audit logs (Admin) |
| GET/PUT | `/api/v1/settings` | System settings |
| POST | `/api/v1/seed` | Load seed data |
| POST | `/api/v1/seed/csv` | Import CSV |

---

## Appendix B: Screenshots / Demo

*[Space reserved for screenshots of Dashboard, Inventory, Purchase Orders, etc.]*

---

*Report generated for Smart Inventory Management System — Mid-Term Assessment*
