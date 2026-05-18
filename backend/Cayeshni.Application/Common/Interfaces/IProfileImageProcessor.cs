namespace Cayeshni.Application.Common.Interfaces;

public interface IProfileImageProcessor
{
    public Task<Stream> ProcessAsync(Stream stream);
}
