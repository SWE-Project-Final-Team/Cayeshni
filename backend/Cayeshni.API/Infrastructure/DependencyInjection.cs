using Cayeshni.API.Infrastructure.Persistence;
using Cayeshni.API.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.DataProtection;
using Cayeshni.API.Infrastructure.Services;
using Cayeshni.API.Application.Common.Interfaces;
using Cayeshni.API.Infrastructure.Persistence.Options;
using Cayeshni.API.Infrastructure.Persistence.Repositories;
using Microsoft.Extensions.Hosting;

namespace Cayeshni.API.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Configure database options from configuration
        var dbOptions = configuration.GetSection(DatabaseOptions.Section).Get<DatabaseOptions>()
            ?? throw new InvalidOperationException("Database configuration is missing.");

        // Register AppDbContext with Npgsql provider
        var connectionString = dbOptions.ToConnectionString();
        Console.WriteLine($"Using connection string: {connectionString}"); // for debugging REMOVE
        services.AddDbContext<AppDbContext>(options => 
            options.UseNpgsql(connectionString, x => 
            {
                x.MigrationsAssembly("Cayeshni.API");
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

        // File storage service — BasePath must be absolute for Docker/Linux (PhysicalFileProvider, file IO)
        services.AddOptions<FileStorageOptions>()
            .Bind(configuration.GetSection(FileStorageOptions.Section))
            .PostConfigure<IHostEnvironment>((opts, env) =>
            {
                if (string.IsNullOrWhiteSpace(opts.BasePath))
                    opts.BasePath = Path.GetFullPath(Path.Combine(env.ContentRootPath, "uploads"));
                else if (!Path.IsPathRooted(opts.BasePath))
                    opts.BasePath = Path.GetFullPath(Path.Combine(env.ContentRootPath, opts.BasePath));
            });
        services.AddScoped<IFileStorageService, LocalFileStorageService>();

        // Regiser Repositories
        services.AddScoped<IUserRepository, UserRepository>();

        services.AddHostedService<UnverifiedUserCleanupService>();

        return services;
    }
}
