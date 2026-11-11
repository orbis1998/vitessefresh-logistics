import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import { VitaWordmark } from "@/components/brand/VitaWordmark";

interface AuthLayoutProps {
  title: string;
  children: ReactNode;
}

const AuthLayout = ({ title, children }: AuthLayoutProps) => {
  return (
    <div className="auth-shell min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      <main className="auth-main relative flex flex-1 items-center justify-center px-4 pb-16 pt-24">
        <div className="auth-card relative w-full max-w-[420px] rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="mb-8 flex items-center justify-center">
            <VitaWordmark lockup className="h-9 sm:h-10" />
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">{title}</h1>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;
