# Step-by-step: Switch from PostgreSQL/Supabase to MongoDB

**Migration is complete.** All entities use `@Document`, repositories use `MongoRepository<Entity, String>`, and IDs are `String` (MongoDB ObjectId) across the API.

---

## Overview

Your app currently uses **Spring Data JPA** with **PostgreSQL** (Supabase). Switching to **MongoDB** means:

1. Replacing JPA with **Spring Data MongoDB**
2. Converting **entities** from `@Entity` to `@Document` (IDs become `String`/ObjectId)
3. Converting **repositories** from `JpaRepository` to `MongoRepository`
4. Updating **services** that use JPA-specific queries or transactions
5. Configuring **MongoDB connection** (local or Atlas)

---

## Step 1: Add MongoDB and remove JPA in `pom.xml`

- **Remove:** `spring-boot-starter-data-jpa`, and optionally PostgreSQL/H2 drivers if you no longer need them.
- **Add:** `spring-boot-starter-data-mongodb`

After this, the project will not compile until entities and repositories are converted.

---

## Step 2: Configure MongoDB connection

In `application.properties` (or `application-local.properties`):

- **Local MongoDB (default):**
  ```properties
  spring.data.mongodb.uri=mongodb://localhost:27017/smart_inventory
  ```
- **MongoDB Atlas:**
  ```properties
  spring.data.mongodb.uri=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/smart_inventory?retryWrites=true&w=majority
  ```
  Replace `USERNAME`, `PASSWORD`, and cluster host from your Atlas dashboard.

Remove or comment out any `spring.datasource.*` and `spring.jpa.*` when using MongoDB.

---

## Step 3: Convert entities to MongoDB documents

For each JPA entity:

- Replace `@Entity`, `@Table(name = "...")` with `@Document(collection = "...")`.
- Replace `@Id` + `@GeneratedValue` with `@Id` and type `String` (MongoDB will use ObjectId).
- Remove JPA-specific: `@Column`, `@JoinColumn`, `@OneToMany`, `@ManyToOne`, `@ManyToMany`, `@JoinTable`, `@Enumerated(EnumType.STRING)` (keep enum as-is).
- **Relationships:** Store referenced document IDs as `String` (e.g. `categoryId`, `supplierId`) instead of object references. For embedded lists (e.g. order items), keep a list of sub-documents (no `@DBRef` needed if embedded).
- Use `java.time` types as needed; Spring Data MongoDB supports them.
- Remove Hibernate annotations (`@CreationTimestamp`, etc.). You can set `createdAt`/`updatedAt` in code or use auditing later.

Example – **Category** (MongoDB):

```java
@Document(collection = "categories")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Category {
    @Id
    private String id;
    private String name;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

---

## Step 4: Convert repositories to MongoRepository

- Change `extends JpaRepository<Entity, Long>` to `extends MongoRepository<Entity, String>`.
- Replace JPA query methods with MongoDB-compatible ones:
  - `findByName` → same
  - `existsByName` → same
  - `findByCategoryId` → same (field is now a String)
  - Custom `@Query` in JPA → use `@Query("{ 'field' : ?0 }")` (MongoDB JSON) or method names.

Remove any `Pageable`/`Sort` usage that relied on JPA-specific behavior; Spring Data MongoDB supports `Pageable` and `Sort` in the same way for method names.

---

## Step 5: Update services

- **IDs:** All entity IDs are now `String`. Update service method parameters and return types (e.g. `Long id` → `String id` where you pass IDs).
- **References:** When loading a related document, use `categoryRepository.findById(categoryId)` etc. with the stored `String` id.
- **Transactions:** For multi-document writes, use `@Transactional` only if you have a MongoDB replica set. For a single node, avoid relying on transactions or enable replica set locally.
- **Custom queries:** Replace any `@Query` or `EntityManager` usage with MongoRepository methods or `MongoTemplate`.

---

## Step 6: Data initializer and seed

- **DataInitializer:** Create admin user and roles using the new MongoDB repositories (insert documents with `String` ids). Use `MongoTemplate` or repository `save()`.
- **SeedService:** Load `seed-data.json` and insert categories, suppliers, and products into MongoDB collections using the new repositories. Map `categoryIndex`/`supplierIndex` to the actual `String` ids after inserting categories and suppliers.

---

## Step 7: Controllers and DTOs

- Path variables and request bodies that use **numeric** ids (e.g. `Long`) should be updated to **String** if you expose MongoDB ids (e.g. `@PathVariable String id`). Alternatively, keep DTOs with numeric-looking ids if you add a separate numeric field; typically MongoDB apps use `String` ids in the API.
- Update any code that assumed `entity.getId()` was `Long`.

---

## Step 8: Run and test

1. **Install/start MongoDB**
   - **Local:** Install [MongoDB Community](https://www.mongodb.com/try/download/community) and run `mongod`, or use Docker: `docker run -d -p 27017:27017 mongo`.
   - **Atlas:** Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas), get the connection string, and set it in `application-local.properties` as `spring.data.mongodb.uri=mongodb+srv://...`.
2. Start the Spring Boot app (e.g. run `SmartInventoryManagementSystemApplication` or `./mvnw spring-boot:run`). No datasource/JPA; MongoDB auto-configuration will connect using the URI.
3. **Setup and login:**  
   - **POST** `http://localhost:8080/api/v1/auth/setup` with body `{"secret":"setup"}`.  
   - **POST** `http://localhost:8080/api/v1/auth/login` with body `{"username":"admin","password":"admin123"}`.  
   - Use the returned `token` as Bearer for other requests.
4. **IDs are now strings.** Use the returned `id` values (e.g. `"507f1f77bcf86cd799439011"`) in paths like `GET /api/v1/products/{id}` and in request bodies (e.g. `categoryId`, `supplierId`, `productId`).
5. Optionally load sample data: **POST** `http://localhost:8080/api/v1/seed` with Bearer token (admin).

---

## Quick reference: collection names

Use the same logical names as tables, e.g.:

- `categories`, `users`, `roles`, `suppliers`, `products`, `purchase_orders`, `sales_orders`, `inventory_transactions`, `notifications`, `audit_logs`, `system_settings`.

Order items can be **embedded** inside `purchase_orders` and `sales_orders` documents to avoid extra collections.
