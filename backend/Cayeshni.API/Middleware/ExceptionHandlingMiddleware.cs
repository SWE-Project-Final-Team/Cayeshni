using Cayeshni.Application.Common.Exceptions;

namespace Cayeshni.Api.Middleware;

public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (UnauthorizedException ex)
        {
            await WriteAsync(context, StatusCodes.Status401Unauthorized, ex.Message);
        }
        catch (NotFoundException ex)
        {
            await WriteAsync(context, StatusCodes.Status404NotFound, ex.Message);
        }
        catch (ValidationException ex)
        {
            await WriteAsync(context, StatusCodes.Status400BadRequest, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");

            var error = _env.IsDevelopment() ? ex.Message : "An unexpected error occurred.";
            await WriteAsync(context, StatusCodes.Status500InternalServerError, error);
        }
    }

    private static Task WriteAsync(HttpContext context, int statusCode, string errorMessage)
    {
        context.Response.StatusCode  = statusCode;
        context.Response.ContentType = "application/json";

        var response = new { status = statusCode, error = errorMessage };

        return context.Response.WriteAsJsonAsync(response);
    }
}