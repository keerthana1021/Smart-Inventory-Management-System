# Sample Dataset for Smart Inventory Management

Default **currency is INR** and sample **phone numbers use Indian format** (+91-XXXXXXXXXX). You can change these in Settings (GET/PUT `/api/v1/settings`) or in the seed file.

## Where the dataset is

The sample dataset is **inside the project**:

- **File:** `src/main/resources/seed-data.json`
- It includes:
  - **4 categories:** Electronics, Office Supplies, Furniture, Safety & PPE
  - **3 suppliers:** Indian-style contacts (e.g. +91-9876543210), addresses in Bangalore, Hyderabad, Chennai
  - **11 products** with prices in **INR** (SKUs, names, quantities, reorder levels, warehouse locations)

You can edit `seed-data.json` to add or change categories, suppliers, and products. Product entries use `categoryIndex` and `supplierIndex` (0-based) to link to the categories and suppliers in the same file.

## How to load the dataset

### Option 1: Postman (recommended)

1. Log in as admin and get a Bearer token (POST `/api/v1/auth/login`).
2. Send:
   - **Method:** POST  
   - **URL:** `http://localhost:8080/api/v1/seed`  
   - **Authorization:** Bearer Token (admin token)
   - **Body:** none
3. The response shows how many categories, suppliers, and products were created (or skipped if they already exist).

### Option 2: Seed from retail CSV

If you have **retail_store_inventory.csv** in the project folder (or pass its path):

- **Method:** POST  
- **URL:** `http://localhost:8080/api/v1/seed/csv`  
- **Authorization:** Bearer Token (admin)  
- **Body:** none  
- **Optional:** `?filename=retail_store_inventory.csv` (default)

This creates:

- **Categories** from the CSV “Category” column (e.g. Groceries, Toys, Electronics, Furniture, Clothing).
- **Suppliers** by “Region” (North, South, East, West) with Indian-style names and phone numbers (+91-…).
- **Products** unique by “Product ID” + “Category”, with price converted to **INR** (CSV price × 83), inventory from “Inventory Level”, and reorder level 10.

Duplicate SKUs are skipped (products already in DB are not overwritten).

### Option 3: cURL (JSON seed)

```bash
curl -X POST http://localhost:8080/api/v1/seed -H "Authorization: Bearer YOUR_TOKEN"
```

## Using your own data

- **Edit** `src/main/resources/seed-data.json` and add more categories, suppliers, or products (keep the same JSON structure).
- **Re-run** POST `/api/v1/seed` when the app is running. Existing categories are updated by name; existing suppliers by name are reused; products with the same SKU are skipped.
- You can also add data via the normal APIs (POST categories, suppliers, products) instead of or in addition to the seed file.

## Product visualizations

After loading data:

- **Backend:** GET `/api/v1/dashboard/charts` returns:
  - `productsByCategory`: count of products per category (for a bar chart).
  - `stockStatusBreakdown`: count per status STOCKED / LOW / CRITICAL (for a pie chart).
- **Frontend:** The Dashboard at http://localhost:3000 shows:
  - **Products by Category** (bar chart)
  - **Stock Status** (pie chart)
  - Low stock alerts list

Use the same Bearer token for `/dashboard/charts` as for other protected endpoints.

---

## Where to get more datasets

| Source | What you get | How to use |
|--------|----------------|------------|
| **This project** | `src/main/resources/seed-data.json` | Edit the JSON (INR prices, Indian phones), then POST `/api/v1/seed`. |
| **Kaggle** | [Inventory / retail / sales datasets](https://www.kaggle.com/datasets?search=inventory) (e.g. "Retail Sales", "Product Inventory") | Download CSV/JSON, map columns to categories, suppliers, products; either import via a small script that calls your APIs or convert to `seed-data.json` format. |
| **UCI ML Repository** | [Retail datasets](https://archive.ics.uci.edu/ml/datasets.php?format=&task=&att=&area=&numAtt=&numIns=&type=&sort=nameUp&view=table) | Same as Kaggle: convert to your schema (categories, suppliers, products in INR) and load via seed or API. |
| **Government / open data (India)** | [data.gov.in](https://data.gov.in) – commodity prices, MSME, etc. | Use for reference prices or supplier lists; normalize to INR and Indian phone format, then add to `seed-data.json` or import via API. |
| **Your own CSV/Excel** | Export from existing tools | Map columns to: category (or categoryIndex), supplier (or supplierIndex), sku, name, unitPrice (INR), currentQuantity, reorderLevel; convert to JSON and either extend `seed-data.json` or write a one-off script that POSTs to `/api/v1/categories`, `/api/v1/suppliers`, `/api/v1/products`. |

**Quick start:** Use and edit `seed-data.json` (already in INR, Indian phones). For larger data, use Kaggle/UCI CSV, convert to the same structure, then load via seed or a small import script that calls your REST API.
