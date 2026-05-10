using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Cayeshni.Application.Common.Exceptions;

namespace Cayeshni.API.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal user)
    {
        var sub = user.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? user.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(sub))
        {
            throw new UnauthorizedException("User ID claim (sub) is missing.");
        }

        return Guid.Parse(sub);
    }
}