import { useInView } from "@/hooks/useInView";

const reviews = [
  {
    name: "Mamie Nzeba",
    place: "Lemba · boutique",
    stars: 4,
    text: "J’envoie des pagne et des sacs vers Gombe presque chaque semaine. Je vois la moto sur la carte, ça rassure. Une fois ça a traîné à Limete, mais les vêtements sont arrivés propres.",
  },
  {
    name: "Patrick Mbala",
    place: "Ngiri-Ngiri · magasin",
    stars: 5,
    text: "Le soir je fais partir les commandes du shop : chaussures, ceintures, petits colis. Le livreur est poli, il appelle avant d’arriver. Ça se voit que c’est du travail, pas un arrangement au bord de la route.",
  },
  {
    name: "Grâce Ilunga",
    place: "Kintambo · particulier",
    stars: 3,
    text: "J’avais commandé un plat du resto pour ma sœur à Matete. Le principe est bon, mais avec la pluie ça a pris plus d’une heure. La nourriture était encore tiède. Je commande plus tôt maintenant.",
  },
  {
    name: "Junior Kasongo",
    place: "Limete · restaurant",
    stars: 4,
    text: "On livre les commandes du midi vers Gombe. En général c’est dans la demi-heure. Une fois le livreur n’a pas trouvé l’immeuble, il a appelé le client tout de suite. Ça m’a évité un plat perdu.",
  },
  {
    name: "Sarah Tshala",
    place: "Gombe · concept store",
    stars: 5,
    text: "On envoie des bijoux et des lunettes, des choses fragiles. Le sachet arrive scellé, avec le code à la réception. L’équipe répond quand il y a un doute sur l’adresse. C’est ça la différence.",
  },
  {
    name: "Dieudonné Kalala",
    place: "Matete · dépôt",
    stars: 4,
    text: "Ce n’est pas le tarif d’un taxi-moto au feeling, mais au moins je sais ce que je paie. Samedi dernier j’ai fait partir un carton de riz et d’huile avant la fermeture. Livré le jour même.",
  },
];

const StarRow = ({ n }: { n: number }) => (
  <div className="flex gap-0.5" aria-label={`${n} sur 5`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <svg key={i} viewBox="0 0 16 16" className="h-3.5 w-3.5">
        <path
          d="M8 1.6l1.7 3.5 3.8.6-2.8 2.7.7 3.8L8 10.4 4.6 12.2l.7-3.8L2.5 5.7l3.8-.6L8 1.6z"
          fill={i <= n ? "#FFC400" : "none"}
          stroke={i <= n ? "#FFC400" : "rgba(255,255,255,0.25)"}
          strokeWidth="1"
        />
      </svg>
    ))}
  </div>
);

const TestimonialsSection = () => {
  const { ref, visible } = useInView<HTMLElement>(0.1);

  return (
    <section ref={ref} className="py-20 sm:py-28 bg-background">
      <div className="container-custom">
        <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-medium">Avis clients</p>
        <h2 className="mt-3 font-heading text-3xl sm:text-4xl font-bold max-w-lg">
          Ce qu’on entend à Kinshasa
        </h2>
        <p className="mt-4 text-muted-foreground max-w-xl">
          Des boutiques, des restos, des particuliers. Pas tous les jours parfaits — mais réalistes.
        </p>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {reviews.map((review, i) => (
            <article
              key={review.name}
              className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 transition-all duration-700 ease-vita ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: visible ? `${i * 80}ms` : "0ms" }}
            >
              <StarRow n={review.stars} />
              <p className="mt-4 text-sm sm:text-[15px] leading-relaxed text-white/80">{review.text}</p>
              <p className="mt-5 font-heading text-sm font-semibold">{review.name}</p>
              <p className="mt-0.5 text-xs text-white/40">{review.place}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
