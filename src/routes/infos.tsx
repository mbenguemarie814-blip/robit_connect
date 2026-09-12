import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { Download } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/infos")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Historique — ERT Connect" },
      { name: "description", content: "Analyse historique du parc de lampadaires : repartition des etats, tendances et zones a risque." },
    ],
  }),
  component: Historique,
});

type HistoriqueResponse = {
  total_alertes: number;
  repartition: { panne: number; anomalie: number; hors_ligne: number };
  par_jour: { date: string; count: number }[];
  zones_top: { quartier: string; count: number }[];
};

const PERIODES = [
  { value: "jour", label: "Jour" },
  { value: "semaine", label: "Semaine" },
  { value: "mois", label: "Mois" },
];

const MODES = [
  { value: "tous", label: "Toute la journee" },
  { value: "jour", label: "Jour" },
  { value: "nuit", label: "Nuit" },
];

const COULEURS = { panne: "#F87171", anomalie: "#FBBF24", hors_ligne: "#9CA3AF" };
const LABELS = { panne: "Panne", anomalie: "Anomalie", hors_ligne: "Hors ligne" };

async function fetchHistorique(periode: string, mode: string): Promise<HistoriqueResponse> {
  const res = await fetch(`/api/historique?periode=${periode}&mode=${mode}`);
  if (!res.ok) throw new Error("Erreur API historique");
  return res.json();
}

function formatJour(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 1).toUpperCase();
}

function Historique() {
  const [periode, setPeriode] = useState("semaine");
  const [mode, setMode] = useState("tous");

  const { data, isLoading } = useQuery({
    queryKey: ["historique", periode, mode],
    queryFn: () => fetchHistorique(periode, mode),
    refetchInterval: 30000,
  });

  const [telechargement, setTelechargement] = useState(false);

  const telechargerRapport = async () => {
    setTelechargement(true);
    try {
      const res = await fetch(`/api/rapport?periode=${periode}`);
      if (!res.ok) throw new Error("Erreur lors de la generation du rapport");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport-ert-${periode}-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setTelechargement(false);
    }
  };

  const pieData = data
    ? (["panne", "anomalie", "hors_ligne"] as const)
        .map((k) => ({ name: LABELS[k], value: data.repartition[k], color: COULEURS[k] }))
        .filter((d) => d.value > 0)
    : [];

  return (
    <AppShell>
      <div className="flex flex-col gap-4 p-4" style={{ background: "#0A0A0A" }}>
        <header>
          <h1 className="font-display text-2xl font-bold text-white">Historique</h1>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Analyse du parc dans le temps</p>
        </header>

        <div className="flex gap-1.5">
          {PERIODES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriode(p.value)}
              className="flex-1 rounded-full py-2 text-[11px] font-semibold"
              style={
                periode === p.value
                  ? { background: "linear-gradient(90deg, #FDE68A, #F59E0B)", color: "#1a1206" }
                  : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }
              }
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className="flex-1 rounded-full py-1.5 text-[11px] font-medium"
              style={
                mode === m.value
                  ? { background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }
                  : { background: "transparent", color: "rgba(255,255,255,0.4)", border: "1px solid transparent" }
              }
            >
              {m.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={telechargement}
          onClick={telechargerRapport}
          className="flex items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-semibold"
          style={{
            background: telechargement ? "rgba(255,255,255,0.06)" : "rgba(251,191,36,0.12)",
            color: telechargement ? "rgba(255,255,255,0.4)" : "#FBBF24",
            border: "1px solid rgba(251,191,36,0.3)",
          }}
        >
          <Download className="h-3.5 w-3.5" />
          {telechargement ? "Generation du rapport..." : "Telecharger le rapport (PDF)"}
        </button>

        {isLoading && (
          <p className="mt-2 text-center text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Chargement...</p>
        )}

        {data && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Carte label="Alertes sur la periode" value={String(data.total_alertes)} color="#FBBF24" />
              <Carte label="Zones touchees" value={String(data.zones_top.length)} color="#22D3EE" />
            </div>

            <section>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>
                Repartition des alertes
              </p>
              {pieData.length === 0 ? (
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Aucune alerte sur cette periode</p>
              ) : (
                <div className="flex items-center gap-4">
                  <div style={{ width: 100, height: 100 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" innerRadius={28} outerRadius={48} paddingAngle={2}>
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {pieData.map((d) => (
                      <span key={d.name} className="flex items-center gap-1.5 text-[11px]" style={{ color: "rgba(255,255,255,0.7)" }}>
                        <span className="h-2 w-2 rounded-sm" style={{ background: d.color }} />
                        {d.name} · {d.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>
                Alertes par jour
              </p>
              <div style={{ width: "100%", height: 90 }}>
                <ResponsiveContainer>
                  <BarChart data={data.par_jour}>
                    <XAxis dataKey="date" tickFormatter={formatJour} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} labelStyle={{ color: "#fff" }} />
                    <Bar dataKey="count" fill="#FBBF24" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>
                Evolution du nombre d'alertes
              </p>
              <div style={{ width: "100%", height: 70 }}>
                <ResponsiveContainer>
                  <LineChart data={data.par_jour}>
                    <Line type="monotone" dataKey="count" stroke="#4ADE80" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>
                Zones les plus en alerte
              </p>
              <div className="flex flex-col gap-1.5">
                {data.zones_top.length === 0 && (
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Aucune donnee</p>
                )}
                {data.zones_top.map((z, i) => (
                  <div
                    key={z.quartier}
                    className="flex items-center justify-between rounded-xl px-3 py-2"
                    style={
                      i === 0
                        ? { background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)" }
                        : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }
                    }
                  >
                    <span className="text-xs text-white">{z.quartier}</span>
                    <span className="text-[11px] font-semibold" style={{ color: i === 0 ? "#F87171" : "rgba(255,255,255,0.5)" }}>
                      {z.count} alerte{z.count > 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Carte({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl p-3 text-center" style={{ background: "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))", border: "1px solid rgba(255,255,255,0.1)" }}>
      <p className="font-display text-lg font-bold" style={{ color }}>{value}</p>
      <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
    </div>
  );
}
