using Cayeshni.API.Application;
using Cayeshni.API.Infrastructure;
using Scalar.AspNetCore;
using Cayeshni.API.Api.Extensions;
using Cayeshni.API.Api.Middleware;
using System.Text.Json.Serialization;
using Microsoft.Extensions.FileProviders;
using Microsoft.AspNetCore.RateLimiting;

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

var frontendUrl = builder.Configuration["App:FrontendUrl"] ?? "http://localhost:3000";
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy
            .WithOrigins(frontendUrl.TrimEnd('/'))
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var rateWindow = TimeSpan.FromMinutes(10);
builder.Services.AddRateLimiter(options =>
{
    options.OnRejected = async (context, ct) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.Headers.Append("Retry-After", ((int)rateWindow.TotalSeconds).ToString());
        await context.HttpContext.Response.WriteAsJsonAsync(
            new { error = $"Too many requests. Try again in {(int)rateWindow.TotalMinutes} minutes." }, ct);
    };

    options.AddFixedWindowLimiter("resend", o =>
    {
        o.PermitLimit = 3;
        o.Window = rateWindow;
        o.QueueLimit = 0;
        o.QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.NewestFirst;
    });
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

// PhysicalFileProvider requires an absolute path (Docker / Linux cwd may differ).
static string ResolveUploadsPhysicalPath(IWebHostEnvironment env, IConfiguration config)
{
    var configured = config["FileStorage:BasePath"];
    if (string.IsNullOrWhiteSpace(configured))
        return Path.GetFullPath(Path.Combine(env.ContentRootPath, "uploads"));
    if (Path.IsPathRooted(configured))
        return configured;
    return Path.GetFullPath(Path.Combine(env.ContentRootPath, configured));
}

// Ensure uploads directory exists and serve it as static files at /uploads
var uploadsPath = ResolveUploadsPhysicalPath(app.Environment, builder.Configuration);

Directory.CreateDirectory(uploadsPath);

// Serve files in the uploads directory at the /uploads URL path
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath  = "/uploads"
});

app.UseStaticFiles(); // For wwwroot and default static files

// app.UseHttpsRedirection();
app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers();
app.MapGet("/", () => "Cayeshni API");

app.Run();