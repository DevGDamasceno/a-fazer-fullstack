using System.ComponentModel.DataAnnotations;
using TodoApi.Models;

namespace TodoApi.Dtos;

public record CreateTodoRequest(
    [property: Required, StringLength(100, MinimumLength = 1)] string Title,
    [property: StringLength(500)] string? Description,
    DateTime? DueDate);

public record UpdateTodoRequest(
    [property: Required, StringLength(100, MinimumLength = 1)] string Title,
    [property: StringLength(500)] string? Description,
    bool IsCompleted,
    DateTime? DueDate);

public record TodoResponse(
    int Id,
    string Title,
    string? Description,
    bool IsCompleted,
    DateTime CreatedAt,
    DateTime? DueDate)
{
    public static TodoResponse From(TodoItem t) =>
        new(t.Id, t.Title, t.Description, t.IsCompleted, t.CreatedAt, t.DueDate);
}
