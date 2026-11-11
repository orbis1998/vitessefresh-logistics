import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  VitaArrowIcon,
  VitaCheckIcon,
  VitaExpressIcon,
  VitaParcelIcon,
  VitaPriorityIcon,
} from "@/components/brand/VitaIcons";
import { getService } from "@/data/services";

const serviceIcons = {
  express: VitaExpressIcon,
  priority: VitaPriorityIcon,
};

const ServiceDetail = () => {
  const { slug } = useParams();
  const service = getService(slug);

  if (!service) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container-custom flex min-h-[70vh] max-w-2xl flex-col justify-center pt-24">
          <p className="text-sm font-medium text-primary">Service introuvable</p>
          <h1 className="mt-3 font-heading text-4xl font-bold">Cette page n’existe pas.</h1>
          <Link to="/services" className="mt-8">
            <Button variant="outline">Voir tous les services</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const ServiceIcon = serviceIcons[service.icon];

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>{service.title} | Vita Express</title>
        <meta name="description" content={service.description} />
      </Helmet>
      <Navbar />

      <main>
        <section className="relative overflow-hidden bg-[#0d0d0d] pb-20 pt-32 text-white sm:pb-28 sm:pt-40">
          <div className="pointer-events-none absolute -right-28 top-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="container-custom relative grid items-end gap-12 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <Link to="/services" className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white">
                <VitaArrowIcon className="h-4 w-4 rotate-180" />
                Tous les services
              </Link>
              <p className="mt-12 text-xs font-medium uppercase tracking-[0.18em] text-primary">{service.eyebrow}</p>
              <h1 className="mt-4 max-w-3xl text-balance font-heading text-4xl font-bold tracking-tight sm:text-6xl">
                {service.title}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/65">{service.description}</p>
            </div>
            <div className="flex justify-start lg:col-span-4 lg:justify-end">
              <div className="flex h-32 w-32 items-center justify-center rounded-[2rem] border border-primary/25 bg-primary/10 text-primary">
                <ServiceIcon className="h-20 w-20" />
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28">
          <div className="container-custom grid gap-16 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Ce qui est inclus</p>
              <h2 className="mt-4 max-w-xl font-heading text-3xl font-bold sm:text-4xl">
                Une course suivie du ramassage à la remise
              </h2>
              <div className="mt-10 divide-y divide-border">
                {service.features.map((feature, index) => (
                  <div key={feature} className="flex items-start gap-5 py-5 first:pt-0">
                    <span className="font-heading text-sm tabular-nums text-primary">0{index + 1}</span>
                    <p className="text-base leading-relaxed">{feature}</p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="lg:col-span-5">
              <div className="rounded-[1.5rem] bg-[#171717] p-7 text-white sm:p-9">
                <VitaParcelIcon className="h-9 w-9 text-primary" />
                <h2 className="mt-7 font-heading text-2xl font-semibold">Idéal pour</h2>
                <ul className="mt-6 space-y-4">
                  {service.idealFor.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-white/70">
                      <VitaCheckIcon className="h-4 w-4 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </section>

        <section className="border-y border-border bg-muted/20 py-20 sm:py-24">
          <div className="container-custom">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Comment ça marche</p>
            <div className="mt-8 grid gap-px overflow-hidden rounded-[1.5rem] bg-border md:grid-cols-3">
              {service.steps.map((step, index) => (
                <article key={step} className="bg-background p-7 sm:p-9">
                  <p className="font-heading text-4xl font-bold text-primary">0{index + 1}</p>
                  <p className="mt-8 leading-relaxed text-muted-foreground">{step}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-primary py-16 text-primary-foreground sm:py-20">
          <div className="container-custom flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium text-black/55">Votre course peut partir aujourd’hui.</p>
              <h2 className="mt-3 max-w-xl font-heading text-3xl font-bold sm:text-4xl">Prêt à confier votre colis à Vita Express ?</h2>
            </div>
            <Link to="/auth/register">
              <Button variant="secondary" size="lg" className="group">
                Commander une livraison
                <VitaArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ServiceDetail;
