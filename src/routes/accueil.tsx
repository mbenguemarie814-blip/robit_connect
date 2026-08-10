import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  Lightbulb,
  PowerOff,
  QrCode,
  Radio,
  Wrench,
} from "lucide-react";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import lampHero from "@/assets/poteaux.png";

export const Route = createFileRoute("/accueil")({
  head: () => ({
    meta: [
      { title: "Accueil supervision — ERT Connect" },
      {
        name: "description",
        content:
          "Tableau de bord ERT Connect : état du parc de lampadaires, alertes en cours, scanner d'installation et interventions.",
      },
      { property: "og:title", content: "Accueil supervision — ERT Connect" },
      {
        property: "og:description",
        content:
          "Vue temps réel du parc d'éclairage public : lampadaires actifs, pannes détectées et interventions en cours.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Accueil,
});

const kpis = [
  {
    label: "Actifs",
    value: "182",
    hint: "sur 194",
    icon: <Lightbulb className="h-5 w-5" />,
    color: "#10E8A3",
    glow: "rgba(16,232,163,0.45)",
  },
  {
    label: "Pannes",
    value: "09",
    hint: "à traiter",
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "#FF3B4E",
    glow: "rgba(255,59,78,0.45)",
  },
  {
    label: "Coupures",
    value: "03",
    hint: "zones",
    icon: <PowerOff className="h-5 w-5" />,
    color: "#FFB020",
    glow: "rgba(255,176,32,0.45)",
  },
  {
    label: "Interventions",
    value: "05",
    hint: "en cours",
    icon: <Wrench className="h-5 w-5" />,
    color: "#22D3EE",
    glow: "rgba(34,211,238,0.45)",
  },
];

function Accueil() {
  return (
    <AppShell
      header={
        <div className="flex min-w-0 items-center gap-2 p-4 pb-0" style={{ background: "#0A0A0A" }}>
          <img
            src="/logo-ert-accueil.png"
            alt="Logo ERT"
            className="h-9 w-9 shrink-0 rounded-2xl"
            style={{ boxShadow: "0 0 16px -2px rgba(251,191,36,0.6)" }}
          />
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold tracking-[0.28em]" style={{ color: "#F5E6C8" }}>
              CONNECT
            </p>
          </div>
        </div>
      }
    >
      <div className="relative" style={{ background: "#0A0A0A" }}>
        <img
          src={lampHero}
          alt="Lampadaire connecté allumé la nuit"
          width={880}
          height={1200}
          className="pointer-events-none absolute inset-x-0 top-0 h-72 w-full object-cover opacity-30"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72" style={{ background: "linear-gradient(180deg, transparent 0%, rgba(10,10,10,0.7) 55%, #0A0A0A 100%)" }} />

        <div className="relative flex flex-col gap-3 p-4 pt-3">

          {/* Carte etat du reseau - glassmorphism fonce */}
          <section className="relative overflow-hidden rounded-3xl p-4" style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.02) 45%, rgba(255,255,255,0.05) 100%)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)",
          }}>
            <div className="pointer-events-none absolute inset-0" style={{
              background: "linear-gradient(115deg, rgba(255,255,255,0.12) 0%, transparent 30%, transparent 100%)",
            }} />
            <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className="text-[11px] tracking-widest uppercase" style={{ color: "rgba(245,230,200,0.5)" }}>
                  Parc supervisé
                </p>
                <p className="truncate font-display text-2xl font-bold text-white">Zone Plateau</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold" style={{ color: "#4ADE80" }}>
                <Radio className="h-3.5 w-3.5" /> Connecté
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 divide-x pt-3 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.08)" }}>
              <Stat value="93,8" unit="%" label="Disponibilité" />
              <Stat value="194" unit="Modules" label="Déployés" />
              <Stat value="4,2" unit="min" label="Détection" />
            </div>
          </section>

          {/* Action centrale */}
          <section className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <SideAction icon={<Activity className="h-5 w-5" />} label="Temps réel" />
            <Link
              to="/scanner"
              className="grid h-20 w-20 place-items-center rounded-full text-center transition-transform active:scale-95"
              style={{
                background: "radial-gradient(circle at 35% 30%, #FDE68A, #F59E0B 55%, #B45309 100%)",
                boxShadow: "0 0 40px -4px rgba(245,158,11,0.8), 0 0 80px -10px rgba(245,158,11,0.4)",
              }}
            >
              <span className="flex flex-col items-center gap-1" style={{ color: "#1a1206" }}>
                <QrCode className="h-5 w-5" />
                <span className="font-display text-xs font-bold">Scanner</span>
              </span>
            </Link>
            <SideAction icon={<Wrench className="h-5 w-5" />} label="Maintenance" />
          </section>

          {/* KPI neon */}
          <section>
            <h2 className="mb-2 font-display text-xs tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>
              Indicateurs clés
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {kpis.map((k) => (
                <article
                  key={k.label}
                  className="relative overflow-hidden rounded-3xl p-3 transition-transform active:scale-[0.97]"
                  style={{
                    background: `radial-gradient(120% 100% at 0% 0%, ${k.glow} 0%, rgba(255,255,255,0.03) 55%, rgba(255,255,255,0.02) 100%)`,
                    backdropFilter: "blur(12px)",
                    border: `1.5px solid ${k.glow}`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14)`,
                  }}
                >
                  {/* Reflet diagonal - surface vernie */}
                  <div className="pointer-events-none absolute inset-0" style={{
                    background: "linear-gradient(115deg, rgba(255,255,255,0.12) 0%, transparent 30%, transparent 100%)",
                  }} />

                  <span className="absolute top-3.5 right-3.5" style={{ color: k.color, filter: `drop-shadow(0 0 6px ${k.glow})` }}>{k.icon}</span>
                  <p className="mt-2 font-display text-2xl leading-none font-bold text-white">{k.value}</p>
                  <p className="mt-1.5 text-xs font-semibold" style={{ color: "#F5E6C8" }}>{k.label}</p>
                  <p className="text-[11px]" style={{ color: "rgba(245,230,200,0.5)" }}>{k.hint}</p>
                </article>
              ))}
            </div>
          </section>

          {/* Derniere alerte */}
          <section className="rounded-3xl p-3" style={{
            background: "linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}>
            <div className="flex items-center justify-between">
              <p className="font-display text-sm font-semibold text-white">Dernière alerte</p>
              <Link to="/maintenance" className="text-xs font-semibold" style={{ color: "#FBBF24" }}>
                Tout voir
              </Link>
            </div>
            <Link
              to="/maintenance"
              className="mt-3 flex items-center gap-3 rounded-2xl p-3"
              style={{ background: "rgba(239,68,68,0.08)" }}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: "rgba(239,68,68,0.15)", color: "#F87171" }}>
                <AlertTriangle className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-white">
                  Lampe éteinte · LMP-0148
                </span>
                <span className="block truncate text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Av. Cheikh Anta Diop · il y a 12 min
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "rgba(255,255,255,0.4)" }} />
            </Link>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ value, unit, label }: { value: string; unit: string; label: string }) {
  return (
    <div className="relative px-1">
      <p className="font-display text-xl font-bold text-white">{value}</p>
      <p className="text-[10px] tracking-wide uppercase" style={{ color: "rgba(245,230,200,0.5)" }}>{unit}</p>
      <p className="text-[11px] font-medium" style={{ color: "#F5E6C8" }}>{label}</p>
    </div>
  );
}

function SideAction({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="relative flex h-16 flex-col items-center justify-center gap-1 overflow-hidden rounded-3xl px-2 text-center transition-transform active:scale-95"
      style={{
        background: "linear-gradient(145deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.02) 45%, rgba(255,255,255,0.05) 100%)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)",
      }}
    >
      <div className="pointer-events-none absolute inset-0" style={{
        background: "linear-gradient(115deg, rgba(255,255,255,0.12) 0%, transparent 30%, transparent 100%)",
      }} />
      <span className="relative" style={{ color: "#FBBF24" }}>{icon}</span>
      <span className="relative text-[11px] font-semibold text-white">{label}</span>
    </button>
  );
}
