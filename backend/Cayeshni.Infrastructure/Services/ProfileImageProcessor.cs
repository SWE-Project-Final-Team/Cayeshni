using SixLabors.ImageSharp.Formats.Webp;
using Cayeshni.API.Application.Common.Interfaces;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

namespace Cayeshni.API.Infrastructure.Services;


public class ProfileImageProcessor : IProfileImageProcessor
{
    public async Task<Stream> ProcessAsync(Stream stream)
    {
        using var image = await Image.LoadAsync(stream);

        image.Mutate(x => x.Resize(new ResizeOptions
        {
            Size = new Size(256, 256), 
            Mode = ResizeMode.Crop
        }));

        var output = new MemoryStream();

        await image.SaveAsync(output, new WebpEncoder
        {
            Quality = 80 // Adjust quality as needed (0-100, where 100 is best quality but largest file size)
        });

        output.Position = 0; // Reset stream position to the beginning before returning

        return output;
    }
}
