namespace Cayeshni.API.Application.Common.Exceptions;

public class ValidationException : Exception
{
    public ValidationException(string message = "Invalid input.") 
        : base(message) { }
}
