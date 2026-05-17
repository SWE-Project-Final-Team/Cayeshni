namespace Cayeshni.API.Application.Common.Exceptions;

public class UnauthorizedException : Exception
{
    public UnauthorizedException(string message = "Unauthorized.")
        : base(message) { }
}
