using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Cayeshni.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task InitializeAsync(IServiceProvider serviceProvider)
    {
        var db = serviceProvider.GetRequiredService<AppDbContext>();

        await db.Database.MigrateAsync();

        // Ensure PostgreSQL extension exists automatically
        await db.Database.ExecuteSqlRawAsync(
            @"CREATE EXTENSION IF NOT EXISTS ""pgcrypto"";"
        );
    }
}