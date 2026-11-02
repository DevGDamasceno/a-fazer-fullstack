using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using TodoApi.Auth;
using TodoApi.Data;
using TodoApi.Dtos;
using TodoApi.Models;

namespace TodoApi.Endpoints;

public static class TodoEndpoints
{
    public static void MapTodoEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/todos").WithTags("Todos").RequireAuthorization();

        group.MapGet("/", async (ClaimsPrincipal principal, AppDbContext db, bool? completed) =>
        {
            var userId = principal.GetUserId();
            var query = db.Todos.AsNoTracking().Where(t => t.UserId == userId);
            if (completed is not null)
                query = query.Where(t => t.IsCompleted == completed);

            var todos = await query.OrderBy(t => t.Id).ToListAsync();
            return Results.Ok(todos.Select(TodoResponse.From));
        });

        group.MapGet("/{id:int}", async (int id, ClaimsPrincipal principal, AppDbContext db) =>
        {
            var userId = principal.GetUserId();
            var todo = await db.Todos.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
            return todo is null ? Results.NotFound() : Results.Ok(TodoResponse.From(todo));
        });

        group.MapPost("/", async (CreateTodoRequest request, ClaimsPrincipal principal, AppDbContext db) =>
        {
            if (!Validation.TryValidate(request, out var errors))
                return Results.ValidationProblem(errors);

            var todo = new TodoItem
            {
                Title = request.Title,
                Description = request.Description,
                DueDate = request.DueDate,
                UserId = principal.GetUserId()
            };
            db.Todos.Add(todo);
            await db.SaveChangesAsync();

            return Results.Created($"/api/todos/{todo.Id}", TodoResponse.From(todo));
        });

        group.MapPut("/{id:int}", async (int id, UpdateTodoRequest request, ClaimsPrincipal principal, AppDbContext db) =>
        {
            if (!Validation.TryValidate(request, out var errors))
                return Results.ValidationProblem(errors);

            var userId = principal.GetUserId();
            var todo = await db.Todos.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
            if (todo is null) return Results.NotFound();

            todo.Title = request.Title;
            todo.Description = request.Description;
            todo.IsCompleted = request.IsCompleted;
            todo.DueDate = request.DueDate;
            await db.SaveChangesAsync();

            return Results.Ok(TodoResponse.From(todo));
        });

        group.MapDelete("/{id:int}", async (int id, ClaimsPrincipal principal, AppDbContext db) =>
        {
            var userId = principal.GetUserId();
            var todo = await db.Todos.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
            if (todo is null) return Results.NotFound();

            db.Todos.Remove(todo);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}
