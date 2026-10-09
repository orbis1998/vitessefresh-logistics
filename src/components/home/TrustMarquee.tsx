const logos = [
  { name: "Extra", node: ExtraLogo },
  { name: "Caprice", node: CapriceLogo },
  { name: "Chez Flore", node: FloreLogo },
  { name: "Harlem Café", node: HarlemLogo },
  { name: "New York Pizza", node: NypLogo },
  { name: "Kin Marché", node: KinMarcheLogo },
  { name: "Sira Wax", node: SiraLogo },
  { name: "Atelier Ngaliema", node: AtelierLogo },
  { name: "Poisson du Fleuve", node: PoissonLogo },
  { name: "Boutique Lemba", node: BoutiqueLogo },
  { name: "Pâtisserie Gombe", node: PatisserieLogo },
  { name: "Café Memling", node: MemlingLogo },
];

function ExtraLogo() {
  return (
    <svg viewBox="0 0 160 48" className="h-11 w-40" role="img" aria-label="Extra">
      <circle cx="20" cy="24" r="16" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14 18h12 M14 24h9 M14 30h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <text x="44" y="30" fill="currentColor" fontFamily="Sora, sans-serif" fontSize="18" fontWeight="700" letterSpacing="2">EXTRA</text>
    </svg>
  );
}

function CapriceLogo() {
  return (
    <svg viewBox="0 0 168 48" className="h-11 w-[10.5rem]" role="img" aria-label="Caprice">
      <path d="M28 38c-10-2-16-10-16-18C12 10 20 6 28 10c2 1 3 3 2 5-4-2-10 0-10 7 0 6 5 9 11 8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <text x="42" y="31" fill="currentColor" fontFamily="Sora, sans-serif" fontSize="16" fontWeight="600" letterSpacing="1.5">CAPRICE</text>
    </svg>
  );
}

function FloreLogo() {
  return (
    <svg viewBox="0 0 176 48" className="h-11 w-44" role="img" aria-label="Chez Flore">
      <circle cx="20" cy="24" r="5" fill="currentColor" />
      <path d="M20 10v6M20 32v6M8 24h6M26 24h6M11 13l4 4M25 31l4 4M11 35l4-4M25 17l4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <text x="42" y="30" fill="currentColor" fontFamily="Sora, sans-serif" fontSize="15" fontWeight="600">CHEZ FLORE</text>
    </svg>
  );
}

function HarlemLogo() {
  return (
    <svg viewBox="0 0 188 48" className="h-11 w-[11.8rem]" role="img" aria-label="Harlem Café">
      <path d="M8 36V12h6l8 14 8-14h6v24h-6V22l-8 12-8-12v14H8z" fill="currentColor" />
      <text x="50" y="30" fill="currentColor" fontFamily="Sora, sans-serif" fontSize="15" fontWeight="600" letterSpacing="1">HARLEM CAFÉ</text>
    </svg>
  );
}

function NypLogo() {
  return (
    <svg viewBox="0 0 200 48" className="h-11 w-[12.5rem]" role="img" aria-label="New York Pizza">
      <path d="M22 8l14 32H8L22 8z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="18" cy="22" r="1.4" fill="currentColor" />
      <circle cx="26" cy="26" r="1.4" fill="currentColor" />
      <circle cx="20" cy="30" r="1.4" fill="currentColor" />
      <text x="44" y="22" fill="currentColor" fontFamily="Sora, sans-serif" fontSize="9" fontWeight="600" letterSpacing="2">NEW YORK</text>
      <text x="44" y="36" fill="currentColor" fontFamily="Sora, sans-serif" fontSize="16" fontWeight="700">PIZZA</text>
    </svg>
  );
}

function KinMarcheLogo() {
  return (
    <svg viewBox="0 0 176 48" className="h-11 w-44" role="img" aria-label="Kin Marché">
      <path d="M10 18h24l-2 16H12L10 18z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 18V14a6 6 0 0 1 12 0v4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text x="42" y="30" fill="currentColor" fontFamily="Sora, sans-serif" fontSize="15" fontWeight="700">KIN MARCHÉ</text>
    </svg>
  );
}

function SiraLogo() {
  return (
    <svg viewBox="0 0 154 48" className="h-11 w-[9.6rem]" role="img" aria-label="Sira Wax">
      <path d="M20 8l12 16-12 16L8 24 20 8z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 24h12M20 14v20" stroke="currentColor" strokeWidth="1.2" />
      <text x="40" y="30" fill="currentColor" fontFamily="Sora, sans-serif" fontSize="16" fontWeight="700" letterSpacing="1.5">SIRA WAX</text>
    </svg>
  );
}

function AtelierLogo() {
  return (
    <svg viewBox="0 0 200 48" className="h-11 w-[12.5rem]" role="img" aria-label="Atelier Ngaliema">
      <path d="M8 18h24M12 18c0 8 4 16 8 16s8-8 8-16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="20" cy="14" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <text x="40" y="22" fill="currentColor" fontFamily="Sora, sans-serif" fontSize="9" letterSpacing="1.5">ATELIER</text>
      <text x="40" y="36" fill="currentColor" fontFamily="Sora, sans-serif" fontSize="14" fontWeight="700">NGALIEMA</text>
    </svg>
  );
}

function PoissonLogo() {
  return (
    <svg viewBox="0 0 200 48" className="h-11 w-[12.5rem]" role="img" aria-label="Poisson du Fleuve">
      <path d="M8 24c8-10 20-10 28 0-8 10-20 10-28 0z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M36 24l8-6v12l-8-6z" fill="currentColor" />
      <circle cx="16" cy="22" r="1.3" fill="currentColor" />
      <text x="50" y="30" fill="currentColor" fontFamily="Sora, sans-serif" fontSize="13" fontWeight="600">POISSON DU FLEUVE</text>
    </svg>
  );
}

function BoutiqueLogo() {
  return (
    <svg viewBox="0 0 188 48" className="h-11 w-[11.8rem]" role="img" aria-label="Boutique Lemba">
      <rect x="10" y="16" width="20" height="18" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 16l4-6h12l4 6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text x="40" y="22" fill="currentColor" fontFamily="Sora, sans-serif" fontSize="9" letterSpacing="1.5">BOUTIQUE</text>
      <text x="40" y="36" fill="currentColor" fontFamily="Sora, sans-serif" fontSize="16" fontWeight="700">LEMBA</text>
    </svg>
  );
}

function PatisserieLogo() {
  return (
    <svg viewBox="0 0 196 48" className="h-11 w-[12.2rem]" role="img" aria-label="Pâtisserie Gombe">
      <path d="M8 30c4-14 12-18 16-8 4-12 14-8 16 8H8z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text x="48" y="22" fill="currentColor" fontFamily="Sora, sans-serif" fontSize="9" letterSpacing="1.2">PÂTISSERIE</text>
      <text x="48" y="36" fill="currentColor" fontFamily="Sora, sans-serif" fontSize="16" fontWeight="700">GOMBE</text>
    </svg>
  );
}

function MemlingLogo() {
  return (
    <svg viewBox="0 0 176 48" className="h-11 w-44" role="img" aria-label="Café Memling">
      <path d="M12 16h16v14a8 8 0 0 1-16 0V16z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M28 20h5a4 4 0 0 1 0 8h-5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 10c2 2 2 4 0 5M22 10c2 2 2 4 0 5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <text x="44" y="30" fill="currentColor" fontFamily="Sora, sans-serif" fontSize="14" fontWeight="600">CAFÉ MEMLING</text>
    </svg>
  );
}

const TrustMarquee = () => {
  const row = [...logos, ...logos];

  return (
    <section className="py-14 sm:py-16 bg-[#0d0d0d] border-y border-white/10 overflow-hidden">
      <div className="container-custom">
        <p className="text-center text-[11px] uppercase tracking-[0.2em] text-white/40">
          Restos, boutiques et commerces qui nous confient leurs livraisons
        </p>
      </div>
      <div className="mt-8 trust-marquee">
        <div className="trust-marquee__track">
          {row.map((brand, i) => {
            const Mark = brand.node;
            return (
              <div key={`${brand.name}-${i}`} className="trust-marquee__item text-white/70">
                <Mark />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrustMarquee;
