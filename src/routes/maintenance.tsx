import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock, Wrench } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/maintenance")({
  head: () => ({
    meta: [
      { title: "Maintenance & interventions — ERT Connect" },
      {
        name: "description",
        content:
          "Suivi des interventions sur l'éclairage public de Dakar : tickets ouverts, techniciens assignés et historique des réparations.",
      },
      { property: "og:title", content: "Maintenance & interventions — ERT Connect" },
      {
        property: "og:description",
        content: "Tickets, techniciens assignés et historique des réparations du parc ERT.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Maintenance,
});

const tickets = [
  { id: "LMP-0148", title: "Lampe éteinte", tech: "Moussa D.", status: "En cours", color: "#FBBF24" },
  { id: "LMP-0203", title: "Coupure secteur", tech: "Awa S.", status: "Assignée", color: "#60A5FA" },
  { id: "LMP-0067", title: "Module hors ligne", tech: "Ibrahima F.", status: "En cours", color: "#FBBF24" },
  { id: "LMP-0012", title: "Remplacement LED", tech: "Moussa D.", status: "Résolue", color: "#4ADE80" },
];

function Maintenance() {
  return (
    <AppShell>
      <div className="flex flex-col gap-5 p-6" style={{ background: "#0A0A0A" }}>
        <header>
          <h1 className="font-display text-2xl font-bold text-white">Maintenance</h1>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>5 interventions en cours · 3 techniciens</p>
        </header>

        <div className="grid grid-cols-3 gap-3">
          <Metric icon={<Wrench className="h-4 w-4" />} value="5" label="Ouvertes" />
          <Metric icon={<Clock className="h-4 w-4" />} value="1,8j" label="Délai moy." />
          <Metric icon={<CheckCircle2 className="h-4 w-4" />} value="41" label="Résolues" />
        </div>

        <section className="space-y-2">
          {tickets.map((t) => (
            <article
              key={t.id}
              className="rounded-2xl p-4"
              style={{
                background: "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{t.title}</p>
                  <p className="truncate text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {t.id} · {t.tech}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] font-semibold" style={{ color: t.color }}>{t.status}</span>
              </div>
            </article>
          ))}
        </section>
      </div>
    </AppShell>
  );
}

function Metric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div
      className="rounded-2xl p-3 text-center"
      style={{
        background: "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <span className="inline-flex" style={{ color: "#FBBF24" }}>{icon}</span>
      <p className="mt-1 font-display text-lg font-bold text-white">{value}</p>
      <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
    </div>
  );
}
