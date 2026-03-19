# Fix: `MongoSocketOpenException` / `Connection refused: localhost:27017`

## What this means

The app is using **`mongodb://localhost:27017`** (default), but **nothing is listening on port 27017** — MongoDB is not running on your PC, and you have not pointed the app at **MongoDB Atlas**.

---

## Fix A — Atlas URI in a local file (easiest if you don’t use env vars)

1. Copy the example file:
   - From project root:  
     `copy src\main\resources\application-local-secret.properties.example src\main\resources\application-local-secret.properties`
2. Edit **`application-local-secret.properties`** and set your real `spring.data.mongodb.uri=` (encode `@` in password as `%40`).
3. Run the app with profile **`local`** (default in `application.properties`).

That file is **gitignored** — same idea as before, without putting passwords in Git.

---

## Fix A2 — MongoDB Atlas via IntelliJ environment variable

1. Open **Run → Edit Configurations…** in IntelliJ.
2. Select **SmartInventoryManagementSystemApplication**.
3. Click **Modify options** → enable **Environment variables**.
4. Add:
   - **Name:** `MONGODB_URI`
   - **Value:** your Atlas string, e.g.  
     `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/smart_inventory?retryWrites=true&w=majority`  
     Encode special characters in the password (`@` → `%40`).
5. Ensure **Active profiles:** includes `local` (or whatever you use).
6. **Apply → OK** and run the app again.

Also allow your IP in Atlas: **Network Access → Add IP Address** (or `0.0.0.0/0` only for demos).

---

## Fix B — MongoDB on your machine with Docker

From the **project root** (where `docker-compose.yml` is):

```powershell
docker compose up -d
```

Wait until the container is healthy (~10–30 seconds), then start the Spring Boot app **without** setting `MONGODB_URI` (localhost default is correct).

---

## Fix C — Install MongoDB locally

Install MongoDB Community Edition, start the service so it listens on **27017**, then run the app.

---

## Checklist

| Symptom | Likely cause |
|--------|----------------|
| `localhost:27017` + Connection refused | No local Mongo **and** no `MONGODB_URI` for Atlas |
| Atlas + timeout / DNS | Network / firewall / Atlas IP allowlist |
| Wrong database | URI should end with `/smart_inventory` (or your DB name) |

See also: `RUN_IN_INTELLIJ.md` and `env.example`.
