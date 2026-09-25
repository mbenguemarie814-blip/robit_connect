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
  { value: "coupure", label: "Coupure" },
  { value: "panne", label: "En panne" },
  { value: "anomalie", label: "Anomalie" },
  { value: "intervention", label: "Intervention" },
];

type GroupDef = { value: string; label: string; color: string; glow: string; etats: string[] };

const GROUPES: GroupDef[] = [
  { value: "allume", label: "Allume", color: "#4ADE80", glow: "rgba(74,222,128,0.45)", etats: ["ALLUME"] },
  { value: "eteint_normal", label: "Eteint (normal)", color: "#9CA3AF", glow: "rgba(156,163,175,0.35)", etats: ["JOUR_NORMAL", "ETEINT_VOLONTAIREMENT"] },
  { value: "coupure", label: "Coupure", color: "#FB923C", glow: "rgba(251,146,60,0.45)", etats: ["PANNE_ALIMENTATION", "OFFLINE"] },
  { value: "panne", label: "En panne", color: "#F87171", glow: "rgba(248,113,113,0.45)", etats: ["SOUS_TENSION", "SURTENSION", "LAMPE_POTENTIELLEMENT_GRILLEE", "PANNE_ELECTRIQUE", "CAPTEUR_EN_PANNE"] },
  { value: "anomalie", label: "Anomalie", color: "#FBBF24", glow: "rgba(251,191,36,0.45)", etats: ["SURCONSOMMATION", "ETEINT_NUIT", "ALLUME_DE_JOUR", "DEFAUT_INTERMITTENT", "DEGRADATION"] },
  { value: "intervention", label: "Intervention", color: "#60A5FA", glow: "rgba(96,165,250,0.45)", etats: ["ALLUME_JOUR_MANUEL", "ETEINT_NUIT_MANUEL"] },
];

const ETAT_LABEL: Record<string, string> = {
  ALLUME: "Allume",
  JOUR_NORMAL: "Eteint (normal)",
  ETEINT_VOLONTAIREMENT: "Eteint volontairement",
  ALLUME_JOUR_MANUEL: "Allumee le jour (intervention)",
  ETEINT_NUIT_MANUEL: "Eteinte la nuit (intervention)",
  PANNE_ALIMENTATION: "Panne alimentation",
  SOUS_TENSION: "Sous-tension",
  SURTENSION: "Surtension",
  LAMPE_POTENTIELLEMENT_GRILLEE: "Lampe grillee",
  PANNE_ELECTRIQUE: "Panne electrique",
  CAPTEUR_EN_PANNE: "Capteur en panne",
  SURCONSOMMATION: "Surconsommation",
  ETEINT_NUIT: "Eteinte la nuit",
  ALLUME_DE_JOUR: "Allumee le jour",
  DEFAUT_INTERMITTENT: "Defaut intermittent",
  DEGRADATION: "Degradation",
  OFFLINE: "Hors ligne",
  MASTER_HORS_LIGNE: "Master hors ligne",
};

function groupeFor(etat: string | null): GroupDef | undefined {
  return GROUPES.find((g) => etat && g.etats.includes(etat));
}

function styleFor(etat: string | null) {
  const g = groupeFor(etat);
  if (g) return { color: g.color, glow: g.glow, label: ETAT_LABEL[etat ?? ""] ?? g.label };
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

function PoteauCard({ p }: { p: Poteau }) {
  const s = styleFor(p.dernier_etat);
  return (
    <Link
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
        <span className="block truncate text-sm font-semibold text-white">Lampe {p.device_id}</span>
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
}

function GroupHeader({ g, count }: { g: GroupDef; count: number }) {
  return (
    <div className="mt-3 mb-1 flex items-center gap-2 px-1 first:mt-0">
      <span
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full"
        style={{ background: `${g.color}26` }}
      >
        <span className="h-2 w-2 rounded-full" style={{ background: g.color, boxShadow: `0 0 8px -1px ${g.glow}` }} />
      </span>
      <span className="font-display text-xs font-semibold uppercase tracking-wide" style={{ color: g.color }}>
        {g.label}
      </span>
      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
        {count}
      </span>
    </div>
  );
}

function PoteauxGroupes({ poteaux }: { poteaux: Poteau[] }) {
  return (
    <>
      {GROUPES.map((g) => {
        const items = poteaux.filter((p) => groupeFor(p.dernier_etat)?.value === g.value);
        return (
          <div key={g.value}>
            <GroupHeader g={g} count={items.length} />
            {items.length === 0 ? (
              <div
                className="flex items-center gap-3 rounded-2xl p-3"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}
              >
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <Lightbulb className="h-5 w-5" style={{ color: "rgba(255,255,255,0.15)" }} />
                </span>
                <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Aucun poteau
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {items.map((p) => (
                  <PoteauCard key={p.device_id} p={p} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
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
    refetchInterval: 15000,
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

        {!isLoading && poteaux && categorie === "tous" && <PoteauxGroupes poteaux={poteaux} />}

        {!isLoading && poteaux && categorie !== "tous" && (() => {
          const g = GROUPES.find((grp) => grp.value === categorie);
          if (!g) return null;
          return (
            <div>
              <GroupHeader g={g} count={poteaux.length} />
              {poteaux.length === 0 ? (
                <div
                  className="flex items-center gap-3 rounded-2xl p-3"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}
                >
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  >
                    <Lightbulb className="h-5 w-5" style={{ color: "rgba(255,255,255,0.15)" }} />
                  </span>
                  <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Aucun poteau
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {poteaux.map((p) => (
                    <PoteauCard key={p.device_id} p={p} />
                  ))}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </AppShell>
  );
}
