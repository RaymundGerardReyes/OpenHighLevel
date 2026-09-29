using OpenFlow.Infrastructure;
using OpenFlow.Worker.Hosting;
using OpenFlow.Worker.Scheduling;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.Configure<WorkerOptions>(builder.Configuration.GetSection("Worker"));
builder.Services.AddOpenFlowInfrastructure();
builder.Services.AddHostedService<TaskPollingService>();

var host = builder.Build();
host.Run();
