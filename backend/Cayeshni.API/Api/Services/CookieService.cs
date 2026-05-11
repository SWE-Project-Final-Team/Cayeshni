using Cayeshni.API.Infrastructure.Persistence.Options;

namespace Cayeshni.API.Api.Services;

public sealed class CookieService
{
    private const string RefreshTokenCookieName = "refreshToken";
    private readonly JwtOptions _jwtOptions;

    public CookieService(JwtOptions jwtOptions)
    {
        _jwtOptions = jwtOptions;
    }

    public string? GetRefreshToken(HttpRequest request) => request.Cookies[RefreshTokenCookieName];

    public void SetRefreshToken(HttpResponse response, string refreshToken)
    {
        response.Cookies.Append(RefreshTokenCookieName, refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
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
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = "/api/auth"
        });
    }
}
