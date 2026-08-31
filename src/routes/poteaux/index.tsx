import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ChevronRight, Lightbulb } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/poteaux/")({
  head: () => ({
    meta: [
      { title: "Poteaux — ERT Connect" },
      { name: "description", content: "Liste des lampadaires supervisés, filtrable par statut." },
    ],
  }),
  component: PoteauxListe,
});

type Poteau = {
  device_id: string;
  quartier: string | null;
  commune: string | null;
  zone: string | null;
  dernier_etat: string | null;
  derniere_maj: string | null;
};

const CATEGORIES = [
  { value: "tous", label: "Tous les etats" },
  { value: "allume", label: "Allume" },
  { value: "eteint_normal", label: "Eteint (normal)" },
  { value: "panne", label: "En panne" },
  { value: "anomalie", label: "Anomalie" },
  { value: "hors_ligne", label: "Hors ligne" },
];

const ETAT_STYLE: Record<string, { color: string; glow: string; label: string }> = {
  ALLUME: { color: "#4ADE80", glow: "rgba(74,222,128,0.45)", label: "Allume" },
  JOUR_NORMAL: { color: "#9CA3AF", glow: "rgba(156,163,175,0.35)", label: "Eteint (normal)" },
  PANNE_ALIMENTATION: { color: "#F87171", glow: "rgba(248,113,113,0.45)", label: "Panne alimentation" },
  SOUS_TENSION: { color: "#F87171", glow: "rgba(248,113,113,0.45)", label: "Sous-tension" },
  SURTENSION: { color: "#F87171", glow: "rgba(248,113,113,0.45)", label: "Surtension" },
  LAMPE_POTENTIELLEMENT_GRILLEE: { color: "#F87171", glow: "rgba(248,113,113,0.45)", label: "Lampe grillee" },
  SURCONSOMMATION: { color: "#FBBF24", glow: "rgba(251,191,36,0.45)", label: "Surconsommation" },
  ETEINT_NUIT: { color: "#FBBF24", glow: "rgba(251,191,36,0.45)", label: "Eteinte la nuit" },
  ALLUME_DE_JOUR: { color: "#FBBF24", glow: "rgba(251,191,36,0.45)", label: "Allumee le jour" },
  DEFAUT_INTERMITTENT: { color: "#FBBF24", glow: "rgba(251,191,36,0.45)", label: "Defaut intermittent" },
  DEGRADATION: { color: "#FBBF24", glow: "rgba(251,191,36,0.45)", label: "Degradation" },
  OFFLINE: { color: "#6B7280", glow: "rgba(107,114,128,0.4)", label: "Hors ligne" },
};

function styleFor(etat: string | null) {
  if (etat && ETAT_STYLE[etat]) return ETAT_STYLE[etat];
  return { color: "#6B7280", glow: "rgba(107,114,128,0.3)", label: "Inconnu" };
}

async function fetchPoteaux(categorie: string): Promise<Poteau[]> {
  const url = categorie === "tous" ? "/api/poteaux" : `/api/poteaux?categorie=${categorie}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erreur API poteaux");
  return res.json();
}

function getInitialCategorie(): string {
  if (typeof window === "undefined") return "tous";
  const params = new URLSearchParams(window.location.search);
  const c = params.get("categorie");
  return c && CATEGORIES.some((cat) => cat.value === c) ? c : "tous";
}

function PoteauxListe() {
  const [categorie, setCategorie] = useState<string>(() => getInitialCategorie());

  useEffect(() => {
    const url = categorie === "tous" ? "/poteaux" : `/poteaux?categorie=${categorie}`;
    window.history.replaceState(null, "", url);
  }, [categorie]);

  const { data: poteaux, isLoading } = useQuery({
    queryKey: ["poteaux", categorie],
    queryFn: () => fetchPoteaux(categorie),
    refetchInterval: 30000,
  });

  return (
    <AppShell
      header={
        <div className="flex flex-col gap-3 p-4 pb-3" style={{ background: "#0A0A0A" }}>
          <div>
            <h1 className="font-display text-xl font-bold text-white">Poteaux</h1>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              {poteaux ? `${poteaux.length} lampadaire${poteaux.length > 1 ? "s" : ""}` : "Chargement..."}
            </p>
          </div>
          <select
            value={categorie}
            onChange={(e) => setCategorie(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm font-medium outline-none"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#fff",
            }}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value} style={{ background: "#1a1a1a" }}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      }
    >
      <div className="flex flex-col gap-2 p-4" style={{ background: "#0A0A0A" }}>
        {isLoading && (
          <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            Chargement des poteaux...
          </p>
        )}

        {!isLoading && poteaux && poteaux.length === 0 && (
          <p className="mt-6 text-center text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            Aucun poteau dans cette categorie
          </p>
        )}

        {poteaux?.map((p) => {
          const s = styleFor(p.dernier_etat);
          return (
            <Link
              key={p.device_id}
              to="/lampadaire/$deviceId"
              params={{ deviceId: p.device_id }}
              className="flex items-center gap-3 rounded-2xl p-3 transition-transform active:scale-[0.98]"
              style={{
                background: "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
                style={{
                  background: `radial-gradient(circle at 35% 30%, ${s.color}, ${s.color}99 70%)`,
                  boxShadow: `0 0 16px -2px ${s.glow}`,
                }}
              >
                <Lightbulb className="h-5 w-5" style={{ color: "#0A0A0A" }} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-white">{p.device_id}</span>
                <span className="block truncate text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {p.quartier ?? "Zone inconnue"}
                </span>
              </span>
              <span className="shrink-0 text-[11px] font-semibold" style={{ color: s.color }}>
                {s.label}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
