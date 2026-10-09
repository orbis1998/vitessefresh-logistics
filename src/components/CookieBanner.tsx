import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const KEY = "vita_cookie_consent";

const CookieBanner = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (!v) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  const choose = (value: "accepted" | "refused") => {
    localStorage.setItem(KEY, value);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[80] p-4">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/15 bg-[#111]/95 backdrop-blur-xl p-5 shadow-2xl">
        <p className="text-sm text-white/80">
          Vita Express utilise des cookies essentiels à la session. Les cookies de mesure
          ne sont déposés que si vous acceptez. Le refus est aussi simple que l’acceptation.{" "}
          <Link to="/cookies" className="text-primary underline">Politique cookies</Link>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => choose("accepted")}>Accepter</Button>
          <Button size="sm" variant="outline" onClick={() => choose("refused")}>Refuser</Button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
