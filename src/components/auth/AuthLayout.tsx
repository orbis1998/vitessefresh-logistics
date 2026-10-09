import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";

interface AuthLayoutProps {
  title: string;
  children: ReactNode;
}

const AuthLayout = ({ title, children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 pt-24 pb-16">
        <div className="w-full max-w-[420px] rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">{title}</h1>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;
