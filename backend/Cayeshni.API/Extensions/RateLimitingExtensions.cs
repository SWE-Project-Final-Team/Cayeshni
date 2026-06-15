using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace Cayeshni.API.Extensions;

public static class RateLimitingExtensions
{
    // Simple fixed-window rate limit for resend actions.
    public static IServiceCollection AddApiRateLimiting(this IServiceCollection services)
    {
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
                o.PermitLimit = 5; // small window to avoid abuse
                o.Window = rateWindow;
                o.QueueLimit = 0;
                o.QueueProcessingOrder = QueueProcessingOrder.NewestFirst;
            });
        });

        return services;
    }
}