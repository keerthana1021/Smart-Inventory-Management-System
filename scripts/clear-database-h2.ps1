# Clear H2 database so you can start fresh.
# 1. STOP your Spring Boot app first (IntelliJ Stop, or close the terminal).
# 2. Run this script from the project root (Smart_Inventory_Management System).

$dataDir = Join-Path $PSScriptRoot ".." "data"
if (-not (Test-Path $dataDir)) {
    Write-Host "No data folder found. Database may already be empty or using in-memory H2."
    exit 0
}

Get-ChildItem -Path $dataDir -Filter "smart-inventory*" -ErrorAction SilentlyContinue | Remove-Item -Force
Write-Host "H2 database files removed. Start your application again; tables will be recreated empty and admin user will be re-initialized."
