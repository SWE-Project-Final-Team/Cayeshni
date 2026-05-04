var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

var app = builder.Build();

// app.UseHttpsRedirection();


app.MapGet("/", () => "This is Cayeshni API root endpoint.");

app.Run();