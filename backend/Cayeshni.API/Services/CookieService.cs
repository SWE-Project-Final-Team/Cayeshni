using Cayeshni.Infrastructure.Persistence.Options;

namespace Cayeshni.API.Services;

public sealed class CookieService
{
    private const string RefreshTokenCookieName = "refreshToken";
    private readonly JwtOptions _jwtOptions;
    private readonly IWebHostEnvironment _env;

    public CookieService(JwtOptions jwtOptions, IWebHostEnvironment env)
    {
        _jwtOptions = jwtOptions;
        _env = env;
    }

    public string? GetRefreshToken(HttpRequest request) => request.Cookies[RefreshTokenCookieName];

    public void SetRefreshToken(HttpResponse response, string refreshToken)
    {
        response.Cookies.Append(RefreshTokenCookieName, refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = !_env.IsDevelopment(),
            SameSite = SameSiteMode.Strict,
            Path = "/api/auth",
            Expires = DateTimeOffset.UtcNow.Add(_jwtOptions.RefreshExpiry)
        });
    }

    public void ClearRefreshToken(HttpResponse response)
    {
        response.Cookies.Delete(RefreshTokenCookieName, new CookieOptions
        {
            HttpOnly = true,
            Secure = !_env.IsDevelopment(),
            SameSite = SameSiteMode.Strict,
            Path = "/api/auth"
        });
    }
}

