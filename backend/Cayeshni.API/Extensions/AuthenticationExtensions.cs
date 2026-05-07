using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace Cayeshni.API.Extensions;

public static class AuthenticationExtensions
{
    public static void AddAuthenticationServices(this IServiceCollection services, IConfiguration configuration)
    {
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
                ValidIssuer                 = configuration["Jwt:Issuer"],
                ValidAudience               = configuration["Jwt:Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Secret"]!)),
                ClockSkew = TimeSpan.Zero // token expires exactly at token expiration time without additional tolerance
            };
        });

        services.AddAuthorization();
    }
}