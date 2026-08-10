import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Navigation, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/carte")({
  head: () => ({
    meta: [
      { title: "Carte du parc — ERT Connect" },
      {
        name: "description",
        content:
          "Localisation des lampadaires connectés de Dakar : état de chaque module, zones en panne et navigation vers l'intervention.",
      },
      { property: "og:title", content: "Carte du parc — ERT Connect" },
      {
        property: "og:description",
        content: "Visualisez chaque lampadaire connecté et son état sur la carte du réseau.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Carte,
});

const points = [
  { id: "LMP-0148", zone: "Av. Cheikh Anta Diop", state: "Panne", tone: "text-destructive" },
  { id: "LMP-0091", zone: "Plateau · Rue 12", state: "Actif", tone: "text-success" },
  { id: "LMP-0203", zone: "Point E", state: "Coupure", tone: "text-warning" },
  { id: "LMP-0310", zone: "Mermoz", state: "Actif", tone: "text-success" },
];

function Carte() {
  return (
    <AppShell>
      <div className="flex flex-col gap-5 p-6">
        <header>
          <h1 className="font-display text-2xl font-bold">Carte du réseau</h1>
          <p className="text-xs text-muted-foreground">194 modules géolocalisés · Dakar</p>
        </header>

        <label className="flex items-center gap-2 rounded-2xl border border-border bg-card/60 px-4 py-3 backdrop-blur">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            placeholder="Rechercher un module ou une rue"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>

        <div className="relative h-64 overflow-hidden rounded-3xl border border-border bg-secondary/40">
          <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(oklch(1_0_0/8%)_1px,transparent_1px),linear-gradient(90deg,oklch(1_0_0/8%)_1px,transparent_1px)] [background-size:32px_32px]" />
          <span className="absolute top-16 left-14 grid h-9 w-9 place-items-center rounded-full bg-destructive/25 text-destructive">
            <MapPin className="h-4 w-4" />
          </span>
          <span className="absolute top-32 right-16 grid h-9 w-9 place-items-center rounded-full bg-success/25 text-success">
            <MapPin className="h-4 w-4" />
          </span>
          <span className="absolute bottom-10 left-1/2 grid h-9 w-9 place-items-center rounded-full bg-warning/25 text-warning">
            <MapPin className="h-4 w-4" />
          </span>
          <button
            type="button"
            className="absolute right-4 bottom-4 grid h-11 w-11 place-items-center rounded-2xl bg-brand-gradient text-primary-foreground shadow-glow"
          >
            <Navigation className="h-5 w-5" />
          </button>
        </div>

        <section className="space-y-2">
          {points.map((p) => (
            <article
              key={p.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-card/60 px-4 py-3 backdrop-blur"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{p.id}</p>
                <p className="truncate text-[11px] text-muted-foreground">{p.zone}</p>
              </div>
              <span className={`shrink-0 text-[11px] font-semibold ${p.tone}`}>{p.state}</span>
            </article>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
