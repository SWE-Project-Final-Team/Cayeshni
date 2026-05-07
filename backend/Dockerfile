# syntax=docker/dockerfile:1

# Multi-stage build for lightweight and secure .NET application

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build

WORKDIR /source

# Copy only project files first (better layer caching)
COPY Cayeshni.API/Cayeshni.API.csproj Cayeshni.API/
COPY Cayeshni.Application/Cayeshni.Application.csproj Cayeshni.Application/
COPY Cayeshni.Domain/Cayeshni.Domain.csproj Cayeshni.Domain/
COPY Cayeshni.Infrastructure/Cayeshni.Infrastructure.csproj Cayeshni.Infrastructure/

# Restore dependencies
RUN dotnet restore Cayeshni.API/Cayeshni.API.csproj

# Copy source code
COPY . .

# Build and publish
WORKDIR /source/Cayeshni.API
RUN dotnet publish --configuration Release --no-restore -o /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS final

WORKDIR /app

# Install necessary runtime dependencies (for PostgreSQL)
RUN apk add --no-cache krb5-libs

# Security: Create non-root user explicitly and set ownership
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser

# Copy published app from build stage
COPY --from=build --chown=appuser:appuser /app .

# Security: Set proper permissions for temporary files and keys
RUN mkdir -p /tmp && chmod 1777 /tmp && \
    mkdir -p /app/keys && \
    chown -R appuser:appuser /app/keys && \
    chmod 700 /app/keys

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD dotnet --version || exit 1

# Security: Run as non-root user
USER appuser

# Set environment for security and performance
ENV DOTNET_RUNNING_IN_CONTAINER=true \
    DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=true \
    ASPNETCORE_URLS=http://+:8080

# Expose port
EXPOSE 8080

# Run application
ENTRYPOINT ["dotnet", "Cayeshni.API.dll"]
