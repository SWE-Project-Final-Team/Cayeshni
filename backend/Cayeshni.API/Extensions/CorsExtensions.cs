using System.Text.RegularExpressions;

namespace Cayeshni.API.Extensions;

public static class CorsExtensions
{
    // CORS policy for the frontend and Vercel previews.
    public static IServiceCollection AddFrontendCors(this IServiceCollection services, IConfiguration configuration)
    {
        var allowedOrigins = configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>() ?? Array.Empty<string>();

        services.AddCors(options =>
        {
            options.AddPolicy("FrontendPolicy", policy =>
            {
                policy.SetIsOriginAllowed(origin =>
                {
                    if (string.IsNullOrWhiteSpace(origin))
                        return false;

                    foreach (var allowedOrigin in allowedOrigins)
                    {
                        if (!string.IsNullOrWhiteSpace(allowedOrigin) &&
                            OriginMatchesAllowedOrigin(origin, allowedOrigin))
                            return true;
                    }

                    return false;
                })
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
            });
        });

        return services;
    }

    private static bool OriginMatchesAllowedOrigin(string origin, string allowedOrigin)
    {
        if (string.IsNullOrWhiteSpace(origin) || string.IsNullOrWhiteSpace(allowedOrigin))
            return false;

        if (string.Equals(origin, allowedOrigin, StringComparison.OrdinalIgnoreCase))
            return true;

        if (!allowedOrigin.Contains('*'))
            return false;

        var pattern = "^" + Regex.Escape(allowedOrigin).Replace("\\*", ".*") + "$";
        return Regex.IsMatch(
            origin,
            pattern,
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
    }
}