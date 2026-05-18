# Script to create a new EF Core migration in the correct location

param(
    [string]$MigrationName
)

if (-not $MigrationName) {
    Write-Host "Usage: .\create-migration.ps1 <MigrationName>"
    Write-Host "Example: .\create-migration.ps1 AddUserTable"
    exit 1
}

Write-Host "Creating migration: $MigrationName"

Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)

dotnet ef migrations add $MigrationName `
    --project Cayeshni.Infrastructure `
    --startup-project Cayeshni.API `
    --output-dir Persistence/Migrations

Write-Host "Migration created successfully in Cayeshni.Infrastructure/Persistence/Migrations/"