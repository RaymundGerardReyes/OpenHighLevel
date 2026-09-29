using OpenFlow.Domain.Workflows;

namespace OpenFlow.Domain.Tests;

public class WorkflowAggregateTests
{
    [Fact]
    public void CreateWorkflow_ShouldInitializeAsDraft()
    {
        var id = Guid.NewGuid();
        var workflow = new Workflow(id, "Lead Qualification", "Test Workflow", DateTime.UtcNow);

        Assert.Equal(id, workflow.Id);
        Assert.Equal("Lead Qualification", workflow.Name);
        Assert.Equal(WorkflowStatus.Draft, workflow.Status);
        Assert.Null(workflow.PublishedVersionId);
        Assert.Equal(1, workflow.LatestVersionNumber);
    }

    [Fact]
    public void PublishVersion_ShouldSetStatusToPublishedAndRecordVersion()
    {
        var workflow = new Workflow(Guid.NewGuid(), "Onboarding Flow", "Description", DateTime.UtcNow);
        var versionId = Guid.NewGuid();

        workflow.PublishVersion(versionId, 2, DateTime.UtcNow);

        Assert.Equal(WorkflowStatus.Published, workflow.Status);
        Assert.Equal(versionId, workflow.PublishedVersionId);
        Assert.Equal(2, workflow.LatestVersionNumber);
    }

    [Fact]
    public void Archive_ShouldTransitionStatusToArchived()
    {
        var workflow = new Workflow(Guid.NewGuid(), "Obsolete Flow", "Description", DateTime.UtcNow);
        workflow.Archive(DateTime.UtcNow);

        Assert.Equal(WorkflowStatus.Archived, workflow.Status);
    }
}
