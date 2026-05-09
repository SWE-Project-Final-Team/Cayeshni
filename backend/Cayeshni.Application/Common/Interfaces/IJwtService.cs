namespace Cayeshni.Application.Common.Interfaces;

public interface IJwtService
{
    string GenerateAccessToken(Guid userId);
    string GenerateRefreshToken(Guid userId);
    Guid? ValidateRefreshToken(string refreshToken);
}