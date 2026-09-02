import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, Wrench, AlertTriangle, X, MapPin } from "lucide-react";
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
  commune: string | null;
  zone: string | null;
  latitude: number | null;
  longitude: number | null;
};

type InterventionRow = {
  id: number;
  alerte_id: number | null;
  statut: string;
  date_intervention: string;
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

// Point 1 : niveau d'urgence par type d'anomalie (remplace le texte brut "Verifier communication" etc.)
const NIVEAU_PAR_ANOMALIE: Record<string, "Urgent" | "Critique" | "Grave" | "Normal"> = {
  PANNE_ALIMENTATION: "Urgent",
  SOUS_TENSION: "Urgent",
  SURTENSION: "Urgent",
  LAMPE_POTENTIELLEMENT_GRILLEE: "Critique",
  SURCONSOMMATION: "Grave",
  DEGRADATION: "Grave",
  ETEINT_NUIT: "Normal",
  ALLUME_DE_JOUR: "Normal",
  DEFAUT_INTERMITTENT: "Normal",
  OFFLINE: "Normal", // cas special, voir point 5
};

const NIVEAU_STYLE: Record<string, string> = {
  Urgent: "#EF4444",
  Critique: "#F97316",
  Grave: "#FBBF24",
  Normal: "#9CA3AF",
};

function niveauFor(type: string) {
  return NIVEAU_PAR_ANOMALIE[type] ?? "Normal";
}

// Point 3 : statuts possibles pour une intervention
const STATUT_LABEL: Record<string, string> = {
  verifier_a_distance: "Verifier a distance",
  en_attente: "En attente",
  en_cours: "En cours",
  resolue: "Resolue",
  non_reparable: "Non reparable",
};

function statutsDisponibles(typeAnomalie: string): string[] {
  // Point 5 : cas special OFFLINE, on propose d'abord la verification a distance
  if (typeAnomalie === "OFFLINE") {
    return ["verifier_a_distance", "en_attente", "en_cours", "resolue", "non_reparable"];
  }
  return ["en_attente", "en_cours", "resolue", "non_reparable"];
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

async function fetchAlertesActives(categorie: string): Promise<AlerteRow[]> {
  const params = new URLSearchParams({ statut: "active" });
  if (categorie !== "tous") params.set("categorie", categorie);
  const res = await fetch(`/api/alertes?${params.toString()}`);
  if (!res.ok) throw new Error("Erreur API alertes");
  return res.json();
}

async function fetchInterventions(): Promise<InterventionRow[]> {
  const res = await fetch("/api/interventions");
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
    queryKey: ["interventions"],
    queryFn: fetchInterventions,
    refetchInterval: 30000,
  });

  // Point 4 : derniere intervention connue par alerte, pour afficher son statut en badge
  const dernierStatutParAlerte = new Map<number, string>();
  (interventions ?? []).forEach((i) => {
    if (i.alerte_id != null && !dernierStatutParAlerte.has(i.alerte_id)) {
      dernierStatutParAlerte.set(i.alerte_id, i.statut);
    }
  });

  const enCoursCount = (interventions ?? []).filter((i) => i.statut === "en_cours" || i.statut === "en_attente").length;

  return (
    <AppShell>
      <div className="flex flex-col gap-4 p-4" style={{ background: "#0A0A0A" }}>
        <header>
          <h1 className="font-display text-2xl font-bold text-white">Maintenance</h1>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            {alertes ? `${alertes.length} alerte${alertes.length > 1 ? "s" : ""} active${alertes.length > 1 ? "s" : ""}` : "Chargement..."}
          </p>
        </header>

        <div className="grid grid-cols-2 gap-3">
          <Metric icon={<AlertTriangle className="h-4 w-4" />} value={String(alertes?.length ?? "—")} label="Actives" color="#F87171" />
          <Metric icon={<Wrench className="h-4 w-4" />} value={String(enCoursCount)} label="En traitement" color="#22D3EE" />
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
            const niveau = niveauFor(a.type_anomalie);
            const color = NIVEAU_STYLE[niveau];
            const statutIntervention = dernierStatutParAlerte.get(a.id);
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
                  {statutIntervention && (
                    <span className="mt-1 inline-block text-[10px] font-semibold" style={{ color: "#22D3EE" }}>
                      {STATUT_LABEL[statutIntervention] ?? statutIntervention}
                    </span>
                  )}
                </span>
                <span className="shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold" style={{ color, background: `${color}26` }}>
                  {niveau}
                </span>
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
            queryClient.invalidateQueries({ queryKey: ["interventions"] });
          }}
        />
      )}
    </AppShell>
  );
}

// Point 2 + 3 : entete avec details du poteau + bouton carte, choix du statut (plus de champs texte)
function InterventionModal({
  alerte, onClose, onDone,
}: { alerte: AlerteRow; onClose: () => void; onDone: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const niveau = niveauFor(alerte.type_anomalie);
  const color = NIVEAU_STYLE[niveau];

  const handleChoix = async (statutChoisi: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/interventions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alerte_id: alerte.id,
          statut: statutChoisi,
        }),
      });
      if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);

      if (statutChoisi === "resolue") {
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
        <div className="mb-4 flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <span className="mb-1.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold" style={{ color, background: `${color}26` }}>
              {niveau}
            </span>
            <p className="font-display text-base font-bold text-white">
              {ANOMALIE_LABEL[alerte.type_anomalie] ?? alerte.type_anomalie}
            </p>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              Detectee {ilYA(alerte.debut)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "#fff" }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Point 2 : details du poteau */}
        <div className="mb-4 flex flex-col gap-1.5 rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <DetailRow label="Poteau" value={alerte.device_id} />
          <DetailRow label="Quartier" value={alerte.quartier ?? "—"} />
          <DetailRow label="Commune" value={alerte.commune ?? "—"} />
          <DetailRow label="Zone" value={alerte.zone ?? "—"} />
        </div>

        {alerte.latitude != null && alerte.longitude != null && (
          <Link
            to="/carte"
            search={{ focus: alerte.device_id } as any}
            className="mb-4 flex items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-semibold"
            style={{ background: "rgba(255,255,255,0.06)", color: "#FBBF24", border: "1px solid rgba(251,191,36,0.3)" }}
          >
            <MapPin className="h-3.5 w-3.5" />
            Voir sur la carte
          </Link>
        )}

        {error && <p className="mb-3 text-xs" style={{ color: "#F87171" }}>{error}</p>}

        {/* Point 3 : choix du statut, plus de champs texte */}
        <p className="mb-2 text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Action du technicien</p>
        <div className="flex flex-col gap-2">
          {statutsDisponibles(alerte.type_anomalie).map((s) => (
            <button
              key={s}
              type="button"
              disabled={submitting}
              onClick={() => handleChoix(s)}
              className="w-full rounded-2xl py-3 text-sm font-semibold transition-transform active:scale-[0.98]"
              style={
                s === "resolue"
                  ? { background: "linear-gradient(90deg, #22C55E, #15803D)", color: "#fff" }
                  : { background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" }
              }
            >
              {STATUT_LABEL[s]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
      <span className="text-xs font-semibold text-white">{value}</span>
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
