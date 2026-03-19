#
# Backend Dockerfile for Spring Boot (Render: Language = Docker)
#
# Builds the backend JAR using the Maven wrapper, then runs it.
#

FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /app

# Copy Maven wrapper + build files first for better layer caching
COPY mvnw .
COPY mvnw.cmd .
COPY .mvn ./.mvn
COPY pom.xml .

# Copy backend sources
COPY src ./src

RUN chmod +x ./mvnw

RUN ./mvnw -DskipTests package

FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=build /app/target/*.jar ./app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]

