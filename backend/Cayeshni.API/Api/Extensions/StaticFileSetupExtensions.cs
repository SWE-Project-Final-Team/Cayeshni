using Microsoft.Extensions.FileProviders;

public static class StaticFilesSetupExtensions
{
    public static void UseUploads(this WebApplication app)
    {
        var path = Path.Combine(app.Environment.ContentRootPath, "uploads");
    
        Directory.CreateDirectory(path);

        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(path),
            RequestPath = "/uploads"
        });

        app.UseStaticFiles(); // enables wwwroot
    }
}