import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Radio, WifiOff, MapPin } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/etat-module")({
  head: () => ({
    meta: [{ title: "Etat des modules — ERT Connect" }],
  }),
  component: EtatModule,
});

type PoteauConnexion = {
  device_id: string;
  quartier: string | null;
  commune: string | null;
  zone: string | null;
  derniere_donnee: string | null;
  en_ligne: boolean;
};

const SEUIL_HORS_LIGNE_MS = 30000; // 30s, coherent avec le backend

async function fetchConnexion(): Promise<PoteauConnexion[]> {
  const res = await fetch("/api/poteaux/connexion");
  if (!res.ok) throw new Error("Erreur API connexion");
  return res.json();
}

function formatDureeExacte(ms: number): string {
  const secondesTotales = Math.floor(ms / 1000);
  if (secondesTotales < 60) return `${secondesTotales}s`;
  const minutesTotales = Math.floor(secondesTotales / 60);
  const secondesRestantes = secondesTotales % 60;
  if (minutesTotales < 60) return `${minutesTotales}min ${secondesRestantes}s`;
  const heuresTotales = Math.floor(minutesTotales / 60);
  const minutesRestantes = minutesTotales % 60;
  if (heuresTotales < 24) return `${heuresTotales}h ${minutesRestantes}min`;
  const joursTotaux = Math.floor(heuresTotales / 24);
  const heuresRestantes = heuresTotales % 24;
  return `${joursTotaux}j ${heuresRestantes}h`;
}

function EtatModule() {
  const navigate = useNavigate();
  const [maintenant, setMaintenant] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const { data: modules, isLoading } = useQuery({
    queryKey: ["poteaux-connexion"],
    queryFn: fetchConnexion,
    refetchInterval: 15000,
  });

  const enLigneCount = modules?.filter((m) => m.en_ligne).length ?? 0;

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
            <p className="font-display text-lg font-bold text-white">Etat des modules</p>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              {modules ? `${enLigneCount}/${modules.length} en ligne` : "Chargement..."}
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

        {!isLoading && modules && modules.length === 0 && (
          <p className="mt-6 text-center text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            Aucun module enregistre
          </p>
        )}

        {modules?.map((m) => {
          const ecoulementMs = m.derniere_donnee ? maintenant - new Date(m.derniere_donnee).getTime() : null;
          const enLigne = ecoulementMs != null && ecoulementMs < SEUIL_HORS_LIGNE_MS;

          return (
            <button
              key={m.device_id}
              type="button"
              onClick={() => navigate({ to: "/lampadaire/$deviceId", params: { deviceId: m.device_id } })}
              className="flex flex-col gap-2 rounded-2xl p-4 text-left"
              style={{
                background: enLigne ? "rgba(74,222,128,0.06)" : "rgba(239,68,68,0.08)",
                border: enLigne ? "1px solid rgba(74,222,128,0.2)" : "1px solid rgba(239,68,68,0.35)",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {enLigne ? (
                    <Radio className="h-4 w-4" style={{ color: "#4ADE80" }} />
                  ) : (
                    <WifiOff className="h-4 w-4" style={{ color: "#F87171" }} />
                  )}
                  <span className="font-display text-sm font-bold text-white">{m.device_id}</span>
                </div>
                <span className="text-xs font-bold" style={{ color: enLigne ? "#4ADE80" : "#F87171" }}>
                  {enLigne ? "En ligne" : "Hors ligne"}
                </span>
              </div>

              <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                <MapPin className="h-3 w-3" />
                {m.quartier ?? "Zone inconnue"}{m.zone ? ` · ${m.zone}` : ""}
              </span>

              <div className="flex items-center justify-between border-t pt-2" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {m.derniere_donnee
                    ? new Date(m.derniere_donnee).toLocaleString("fr-FR", {
                        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
                      })
                    : "Aucune donnee"}
                </span>
                {ecoulementMs != null && (
                  <span className="text-[11px] font-semibold" style={{ color: enLigne ? "rgba(255,255,255,0.7)" : "#F87171" }}>
                    depuis {formatDureeExacte(ecoulementMs)}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </AppShell>
  );
}
