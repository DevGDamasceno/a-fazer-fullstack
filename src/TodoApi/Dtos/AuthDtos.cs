using System.ComponentModel.DataAnnotations;

namespace TodoApi.Dtos;

public record RegisterRequest(
    [property: Required, EmailAddress, StringLength(200)] string Email,
    [property: Required, StringLength(100, MinimumLength = 8)] string Password);

public record LoginRequest(
    [property: Required] string Email,
    [property: Required] string Password);

public record AuthResponse(string Token, DateTime ExpiresAt);
