# Run the Project in IntelliJ IDEA

## If you see: `Connection refused: localhost:27017` / `MongoSocketOpenException`

The app is trying **local** MongoDB and nothing is running there. **Do one of:**

1. **Atlas:** Copy `application-local-secret.properties.example` → `application-local-secret.properties` and set your URI (§2 Option A), **or** set `MONGODB_URI` in Run Configuration (§2 Option B), **or**
2. **Docker:** In project root run `docker compose up -d`, then start the app again.

Full steps: **`FIX_MONGODB_CONNECTION_REFUSED.md`**

---

## 1. Open the project

- **File → Open** and select the project folder: `Smart_Inventory_Management System`
- Choose **Open as Project** (IntelliJ will detect the Maven `pom.xml`)
- Wait for Maven import and index. Ensure **JDK 17** is used: **File → Project Structure → Project** → set **SDK** to 17.

---

## 2. Set MongoDB connection (required)

The app uses **MongoDB**. Without MongoDB running or configured, you'll get "Connection refused" errors.

### Option A: Atlas URI in a file (same as before — no IntelliJ env var)

1. Copy `src/main/resources/application-local-secret.properties.example` to  
   `src/main/resources/application-local-secret.properties`
2. Open the new file and replace `YOUR_DB_USER`, `YOUR_PASSWORD`, and cluster host with your Atlas values (`@` in password → `%40`).
3. That file is **gitignored** — it won’t be committed.

### Option B: MongoDB Atlas via IntelliJ environment variable

1. Go to **Run → Edit Configurations...**
2. Select or add **SmartInventoryManagementSystemApplication**:
   - If missing: **+** → **Application** → Main class: `com.example.demo.SmartInventoryManagementSystemApplication`
3. Click **Modify options** → enable **Environment variables**
4. Add environment variable:
   - **Name:** `MONGODB_URI`
   - **Value:** your MongoDB Atlas connection string, e.g.  
     `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/smart_inventory?retryWrites=true&w=majority`
   - URL-encode special chars in password: `@` → `%40`
5. Click **OK** twice.

### Option C: Local MongoDB

Install and run MongoDB locally on port 27017. No extra config needed.

---

## 3. Run the backend

- Click **Run** (green play) next to **SmartInventoryManagementSystemApplication**
- Wait for: `Started SmartInventoryManagementSystemApplication`
- Backend: **http://localhost:8080**  
- Default login: **admin** / **admin123**

---

## 4. (Optional) Run the frontend

**Terminal in IntelliJ:**

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** and log in with **admin** / **admin123**.

---

## Quick checklist

| Step | Action |
|------|--------|
| 1 | Open project, wait for Maven import |
| 2 | Copy `application-local-secret.properties.example` → `application-local-secret.properties` and set Atlas URI **or** set `MONGODB_URI` in Run Configuration |
| 3 | Run **SmartInventoryManagementSystemApplication** |
| 4 | (Optional) `cd frontend` → `npm install` → `npm run dev` |

If you see "Connection refused" or "localhost:27017", MongoDB is not reachable. Use Option A or B above to point to MongoDB Atlas.
