using Microsoft.AspNetCore.Mvc;
using Cayeshni.Application.Features.Auth;
using Cayeshni.Application.Common.Exceptions;
using Cayeshni.API.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace Cayeshni.API.Controllers;

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
        var tokens = await _authService.RegisterAsync(registerDto);
        return Ok(CreateAuthResponse(tokens));
    }

    [AllowAnonymous]
    [HttpPost("login")] 
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto loginDto)
    {
        var tokens = await _authService.LoginAsync(loginDto);
        return Ok(CreateAuthResponse(tokens));
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponseDto>> Refresh()
    {
        var refreshToken = _cookieService.GetRefreshToken(Request)
            ?? throw new UnauthorizedException("Refresh token is missing.");

        var tokens = await _authService.RefreshTokenAsync(refreshToken);
        return Ok(CreateAuthResponse(tokens));
    }

    [Authorize]
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        _cookieService.ClearRefreshToken(Response);
        return NoContent();
    }

    // Helper method (creates AuthResponseDto + sets refresh token cookie)
    private AuthResponseDto CreateAuthResponse(TokenPairDto tokens)
    {
        _cookieService.SetRefreshToken(Response, tokens.RefreshToken);
        return new AuthResponseDto(tokens.AccessToken);
    }
}