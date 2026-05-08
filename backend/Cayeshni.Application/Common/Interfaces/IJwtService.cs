namespace Cayeshni.Application.Common.Interfaces;

public interface IJwtService
{
    string GenerateAccessToken(Guid userId, string email);
    string GenerateRefreshToken();
}