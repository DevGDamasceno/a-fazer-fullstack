using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TodoApi.Auth;
using TodoApi.Data;
using TodoApi.Dtos;
using TodoApi.Models;

namespace TodoApi.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        group.MapPost("/register", async (RegisterRequest request, AppDbContext db, TokenService tokens) =>
        {
            if (!Validation.TryValidate(request, out var errors))
                return Results.ValidationProblem(errors);

            var email = request.Email.Trim().ToLowerInvariant();
            if (await db.Users.AnyAsync(u => u.Email == email))
                return Results.Conflict(new { error = "E-mail já cadastrado." });

            var user = new User { Email = email };
            user.PasswordHash = new PasswordHasher<User>().HashPassword(user, request.Password);
            db.Users.Add(user);
            await db.SaveChangesAsync();

            return Results.Created($"/api/auth/users/{user.Id}", tokens.CreateToken(user));
        });

        group.MapPost("/login", async (LoginRequest request, AppDbContext db, TokenService tokens) =>
        {
            if (!Validation.TryValidate(request, out var errors))
                return Results.ValidationProblem(errors);

            var email = request.Email.Trim().ToLowerInvariant();
            var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);

            // Mesma resposta para e-mail inexistente e senha errada, para não revelar quais e-mails existem.
            if (user is null ||
                new PasswordHasher<User>().VerifyHashedPassword(user, user.PasswordHash, request.Password)
                    == PasswordVerificationResult.Failed)
                return Results.Unauthorized();

            return Results.Ok(tokens.CreateToken(user));
        });
    }
}
