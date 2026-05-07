using Cayeshni.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Cayeshni.API.Extensions;

public static class DatabaseInitializationExtensions
{
    public static async Task InitializeDatabaseAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var services = scope.ServiceProvider;
        var logger = services.GetRequiredService<ILogger<Program>>();

        try
        {
            await DbInitializer.InitializeAsync(services);

            if (app.Environment.IsDevelopment())
            {
                await DbSeeder.SeedAsync(services);
            }
        }
        catch (Npgsql.NpgsqlException ex)
        {
            logger.LogError(ex,
                "Database connection failed. Check connection string and ensure PostgreSQL is running");
            throw;
        }
        catch (DbUpdateException ex)
        {
            logger.LogError(ex,
                "Database update failed during migration/seeding. Schema or constraint issue detected");
            throw;
        }
        catch (TimeoutException ex)
        {
            logger.LogError(ex,
                "Database operation timed out. DB may be slow or unreachable");
            throw;
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Unexpected error during database initialization");
            throw;
        }
    }
}