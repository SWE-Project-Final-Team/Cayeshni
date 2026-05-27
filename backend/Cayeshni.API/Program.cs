using Cayeshni.Application;
using Cayeshni.Infrastructure;
using Cayeshni.API.Extensions;
using Cayeshni.API.Middleware;
using Scalar.AspNetCore;

DotNetEnv.Env.TraversePath().Load(); // Load .env file from project root

var builder = WebApplication.CreateBuilder(args);

// Add layer services
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();

// Add authentication and authorization services (JWT, cookie handling, etc.)
builder.Services.AddAuthenticationServices(builder.Configuration);
// Register API surface services (JSON, CORS, rate limiting, OpenAPI)
builder.Services.AddApiServices(builder.Configuration); //(after auth to ensure policies are registered)

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy
            .WithOrigins(builder.Configuration["App:FrontendUrl"] ?? "http://localhost:3000")
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

// Serve files in the uploads directory at the /uploads URL path
app.UseUploads();

app.UseHttpsRedirection();
app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers();

app.MapGet("/", () => "Cayeshni API");
app.MapGet("/health", () => Results.Ok("healthy"));

app.Run();
