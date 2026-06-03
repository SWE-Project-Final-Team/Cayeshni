using System.Security.Cryptography;
using System.Text;

namespace Cayeshni.Domain.Utilities;

/// <summary>
/// Generates invite tokens for groups using hash + base58 encoding.
/// Provides shorter, friendlier tokens compared to raw GUIDs.
/// </summary>
public static class InviteTokenGenerator
{
    private const string Base58Alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    private const int TokenLength = 8; // Use first 8 characters

    /// <summary>
    /// Generates an invite token from a group ID.
    /// Hashes the group ID and encodes it as base58, returning the first 8 characters.
    /// </summary>
    public static string GenerateToken(Guid groupId)
    {
        // Hash the group ID bytes using SHA256
        var idBytes = groupId.ToByteArray();
        byte[] hashBytes;

        using (var sha256 = SHA256.Create())
        {
            hashBytes = sha256.ComputeHash(idBytes);
        }

        // Encode to base58 and take first 8 characters
        var base58 = EncodeBase58(hashBytes);
        return base58.Substring(0, Math.Min(TokenLength, base58.Length));
    }

    /// <summary>
    /// Encodes a byte array to base58 string using standard base58 algorithm.
    /// </summary>
    private static string EncodeBase58(byte[] data)
    {
        // Handle empty input
        if (data == null || data.Length == 0)
            return "";

        // Count leading zero bytes
        int leadingZeros = 0;
        for (int i = 0; i < data.Length && data[i] == 0; i++)
            leadingZeros++;

        // Create a copy for encoding
        var encoded = new byte[data.Length];
        Array.Copy(data, encoded, data.Length);

        var result = new List<char>();

        // Convert bytes to base58
        while (ContainsNonZero(encoded))
        {
            int remainder = 0;
            for (int i = 0; i < encoded.Length; i++)
            {
                int temp = remainder * 256 + encoded[i];
                encoded[i] = (byte)(temp / 58);
                remainder = temp % 58;
            }
            result.Add(Base58Alphabet[remainder]);
        }

        // Add leading zero characters for each leading zero byte
        for (int i = 0; i < leadingZeros; i++)
            result.Add(Base58Alphabet[0]);

        // Reverse to get correct order
        result.Reverse();
        return new string(result.ToArray());
    }

    /// <summary>
    /// Checks if the byte array contains any non-zero values.
    /// </summary>
    private static bool ContainsNonZero(byte[] data)
    {
        foreach (var b in data)
        {
            if (b != 0)
                return true;
        }
        return false;
    }
}
