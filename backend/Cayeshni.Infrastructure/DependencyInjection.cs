using Cayeshni.Infrastructure.Persistence;
using Cayeshni.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.DataProtection;
using Cayeshni.Infrastructure.Services;
using Cayeshni.Application.Common.Interfaces;
using Cayeshni.Application.Features.Dashboard;
using Cayeshni.Application.Features.Transactions;
using Cayeshni.Application.Features.Settlements;
using Cayeshni.Application.Features.Groups;
using Cayeshni.Application.Features.Friends;
using Cayeshni.Application.Features.Users;
using Cayeshni.Infrastructure.Persistence.Options;
using Cayeshni.Infrastructure.Persistence.Repositories;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;

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
                x.MigrationsAssembly(typeof(AppDbContext).Assembly.GetName().Name); // Cayeshni.Infrastructure
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
        // services.AddScoped<IFileStorageService, LocalFileStorageService>(); // for local filesystem storage
        services.AddScoped<IFileStorageService, CloudinaryFileStorageService>(); // for Cloudinary storage
        
        // Profile image processor
        services.AddScoped<IProfileImageProcessor, ProfileImageProcessor>();
        
        // Email normalizer delegate for FriendService
        services.AddScoped<Func<string?, string?>>(sp => email =>
        {
            if (string.IsNullOrEmpty(email))
                return null;
            return email.ToUpperInvariant();
        });


        // Register repositories
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IFriendRepository, FriendRepository>();
        services.AddScoped<IGroupRepository, GroupRepository>();
        services.AddScoped<IDashboardRepository, DashboardRepository>();
        services.AddScoped<ITransactionRepository, TransactionRepository>();
        services.AddScoped<ISettlementRepository, SettlementRepository>();

        services.AddHostedService<UnverifiedUserCleanupService>();

        return services;
    }
}

