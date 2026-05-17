using System.Text.Json;
using Cayeshni.API.Middleware;
using Cayeshni.API.Application.Common.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;

namespace Cayeshni.Tests.Middleware;

public class ExceptionHandlingMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_Writes401_ForUnauthorizedException()
    {
        var context = CreateContext();
        var middleware = CreateMiddleware(_ => throw new UnauthorizedException("nope"));

        await middleware.InvokeAsync(context);

        Assert.Equal(StatusCodes.Status401Unauthorized, context.Response.StatusCode);
        Assert.StartsWith("application/json", context.Response.ContentType);
        Assert.Equal("nope", await ReadErrorAsync(context));
    }

    [Fact]
    public async Task InvokeAsync_Writes404_ForNotFoundException()
    {
        var context = CreateContext();
        var middleware = CreateMiddleware(_ => throw new NotFoundException("Group", Guid.Parse("11111111-1111-1111-1111-111111111111")));

        await middleware.InvokeAsync(context);

        Assert.Equal(StatusCodes.Status404NotFound, context.Response.StatusCode);
        Assert.StartsWith("application/json", context.Response.ContentType);
        Assert.Contains("Group with id", await ReadErrorAsync(context));
    }

    [Fact]
    public async Task InvokeAsync_Writes400_ForValidationException()
    {
        var context = CreateContext();
        var middleware = CreateMiddleware(_ => throw new ValidationException("bad request"));

        await middleware.InvokeAsync(context);

        Assert.Equal(StatusCodes.Status400BadRequest, context.Response.StatusCode);
        Assert.StartsWith("application/json", context.Response.ContentType);
        Assert.Equal("bad request", await ReadErrorAsync(context));
    }

    [Fact]
    public async Task InvokeAsync_Writes500_WithExceptionMessage_InDevelopment()
    {
        var context = CreateContext();
        var middleware = CreateMiddleware(_ => throw new InvalidOperationException("boom"), isDevelopment: true);

        await middleware.InvokeAsync(context);

        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
        Assert.StartsWith("application/json", context.Response.ContentType);
        Assert.Equal("boom", await ReadErrorAsync(context));
    }

    [Fact]
    public async Task InvokeAsync_CallsNext_WhenNoExceptionOccurs()
    {
        var context = CreateContext();
        var called = false;
        var middleware = CreateMiddleware(async ctx =>
        {
            called = true;
            await ctx.Response.WriteAsync("ok");
        });

        await middleware.InvokeAsync(context);

        Assert.True(called);
        Assert.Equal("ok", await ReadBodyAsync(context));
    }

    private static ExceptionHandlingMiddleware CreateMiddleware(RequestDelegate next, bool isDevelopment = false)
        => new(next, NullLogger<ExceptionHandlingMiddleware>.Instance, new TestHostEnvironment(isDevelopment));

    private static DefaultHttpContext CreateContext()
        => new()
        {
            Response = { Body = new MemoryStream() }
        };

    private static async Task<string?> ReadErrorAsync(HttpContext context)
    {
        var body = await ReadBodyAsync(context);
        using var doc = JsonDocument.Parse(body);
        return doc.RootElement.GetProperty("message").GetString();
    }

    private static async Task<string> ReadBodyAsync(HttpContext context)
    {
        context.Response.Body.Position = 0;
        using var reader = new StreamReader(context.Response.Body, leaveOpen: true);
        return await reader.ReadToEndAsync();
    }

    private sealed class TestHostEnvironment : IHostEnvironment
    {
        public TestHostEnvironment(bool isDevelopment)
        {
            EnvironmentName = isDevelopment ? Environments.Development : Environments.Production;
            ApplicationName = "Cayeshni.Tests";
            ContentRootPath = AppContext.BaseDirectory;
        }

        public string EnvironmentName { get; set; }
        public string ApplicationName { get; set; }
        public string ContentRootPath { get; set; }
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}

