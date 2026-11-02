using System.Net.Http.Headers;
using System.Net.Http.Json;
using TodoApi.Dtos;

namespace TodoApi.Tests;

public static class TestHelpers
{
    // Registra um usuário novo e devolve um client já autenticado com o token dele.
    public static async Task<HttpClient> CreateAuthenticatedClientAsync(this TodoApiFactory factory)
    {
        var client = factory.CreateClient();
        var email = $"user-{Guid.NewGuid():N}@teste.com";

        var response = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(email, "Senha12345"));
        response.EnsureSuccessStatusCode();
        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>();

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
        return client;
    }
}
