using System.Text.Json;

namespace safefy_api_payment.Services.Helpers;

public static class WebhookFieldResolver
{
    public static string? FirstNonEmpty(params string?[] values)
    {
        foreach (var value in values)
        {
            if (!string.IsNullOrWhiteSpace(value))
                return value.Trim();
        }

        return null;
    }

    public static string? FirstNonEmpty<TSource>(TSource source, params Func<TSource, string?>[] selectors)
    {
        foreach (var selector in selectors)
        {
            var value = selector(source);
            if (!string.IsNullOrWhiteSpace(value))
                return value.Trim();
        }

        return null;
    }

    public static TEnum? FirstKnown<TSource, TEnum>(
        TSource source,
        TEnum unknownValue,
        params Func<TSource, TEnum?>[] selectors)
        where TEnum : struct, Enum
    {
        foreach (var selector in selectors)
        {
            var value = selector(source);
            if (!value.HasValue)
                continue;

            if (!EqualityComparer<TEnum>.Default.Equals(value.Value, unknownValue))
                return value;
        }

        return null;
    }

    public static IEnumerable<TNode> Traverse<TNode>(TNode? root, Func<TNode, TNode?> next)
        where TNode : class
    {
        var current = root;
        while (current != null)
        {
            yield return current;
            current = next(current);
        }
    }

    public static string? FirstNonEmptyFromChain<TNode>(
        TNode? root,
        Func<TNode, TNode?> next,
        params Func<TNode, string?>[] selectors)
        where TNode : class
    {
        foreach (var node in Traverse(root, next))
        {
            var value = FirstNonEmpty(node, selectors);
            if (!string.IsNullOrWhiteSpace(value))
                return value;
        }

        return null;
    }

    public static TEnum? FirstKnownFromChain<TNode, TEnum>(
        TNode? root,
        Func<TNode, TNode?> next,
        TEnum unknownValue,
        params Func<TNode, TEnum?>[] selectors)
        where TNode : class
        where TEnum : struct, Enum
    {
        foreach (var node in Traverse(root, next))
        {
            var value = FirstKnown(node, unknownValue, selectors);
            if (value.HasValue)
                return value;
        }

        return null;
    }

    public static TValue? FirstValueFromChain<TNode, TValue>(
        TNode? root,
        Func<TNode, TNode?> next,
        params Func<TNode, TValue?>[] selectors)
        where TNode : class
        where TValue : struct
    {
        foreach (var node in Traverse(root, next))
        {
            foreach (var selector in selectors)
            {
                var value = selector(node);
                if (value.HasValue)
                    return value;
            }
        }

        return null;
    }

    public static string? FirstJsonString(JsonElement element, params string[] propertyNames)
    {
        if (element.ValueKind != JsonValueKind.Object)
            return null;

        foreach (var propertyName in propertyNames)
        {
            if (TryGetPropertyIgnoreCase(element, propertyName, out var value) && value.ValueKind == JsonValueKind.String)
            {
                var text = value.GetString();
                if (!string.IsNullOrWhiteSpace(text))
                    return text.Trim();
            }
        }

        return null;
    }

    private static bool TryGetPropertyIgnoreCase(JsonElement element, string propertyName, out JsonElement value)
    {
        if (element.TryGetProperty(propertyName, out value))
            return true;

        foreach (var property in element.EnumerateObject())
        {
            if (string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
            {
                value = property.Value;
                return true;
            }
        }

        value = default;
        return false;
    }
}
