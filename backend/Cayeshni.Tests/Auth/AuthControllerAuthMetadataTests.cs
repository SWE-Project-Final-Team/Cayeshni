using System.Linq;
using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Xunit;

namespace Cayeshni.Tests.Auth;

public class AuthControllerAuthMetadataTests
{
    [Fact]
    public void Logout_Action_HasAuthorizeAttribute()
    {
        var method = typeof(Cayeshni.API.Api.Controllers.AuthController)
            .GetMethod(nameof(Cayeshni.API.Api.Controllers.AuthController.Logout), BindingFlags.Instance | BindingFlags.Public);

        Assert.NotNull(method);
        Assert.Contains(method!.GetCustomAttributes(inherit: true), a => a is AuthorizeAttribute);
    }

    [Fact]
    public void ChangePassword_Action_HasAuthorizeAttribute()
    {
        var method = typeof(Cayeshni.API.Api.Controllers.AuthController)
            .GetMethod(nameof(Cayeshni.API.Api.Controllers.AuthController.ChangePassword), BindingFlags.Instance | BindingFlags.Public);

        Assert.NotNull(method);
        Assert.Contains(method!.GetCustomAttributes(inherit: true), a => a is AuthorizeAttribute);
    }
}
