using OpenFlow.Application.Abstractions;
using OpenFlow.Contracts.Common;

namespace OpenFlow.Application.Executions.Commands.ResumeExecution;

public record ResumeExecutionCommand(Guid ExecutionId, string NodeKey, string ContextJson) : ICommand<ApiResponse<bool>>;
