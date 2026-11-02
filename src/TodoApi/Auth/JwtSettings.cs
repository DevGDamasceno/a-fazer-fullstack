namespace TodoApi.Auth;

public class JwtSettings
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "TodoApi";
    public string Audience { get; set; } = "TodoApi";
    public string Key { get; set; } = "";
    public int ExpiresMinutes { get; set; } = 60;
}
