using Cayeshni.Application;
using Cayeshni.Infrastructure;
using Scalar.AspNetCore;
using Cayeshni.API.Extensions;
using Cayeshni.Api.Middleware;

DotNetEnv.Env.TraversePath().Load(); // Load .env file from project root

var builder = WebApplication.CreateBuilder(args);

// Add layer services
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();

// Add authentication and authorization services (JWT, cookie handling, etc.)
builder.Services.AddAuthenticationServices(builder.Configuration);

// Add controllers and OpenAPI (Swagger/Scalar) services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer(); // Required for OpenAPI generation
builder.Services.AddOpenApi();

var app = builder.Build();

// Initialize database with migrations and seeding (seeding only in development if db is empty)
await app.InitializeDatabaseAsync();

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi(); // generates openapi.json

    // Scalar UI
    app.MapScalarApiReference(options =>
        options.WithDefaultHttpClient(ScalarTarget.JavaScript, ScalarClient.Axios));

    // Swagger UI
    app.UseSwaggerUI(options =>
        options.SwaggerEndpoint("/openapi/v1.json", "Cayeshni API"));
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/", () => "Cayeshni API");

app.Run();