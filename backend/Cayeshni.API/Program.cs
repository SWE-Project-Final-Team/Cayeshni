using Cayeshni.Application;
using Cayeshni.Infrastructure;
using Scalar.AspNetCore;
using Cayeshni.API.Extensions;
using Cayeshni.Api.Middleware;
using System.Text.Json.Serialization;
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

// Add rate limiting (for endpoints like resend confirmation and forgot password to prevent abuse)
builder.Services.AddRateLimiter(options =>
{
    var window = TimeSpan.FromMinutes(10);

    options.OnRejected = async (context, ct) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.Headers["Retry-After"] = ((int)window.TotalSeconds).ToString();
        await context.HttpContext.Response.WriteAsJsonAsync(
            new { error = $"Too many requests. Try again in {(int)window.TotalMinutes} minutes." }, ct);
    };

    options.AddFixedWindowLimiter("resend", o =>
    {
        o.PermitLimit = 3;
        o.Window = window;
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

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy
            .WithOrigins("http://localhost:3000")
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

// app.UseHttpsRedirection();
app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers();

app.MapGet("/", () => "Cayeshni API");

app.Run();