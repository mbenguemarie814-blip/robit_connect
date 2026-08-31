import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronRight, Lamp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import "leaflet/dist/leaflet.css";

export const Route = createFileRoute("/carte")({
  head: () => ({
    meta: [
      { title: "Carte du réseau — ERT Connect" },
      {
        name: "description",
        content: "Localisation en temps réel des lampadaires connectés de Dakar sur une carte OpenStreetMap.",
      },
      { property: "og:title", content: "Carte du réseau — ERT Connect" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Carte,
});

type Poteau = {
  device_id: string;
  quartier: string | null;
  commune: string | null;
  latitude: number | null;
  longitude: number | null;
  dernier_etat: string | null;
};

const DAKAR_CENTER: [number, number] = [14.6937, -17.4441];

const ETAT_STYLE: Record<string, { color: string; dark: string; label: string }> = {
  ALLUME: { color: "#4ADE80", dark: "#16A34A", label: "Allume" },
  JOUR_NORMAL: { color: "#9CA3AF", dark: "#4B5563", label: "Eteint normal" },
  PANNE_ALIMENTATION: { color: "#F87171", dark: "#B91C1C", label: "Panne" },
  SOUS_TENSION: { color: "#F87171", dark: "#B91C1C", label: "Panne" },
  SURTENSION: { color: "#F87171", dark: "#B91C1C", label: "Panne" },
  LAMPE_POTENTIELLEMENT_GRILLEE: { color: "#F87171", dark: "#B91C1C", label: "Panne" },
  SURCONSOMMATION: { color: "#FBBF24", dark: "#B45309", label: "Anomalie" },
  ETEINT_NUIT: { color: "#FBBF24", dark: "#B45309", label: "Anomalie" },
  ALLUME_DE_JOUR: { color: "#FBBF24", dark: "#B45309", label: "Anomalie" },
  DEFAUT_INTERMITTENT: { color: "#FBBF24", dark: "#B45309", label: "Anomalie" },
  DEGRADATION: { color: "#FBBF24", dark: "#B45309", label: "Anomalie" },
  OFFLINE: { color: "#6B7280", dark: "#374151", label: "Hors ligne" },
};

function styleFor(etat: string | null) {
  if (etat && ETAT_STYLE[etat]) return ETAT_STYLE[etat];
  return { color: "#6B7280", dark: "#374151", label: "Inconnu" };
}

async function fetchPoteaux(): Promise<Poteau[]> {
  const res = await fetch("/api/poteaux");
  if (!res.ok) throw new Error("Erreur API poteaux");
  return res.json();
}

function Carte() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data: poteaux } = useQuery({
    queryKey: ["poteaux-carte"],
    queryFn: fetchPoteaux,
    refetchInterval: 30000,
  });

  const localises = (poteaux ?? []).filter((p) => p.latitude != null && p.longitude != null);

  return (
    <AppShell
      header={
        <div className="p-4 pb-2" style={{ background: "#0A0A0A" }}>
          <h1 className="font-display text-xl font-bold text-white">Carte du réseau</h1>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            {localises.length} lampe{localises.length > 1 ? "s" : ""} geolocalisee{localises.length > 1 ? "s" : ""} · Dakar
          </p>
        </div>
      }
    >
      <div className="relative" style={{ background: "#0A0A0A" }}>
        <div className="relative h-80 w-full overflow-hidden">
          {mounted && <MapClient poteaux={localises} />}

          <div
            className="pointer-events-none absolute bottom-2 left-2 right-2 flex flex-wrap gap-x-3.5 gap-y-1.5 rounded-2xl p-2.5"
            style={{ background: "rgba(10,10,10,0.85)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <Legende color="#4ADE80" label="Allume" />
            <Legende color="#9CA3AF" label="Eteint normal" />
            <Legende color="#F87171" label="Panne" />
            <Legende color="#FBBF24" label="Anomalie" />
            <Legende color="#6B7280" label="Hors ligne" />
          </div>
        </div>

        <div className="flex flex-col gap-2 p-4">
          {localises.length === 0 && (
            <p className="mt-2 text-center text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              Aucune lampe geolocalisee pour le moment
            </p>
          )}
          {localises.map((p) => (
            <PoteauRow key={p.device_id} p={p} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function Legende({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[10px]" style={{ color: "rgba(255,255,255,0.7)" }}>
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function PoteauRow({ p }: { p: Poteau }) {
  const navigate = useNavigate();
  const s = styleFor(p.dernier_etat);
  return (
    <button
      type="button"
      onClick={() => navigate({ to: "/lampadaire/$deviceId", params: { deviceId: p.device_id } })}
      className="flex items-center gap-3 rounded-2xl p-3 text-left transition-transform active:scale-[0.98]"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
        style={{ background: `radial-gradient(circle at 35% 30%, ${s.color}, ${s.dark} 70%)` }}
      >
        <Lamp className="h-4 w-4" style={{ color: s.dark }} />
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
    </button>
  );
}

function MapClient({ poteaux }: { poteaux: Poteau[] }) {
  const [Leaflet, setLeaflet] = useState<null | {
    MapContainer: any; TileLayer: any; Marker: any; L: any;
  }>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([import("react-leaflet"), import("leaflet")]).then(([rl, leaflet]) => {
      if (!cancelled) {
        setLeaflet({ MapContainer: rl.MapContainer, TileLayer: rl.TileLayer, Marker: rl.Marker, L: leaflet.default });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!Leaflet) {
    return (
      <div className="flex h-full items-center justify-center" style={{ background: "#EAE6DD" }}>
        <p className="text-xs" style={{ color: "#8a8577" }}>Chargement de la carte...</p>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, L } = Leaflet;
  const navigate = (window as any).__ertNavigate;

  return (
    <MapContainer center={DAKAR_CENTER} zoom={12} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {poteaux.map((p) => {
        const s = styleFor(p.dernier_etat);
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:28px;height:28px;border-radius:9999px 9999px 9999px 2px;transform:rotate(45deg);background:radial-gradient(circle at 35% 30%, ${s.color}, ${s.dark} 70%);box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        });
        return (
          <Marker
            key={p.device_id}
            position={[p.latitude as number, p.longitude as number]}
            icon={icon}
            eventHandlers={{
              click: () => {
                window.location.href = `/lampadaire/${p.device_id}`;
              },
            }}
          />
        );
      })}
    </MapContainer>
  );
}
