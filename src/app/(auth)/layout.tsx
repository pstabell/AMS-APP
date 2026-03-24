import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md items-center">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
