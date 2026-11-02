using System.ComponentModel.DataAnnotations;

namespace TodoApi.Endpoints;

// Minimal APIs não validam DataAnnotations automaticamente; este helper aplica as regras dos DTOs.
public static class Validation
{
    public static bool TryValidate<T>(T model, out Dictionary<string, string[]> errors) where T : notnull
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(model, new ValidationContext(model), results, validateAllProperties: true);

        errors = results
            .GroupBy(r => r.MemberNames.FirstOrDefault() ?? "")
            .ToDictionary(g => g.Key, g => g.Select(r => r.ErrorMessage ?? "Invalid").ToArray());
        return errors.Count == 0;
    }
}
