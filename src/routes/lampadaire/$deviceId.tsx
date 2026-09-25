import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bolt, Gauge, Zap, Activity, CheckCircle2, AlertTriangle, MapPin, Radio, WifiOff } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/lampadaire/$deviceId")({
  head: () => ({
    meta: [{ title: "Detail lampadaire — ERT Connect" }],
  }),
  component: LampadaireDetail,
});

type Alerte = {
  id: number;
  type_anomalie: string;
  severite: string | null;
  debut: string;
};

type DetailResponse = {
  poteau: {
    device_id: string;
    quartier: string | null;
    commune: string | null;
    ville: string | null;
    zone: string | null;
    latitude: number | null;
    longitude: number | null;
    type_lampe: string | null;
    puissance_w: number | null;
    dernier_etat: string | null;
    derniere_maj: string | null;
  };
  alerte_active: Alerte | null;
  derniere_mesure: {
    time: string;
    voltage: number | null;
    current: number | null;
    power: number | null;
    frequency: number | null;
  } | null;
};

const ETAT_STYLE: Record<string, { color: string; dark: string; label: string; sous: string }> = {
  ALLUME: { color: "#4ADE80", dark: "#16A34A", label: "Allume", sous: "Fonctionnement normal" },
  JOUR_NORMAL: { color: "#9CA3AF", dark: "#4B5563", label: "Eteint (normal)", sous: "Comportement attendu de jour" },
  PANNE_ALIMENTATION: { color: "#F87171", dark: "#B91C1C", label: "Panne d'alimentation", sous: "Coupure secteur detectee" },
  SOUS_TENSION: { color: "#F87171", dark: "#B91C1C", label: "Sous-tension", sous: "Tension anormalement basse" },
  SURTENSION: { color: "#F87171", dark: "#B91C1C", label: "Surtension", sous: "Tension anormalement haute" },
  LAMPE_POTENTIELLEMENT_GRILLEE: { color: "#F87171", dark: "#B91C1C", label: "Lampe grillee", sous: "Intervention necessaire" },
  SURCONSOMMATION: { color: "#FBBF24", dark: "#B45309", label: "Surconsommation", sous: "Courant ou puissance excessif" },
  ETEINT_NUIT: { color: "#FBBF24", dark: "#B45309", label: "Eteinte la nuit", sous: "Anomalie a confirmer" },
  ALLUME_DE_JOUR: { color: "#FBBF24", dark: "#B45309", label: "Allumee le jour", sous: "Gaspillage energetique" },
  DEFAUT_INTERMITTENT: { color: "#FBBF24", dark: "#B45309", label: "Defaut intermittent", sous: "Instabilite detectee" },
  DEGRADATION: { color: "#FBBF24", dark: "#B45309", label: "Degradation", sous: "Derive progressive" },
  ETEINT_VOLONTAIREMENT: { color: "#9CA3AF", dark: "#4B5563", label: "Eteint volontairement", sous: "Commande a distance" },
  PANNE_ELECTRIQUE: { color: "#F87171", dark: "#B91C1C", label: "Panne electrique", sous: "Relais actif mais pas de courant" },
  CAPTEUR_EN_PANNE: { color: "#F87171", dark: "#B91C1C", label: "Capteur en panne", sous: "Le module PZEM ne repond plus" },
  OFFLINE: { color: "#9CA3AF", dark: "#4B5563", label: "Hors ligne", sous: "Aucune donnee recente" },
  MASTER_HORS_LIGNE: { color: "#60A5FA", dark: "#1D4ED8", label: "Master hors ligne", sous: "La passerelle ne repond plus - etat du poteau inconnu" },
  ALLUME_JOUR_MANUEL: { color: "#60A5FA", dark: "#1D4ED8", label: "Intervention en cours", sous: "Allumee manuellement en journee" },
  ETEINT_NUIT_MANUEL: { color: "#60A5FA", dark: "#1D4ED8", label: "Intervention en cours", sous: "Eteinte manuellement la nuit" },
};

function styleFor(etat: string | null) {
  if (etat && ETAT_STYLE[etat]) return ETAT_STYLE[etat];
  return { color: "#6B7280", dark: "#374151", label: "Inconnu", sous: "Statut indisponible" };
}

async function fetchDetail(deviceId: string): Promise<DetailResponse> {
  const res = await fetch(`/api/poteaux/${deviceId}/detail`);
  if (!res.ok) throw new Error("Erreur API detail");
  return res.json();
}

function ilYA(dateIso: string): string {
  const diffMs = Date.now() - new Date(dateIso).getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60000));
  if (minutes < 1) return "a l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.round(minutes / 60);
  return `il y a ${heures} h`;
}

const POTEAU_OFFLINE_MS = 30000; // coherent avec T_OFFLINE_SECONDS cote backend (30s)

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

function EtatLampeDepuis({ label, color, debut }: { label: string; color: string; debut: string | null }) {
  const [maintenant, setMaintenant] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!debut) {
    return (
      <div
        className="mb-4 flex items-center gap-2 rounded-2xl p-3"
        style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)" }}
      >
        <Radio className="h-4 w-4" style={{ color: "#4ADE80" }} />
        <span className="text-xs font-bold" style={{ color: "#4ADE80" }}>Fonctionnement normal</span>
      </div>
    );
  }

  const ecoulementMs = maintenant - new Date(debut).getTime();

  return (
    <div
      className="mb-4 flex flex-col gap-2 rounded-2xl p-3"
      style={{ background: `${color}0F`, border: `1px solid ${color}40` }}
    >
      <div className="flex items-center gap-2">
        <WifiOff className="h-4 w-4" style={{ color }} />
        <span className="text-xs font-bold" style={{ color }}>Lampe {label}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>Depuis</span>
        <span className="text-[11px] font-semibold" style={{ color }}>
          {formatDureeExacte(ecoulementMs)}
        </span>
      </div>
    </div>
  );
}

function LampadaireDetail() {
  const { deviceId } = Route.useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["lampadaire-detail", deviceId],
    queryFn: () => fetchDetail(deviceId),
    refetchInterval: 5000,
  });

  const queryClient = useQueryClient();
  const [envoiCommande, setEnvoiCommande] = useState<string | null>(null);
  const [erreurCommande, setErreurCommande] = useState<string | null>(null);

  const envoyerCommande = async (relais: "ON" | "OFF") => {
    setEnvoiCommande(relais);
    setErreurCommande(null);
    try {
      const res = await fetch(`/api/poteaux/${deviceId}/commande`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relais }),
      });
      if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["lampadaire-detail", deviceId] });
      }, 3000);
    } catch (err: any) {
      setErreurCommande(err?.message ?? "Echec de l'envoi de la commande");
    } finally {
      setEnvoiCommande(null);
    }
  };
  const [maj, setMaj] = useState(false);
  const [erreurMaj, setErreurMaj] = useState<string | null>(null);

  const [formulaireManuel, setFormulaireManuel] = useState(false);
  const [latManuel, setLatManuel] = useState("");
  const [lngManuel, setLngManuel] = useState("");

  const mettreAJourPosition = async (lat: number, lng: number) => {
    if (!data) return;
    setMaj(true);
    setErreurMaj(null);
    try {
      const res = await fetch(`/api/poteaux/${deviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: deviceId,
          latitude: lat,
          longitude: lng,
          quartier: data.poteau.quartier,
          commune: data.poteau.commune,
          zone: data.poteau.zone,
          type_lampe: data.poteau.type_lampe,
          puissance_w: data.poteau.puissance_w,
        }),
      });
      if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
      queryClient.invalidateQueries({ queryKey: ["lampadaire-detail", deviceId] });
      setFormulaireManuel(false);
    } catch (err: any) {
      setErreurMaj(err?.message ?? "Echec de la mise a jour");
    } finally {
      setMaj(false);
    }
  };

  const reprendrePosition = () => {
    if (!navigator.geolocation) return;
    setMaj(true);
    setErreurMaj(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => mettreAJourPosition(pos.coords.latitude, pos.coords.longitude),
      () => {
        setErreurMaj("Position GPS indisponible. Verifie l'autorisation de localisation.");
        setMaj(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const validerPositionManuelle = () => {
    const lat = parseFloat(latManuel);
    const lng = parseFloat(lngManuel);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setErreurMaj("Latitude/longitude invalides.");
      return;
    }
    mettreAJourPosition(lat, lng);
  };

  const [formulaireInfos, setFormulaireInfos] = useState(false);
  const [quartierEdit, setQuartierEdit] = useState("");
  const [communeEdit, setCommuneEdit] = useState("");
  const [villeEdit, setVilleEdit] = useState("");
  const [zoneEdit, setZoneEdit] = useState("");
  const [typeLampeEdit, setTypeLampeEdit] = useState("");
  const [puissanceEdit, setPuissanceEdit] = useState("");
  const [majInfos, setMajInfos] = useState(false);
  const [erreurInfos, setErreurInfos] = useState<string | null>(null);

  const ouvrirFormulaireInfos = () => {
    if (!data) return;
    setQuartierEdit(data.poteau.quartier ?? "");
    setCommuneEdit(data.poteau.commune ?? "");
    setVilleEdit(data.poteau.ville ?? "");
    setZoneEdit(data.poteau.zone ?? "");
    setTypeLampeEdit(data.poteau.type_lampe ?? "");
    setPuissanceEdit(data.poteau.puissance_w != null ? String(data.poteau.puissance_w) : "");
    setErreurInfos(null);
    setFormulaireInfos(true);
  };

  const validerInfos = async () => {
    if (!data) return;
    const puissance = parseInt(puissanceEdit, 10);
    if (puissanceEdit && Number.isNaN(puissance)) {
      setErreurInfos("Puissance invalide.");
      return;
    }

    setMajInfos(true);
    setErreurInfos(null);
    try {
      const res = await fetch(`/api/poteaux/${deviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: deviceId,
          latitude: data.poteau.latitude,
          longitude: data.poteau.longitude,
          quartier: quartierEdit || null,
          commune: communeEdit || null,
          ville: villeEdit || null,
          zone: zoneEdit || null,
          type_lampe: typeLampeEdit || null,
          puissance_w: puissanceEdit ? puissance : null,
        }),
      });
      if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
      queryClient.invalidateQueries({ queryKey: ["lampadaire-detail", deviceId] });
      setFormulaireInfos(false);
    } catch (err: any) {
      setErreurInfos(err?.message ?? "Echec de la mise a jour");
    } finally {
      setMajInfos(false);
    }
  };

  const s = styleFor(data?.poteau.dernier_etat ?? null);

  return (
    <AppShell
      header={
        <div className="flex items-center gap-3 p-4 pb-2" style={{ background: "#0A0A0A" }}>
          <button
            type="button"
            onClick={() => navigate({ to: "/poteaux" })}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
            style={{ background: "rgba(255,255,255,0.06)", color: "#fff" }}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-bold text-white">{deviceId}</p>
            <p className="truncate text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              {data?.poteau.quartier ?? "..."}{data?.poteau.commune ? `, ${data.poteau.commune}` : ""}
            </p>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4 p-4" style={{ background: "#0A0A0A" }}>
        {isLoading && (
          <p className="mt-10 text-center text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            Chargement...
          </p>
        )}

        {data && (
          <>
            <div className="flex flex-col items-center py-4">
              <div
                className="grid h-28 w-28 place-items-center rounded-full"
                style={{
                  background: `radial-gradient(circle at 35% 30%, ${s.color}, ${s.dark} 70%)`,
                  boxShadow: `0 0 40px -4px ${s.color}66`,
                }}
              >
                <Zap className="h-12 w-12" style={{ color: s.dark }} />
              </div>
              <p className="mt-3 font-display text-lg font-bold" style={{ color: s.color }}>
                {s.label}
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                {s.sous}
              </p>
            </div>

            <EtatLampeDepuis label={s.label.toLowerCase()} color={s.color} debut={data.alerte_active?.debut ?? null} />

            {data.poteau.dernier_etat === "OFFLINE" ? (
              <div
                className="rounded-2xl p-4 text-center"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)" }}
              >
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Aucune mesure — le module ne transmet plus de donnees
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <Mesure icon={<Bolt className="h-4 w-4" />} label="Tension" value={data.derniere_mesure?.voltage} unit="V" />
                <Mesure icon={<Activity className="h-4 w-4" />} label="Courant" value={data.derniere_mesure?.current} unit="A" decimals={2} />
                <Mesure icon={<Gauge className="h-4 w-4" />} label="Puissance" value={data.derniere_mesure?.power} unit="W" />
                <Mesure icon={<Activity className="h-4 w-4" />} label="Frequence" value={data.derniere_mesure?.frequency} unit="Hz" />
              </div>
            )}

            <div
              className="rounded-2xl p-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <InfoRow label="Puissance nominale" value={data.poteau.puissance_w ? `${data.poteau.puissance_w} W` : "—"} />
              <InfoRow label="Type de lampe" value={data.poteau.type_lampe ?? "—"} />
              <InfoRow label="Zone" value={data.poteau.zone ?? "—"} />
              <InfoRow
                label="Localisation"
                value={
                  data.poteau.latitude != null && data.poteau.longitude != null
                    ? `${data.poteau.latitude.toFixed(5)}, ${data.poteau.longitude.toFixed(5)}`
                    : "—"
                }
              />
              <div className="pt-2">
                <div className="mb-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={envoiCommande !== null}
                    onClick={() => envoyerCommande("ON")}
                    className="rounded-xl py-2.5 text-xs font-semibold"
                    style={{
                      background: envoiCommande === "ON" ? "rgba(255,255,255,0.06)" : "linear-gradient(90deg, #22C55E, #15803D)",
                      color: envoiCommande === "ON" ? "rgba(255,255,255,0.4)" : "#fff",
                    }}
                  >
                    {envoiCommande === "ON" ? "Envoi..." : "Allumer"}
                  </button>
                  <button
                    type="button"
                    disabled={envoiCommande !== null}
                    onClick={() => envoyerCommande("OFF")}
                    className="rounded-xl py-2.5 text-xs font-semibold"
                    style={{
                      background: envoiCommande === "OFF" ? "rgba(255,255,255,0.06)" : "rgba(239,68,68,0.15)",
                      color: envoiCommande === "OFF" ? "rgba(255,255,255,0.4)" : "#F87171",
                      border: "1px solid rgba(239,68,68,0.3)",
                    }}
                  >
                    {envoiCommande === "OFF" ? "Envoi..." : "Eteindre"}
                  </button>
                </div>
                {erreurCommande && (
                  <p className="mb-2 text-[11px]" style={{ color: "#F87171" }}>{erreurCommande}</p>
                )}

                {data.poteau.latitude != null && data.poteau.longitude != null && (
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${data.poteau.latitude},${data.poteau.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold"
                    style={{ background: "rgba(251,191,36,0.12)", color: "#FBBF24", border: "1px solid rgba(251,191,36,0.3)" }}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    Itineraire
                  </a>
                )}
                {erreurMaj && (
                  <p className="mt-1.5 text-[11px]" style={{ color: "#F87171" }}>{erreurMaj}</p>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setFormulaireManuel((v) => !v);
                    if (data?.poteau.latitude != null) setLatManuel(String(data.poteau.latitude));
                    if (data?.poteau.longitude != null) setLngManuel(String(data.poteau.longitude));
                  }}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  Saisir la position manuellement
                </button>

                {formulaireManuel && (
                  <div className="mt-2 flex flex-col gap-2 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>Latitude</span>
                      <input
                        value={latManuel}
                        onChange={(e) => setLatManuel(e.target.value)}
                        placeholder="Ex: 14.6937"
                        className="rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>Longitude</span>
                      <input
                        value={lngManuel}
                        onChange={(e) => setLngManuel(e.target.value)}
                        placeholder="Ex: -17.4441"
                        className="rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                      />
                    </label>
                    <button
                      type="button"
                      disabled={maj}
                      onClick={validerPositionManuelle}
                      className="mt-1 rounded-lg py-2 text-xs font-semibold"
                      style={{
                        background: maj ? "rgba(255,255,255,0.06)" : "linear-gradient(90deg, #22C55E, #15803D)",
                        color: maj ? "rgba(255,255,255,0.4)" : "#fff",
                      }}
                    >
                      {maj ? "Enregistrement..." : "Valider la position"}
                    </button>
                  </div>
                )}
              </div>
              <InfoRow
                label="Derniere mesure"
                value={data.derniere_mesure ? ilYA(data.derniere_mesure.time) : "Aucune donnee"}
                last
              />

              <button
                type="button"
                onClick={ouvrirFormulaireInfos}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold"
                style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                Modifier les informations
              </button>

              {formulaireInfos && (
                <div className="mt-2 flex flex-col gap-2 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>Quartier</span>
                    <input
                      value={quartierEdit}
                      onChange={(e) => setQuartierEdit(e.target.value)}
                      className="rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>Commune</span>
                    <input
                      value={communeEdit}
                      onChange={(e) => setCommuneEdit(e.target.value)}
                      className="rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>Ville</span>
                    <input
                      value={villeEdit}
                      onChange={(e) => setVilleEdit(e.target.value)}
                      className="rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>Zone</span>
                    <input
                      value={zoneEdit}
                      onChange={(e) => setZoneEdit(e.target.value)}
                      className="rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>Type de lampe</span>
                    <input
                      value={typeLampeEdit}
                      onChange={(e) => setTypeLampeEdit(e.target.value)}
                      className="rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>Puissance (W)</span>
                    <input
                      value={puissanceEdit}
                      onChange={(e) => setPuissanceEdit(e.target.value)}
                      type="number"
                      className="rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                    />
                  </label>

                  {erreurInfos && (
                    <p className="text-[11px]" style={{ color: "#F87171" }}>{erreurInfos}</p>
                  )}

                  <button
                    type="button"
                    disabled={majInfos}
                    onClick={validerInfos}
                    className="mt-1 rounded-lg py-2 text-xs font-semibold"
                    style={{
                      background: majInfos ? "rgba(255,255,255,0.06)" : "linear-gradient(90deg, #22C55E, #15803D)",
                      color: majInfos ? "rgba(255,255,255,0.4)" : "#fff",
                    }}
                  >
                    {majInfos ? "Enregistrement..." : "Valider les informations"}
                  </button>
                </div>
              )}
            </div>

            {data.alerte_active ? (
              <Link
                to="/maintenance"
                className="flex items-center gap-2.5 rounded-2xl p-3"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}
              >
                <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "#F87171" }} />
                <span className="text-xs font-semibold" style={{ color: "#F87171" }}>
                  Alerte active : {data.alerte_active.severite ?? data.alerte_active.type_anomalie}
                </span>
              </Link>
            ) : (
              <div
                className="flex items-center gap-2.5 rounded-2xl p-3"
                style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)" }}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#4ADE80" }} />
                <span className="text-xs font-semibold" style={{ color: "#4ADE80" }}>
                  Aucune alerte active
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function Mesure({
  icon, label, value, unit, decimals = 1,
}: { icon: React.ReactNode; label: string; value: number | null | undefined; unit: string; decimals?: number }) {
  return (
    <div
      className="rounded-2xl p-3"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>
        {icon} {label}
      </span>
      <p className="mt-1 font-display text-lg font-bold text-white">
        {value != null ? value.toFixed(decimals) : "—"} <span className="text-[11px] font-normal" style={{ color: "rgba(255,255,255,0.4)" }}>{unit}</span>
      </p>
    </div>
  );
}

function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between py-1.5"
      style={!last ? { borderBottom: "1px solid rgba(255,255,255,0.08)" } : undefined}
    >
      <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</span>
      <span className="text-xs font-semibold text-white">{value}</span>
    </div>
  );
}
