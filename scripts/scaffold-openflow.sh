#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# OpenFlow Automated Codebase Infrastructure Scaffolding Script
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "======================================================================"
echo "🚀 [OpenFlow] Initializing Codebase Infrastructure & Reference Scaffold"
echo "Target Directory: $ROOT_DIR"
echo "======================================================================"

cd "$ROOT_DIR"

# Resolve Node command
NODE_BIN="node"
if ! command -v node &> /dev/null; then
    if command -v node.exe &> /dev/null; then
        NODE_BIN="node.exe"
    elif [ -f "/mnt/c/Program Files/nodejs/node.exe" ]; then
        NODE_BIN="/mnt/c/Program Files/nodejs/node.exe"
    fi
fi

# Resolve dotnet command
DOTNET_BIN="dotnet"
if ! command -v dotnet &> /dev/null; then
    if command -v dotnet.exe &> /dev/null; then
        DOTNET_BIN="dotnet.exe"
    elif [ -f "/mnt/c/Program Files/dotnet/dotnet.exe" ]; then
        DOTNET_BIN="/mnt/c/Program Files/dotnet/dotnet.exe"
    fi
fi

echo "==> 1. Generating monorepo folders, projects, contracts, and code..."
"$NODE_BIN" scripts/scaffold.js

echo "==> 2. Restoring .NET 10 solution packages..."
"$DOTNET_BIN" restore OpenFlow.sln

echo "==> 3. Compiling full modular monolith backend solution..."
"$DOTNET_BIN" build OpenFlow.sln --no-restore

echo "==> 4. Executing domain and application execution engine test suites..."
"$DOTNET_BIN" test OpenFlow.sln --no-build

echo "======================================================================"
echo "✅ [OpenFlow] Architecture Infrastructure Scaffolding Complete!"
echo "Next steps:"
echo "  - Start DB: docker compose up -d"
echo "  - Run API:  dotnet run --project apps/api"
echo "  - Run Worker: dotnet run --project apps/worker"
echo "  - Run Web:  pnpm install && pnpm dev"
echo "======================================================================"
