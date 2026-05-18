#!/bin/bash

# Script to create a new EF Core migration in the correct location

if [ -z "$1" ]; then
    echo "Usage: ./create-migration.sh <MigrationName>"
    echo "Example: ./create-migration.sh AddUserTable"
    exit 1
fi

MIGRATION_NAME=$1

echo "Creating migration: $MIGRATION_NAME"

cd "$(dirname "$0")"

dotnet ef migrations add "$MIGRATION_NAME" \
    --project Cayeshni.Infrastructure \
    --startup-project Cayeshni.API \
    -o Persistence/Migrations

if [ $? -ne 0 ]; then
    echo "Failed to create migration. Please check the error messages above."
    exit 1
fi

echo "Migration created successfully in Cayeshni.Infrastructure/Persistence/Migrations/"
