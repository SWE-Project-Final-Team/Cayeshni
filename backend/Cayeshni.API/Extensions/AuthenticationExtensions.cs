using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Cayeshni.API.Services;
using Cayeshni.Infrastructure.Persistence.Options;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;

namespace Cayeshni.API.Extensions;

public static class AuthenticationExtensions
{
    public static void AddAuthenticationServices(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtOptions = configuration.GetSection(JwtOptions.Section).Get<JwtOptions>()
            ?? throw new InvalidOperationException("JWT configuration is missing.");

        // Register JwtOptions for injection into services like JwtService
        services.AddSingleton(jwtOptions);

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            // Preserve raw JWT claim names like "sub" instead of remapping them.
            options.MapInboundClaims = false;

            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer              = true,
                ValidateAudience            = true,
                ValidateLifetime            = true,
                ValidateIssuerSigningKey    = true,
                ValidIssuer                 = jwtOptions.Issuer,
                ValidAudience               = jwtOptions.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Secret)),
                ClockSkew = TimeSpan.Zero, // token expires exactly at token expiration time without additional tolerance

                // Map "sub" claim to ClaimTypes.NameIdentifier for easier access in controllers
                NameClaimType = JwtRegisteredClaimNames.Sub,
                RoleClaimType = ClaimTypes.Role // also map "role" claims to ClaimTypes.Role (i don't have roles yet but incase i add them in the future)
            };
        });

        services.AddAuthorization(options =>
        {
            // Full access - requires valid JWT and email_confirmed == true
            var fullAccess = new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .RequireClaim("email_confirmed", "true")
                .Build();

            // Limited access - any authenticated user (including email_confirmed=false)
            var limitedAccess = new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .Build();

            options.AddPolicy("FullAccess", fullAccess);
            options.AddPolicy("LimitedAccess", limitedAccess);

            // Make FullAccess the default for [Authorize]
            options.DefaultPolicy = fullAccess;
        });

        // Register CookieService
        services.AddScoped<CookieService>();
    }
}