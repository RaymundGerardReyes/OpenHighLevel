// scripts/scaffold.js
// OpenFlow Codebase Infrastructure Generator

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { rootTemplates } from './templates/root-templates.js';
import { domainTemplates } from './templates/domain-templates.js';
import { contractsTemplates } from './templates/contracts-templates.js';
import { applicationAbstractionsTemplates } from './templates/application-abstractions-templates.js';
import { applicationWorkflowsTemplates } from './templates/application-workflows-templates.js';
import { applicationExecutionsTemplates } from './templates/application-executions-templates.js';
import { infrastructureTemplates } from './templates/infrastructure-templates.js';
import { apiWorkerTemplates } from './templates/api-worker-templates.js';
import { webTemplates } from './templates/web-templates.js';
import { testTemplates } from './templates/test-templates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const allTemplates = {
  ...rootTemplates,
  ...domainTemplates,
  ...contractsTemplates,
  ...applicationAbstractionsTemplates,
  ...applicationWorkflowsTemplates,
  ...applicationExecutionsTemplates,
  ...infrastructureTemplates,
  ...apiWorkerTemplates,
  ...webTemplates,
  ...testTemplates,
};

console.log('🚀 [OpenFlow] Starting Codebase Infrastructure Scaffolding...');
console.log(`📁 Target Root Directory: ${rootDir}`);

let filesWritten = 0;

for (const [relPath, content] of Object.entries(allTemplates)) {
  const fullPath = path.join(rootDir, relPath);
  const dirName = path.dirname(fullPath);

  if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName, { recursive: true });
  }

  fs.writeFileSync(fullPath, content.trimStart(), 'utf-8');
  filesWritten++;
}

console.log(`✅ Wrote ${filesWritten} architectural template files successfully.`);

// Generate OpenFlow.sln
const solutionPath = path.join(rootDir, 'OpenFlow.sln');
const slnContent = `
Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio Version 17
VisualStudioVersion = 17.0.31903.59
MinimumVisualStudioVersion = 10.0.40219.1
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "OpenFlow.Domain", "src\\OpenFlow.Domain\\OpenFlow.Domain.csproj", "{A1111111-1111-1111-1111-111111111111}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "OpenFlow.Contracts", "src\\OpenFlow.Contracts\\OpenFlow.Contracts.csproj", "{B2222222-2222-2222-2222-222222222222}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "OpenFlow.Application", "src\\OpenFlow.Application\\OpenFlow.Application.csproj", "{C3333333-3333-3333-3333-333333333333}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "OpenFlow.Infrastructure", "src\\OpenFlow.Infrastructure\\OpenFlow.Infrastructure.csproj", "{D4444444-4444-4444-4444-444444444444}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "OpenFlow.Api", "apps\\api\\OpenFlow.Api.csproj", "{E5555555-5555-5555-5555-555555555555}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "OpenFlow.Worker", "apps\\worker\\OpenFlow.Worker.csproj", "{F6666666-6666-6666-6666-666666666666}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "OpenFlow.Domain.Tests", "tests\\OpenFlow.Domain.Tests\\OpenFlow.Domain.Tests.csproj", "{17777777-7777-7777-7777-777777777777}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "OpenFlow.Application.Tests", "tests\\OpenFlow.Application.Tests\\OpenFlow.Application.Tests.csproj", "{18888888-8888-8888-8888-888888888888}"
EndProject
Global
	GlobalSection(SolutionConfigurationPlatforms) = preSolution
		Debug|Any CPU = Debug|Any CPU
		Release|Any CPU = Release|Any CPU
	EndGlobalSection
	GlobalSection(ProjectConfigurationPlatforms) = postSolution
		{A1111111-1111-1111-1111-111111111111}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{A1111111-1111-1111-1111-111111111111}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{A1111111-1111-1111-1111-111111111111}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{A1111111-1111-1111-1111-111111111111}.Release|Any CPU.Build.0 = Release|Any CPU
		{B2222222-2222-2222-2222-222222222222}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{B2222222-2222-2222-2222-222222222222}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{B2222222-2222-2222-2222-222222222222}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{B2222222-2222-2222-2222-222222222222}.Release|Any CPU.Build.0 = Release|Any CPU
		{C3333333-3333-3333-3333-333333333333}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{C3333333-3333-3333-3333-333333333333}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{C3333333-3333-3333-3333-333333333333}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{C3333333-3333-3333-3333-333333333333}.Release|Any CPU.Build.0 = Release|Any CPU
		{D4444444-4444-4444-4444-444444444444}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{D4444444-4444-4444-4444-444444444444}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{D4444444-4444-4444-4444-444444444444}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{D4444444-4444-4444-4444-444444444444}.Release|Any CPU.Build.0 = Release|Any CPU
		{E5555555-5555-5555-5555-555555555555}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{E5555555-5555-5555-5555-555555555555}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{E5555555-5555-5555-5555-555555555555}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{E5555555-5555-5555-5555-555555555555}.Release|Any CPU.Build.0 = Release|Any CPU
		{F6666666-6666-6666-6666-666666666666}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{F6666666-6666-6666-6666-666666666666}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{F6666666-6666-6666-6666-666666666666}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{F6666666-6666-6666-6666-666666666666}.Release|Any CPU.Build.0 = Release|Any CPU
		{17777777-7777-7777-7777-777777777777}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{17777777-7777-7777-7777-777777777777}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{17777777-7777-7777-7777-777777777777}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{17777777-7777-7777-7777-777777777777}.Release|Any CPU.Build.0 = Release|Any CPU
		{18888888-8888-8888-8888-888888888888}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{18888888-8888-8888-8888-888888888888}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{18888888-8888-8888-8888-888888888888}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{18888888-8888-8888-8888-888888888888}.Release|Any CPU.Build.0 = Release|Any CPU
	EndGlobalSection
EndGlobal
`;

fs.writeFileSync(solutionPath, slnContent.trimStart(), 'utf-8');
console.log('✅ Generated OpenFlow.sln with all project bindings.');
console.log('🎉 Codebase scaffolding completed successfully!');
