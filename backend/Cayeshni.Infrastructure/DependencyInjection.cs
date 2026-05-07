using Cayeshni.Infrastructure.Persistence;
using Cayeshni.Infrastructure.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;

namespace Cayeshni.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Register AppDbContext with Npgsql provider
        var connectionString = GetConnectionString(configuration);
        Console.WriteLine($"Using connection string: {connectionString}"); // for debugging REMOVE
        services.AddDbContext<AppDbContext>(options => 
            options.UseNpgsql(connectionString, x => 
            {
                x.MigrationsAssembly("Cayeshni.Infrastructure");
                x.EnableRetryOnFailure(5);
            }));
    
        // Register Identity services
        services.AddIdentityCore<AppUser>()
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders()
            .AddSignInManager();
              
        // Add other services like repositories, external API clients, etc.

        return services;
    }

    private static string GetConnectionString(IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            var host = configuration["DB_HOST"] ?? "localhost";
            var port = configuration["DB_PORT"] ?? "5432";
            var db   = configuration["DB_NAME"] ?? "cayeshni";
            var user = configuration["DB_USER"] ?? "postgres";
            var pass = configuration["DB_PASSWORD"] ?? "postgres";

            connectionString = $"Host={host};Port={port};Database={db};Username={user};Password={pass}";
        }

        return connectionString;
    }
}