# Cloud Database Connection Guide

This guide explains how to connect the Smart Inventory Management System to **Supabase (PostgreSQL)**, **MySQL (cloud)**, and **MongoDB** (optional audit store).

---

## 1. MySQL (Default – Local or Cloud)

The application uses **MySQL** by default. Use this for:

- Local development
- PlanetScale, AWS RDS, Azure Database for MySQL, or any MySQL-compatible host

### Local MySQL

1. Install MySQL and create a database:

```sql
CREATE DATABASE smart_inventory;
CREATE USER 'app'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL ON smart_inventory.* TO 'app'@'localhost';
```

2. In `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/smart_inventory?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=app
spring.datasource.password=your_password
```

### Cloud MySQL (e.g. PlanetScale, AWS RDS)

1. Create a MySQL instance in your cloud provider and note:
   - Host
   - Port (usually 3306)
   - Database name
   - Username and password

2. Set environment variables (recommended for production):

```bash
export SPRING_DATASOURCE_URL="jdbc:mysql://your-host:3306/your_db?useSSL=true&serverTimezone=UTC"
export SPRING_DATASOURCE_USERNAME=your_user
export SPRING_DATASOURCE_PASSWORD=your_password
```

Or use profile `cloud` and set the same in `application-cloud.properties` or in your deployment config.

3. Run:

```bash
./mvnw spring-boot:run
```

---

## 2. Supabase (PostgreSQL)

Supabase provides **PostgreSQL**. The project includes an optional profile for it.

### Steps

1. **Create a Supabase project** at [supabase.com](https://supabase.com).

2. **Get connection details**  
   In Supabase: **Project Settings → Database**:
   - **Connection string** (URI) or **Host**, **Port**, **Database**, **User**, **Password**
   - Use **Connection pooling** (port 6543) for serverless or high concurrency.

3. **Configure Spring Boot**  

   Either set environment variables:

   ```bash
   export SPRING_PROFILES_ACTIVE=supabase
   export SUPABASE_DB_URL="jdbc:postgresql://db.xxxxx.supabase.co:5432/postgres"
   export SUPABASE_DB_USER=postgres
   export SUPABASE_DB_PASSWORD=your_password
   ```

   Or create/update `src/main/resources/application-supabase.properties`:

   ```properties
   spring.datasource.url=jdbc:postgresql://db.YOUR_REF.supabase.co:5432/postgres
   spring.datasource.username=postgres
   spring.datasource.password=YOUR_DB_PASSWORD
   spring.datasource.driver-class-name=org.postgresql.Driver
   spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
   spring.jpa.hibernate.ddl-auto=update
   ```

4. **Run with Supabase profile**:

   ```bash
   ./mvnw spring-boot:run -Dspring-boot.run.profiles=supabase
   ```

   Or set `SPRING_PROFILES_ACTIVE=supabase` in your environment.

5. **First run**  
   Hibernate will create tables (`ddl-auto=update`). Default admin user is created on first start (see `DataInitializer`: username `admin`, password `admin123`).

---

## 3. MongoDB (Optional – e.g. for Audit / Analytics)

The main app is built for **MySQL/PostgreSQL** (JPA). To use **MongoDB** for a specific use case (e.g. audit logs or analytics):

### Option A: Separate microservice

- Build a small service (e.g. Spring Boot + Spring Data MongoDB) that writes audit/analytics events to MongoDB.
- Have the main app send events via REST or message queue to that service.

### Option B: Add MongoDB to this app

1. Add to `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-mongodb</artifactId>
</dependency>
```

2. Add configuration (e.g. in `application.properties` or profile):

```properties
spring.data.mongodb.uri=mongodb+srv://user:password@cluster.mongodb.net/smart_inventory?retryWrites=true&w=majority
```

3. Create a document entity and repository for audit/events and use it in addition to (or instead of) the JPA `AuditLog` for those flows.

For **MongoDB Atlas**:

- Create a cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
- Get the connection string from **Connect → Drivers** and set `spring.data.mongodb.uri`.

---

## 4. Quick reference

| Target        | Profile / Config        | Main property / env                          |
|---------------|-------------------------|----------------------------------------------|
| Local MySQL   | default                 | `spring.datasource.url` (application.properties) |
| Cloud MySQL   | `cloud` (optional)      | `SPRING_DATASOURCE_URL`, `USERNAME`, `PASSWORD` |
| Supabase      | `supabase`              | `SUPABASE_DB_URL` or application-supabase.properties |
| MongoDB       | N/A (optional module)   | `spring.data.mongodb.uri`                    |

---

## 5. Running the full stack

1. **Backend (Spring Boot)**  
   Use one of the configs above, then:

   ```bash
   cd "Smart_Inventory_Management System"
   ./mvnw spring-boot:run
   ```

   API: `http://localhost:8080`  
   Swagger: `http://localhost:8080/swagger-ui.html`

2. **Frontend (React)**  
   Uses Vite proxy to `/api` → backend. From project root:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   Open `http://localhost:3000` and log in with `admin` / `admin123`.

3. **Docker (optional)**  
   For MySQL only:

   ```bash
   docker run -d --name mysql-inv -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=smart_inventory -p 3306:3306 mysql:8
   ```

   Then run the app with default MySQL config pointing to `localhost:3306`.
