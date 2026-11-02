using System.Net;
using System.Net.Http.Json;
using TodoApi.Dtos;

namespace TodoApi.Tests;

public class TodoEndpointsTests(TodoApiFactory factory) : IClassFixture<TodoApiFactory>
{
    [Fact]
    public async Task Create_ReturnsCreatedWithLocation()
    {
        var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.PostAsJsonAsync("/api/todos", new CreateTodoRequest("Estudar C#", null, null));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var todo = await response.Content.ReadFromJsonAsync<TodoResponse>();
        Assert.NotNull(todo);
        Assert.Equal("Estudar C#", todo.Title);
        Assert.False(todo.IsCompleted);
        Assert.Equal($"/api/todos/{todo.Id}", response.Headers.Location?.OriginalString);
    }

    [Fact]
    public async Task Create_WithEmptyTitle_ReturnsBadRequest()
    {
        var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.PostAsJsonAsync("/api/todos", new CreateTodoRequest("", null, null));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetById_Unknown_ReturnsNotFound()
    {
        var client = await factory.CreateAuthenticatedClientAsync();

        var response = await client.GetAsync("/api/todos/99999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Update_ChangesFields()
    {
        var client = await factory.CreateAuthenticatedClientAsync();
        var created = await (await client.PostAsJsonAsync("/api/todos", new CreateTodoRequest("Antes", null, null)))
            .Content.ReadFromJsonAsync<TodoResponse>();

        var response = await client.PutAsJsonAsync($"/api/todos/{created!.Id}",
            new UpdateTodoRequest("Depois", "detalhe", true, null));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var updated = await response.Content.ReadFromJsonAsync<TodoResponse>();
        Assert.Equal("Depois", updated!.Title);
        Assert.True(updated.IsCompleted);
    }

    [Fact]
    public async Task Delete_RemovesTodo()
    {
        var client = await factory.CreateAuthenticatedClientAsync();
        var created = await (await client.PostAsJsonAsync("/api/todos", new CreateTodoRequest("Apagar", null, null)))
            .Content.ReadFromJsonAsync<TodoResponse>();

        var delete = await client.DeleteAsync($"/api/todos/{created!.Id}");
        var get = await client.GetAsync($"/api/todos/{created.Id}");

        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, get.StatusCode);
    }

    [Fact]
    public async Task List_FiltersByCompleted()
    {
        var client = await factory.CreateAuthenticatedClientAsync();
        var a = await (await client.PostAsJsonAsync("/api/todos", new CreateTodoRequest("Pendente", null, null)))
            .Content.ReadFromJsonAsync<TodoResponse>();
        var b = await (await client.PostAsJsonAsync("/api/todos", new CreateTodoRequest("Feita", null, null)))
            .Content.ReadFromJsonAsync<TodoResponse>();
        await client.PutAsJsonAsync($"/api/todos/{b!.Id}", new UpdateTodoRequest("Feita", null, true, null));

        var done = await client.GetFromJsonAsync<List<TodoResponse>>("/api/todos?completed=true");

        Assert.Contains(done!, t => t.Id == b.Id);
        Assert.DoesNotContain(done!, t => t.Id == a!.Id);
    }

    [Fact]
    public async Task Todos_WithoutToken_ReturnsUnauthorized()
    {
        var response = await factory.CreateClient().GetAsync("/api/todos");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Todos_AreIsolatedBetweenUsers()
    {
        var alice = await factory.CreateAuthenticatedClientAsync();
        var bob = await factory.CreateAuthenticatedClientAsync();
        var todo = await (await alice.PostAsJsonAsync("/api/todos", new CreateTodoRequest("Da Alice", null, null)))
            .Content.ReadFromJsonAsync<TodoResponse>();

        var bobGet = await bob.GetAsync($"/api/todos/{todo!.Id}");
        var bobPut = await bob.PutAsJsonAsync($"/api/todos/{todo.Id}", new UpdateTodoRequest("Hack", null, true, null));
        var bobDelete = await bob.DeleteAsync($"/api/todos/{todo.Id}");
        var bobList = await bob.GetFromJsonAsync<List<TodoResponse>>("/api/todos");

        Assert.Equal(HttpStatusCode.NotFound, bobGet.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, bobPut.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, bobDelete.StatusCode);
        Assert.DoesNotContain(bobList!, t => t.Id == todo.Id);
        Assert.Equal(HttpStatusCode.OK, (await alice.GetAsync($"/api/todos/{todo.Id}")).StatusCode);
    }
}
