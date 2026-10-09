import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface LegalPageProps {
  title: string;
  updated: string;
  children: ReactNode;
}

const LegalPage = ({ title, updated, children }: LegalPageProps) => (
  <div className="min-h-screen">
    <Navbar />
    <main className="pt-28 pb-16 sm:pt-32 sm:pb-24">
      <article className="container-custom max-w-3xl">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">Dernière mise à jour : {updated}</p>
        <div className="mt-10 space-y-6 text-sm sm:text-base text-muted-foreground leading-relaxed [&_h2]:font-heading [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-3">
          {children}
        </div>
      </article>
    </main>
    <Footer />
  </div>
);

export default LegalPage;
