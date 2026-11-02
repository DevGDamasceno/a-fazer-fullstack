using System.Net;
using System.Net.Http.Json;
using TodoApi.Dtos;

namespace TodoApi.Tests;

public class AuthEndpointsTests(TodoApiFactory factory) : IClassFixture<TodoApiFactory>
{
    private static string NewEmail() => $"user-{Guid.NewGuid():N}@teste.com";

    [Fact]
    public async Task Register_ReturnsToken()
    {
        var response = await factory.CreateClient()
            .PostAsJsonAsync("/api/auth/register", new RegisterRequest(NewEmail(), "Senha12345"));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.False(string.IsNullOrWhiteSpace(auth!.Token));
    }

    [Fact]
    public async Task Register_DuplicateEmail_ReturnsConflict()
    {
        var client = factory.CreateClient();
        var email = NewEmail();
        await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(email, "Senha12345"));

        var response = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(email.ToUpperInvariant(), "Senha12345"));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Register_WeakPasswordOrBadEmail_ReturnsBadRequest()
    {
        var client = factory.CreateClient();

        var shortPassword = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(NewEmail(), "123"));
        var badEmail = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest("nao-e-email", "Senha12345"));

        Assert.Equal(HttpStatusCode.BadRequest, shortPassword.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, badEmail.StatusCode);
    }

    [Fact]
    public async Task Login_WithCorrectCredentials_ReturnsToken()
    {
        var client = factory.CreateClient();
        var email = NewEmail();
        await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(email, "Senha12345"));

        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, "Senha12345"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.False(string.IsNullOrWhiteSpace((await response.Content.ReadFromJsonAsync<AuthResponse>())!.Token));
    }

    [Fact]
    public async Task Login_WithWrongPasswordOrUnknownEmail_ReturnsUnauthorized()
    {
        var client = factory.CreateClient();
        var email = NewEmail();
        await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(email, "Senha12345"));

        var wrongPassword = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, "outra-senha"));
        var unknown = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(NewEmail(), "Senha12345"));

        Assert.Equal(HttpStatusCode.Unauthorized, wrongPassword.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, unknown.StatusCode);
    }
}
