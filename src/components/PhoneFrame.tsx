import type { ReactNode } from "react";

/**
 * Cadre imitant un écran de téléphone : 440px max de large, hauteur exacte
 * de l'écran (h-screen, responsive — pas une taille fixe en pixels),
 * arrondi sur desktop, plein écran sur mobile.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh justify-center bg-shell">
      <div className="relative flex h-full w-full max-w-[440px] flex-col overflow-hidden bg-app-gradient text-foreground shadow-frame sm:rounded-[2.5rem] sm:border sm:border-border">
        {children}
      </div>
    </div>
  );
}
