# OpenFlow.Application — Full Folder-to-File Map

```text
OpenFlow.Application/
├── Workflows/
│   ├── Commands/
│   │   ├── CreateWorkflow/
│   │   │   ├── CreateWorkflowCommand.cs
│   │   │   ├── CreateWorkflowValidator.cs
│   │   │   └── CreateWorkflowHandler.cs
│   │   ├── UpdateWorkflowDraft/
│   │   │   ├── UpdateWorkflowDraftCommand.cs
│   │   │   ├── UpdateWorkflowDraftValidator.cs
│   │   │   └── UpdateWorkflowDraftHandler.cs
│   │   ├── PublishWorkflowVersion/
│   │   │   ├── PublishWorkflowVersionCommand.cs
│   │   │   ├── PublishWorkflowVersionValidator.cs
│   │   │   └── PublishWorkflowVersionHandler.cs
│   │   └── ArchiveWorkflow/
│   │       ├── ArchiveWorkflowCommand.cs
│   │       ├── ArchiveWorkflowValidator.cs
│   │       └── ArchiveWorkflowHandler.cs
│   ├── Queries/
│   │   ├── GetWorkflow/
│   │   │   ├── GetWorkflowQuery.cs
│   │   │   └── GetWorkflowHandler.cs
│   │   ├── ListWorkflows/
│   │   │   ├── ListWorkflowsQuery.cs
│   │   │   └── ListWorkflowsHandler.cs
│   │   └── GetWorkflowBuilderState/
│   │       ├── GetWorkflowBuilderStateQuery.cs
│   │       └── GetWorkflowBuilderStateHandler.cs
│   ├── Validators/
│   │   └── WorkflowGraphDtoValidator.cs
│   ├── Mappers/
│   │   └── WorkflowGraphMapper.cs
│   └── Services/
│       ├── IWorkflowGraphValidationService.cs
│       └── WorkflowGraphValidationService.cs
│
└── Executions/
    ├── Commands/
    │   ├── StartExecution/
    │   │   ├── StartExecutionCommand.cs
    │   │   ├── StartExecutionValidator.cs
    │   │   └── StartExecutionHandler.cs
    │   ├── ResumeExecution/
    │   │   ├── ResumeExecutionCommand.cs
    │   │   ├── ResumeExecutionValidator.cs
    │   │   └── ResumeExecutionHandler.cs
    │   ├── CancelExecution/
    │   │   ├── CancelExecutionCommand.cs
    │   │   ├── CancelExecutionValidator.cs
    │   │   └── CancelExecutionHandler.cs
    │   └── RetryExecutionStep/
    │       ├── RetryExecutionStepCommand.cs
    │       ├── RetryExecutionStepValidator.cs
    │       └── RetryExecutionStepHandler.cs
    ├── Queries/
    │   ├── GetExecutionTrace/
    │   │   ├── GetExecutionTraceQuery.cs
    │   │   └── GetExecutionTraceHandler.cs
    │   ├── ListExecutions/
    │   │   ├── ListExecutionsQuery.cs
    │   │   └── ListExecutionsHandler.cs
    │   └── GetExecutionStep/
    │       ├── GetExecutionStepQuery.cs
    │       └── GetExecutionStepHandler.cs
    ├── Policies/
    │   ├── IExecutionRetryPolicy.cs
    │   └── DefaultExecutionRetryPolicy.cs
    └── Services/
        ├── IWorkflowExecutionEngine.cs
        └── WorkflowExecutionEngine.cs
```
