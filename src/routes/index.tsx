import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ERT Connect — Supervision des lampadaires publics" },
      {
        name: "description",
        content:
          "Supervision temps réel de l'éclairage public à Dakar : détection automatique des pannes, localisation LoRa et suivi des interventions.",
      },
      { property: "og:title", content: "ERT Connect — Supervision des lampadaires" },
      {
        property: "og:description",
        content:
          "Plateforme intelligente de supervision de l'éclairage public : alertes automatiques, carte interactive et maintenance optimisée.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Splash,
});

function Splash() {
  return (
    <PhoneFrame>
      <div className="relative flex flex-1 flex-col" style={{ backgroundColor: "#000000" }}>
        {/* Reflet diagonal - meme style que les KPI */}
        <div className="pointer-events-none absolute inset-0" style={{
          background: "linear-gradient(115deg, rgba(255,255,255,0.10) 0%, transparent 30%, transparent 100%)",
        }} />

        {/* Glow directionnel blanc, coin haut-gauche */}
        <div className="pointer-events-none absolute inset-0" style={{
          background: "radial-gradient(60% 40% at 0% 0%, rgba(255,255,255,0.14) 0%, transparent 70%)",
        }} />

        <div className="relative flex flex-1 flex-col items-center justify-between px-7 py-10">

          <div className="flex-[0.6]" />

          <img
            src="/logo-ert-accueil.png"
            alt="Logo ERT"
            className="h-44 w-44 shrink-0"
          />

          <div className="flex-[0.6]" />

          <div className="flex w-full justify-center" style={{ marginBottom: "20px" }}>
            <Link
              to="/accueil"
              className="flex w-[80%] items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-5 font-display text-base font-semibold text-primary-foreground shadow-glow transition-transform active:scale-[0.98]"
            >
              Entrer
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
