using System.Globalization;
using System.Text.Json;
using OpenFlow.Domain.Executions;

namespace OpenFlow.Application.Executions.Services;

public class ConditionEvaluator : IConditionEvaluator
{
    public ConditionEvaluationResult Evaluate(string configJson, ExecutionState state)
    {
        var result = new ConditionEvaluationResult { IsMatched = true };

        if (string.IsNullOrWhiteSpace(configJson) || configJson.Trim() == "{}")
        {
            return result;
        }

        try
        {
            using var doc = JsonDocument.Parse(configJson);
            var root = doc.RootElement;

            var rules = new List<ConditionRule>();
            string matchType = "all";

            if (root.TryGetProperty("matchType", out var matchTypeProp))
            {
                matchType = matchTypeProp.GetString() ?? "all";
            }

            if (root.TryGetProperty("conditions", out var conditionsProp) && conditionsProp.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in conditionsProp.EnumerateArray())
                {
                    rules.Add(ParseRule(item));
                }
            }
            else if (root.TryGetProperty("field", out _))
            {
                rules.Add(ParseRule(root));
            }

            if (rules.Count == 0) return result;

            bool isAny = matchType.Equals("any", StringComparison.OrdinalIgnoreCase);
            bool overallMatch = !isAny;

            foreach (var rule in rules)
            {
                var actual = ResolveFieldValue(rule.Field, state);
                bool matched = MatchRule(rule.Operator, actual, rule.Value);

                result.EvaluatedRules.Add(new ConditionEvaluationDetail
                {
                    Field = rule.Field,
                    Operator = rule.Operator,
                    Expected = rule.Value,
                    Actual = actual,
                    Matched = matched
                });

                if (isAny)
                {
                    if (matched) overallMatch = true;
                }
                else
                {
                    if (!matched) overallMatch = false;
                }
            }

            result.IsMatched = overallMatch;
            return result;
        }
        catch
        {
            result.IsMatched = true;
            return result;
        }
    }

    private static ConditionRule ParseRule(JsonElement elem)
    {
        var rule = new ConditionRule();
        if (elem.TryGetProperty("field", out var f)) rule.Field = f.GetString() ?? string.Empty;
        if (elem.TryGetProperty("operator", out var o)) rule.Operator = o.GetString() ?? "equals";
        if (elem.TryGetProperty("value", out var v)) rule.Value = ConvertJsonElement(v);
        return rule;
    }

    private static object? ConvertJsonElement(JsonElement element)
    {
        return element.ValueKind switch
        {
            JsonValueKind.String => element.GetString(),
            JsonValueKind.Number => element.TryGetInt64(out var l) ? l : element.GetDouble(),
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.Array => element.EnumerateArray().Select(ConvertJsonElement).ToList(),
            JsonValueKind.Null => null,
            _ => element.GetRawText()
        };
    }

    private static object? ResolveFieldValue(string fieldPath, ExecutionState state)
    {
        if (string.IsNullOrWhiteSpace(fieldPath)) return null;

        var parts = fieldPath.Trim().Split('.', StringSplitOptions.RemoveEmptyEntries);
        var currentSection = parts[0].ToLowerInvariant();

        if (currentSection == "contact")
        {
            if (parts.Length < 2) return state.Contact;
            var subField = parts[1].ToLowerInvariant();

            return subField switch
            {
                "id" => state.Contact.Id,
                "email" => state.Contact.Email,
                "firstname" => state.Contact.FirstName,
                "lastname" => state.Contact.LastName,
                "phone" => state.Contact.Phone,
                "score" => state.Contact.Score,
                "tags" => state.Contact.Tags,
                "customfields" when parts.Length >= 3 => state.Contact.CustomFields.TryGetValue(parts[2], out var cf) ? cf : null,
                _ => state.Contact.CustomFields.TryGetValue(parts[1], out var cfDirect) ? cfDirect : null
            };
        }
        else if (currentSection == "tags") return state.Contact.Tags;
        else if (currentSection == "score") return state.Contact.Score;
        else if (currentSection == "email") return state.Contact.Email;
        else if (currentSection == "firstname") return state.Contact.FirstName;
        else if (currentSection == "lastname") return state.Contact.LastName;
        else if (currentSection == "variables" && parts.Length >= 2)
        {
            return state.Variables.TryGetValue(parts[1], out var v) ? v : null;
        }
        else
        {
            if (state.Contact.CustomFields.TryGetValue(fieldPath, out var cf)) return cf;
            if (state.Variables.TryGetValue(fieldPath, out var varVal)) return varVal;
            return null;
        }
    }

    private static bool MatchRule(string op, object? actual, object? expected)
    {
        string normalizedOp = op?.ToLowerInvariant().Trim() ?? "equals";

        return normalizedOp switch
        {
            "equals" or "eq" or "==" => CompareEquals(actual, expected),
            "notequals" or "neq" or "!=" => !CompareEquals(actual, expected),
            "contains" => CheckContains(actual, expected),
            "notcontains" => !CheckContains(actual, expected),
            "greaterthan" or "gt" or ">" => CompareNumeric(actual, expected) > 0,
            "greaterthanorequal" or "gte" or ">=" => CompareNumeric(actual, expected) >= 0,
            "lessthan" or "lt" or "<" => CompareNumeric(actual, expected) < 0,
            "lessthanorequal" or "lte" or "<=" => CompareNumeric(actual, expected) <= 0,
            "in" => CheckIn(actual, expected),
            "notin" => !CheckIn(actual, expected),
            "exists" or "isnotempty" => actual != null && !string.IsNullOrWhiteSpace(actual.ToString()),
            "notexists" or "isempty" => actual == null || string.IsNullOrWhiteSpace(actual.ToString()),
            _ => CompareEquals(actual, expected)
        };
    }

    private static bool CompareEquals(object? actual, object? expected)
    {
        if (actual == null && expected == null) return true;
        if (actual == null || expected == null) return false;

        if (TryConvertToDouble(actual, out var aNum) && TryConvertToDouble(expected, out var eNum))
        {
            return Math.Abs(aNum - eNum) < 0.000001;
        }

        return string.Equals(actual.ToString()?.Trim(), expected.ToString()?.Trim(), StringComparison.OrdinalIgnoreCase);
    }

    private static int CompareNumeric(object? actual, object? expected)
    {
        if (actual == null || expected == null) return -1;

        if (TryConvertToDouble(actual, out var aNum) && TryConvertToDouble(expected, out var eNum))
        {
            return aNum.CompareTo(eNum);
        }

        return string.Compare(actual.ToString(), expected.ToString(), StringComparison.OrdinalIgnoreCase);
    }

    private static bool CheckContains(object? actual, object? expected)
    {
        if (actual == null || expected == null) return false;

        string expStr = expected.ToString()?.Trim() ?? string.Empty;

        if (actual is IEnumerable<string> stringList)
        {
            return stringList.Any(s => string.Equals(s, expStr, StringComparison.OrdinalIgnoreCase));
        }

        return actual.ToString()?.Contains(expStr, StringComparison.OrdinalIgnoreCase) ?? false;
    }

    private static bool CheckIn(object? actual, object? expected)
    {
        if (actual == null || expected == null) return false;

        string actStr = actual.ToString()?.Trim() ?? string.Empty;

        if (expected is IEnumerable<object> expList)
        {
            return expList.Any(e => string.Equals(e?.ToString()?.Trim(), actStr, StringComparison.OrdinalIgnoreCase));
        }

        if (expected is IEnumerable<string> strList)
        {
            return strList.Any(e => string.Equals(e.Trim(), actStr, StringComparison.OrdinalIgnoreCase));
        }

        return false;
    }

    private static bool TryConvertToDouble(object value, out double result)
    {
        result = 0;
        if (value is double d) { result = d; return true; }
        if (value is float f) { result = f; return true; }
        if (value is int i) { result = i; return true; }
        if (value is long l) { result = l; return true; }
        if (value is decimal dec) { result = (double)dec; return true; }

        return double.TryParse(value.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out result);
    }
}
