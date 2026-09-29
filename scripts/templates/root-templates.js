// scripts/templates/root-templates.js
// Root configuration and project file definitions for OpenFlow

export const rootTemplates = {
  'global.json': JSON.stringify(
    {
      sdk: {
        version: '10.0.301',
        rollForward: 'latestMinor',
      },
    },
    null,
    2
  ),

  'Directory.Build.props': `<Project>
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <LangVersion>latest</LangVersion>
    <TreatWarningsAsErrors>false</TreatWarningsAsErrors>
    <Version>0.1.0</Version>
    <AssemblyVersion>0.1.0.0</AssemblyVersion>
    <FileVersion>0.1.0.0</FileVersion>
    <InformationalVersion>0.1.0</InformationalVersion>
  </PropertyGroup>
</Project>`,

  'compose.yaml': `services:
  postgres:
    image: postgres:18-alpine
    container_name: openflow-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: openflow
      POSTGRES_USER: openflow
      POSTGRES_PASSWORD: openflow_dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U openflow -d openflow"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
`,

  'package.json': JSON.stringify(
    {
      name: 'openflow-monorepo',
      version: '0.1.0',
      private: true,
      type: 'module',
      description: 'OpenFlow - Requirements-Driven GHL Workflow Simulator',
      scripts: {
        dev: 'pnpm --filter web dev',
        build: 'pnpm --filter web build',
        lint: 'pnpm --filter web lint',
        'build:backend': 'dotnet build OpenFlow.sln',
        'test:backend': 'dotnet test OpenFlow.sln',
        scaffold: 'bash scripts/scaffold-openflow.sh',
      },
      devDependencies: {
        prettier: '^3.5.0',
      },
    },
    null,
    2
  ),

  'pnpm-workspace.yaml': `packages:
  - 'apps/*'
`,

  '.gitignore': `## .NET
bin/
obj/
*.user
*.suo
.vs/

## Node & Web
node_modules/
.next/
out/
dist/
.pnpm-store/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

## OS / Editor
.DS_Store
Thumbs.db
.idea/
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
`,

  'README.md': `# OpenFlow: Requirements-Driven GHL Workflow Simulator \`v0.1.0\`

> **Current Version:** \`v0.1.0\` (Modular Monolith Core, Trace-First Engine & Simulation Laboratory)

OpenFlow is an independently built, behavior-compatible workflow simulator and testing laboratory inspired by CRM automation systems.

## Engineering Highlights
- **Modular Monolith**: ASP.NET Core 10 backend + Next.js App Router frontend in a single repository.
- **Trace-First Execution Engine**: Every node transition, decision, state mutation, and scheduled wait leaves an immutable execution step trace.
- **Virtual Simulation Clock**: Run 30-day workflow timelines in milliseconds without waiting on real time.
- **PostgreSQL 18 Leases**: Durable scheduled task queue with transactional claiming via row-level locks and \`SKIP LOCKED\`.
- **Decoupled React Flow**: Canvas layout state is strictly separated from the semantic workflow graph domain model.

## Repository Layout
- \`apps/web\`: Next.js 15+ App Router workflow builder UI and execution visualizer.
- \`apps/api\`: ASP.NET Core REST API host.
- \`apps/worker\`: ASP.NET Core background worker host for scheduling & leases.
- \`src/OpenFlow.Domain\`: Core domain models, aggregates, invariants, and events.
- \`src/OpenFlow.Contracts\`: Shared request/response DTOs and contracts.
- \`src/OpenFlow.Application\`: Use cases, commands, queries, validators, and execution engine.
- \`src/OpenFlow.Infrastructure\`: EF Core, PostgreSQL persistence, and mock effect adapters.
- \`tests/\`: Domain unit tests, engine application tests, and golden compatibility fixtures.
- \`scripts/\`: Automation commands and codebase scaffolding scripts.

## Quick Start
1. Scaffold or refresh codebase:
   \`\`\`bash
   bash scripts/scaffold-openflow.sh
   # Or on Windows PowerShell:
   ./scripts/scaffold-openflow.ps1
   \`\`\`
2. Start PostgreSQL:
   \`\`\`bash
   docker compose up -d
   \`\`\`
3. Run backend tests:
   \`\`\`bash
   dotnet test OpenFlow.sln
   \`\`\`
4. Run API:
   \`\`\`bash
   dotnet run --project apps/api
   \`\`\`
5. Run Worker:
   \`\`\`bash
   dotnet run --project apps/worker
   \`\`\`
6. Run Web:
   \`\`\`bash
   pnpm install
   pnpm dev
   \`\`\`
`,

  // Projects
  'src/OpenFlow.Domain/OpenFlow.Domain.csproj': `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
  </PropertyGroup>
</Project>`,

  'src/OpenFlow.Contracts/OpenFlow.Contracts.csproj': `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
  </PropertyGroup>
</Project>`,

  'src/OpenFlow.Application/OpenFlow.Application.csproj': `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="../OpenFlow.Domain/OpenFlow.Domain.csproj" />
    <ProjectReference Include="../OpenFlow.Contracts/OpenFlow.Contracts.csproj" />
  </ItemGroup>
</Project>`,

  'src/OpenFlow.Infrastructure/OpenFlow.Infrastructure.csproj': `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <FrameworkReference Include="Microsoft.AspNetCore.App" />
  </ItemGroup>
  <ItemGroup>
    <ProjectReference Include="../OpenFlow.Domain/OpenFlow.Domain.csproj" />
    <ProjectReference Include="../OpenFlow.Application/OpenFlow.Application.csproj" />
    <ProjectReference Include="../OpenFlow.Contracts/OpenFlow.Contracts.csproj" />
  </ItemGroup>
</Project>`,

  'apps/api/OpenFlow.Api.csproj': `<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="10.0.12" />
  </ItemGroup>
  <ItemGroup>
    <ProjectReference Include="../../src/OpenFlow.Domain/OpenFlow.Domain.csproj" />
    <ProjectReference Include="../../src/OpenFlow.Application/OpenFlow.Application.csproj" />
    <ProjectReference Include="../../src/OpenFlow.Infrastructure/OpenFlow.Infrastructure.csproj" />
    <ProjectReference Include="../../src/OpenFlow.Contracts/OpenFlow.Contracts.csproj" />
  </ItemGroup>
</Project>`,

  'apps/worker/OpenFlow.Worker.csproj': `<Project Sdk="Microsoft.NET.Sdk.Worker">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="../../src/OpenFlow.Domain/OpenFlow.Domain.csproj" />
    <ProjectReference Include="../../src/OpenFlow.Application/OpenFlow.Application.csproj" />
    <ProjectReference Include="../../src/OpenFlow.Infrastructure/OpenFlow.Infrastructure.csproj" />
    <ProjectReference Include="../../src/OpenFlow.Contracts/OpenFlow.Contracts.csproj" />
  </ItemGroup>
</Project>`,

  'tests/OpenFlow.Domain.Tests/OpenFlow.Domain.Tests.csproj': `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <IsPackable>false</IsPackable>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.14.1" />
    <PackageReference Include="xunit" Version="2.9.3" />
    <PackageReference Include="xunit.runner.visualstudio" Version="3.1.4" />
  </ItemGroup>
  <ItemGroup>
    <ProjectReference Include="../../src/OpenFlow.Domain/OpenFlow.Domain.csproj" />
  </ItemGroup>
  <ItemGroup>
    <Using Include="Xunit" />
  </ItemGroup>
</Project>`,

  'tests/OpenFlow.Application.Tests/OpenFlow.Application.Tests.csproj': `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <IsPackable>false</IsPackable>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.14.1" />
    <PackageReference Include="xunit" Version="2.9.3" />
    <PackageReference Include="xunit.runner.visualstudio" Version="3.1.4" />
  </ItemGroup>
  <ItemGroup>
    <ProjectReference Include="../../src/OpenFlow.Domain/OpenFlow.Domain.csproj" />
    <ProjectReference Include="../../src/OpenFlow.Contracts/OpenFlow.Contracts.csproj" />
    <ProjectReference Include="../../src/OpenFlow.Application/OpenFlow.Application.csproj" />
    <ProjectReference Include="../../src/OpenFlow.Infrastructure/OpenFlow.Infrastructure.csproj" />
  </ItemGroup>
  <ItemGroup>
    <Using Include="Xunit" />
  </ItemGroup>
</Project>`,
};
