import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, MapPin, QrCode } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/scanner")({
  head: () => ({
    meta: [
      { title: "Scanner un module — ERT Connect" },
      {
        name: "description",
        content: "Scannez le QR code d'un module lampadaire pour l'installer ou consulter son état.",
      },
      { property: "og:title", content: "Scanner un module — ERT Connect" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Scanner,
});

const fieldStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#fff",
};

const ALLOWED_SCANNER_URL = "https://robit-connect.vercel.app/scanner";

function extractDeviceId(raw: string): string | null {
  try {
    const url = new URL(raw);
    const base = new URL(ALLOWED_SCANNER_URL);
    if (url.origin !== base.origin || url.pathname !== base.pathname) return null;
    const id = url.searchParams.get("id");
    return id && id.trim() ? id.trim() : null;
  } catch {
    return null;
  }
}

function Scanner() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<import("qr-scanner").default | null>(null);

  const getIdFromUrl = () => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    return id && id.trim() ? id.trim() : null;
  };

  const [deviceId, setDeviceId] = useState<string | null>(() => getIdFromUrl());
  const [installedAt, setInstalledAt] = useState<string>(() => (getIdFromUrl() ? new Date().toISOString() : ""));
  const [gps, setGps] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string>("Initialisation...");

  const [poleNumber, setPoleNumber] = useState("");
  const [district, setDistrict] = useState("");
  const [commune, setCommune] = useState("");
  const [city, setCity] = useState("");
  const [zone, setZone] = useState("");
  const [lampType, setLampType] = useState("LED");
  const [power, setPower] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Camera + scan QR
  useEffect(() => {
    if (deviceId) return; // scan deja effectue, pas besoin de relancer la camera
    let cancelled = false;

    (async () => {
      const { default: QrScannerLib } = await import("qr-scanner");
      const workerUrl = new URL("qr-scanner/qr-scanner-worker.min.js", import.meta.url);
      QrScannerLib.WORKER_PATH = workerUrl.toString();

      if (cancelled || !videoRef.current) return;

      const scanner = new QrScannerLib(
        videoRef.current,
        (res) => {
          const extractedId = extractDeviceId(res.data);
          if (!extractedId) {
            setDebug(`⛔ Rejeté — contenu scanné : ${res.data}`);
            setError(`Accès non autorisé. Contenu détecté : ${res.data}`);
            return;
          }
          setError(null);
          setDeviceId(extractedId);
          setInstalledAt(new Date().toISOString());
          setDebug("Code détecté ✓");
          scanner.stop();
        },
        {
          preferredCamera: "environment",
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 5,
        },
      );

      scannerRef.current = scanner;
      setDebug("Démarrage de la caméra...");

      try {
        await scanner.start();
        if (!cancelled) setDebug("Caméra active — recherche de QR code...");
      } catch (err: any) {
        setError(
          err?.message?.includes("Permission")
            ? "Accès à la caméra refusé. Autorise la caméra pour scanner un module."
            : `Erreur caméra : ${err?.message ?? "inconnue"}`,
        );
        setDebug("Erreur au démarrage");
      }
    })();

    return () => {
      cancelled = true;
      scannerRef.current?.stop();
      scannerRef.current?.destroy();
    };
  }, [deviceId]);

  // GPS - capture automatique une fois le QR scanne
  useEffect(() => {
    if (!deviceId || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        setGpsError(
          err.code === err.PERMISSION_DENIED
            ? "Position GPS refusée. Autorise la géolocalisation."
            : "Impossible d'obtenir la position GPS.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [deviceId]);

  const handleRescan = () => {
    setDeviceId(null);
    setGps(null);
    setGpsError(null);
    setSubmitted(false);
    setSubmitError(null);
    setPoleNumber("");
    setDistrict("");
    setCommune("");
    setCity("");
    setZone("");
    setLampType("LED");
    setPower("");
    setDebug("Caméra active — recherche de QR code...");
  };

  const handleSubmit = async () => {
    if (!deviceId || !gps) return;
    setSubmitting(true);
    setSubmitError(null);

    const now = new Date(installedAt);

    const payload = {
      device_id: deviceId,
      pole_number: poleNumber,
      latitude: gps.lat,
      longitude: gps.lng,
      gps_accuracy_m: Math.round(gps.accuracy),
      district,
      commune,
      city,
      zone,
      lamp_type: lampType,
      power: Number(power),
      install_date: now.toISOString().split("T")[0],
      install_time: now.toTimeString().split(" ")[0],
    };

    try {
      const res = await fetch("/nodered/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err?.message ?? "Échec de l'enregistrement. Vérifie ta connexion.");
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = poleNumber && district && commune && city && zone && lampType && power;

  return (
    <AppShell>
      <div className="flex flex-col gap-5 p-6" style={{ background: "#0A0A0A" }}>
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/accueil" })}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
            style={{ background: "rgba(255,255,255,0.06)", color: "#fff" }}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              {deviceId ? "Installation du module" : "Scanner un module"}
            </h1>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              {deviceId ? `Device ID : ${deviceId}` : "Cadrez le QR code du lampadaire"}
            </p>
          </div>
        </header>

        {!deviceId && (
          <>
            <div
              className="relative flex h-96 items-center justify-center overflow-hidden rounded-3xl"
              style={{
                background: "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <video ref={videoRef} className="h-full w-full object-cover" muted playsInline autoPlay />
              {error && (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm" style={{ color: "rgba(255,255,255,0.6)", background: "rgba(0,0,0,0.7)" }}>
                  {error}
                </div>
              )}
            </div>
            <p className="rounded-xl px-3 py-2 text-center text-sm font-semibold" style={{ background: "rgba(251,191,36,0.15)", color: "#FBBF24", border: "1px solid rgba(251,191,36,0.4)" }}>{debug}</p>
          </>
        )}

        {deviceId && !submitted && (
          <div className="flex flex-col gap-4">

            {/* Champs automatiques */}
            <div
              className="flex flex-col gap-3 rounded-2xl p-4"
              style={{
                background: "linear-gradient(160deg, rgba(74,222,128,0.08), rgba(74,222,128,0.01))",
                border: "1px solid rgba(74,222,128,0.25)",
              }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" style={{ color: "#4ADE80" }} />
                <p className="text-xs font-semibold" style={{ color: "#4ADE80" }}>Détecté automatiquement</p>
              </div>
              <Row label="Device ID" value={deviceId} />
              <Row label="Date / Heure" value={new Date(installedAt).toLocaleString("fr-FR")} />
              <Row
                label="Position GPS"
                value={gps ? `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)} (±${Math.round(gps.accuracy)}m)` : gpsError ?? "Recherche en cours..."}
                icon={<MapPin className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />}
              />
            </div>

            {/* Champs manuels */}
            <div
              className="flex flex-col gap-3 rounded-2xl p-4"
              style={{
                background: "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>À compléter</p>
              <Field label="Numéro du poteau" value={poleNumber} onChange={setPoleNumber} placeholder="Ex: DK-2548" />
              <Field label="Quartier" value={district} onChange={setDistrict} placeholder="Ex: Plateau" />
              <Field label="Commune" value={commune} onChange={setCommune} placeholder="Ex: Dakar-Plateau" />
              <Field label="Ville" value={city} onChange={setCity} placeholder="Ex: Dakar" />
              <Field label="Zone" value={zone} onChange={setZone} placeholder="Ex: Centre" />
              <Field label="Type de lampe" value={lampType} onChange={setLampType} placeholder="Ex: LED" />
              <Field label="Puissance (W)" value={power} onChange={setPower} placeholder="Ex: 150" type="number" />
            </div>

            {submitError && (
              <p className="text-xs" style={{ color: "#F87171" }}>{submitError}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleRescan}
                className="rounded-2xl px-4 py-3 text-sm font-semibold"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={!isFormValid || !gps || submitting}
                onClick={handleSubmit}
                className="flex-1 rounded-2xl py-3 text-sm font-semibold"
                style={{
                  background: isFormValid && gps ? "linear-gradient(90deg, #22C55E, #15803D)" : "rgba(255,255,255,0.06)",
                  color: isFormValid && gps ? "#fff" : "rgba(255,255,255,0.3)",
                  boxShadow: isFormValid && gps ? "0 0 16px -2px rgba(34,197,94,0.5)" : "none",
                }}
              >
                {submitting ? "Enregistrement..." : "Valider l'installation"}
              </button>
            </div>
          </div>
        )}

        {submitted && (
          <div
            className="flex flex-col items-center gap-3 rounded-2xl p-8 text-center"
            style={{
              background: "linear-gradient(160deg, rgba(74,222,128,0.1), rgba(74,222,128,0.02))",
              border: "1px solid rgba(74,222,128,0.3)",
            }}
          >
            <CheckCircle2 className="h-10 w-10" style={{ color: "#4ADE80" }} />
            <p className="text-base font-semibold text-white">Installation enregistrée avec succès</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{deviceId}</p>
            <button
              type="button"
              onClick={handleRescan}
              className="mt-2 rounded-2xl px-5 py-2.5 text-sm font-semibold"
              style={{ background: "rgba(251,191,36,0.15)", color: "#FBBF24" }}
            >
              Scanner un autre module
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
      <span className="flex items-center gap-1.5 text-right text-xs font-semibold text-white">
        {icon}
        {value}
      </span>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-xl px-4 py-3.5 text-base outline-none"
        style={fieldStyle}
      />
    </label>
  );
}
