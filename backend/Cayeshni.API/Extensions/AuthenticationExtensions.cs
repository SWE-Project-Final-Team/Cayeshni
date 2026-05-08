using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Cayeshni.Infrastructure.Persistence.Options;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace Cayeshni.API.Extensions;

public static class AuthenticationExtensions
{
    public static void AddAuthenticationServices(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtOptions = configuration.GetSection(JwtOptions.Section).Get<JwtOptions>()
            ?? throw new InvalidOperationException("JWT configuration is missing.");

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer              = true,
                ValidateAudience            = true,
                ValidateLifetime            = true,
                ValidateIssuerSigningKey    = true,
                ValidIssuer                 = jwtOptions.Issuer,
                ValidAudience               = jwtOptions.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Secret"]!)),
                ClockSkew = TimeSpan.Zero, // token expires exactly at token expiration time without additional tolerance

                NameClaimType = JwtRegisteredClaimNames.Sub,
                RoleClaimType = ClaimTypes.Role
            };
        });

        services.AddAuthorization();
    }
}