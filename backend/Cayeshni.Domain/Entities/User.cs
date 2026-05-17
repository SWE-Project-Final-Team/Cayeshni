using Cayeshni.API.Domain.Enums;

namespace Cayeshni.API.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ProfilePicturePath { get; set; }
    public Currency PreferredCurrency { get; set; }
    public DateTime CreatedAt { get; set; }
}
