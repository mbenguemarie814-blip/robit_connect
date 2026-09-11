import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Battery, Bolt, Gauge, Zap, RefreshCw, Sun, Moon, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/master")({
  head: () => ({
    meta: [{ title: "Passerelles — ERT Connect" }],
  }),
  component: MasterListe,
});

type Gateway = {
  gateway_id: string;
  time: string;
  voltage: number | null;
  current_mA: number | null;
  power_mW: number | null;
  battery_percent: number | null;
  charging: boolean | null;
  is_night: boolean | null;
};

function infoRecharge(charging: boolean | null, isNight: boolean | null) {
  if (isNight == null) {
    return { label: "Statut inconnu", color: "#9CA3AF", bg: "rgba(156,163,175,0.12)", icone: "inconnu" as const };
  }
  if (isNight) {
    if (charging) {
      return { label: "Charge externe active", color: "#4ADE80", bg: "rgba(74,222,128,0.12)", icone: "eclair" as const };
    }
    return { label: "Nuit — pas de recharge (normal)", color: "#9CA3AF", bg: "rgba(156,163,175,0.1)", icone: "lune" as const };
  }
  if (charging) {
    return { label: "Recharge solaire active", color: "#4ADE80", bg: "rgba(74,222,128,0.12)", icone: "eclair" as const };
  }
  return { label: "Pas de recharge — a verifier", color: "#FBBF24", bg: "rgba(251,191,36,0.12)", icone: "alerte" as const };
}

async function fetchGateways(): Promise<Gateway[]> {
  const res = await fetch("/api/gateways");
  if (!res.ok) throw new Error("Erreur API gateways");
  return res.json();
}

function couleurBatterie(pct: number | null): string {
  if (pct == null) return "#9CA3AF";
  if (pct < 15) return "#F87171";
  if (pct < 40) return "#FBBF24";
  return "#4ADE80";
}

function etatBatterie(pct: number | null): string {
  if (pct == null) return "Inconnu";
  if (pct < 15) return "Critique";
  if (pct < 40) return "Faible";
  if (pct < 80) return "Correcte";
  return "Pleine";
}

const SEUIL_HORS_LIGNE_MS = 90000; // 90 secondes

function masterEnLigne(dateIso: string): boolean {
  return Date.now() - new Date(dateIso).getTime() < SEUIL_HORS_LIGNE_MS;
}

function ilYA(dateIso: string): string {
  const diffMs = Date.now() - new Date(dateIso).getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60000));
  if (minutes < 1) return "a l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.round(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  return `il y a ${Math.round(heures / 24)} j`;
}

function MasterListe() {
  const navigate = useNavigate();

  const { data: gateways, isLoading } = useQuery({
    queryKey: ["gateways"],
    queryFn: fetchGateways,
    refetchInterval: 15000,
  });

  return (
    <AppShell
      header={
        <div className="flex items-center gap-3 p-4 pb-2" style={{ background: "#0A0A0A" }}>
          <button
            type="button"
            onClick={() => navigate({ to: "/accueil" })}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
            style={{ background: "rgba(255,255,255,0.06)", color: "#fff" }}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="font-display text-lg font-bold text-white">Passerelles</p>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              {gateways ? `${gateways.length} passerelle${gateways.length > 1 ? "s" : ""}` : "Chargement..."}
            </p>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-3 p-4" style={{ background: "#0A0A0A" }}>
        {isLoading && (
          <p className="mt-6 text-center text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            Chargement...
          </p>
        )}

        {!isLoading && gateways && gateways.length === 0 && (
          <p className="mt-6 text-center text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            Aucune passerelle n'a encore transmis de donnees
          </p>
        )}

        {gateways?.map((g) => {
          const couleur = couleurBatterie(g.battery_percent);
          return (
            <div
              key={g.gateway_id}
              className="flex flex-col gap-4 rounded-3xl p-4"
              style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        background: masterEnLigne(g.time) ? "#4ADE80" : "#F87171",
                        boxShadow: masterEnLigne(g.time) ? "0 0 6px -1px #4ADE80" : "0 0 6px -1px #F87171",
                      }}
                    />
                    <p className="font-display text-base font-bold text-white">{g.gateway_id}</p>
                  </div>
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Mise a jour {ilYA(g.time)}
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <div
                    className="grid h-14 w-14 place-items-center rounded-full"
                    style={{
                      background: `radial-gradient(circle at 35% 30%, ${couleur}, ${couleur}99 70%)`,
                      boxShadow: `0 0 16px -2px ${couleur}66`,
                    }}
                  >
                    <Battery className="h-6 w-6" style={{ color: "#0A0A0A" }} />
                  </div>
                  <p className="mt-1 text-xs font-bold" style={{ color: couleur }}>
                    {g.battery_percent != null ? `${g.battery_percent.toFixed(0)}%` : "—"}
                  </p>
                  <p className="text-[10px] font-semibold" style={{ color: couleur }}>
                    {etatBatterie(g.battery_percent)}
                  </p>
                </div>
              </div>

              {(() => {
                const info = infoRecharge(g.charging, g.is_night);
                return (
                  <span
                    className="flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold"
                    style={{ color: info.color, background: info.bg }}
                  >
                    {info.icone === "eclair" && <RefreshCw className="h-3 w-3" />}
                    {info.icone === "lune" && <Moon className="h-3 w-3" />}
                    {info.icone === "alerte" && <AlertTriangle className="h-3 w-3" />}
                    {g.is_night === false && info.icone !== "alerte" && <Sun className="h-3 w-3" />}
                    {info.label}
                  </span>
                );
              })()}

              <div className="grid grid-cols-3 gap-2.5">
                <Mesure icon={<Bolt className="h-4 w-4" />} label="Tension" value={g.voltage} unit="V" />
                <Mesure icon={<Zap className="h-4 w-4" />} label="Courant" value={g.current_mA} unit="mA" decimals={0} />
                <Mesure icon={<Gauge className="h-4 w-4" />} label="Puissance" value={g.power_mW} unit="mW" decimals={0} />
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}

function Mesure({
  icon, label, value, unit, decimals = 2,
}: { icon: React.ReactNode; label: string; value: number | null; unit: string; decimals?: number }) {
  return (
    <div className="rounded-2xl p-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
      <span className="flex items-center gap-1 text-[9px] uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>
        {icon} {label}
      </span>
      <p className="mt-1 text-sm font-bold text-white">
        {value != null ? value.toFixed(decimals) : "—"} <span className="text-[10px] font-normal" style={{ color: "rgba(255,255,255,0.4)" }}>{unit}</span>
      </p>
    </div>
  );
}
