import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Cpu, Radio, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/infos")({
  head: () => ({
    meta: [
      { title: "Infos réseau & aide — ERT Connect" },
      {
        name: "description",
        content:
          "Fonctionnement du système ERT Connect : capteurs LoRa, détection automatique des pannes, sécurité des données et support technique.",
      },
      { property: "og:title", content: "Infos réseau & aide — ERT Connect" },
      {
        property: "og:description",
        content: "Comprendre l'architecture LoRa, la détection des pannes et le support ERT.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Infos,
});

const items = [
  {
    icon: <Radio className="h-5 w-5" />,
    title: "Réseau LoRa longue portée",
    text: "Chaque lampadaire embarque un module qui remonte son état sans SIM ni abonnement data.",
  },
  {
    icon: <Cpu className="h-5 w-5" />,
    title: "Détection automatique",
    text: "Panne, coupure secteur ou surconsommation sont identifiées en moins de 5 minutes.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "Données sécurisées",
    text: "Communication chiffrée et historique conservé pour l'analyse du parc.",
  },
  {
    icon: <BookOpen className="h-5 w-5" />,
    title: "Support ERT Dakar",
    text: "Assistance technique et formation des équipes de maintenance incluses.",
  },
];

function Infos() {
  return (
    <AppShell>
      <div className="flex flex-col gap-5 p-6" style={{ background: "#0A0A0A" }}>
        <header>
          <h1 className="font-display text-2xl font-bold text-white">Infos & aide</h1>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Comment fonctionne ERT Connect</p>
        </header>

        <div className="space-y-3">
          {items.map((i) => (
            <article
              key={i.title}
              className="flex gap-3 rounded-3xl p-4"
              style={{
                background: "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
                style={{ background: "rgba(251,191,36,0.15)", color: "#FBBF24" }}
              >
                {i.icon}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{i.title}</p>
                <p className="mt-1 text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{i.text}</p>
              </div>
            </article>
          ))}
        </div>

        <Link
          to="/"
          className="rounded-2xl py-3 text-center text-sm font-semibold text-white"
          style={{
            background: "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          Retour à l'écran d'accueil
        </Link>
      </div>
    </AppShell>
  );
}
