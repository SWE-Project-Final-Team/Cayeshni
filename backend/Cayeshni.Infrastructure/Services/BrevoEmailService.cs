using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Cayeshni.Application.Common.Interfaces;
using Cayeshni.Infrastructure.Options;

namespace Cayeshni.Infrastructure.Services;

public class BrevoEmailService : IEmailService
{
    private readonly HttpClient   _http;
    private readonly BrevoOptions _options;

    public BrevoEmailService(HttpClient http, BrevoOptions options)
    {
        _http    = http;
        _options = options;
    }

    public async Task SendAsync(string to, string subject, string htmlBody)
    {
        var payload = new
        {
            sender  = new { name = _options.FromName, email = _options.FromEmail },
            to      = new[] { new { email = to } },
            subject = subject,
            htmlContent = htmlBody
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email")
        {
            Content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json"
            )
        };

        request.Headers.Add("api-key", _options.ApiKey);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var response = await _http.SendAsync(request);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync();
            throw new InvalidOperationException($"Brevo email failed: {body}");
        }
    }
}