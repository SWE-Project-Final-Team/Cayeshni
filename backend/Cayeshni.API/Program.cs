using Cayeshni.Application;
using Cayeshni.Infrastructure;
using Scalar.AspNetCore;
using Cayeshni.API.Extensions;
using Cayeshni.Api.Middleware;
using System.Text.Json.Serialization;

DotNetEnv.Env.TraversePath().Load(); // Load .env file from project root

var builder = WebApplication.CreateBuilder(args);

// Add layer services
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();

// Add authentication and authorization services (JWT, cookie handling, etc.)
builder.Services.AddAuthenticationServices(builder.Configuration);

// Configure JSON options globally
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
    options.SerializerOptions.NumberHandling = JsonNumberHandling.Strict;
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter());
        options.JsonSerializerOptions.NumberHandling = JsonNumberHandling.Strict;
        options.JsonSerializerOptions.Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
    });

// Add OpenAPI (Swagger/Scalar) services
builder.Services.AddEndpointsApiExplorer(); // Required for OpenAPI generation
builder.Services.AddOpenApi(options =>
{
    // Add JWT Bearer security scheme to OpenAPI documentation
    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        document.Components ??= new Microsoft.OpenApi.OpenApiComponents();
        document.Components.SecuritySchemes ??= new Dictionary<string, Microsoft.OpenApi.IOpenApiSecurityScheme>();

        document.Components.SecuritySchemes["Bearer"] = new Microsoft.OpenApi.OpenApiSecurityScheme
        {
            Type = Microsoft.OpenApi.SecuritySchemeType.Http,
            Scheme = Microsoft.OpenApi.OpenApiConstants.Bearer,
            BearerFormat = Microsoft.OpenApi.OpenApiConstants.Jwt,
            Description = "JWT bearer authentication"
        };

        return Task.CompletedTask;
    });
});

var frontendOrigin = builder.Configuration["Frontend:Origin"] ?? "http://localhost:3000";
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(frontendOrigin)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

// Initialize database with migrations and seeding (seeding only in development if db is empty)
await app.InitializeDatabaseAsync();

app.UseUploads(); // Serve static files from uploads directory

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


// Ensure uploads directory exists and serve it as static files at /uploads
var uploadsPath = builder.Configuration["FileStorage:BasePath"] 
    ?? Path.Combine(Directory.GetCurrentDirectory(), "uploads");

Directory.CreateDirectory(uploadsPath);

// Serve files in the uploads directory at the /uploads URL path
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath  = "/uploads"
});

app.UseHttpsRedirection();
app.UseCors();

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/", () => "Cayeshni API");

app.Run();