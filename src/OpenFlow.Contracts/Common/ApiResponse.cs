namespace OpenFlow.Contracts.Common;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Error { get; set; }
    public string TraceId { get; set; } = string.Empty;

    public static ApiResponse<T> Ok(T data, string traceId = "") =>
        new() { Success = true, Data = data, TraceId = traceId };

    public static ApiResponse<T> Fail(string error, string traceId = "") =>
        new() { Success = false, Error = error, TraceId = traceId };
}
