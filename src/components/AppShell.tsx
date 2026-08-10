import type { ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Home, Map, Wrench, Info } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";

const tabs = [
  { to: "/accueil", label: "Accueil", icon: Home },
  { to: "/carte", label: "Carte", icon: Map },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/infos", label: "Infos", icon: Info },
] as const;

export function AppShell({ header, children }: { header?: ReactNode; children: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <PhoneFrame>
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {header && <div className="relative z-20 shrink-0">{header}</div>}

        <main
          className="min-h-0 flex-1 overflow-y-auto pb-24 no-scrollbar"
          style={{ background: "#0A0A0A", scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
          {children}
        </main>

        <nav className="absolute inset-x-0 bottom-0 z-30 backdrop-blur-xl" style={{
          borderTop: "1px solid rgba(251,191,36,0.15)",
          background: "rgba(10,10,10,0.85)",
        }}>
          <ul className="grid grid-cols-4 gap-1 px-1 pt-1.5 pb-2">
            {tabs.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <li key={to}>
                  <Link
                    to={to}
                    className="flex flex-col items-center gap-0.5 rounded-2xl py-1 transition-colors"
                    style={{ color: active ? "#FBBF24" : "rgba(255,255,255,0.4)" }}
                  >
                    <span
                      className="grid h-8 w-8 place-items-center rounded-xl transition-all"
                      style={active ? {
                        background: "rgba(251,191,36,0.15)",
                        boxShadow: "0 0 14px -2px rgba(251,191,36,0.6)",
                      } : undefined}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-[10px] leading-none font-semibold">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </PhoneFrame>
  );
}
