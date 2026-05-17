using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.RateLimiting;
using Cayeshni.API.Middleware;
using Scalar.AspNetCore;

namespace Cayeshni.API.Extensions;

public static class ApiHostingExtensions
{
    public static IServiceCollection AddApiServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Configure JSON options globally
        services.ConfigureHttpJsonOptions(options =>
        {
            options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
            options.SerializerOptions.NumberHandling = JsonNumberHandling.Strict;
            options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        });

        services.AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
                options.JsonSerializerOptions.NumberHandling = JsonNumberHandling.Strict;
                options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
                options.JsonSerializerOptions.Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
            });

        var frontendUrl = configuration["App:FrontendUrl"]
            ?? throw new InvalidOperationException("Frontend URL configuration is missing (App:FrontendUrl).");

        // CORS policy to allow requests from the frontend application
        services.AddCors(options =>
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

        // Rate limiting configuration
        var rateWindow = TimeSpan.FromMinutes(10);
        services.AddRateLimiter(options =>
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
                o.PermitLimit = 5; // allow 5 resend attempts per window (10 minutes)
                o.Window = rateWindow;
                o.QueueLimit = 0;
                o.QueueProcessingOrder = System.Threading.RateLimiting.QueueProcessingOrder.NewestFirst;
            });
        });

        // OpenAPI
        services.AddEndpointsApiExplorer();
        services.AddOpenApi(options =>
        {
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

        return services;
    }
}