using Cayeshni.Application;
using Cayeshni.Infrastructure;
using Scalar.AspNetCore;
using Cayeshni.API.Extensions;
using Microsoft.AspNetCore.DataProtection;
using Cayeshni.Api.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;

DotNetEnv.Env.TraversePath().Load(); // Load .env file from project root

var builder = WebApplication.CreateBuilder(args);

// Add layer services
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();

// Add authentication and authorization services
builder.Services.AddAuthentication();
builder.Services.AddAuthorization();

// Add controllers and OpenAPI (Swagger/Scalar) services
builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

// Initialize database with migrations and seeding (seeding only in development if db is empty)
await app.InitializeDatabaseAsync();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi(); // generates openapi.json

    // Scalar UI
    app.MapScalarApiReference(options =>
        options.WithDefaultHttpClient(ScalarTarget.JavaScript, ScalarClient.Axios));

    // Swagger UI
    app.UseSwaggerUI(options =>
        options.SwaggerEndpoint("/openapi.json", "Cayeshni API"));
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/", () => "Cayeshni API");

app.Run();