using Microsoft.OpenApi;

namespace Cayeshni.API.Extensions;

public static class OpenApiExtensions
{
    // OpenAPI docs and the Bearer auth scheme.
    public static IServiceCollection AddApiDocumentation(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddOpenApi(options =>
        {
            options.AddDocumentTransformer((document, context, cancellationToken) =>
            {
                document.Components ??= new OpenApiComponents();
                document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();

                document.Components.SecuritySchemes["Bearer"] = new OpenApiSecurityScheme
                {
                    Type = SecuritySchemeType.Http,
                    Scheme = OpenApiConstants.Bearer,
                    BearerFormat = OpenApiConstants.Jwt,
                    Description = "JWT bearer authentication"
                };

                return Task.CompletedTask;
            });
        });

        return services;
    }
}