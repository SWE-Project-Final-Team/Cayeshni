using Cayeshni.Application;
using Cayeshni.Infrastructure;
using Microsoft.AspNetCore.DataProtection;
using Cayeshni.Api.Middleware;

DotNetEnv.Env.TraversePath().Load(); // Load .env file from project root

var builder = WebApplication.CreateBuilder(args);

// Add layer services
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();

// Add authentication and authorization services
builder.Services.AddAuthentication();
builder.Services.AddAuthorization();

// Configure data protection to persist keys in a shared volume for multi-instance scenarios
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo("/app/keys"))
    .SetApplicationName("Cayeshni");

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/", () => "Cayeshni API");

app.Run();