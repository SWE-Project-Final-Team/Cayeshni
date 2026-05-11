using Cayeshni.Infrastructure.Persistence;
using Cayeshni.Infrastructure.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.DataProtection;
using Cayeshni.Infrastructure.Services;
using Cayeshni.Application.Common.Interfaces;
using Cayeshni.Application.Features.Groups;
using Cayeshni.Infrastructure.Persistence.Options;
using Cayeshni.Infrastructure.Persistence.Repositories;
using Cayeshni.Infrastructure.Options;
using Cayeshni.Application.Features.Users;

namespace Cayeshni.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Configure database options from configuration
        var dbOptions = configuration.GetSection(DatabaseOptions.Section).Get<DatabaseOptions>()
            ?? throw new InvalidOperationException("Database configuration is missing.");

        // Register AppDbContext with Npgsql provider
        var connectionString = dbOptions.ToConnectionString();
        services.AddDbContext<AppDbContext>(options => 
            options.UseNpgsql(connectionString, x => 
            {
                x.MigrationsAssembly("Cayeshni.Infrastructure");
                x.EnableRetryOnFailure(5);
            }));
    
        // Register Identity services
        services.AddIdentity<AppUser, IdentityRole<Guid>>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequiredLength = 8;
            options.Password.RequireNonAlphanumeric = false;
            options.Password.RequireUppercase = false;
            options.Password.RequireLowercase = false;
            options.User.RequireUniqueEmail = true;
        })
        .AddEntityFrameworkStores<AppDbContext>()
        .AddDefaultTokenProviders()
        .AddSignInManager();

        // Data protection
        var keyPath = configuration["DataProtection:KeysPath"] ?? "DataProtection-Keys";
        if (!Directory.Exists(keyPath)) Directory.CreateDirectory(keyPath); // Ensure directory exists
        services.AddDataProtection().PersistKeysToFileSystem(new DirectoryInfo(keyPath))
                                    .SetApplicationName("Cayeshni");
              
        // get JWT options from configuration
        var jwtOptions = configuration.GetSection(JwtOptions.Section).Get<JwtOptions>()
            ?? throw new InvalidOperationException("JWT configuration is missing.");

        // Register JwtOptions as singleton for direct injection
        services.AddSingleton(jwtOptions);

        // Authentication services
        services.AddScoped<IIdentityService, IdentityService>();
        services.AddScoped<IJwtService, JwtService>();
    
        // Email service (using Brevo)
        var brevoOptions = configuration
            .GetSection(BrevoOptions.Section)
            .Get<BrevoOptions>()
            ?? throw new InvalidOperationException("Brevo configuration is missing.");
            
        services.AddSingleton(brevoOptions);
        services.AddHttpClient<BrevoEmailService>();
        services.AddScoped<IEmailService, BrevoEmailService>();

        // File storage service
        services.Configure<FileStorageOptions>(configuration.GetSection(FileStorageOptions.Section));
        services.AddScoped<IFileStorageService, LocalFileStorageService>();

        // Register repositories
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IGroupRepository, GroupRepository>();

        // Add other services like repositories, external API clients, etc.

        return services;
    }
}