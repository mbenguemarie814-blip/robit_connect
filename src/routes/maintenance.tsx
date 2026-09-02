import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, Wrench, AlertTriangle, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/maintenance")({
  head: () => ({
    meta: [
      { title: "Maintenance & interventions — ERT Connect" },
      {
        name: "description",
        content: "Suivi des alertes actives sur l'éclairage public de Dakar et des interventions techniciens.",
      },
    ],
  }),
  component: Maintenance,
});

type AlerteRow = {
  id: number;
  device_id: string;
  type_anomalie: string;
  statut: string;
  severite: string | null;
  debut: string;
  quartier: string | null;
};

const CATEGORIES = [
  { value: "tous", label: "Toutes les categories" },
  { value: "panne", label: "Pannes" },
  { value: "anomalie", label: "Anomalies" },
  { value: "hors_ligne", label: "Hors ligne" },
];

const ANOMALIE_LABEL: Record<string, string> = {
  PANNE_ALIMENTATION: "Panne d'alimentation",
  SOUS_TENSION: "Sous-tension",
  SURTENSION: "Surtension",
  LAMPE_POTENTIELLEMENT_GRILLEE: "Lampe grillee",
  SURCONSOMMATION: "Surconsommation",
  ETEINT_NUIT: "Eteinte la nuit",
  ALLUME_DE_JOUR: "Allumee le jour",
  DEFAUT_INTERMITTENT: "Defaut intermittent",
  DEGRADATION: "Degradation",
  OFFLINE: "Hors ligne",
};

const ANOMALIE_COLOR: Record<string, string> = {
  PANNE_ALIMENTATION: "#F87171",
  SOUS_TENSION: "#F87171",
  SURTENSION: "#F87171",
  LAMPE_POTENTIELLEMENT_GRILLEE: "#F87171",
  SURCONSOMMATION: "#FBBF24",
  ETEINT_NUIT: "#FBBF24",
  ALLUME_DE_JOUR: "#FBBF24",
  DEFAUT_INTERMITTENT: "#FBBF24",
  DEGRADATION: "#FBBF24",
  OFFLINE: "#9CA3AF",
};

function ilYA(dateIso: string): string {
  const diffMs = Date.now() - new Date(dateIso).getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60000));
  if (minutes < 1) return "a l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.round(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  return `il y a ${Math.round(heures / 24)} j`;
}

async function fetchAlertesActives(categorie: string): Promise<AlerteRow[]> {
  const params = new URLSearchParams({ statut: "active" });
  if (categorie !== "tous") params.set("categorie", categorie);
  const res = await fetch(`/api/alertes?${params.toString()}`);
  if (!res.ok) throw new Error("Erreur API alertes");
  return res.json();
}

async function fetchInterventionsEnCours(): Promise<any[]> {
  const res = await fetch("/api/interventions?statut=en_cours");
  if (!res.ok) throw new Error("Erreur API interventions");
  return res.json();
}

function Maintenance() {
  const [categorie, setCategorie] = useState("tous");
  const [selected, setSelected] = useState<AlerteRow | null>(null);
  const queryClient = useQueryClient();

  const { data: alertes, isLoading } = useQuery({
    queryKey: ["alertes-actives", categorie],
    queryFn: () => fetchAlertesActives(categorie),
    refetchInterval: 30000,
  });

  const { data: interventions } = useQuery({
    queryKey: ["interventions-en-cours"],
    queryFn: fetchInterventionsEnCours,
    refetchInterval: 30000,
  });

  return (
    <AppShell>
      <div className="flex flex-col gap-4 p-4" style={{ background: "#0A0A0A" }}>
        <header>
          <h1 className="font-display text-2xl font-bold text-white">Maintenance</h1>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            {alertes ? `${alertes.length} alerte${alertes.length > 1 ? "s" : ""} active${alertes.length > 1 ? "s" : ""}` : "Chargement..."}
            {" · "}
            {interventions ? `${interventions.length} intervention${interventions.length > 1 ? "s" : ""} en cours` : "..."}
          </p>
        </header>

        <div className="grid grid-cols-2 gap-3">
          <Metric icon={<AlertTriangle className="h-4 w-4" />} value={String(alertes?.length ?? "—")} label="Actives" color="#F87171" />
          <Metric icon={<Wrench className="h-4 w-4" />} value={String(interventions?.length ?? "—")} label="En cours" color="#22D3EE" />
        </div>

        <select
          value={categorie}
          onChange={(e) => setCategorie(e.target.value)}
          className="w-full rounded-xl px-3 py-2.5 text-sm font-medium outline-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value} style={{ background: "#1a1a1a" }}>
              {c.label}
            </option>
          ))}
        </select>

        <section className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>
            Alertes actives
          </p>

          {isLoading && (
            <p className="mt-2 text-center text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              Chargement...
            </p>
          )}

          {!isLoading && alertes && alertes.length === 0 && (
            <div className="flex items-center gap-3 rounded-2xl p-4" style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)" }}>
              <CheckCircle2 className="h-4 w-4" style={{ color: "#4ADE80" }} />
              <p className="text-xs font-semibold" style={{ color: "#4ADE80" }}>Aucune alerte active dans cette categorie</p>
            </div>
          )}

          {alertes?.map((a) => {
            const color = ANOMALIE_COLOR[a.type_anomalie] ?? "#9CA3AF";
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelected(a)}
                className="flex items-start gap-3 rounded-2xl p-3 text-left transition-transform active:scale-[0.98]"
                style={{ background: `${color}0F`, border: `1px solid ${color}40` }}
              >
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-white">
                    {ANOMALIE_LABEL[a.type_anomalie] ?? a.type_anomalie}
                  </span>
                  <span className="block truncate text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {a.device_id} · {a.quartier ?? "Zone inconnue"} · {ilYA(a.debut)}
                  </span>
                </span>
                {a.severite && (
                  <span className="shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold" style={{ color, background: `${color}26` }}>
                    {a.severite}
                  </span>
                )}
              </button>
            );
          })}
        </section>
      </div>

      {selected && (
        <InterventionModal
          alerte={selected}
          onClose={() => setSelected(null)}
          onDone={() => {
            setSelected(null);
            queryClient.invalidateQueries({ queryKey: ["alertes-actives"] });
            queryClient.invalidateQueries({ queryKey: ["interventions-en-cours"] });
          }}
        />
      )}
    </AppShell>
  );
}

function InterventionModal({
  alerte, onClose, onDone,
}: { alerte: AlerteRow; onClose: () => void; onDone: () => void }) {
  const [technicien, setTechnicien] = useState("");
  const [description, setDescription] = useState("");
  const [closeAlerte, setCloseAlerte] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/interventions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alerte_id: alerte.id,
          technicien,
          description,
          statut: closeAlerte ? "terminee" : "en_cours",
        }),
      });
      if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);

      if (closeAlerte) {
        const resAlerte = await fetch(`/api/alertes/${alerte.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statut: "resolue" }),
        });
        if (!resAlerte.ok) throw new Error(`Erreur fermeture alerte (${resAlerte.status})`);
      }

      onDone();
    } catch (err: any) {
      setError(err?.message ?? "Echec de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div
        className="w-full max-w-[440px] rounded-t-3xl p-5"
        style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-display text-base font-bold text-white">Nouvelle intervention</p>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              {ANOMALIE_LABEL[alerte.type_anomalie] ?? alerte.type_anomalie} · {alerte.device_id}
            </p>
          </div>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "#fff" }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mb-3 flex flex-col gap-1.5">
          <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>Technicien</span>
          <input
            value={technicien}
            onChange={(e) => setTechnicien(e.target.value)}
            placeholder="Nom du technicien"
            className="rounded-xl px-3.5 py-3 text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
          />
        </label>

        <label className="mb-3 flex flex-col gap-1.5">
          <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Action realisee..."
            rows={3}
            className="resize-none rounded-xl px-3.5 py-3 text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
          />
        </label>

        <label className="mb-4 flex items-center gap-2">
          <input type="checkbox" checked={closeAlerte} onChange={(e) => setCloseAlerte(e.target.checked)} />
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>Marquer l'alerte comme resolue</span>
        </label>

        {error && <p className="mb-3 text-xs" style={{ color: "#F87171" }}>{error}</p>}

        <button
          type="button"
          disabled={!technicien || submitting}
          onClick={handleSubmit}
          className="w-full rounded-2xl py-3 text-sm font-semibold"
          style={{
            background: technicien ? "linear-gradient(90deg, #22C55E, #15803D)" : "rgba(255,255,255,0.06)",
            color: technicien ? "#fff" : "rgba(255,255,255,0.3)",
          }}
        >
          {submitting ? "Enregistrement..." : "Enregistrer l'intervention"}
        </button>
      </div>
    </div>
  );
}

function Metric({
  icon, value, label, color,
}: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <div
      className="rounded-2xl p-3 text-center"
      style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      <span className="inline-flex" style={{ color }}>{icon}</span>
      <p className="mt-1 font-display text-lg font-bold text-white">{value}</p>
      <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
    </div>
  );
}
