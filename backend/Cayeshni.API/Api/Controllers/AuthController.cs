using Microsoft.AspNetCore.Mvc;
using Cayeshni.API.Application.Features.Auth;
using Cayeshni.API.Application.Common.Exceptions;
using Cayeshni.API.Api.Services;
using Microsoft.AspNetCore.Authorization;
using System.IdentityModel.Tokens.Jwt;

namespace Cayeshni.API.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly CookieService _cookieService;

    public AuthController(AuthService authService, CookieService cookieService)
    {
        _authService = authService;
        _cookieService = cookieService;
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto registerDto)
    {
        return Ok(Respond(await _authService.RegisterAsync(registerDto)));
    }

    [AllowAnonymous]
    [HttpPost("login")] 
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto loginDto)
    {
        return Ok(Respond(await _authService.LoginAsync(loginDto)));
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponseDto>> Refresh()
    {
        var refreshToken = _cookieService.GetRefreshToken(Request)
            ?? throw new UnauthorizedException("Refresh token is missing.");

        return Ok(Respond(await _authService.RefreshTokenAsync(refreshToken)));
    }

    [Authorize]
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        _cookieService.ClearRefreshToken(Response);
        return NoContent();
    }


    private AuthResponseDto Respond(TokenPairDto tokens)
    {
        _cookieService.SetRefreshToken(Response, tokens.RefreshToken);
        return new AuthResponseDto(
            tokens.AccessToken,
            EmailConfirmed: ParseEmailConfirmed(tokens.AccessToken)
        );
    }

    // Helper method to parse email_confirmed from access token
    private static bool ParseEmailConfirmed(string accessToken)
    {
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(accessToken);
        var claim = jwt.Claims.FirstOrDefault(c => c.Type == "email_confirmed");
        return claim?.Value == "true";
    }
}
