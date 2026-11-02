using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using TodoApi.Dtos;
using TodoApi.Models;

namespace TodoApi.Auth;

public class TokenService(IOptions<JwtSettings> options)
{
    private readonly JwtSettings _settings = options.Value;

    public AuthResponse CreateToken(User user)
    {
        var expires = DateTime.UtcNow.AddMinutes(_settings.ExpiresMinutes);
        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity([
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email)
            ]),
            Issuer = _settings.Issuer,
            Audience = _settings.Audience,
            Expires = expires,
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Key)),
                SecurityAlgorithms.HmacSha256)
        };

        return new AuthResponse(new JsonWebTokenHandler().CreateToken(descriptor), expires);
    }
}
