using Microsoft.EntityFrameworkCore;
using Cayeshni.Infrastructure.Persistence;
using Cayeshni.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddIdentityApiEndpoints<AppUser>()
    .AddEntityFrameworkStores<AppDbContext>();

builder.Services.AddAuthorization();

// Configure DbContext with PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    
    if (string.IsNullOrEmpty(connectionString))
    {
        connectionString = "Host=localhost;Port=5432;Database=cayeshni;Username=postgres;Password=password";
    }
    else
    {
        connectionString = connectionString
            .Replace("${DB_HOST}", Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost")
            .Replace("${DB_PORT}", Environment.GetEnvironmentVariable("DB_PORT") ?? "5432")
            .Replace("${DB_NAME}", Environment.GetEnvironmentVariable("DB_NAME") ?? "cayeshni")
            .Replace("${DB_USER}", Environment.GetEnvironmentVariable("DB_USER") ?? "postgres")
            .Replace("${DB_PASSWORD}", Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "password");
    }
    
    options.UseNpgsql(connectionString);
});

var app = builder.Build();

// Apply migrations and seed database
using (var scope = app.Services.CreateScope())
{
    try
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await dbContext.Database.MigrateAsync();
        await DbSeeder.SeedAsync(scope.ServiceProvider);
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Error during database migration/seeding");
        throw; // Re-throw for visibility
    }
}

// Configure middleware
app.UseAuthorization();

app.MapGet("/", () => "This is Cayeshni API root endpoint.");
app.MapIdentityApi<AppUser>();

app.Run();