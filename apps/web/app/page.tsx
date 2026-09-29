import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-slate-50 to-slate-200">
      <div className="max-w-2xl text-center space-y-6">
        <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold">
          OpenFlow v0.1.0 Architecture Engine
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Requirements-Driven GHL Workflow Simulator
        </h1>
        <p className="text-lg text-slate-600">
          Trace-first execution simulator with virtual clock time travel, deterministic branch tracing, and durable PostgreSQL task scheduling.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Link
            href="/workflows"
            className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            Open Workflow Studio
          </Link>
          <a
            href="http://localhost:5000/swagger"
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3 rounded-lg bg-white border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition"
          >
            API Docs (Swagger)
          </a>
        </div>
      </div>
    </main>
  );
}
