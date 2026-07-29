"use client";

import { useEffect, useState } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

type InstallMode =
  | "checking"
  | "prompt-ready"
  | "instructions"
  | "unavailable"
  | "installed";

export const INSTALL_GUIDANCE =
  "Open your browser's page or Share menu, then choose Install app or Add to Home Screen if that option is available. Browser and device support varies.";

function isRunningInstalled(): boolean {
  const standaloneNavigator = navigator as NavigatorWithStandalone;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    standaloneNavigator.standalone === true
  );
}

function hasInstallFoundation(): boolean {
  return window.isSecureContext && "serviceWorker" in navigator;
}

export function InstallControl() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<InstallMode>("checking");
  const [showGuidance, setShowGuidance] = useState(false);
  const [status, setStatus] = useState(
    "Checking whether this browser offers installation.",
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isRunningInstalled()) {
      setMode("installed");
      setStatus("Fire Your Coworkers is already running as an installed app.");
    } else if (hasInstallFoundation()) {
      setMode("instructions");
      setStatus("Install options depend on this browser and device.");
    } else {
      setMode("unavailable");
      setStatus("This browser context does not currently expose app installation.");
    }

    const onBeforeInstallPrompt = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent;

      // Capture the browser event for an explicit click; never open it automatically.
      installEvent.preventDefault();
      setDeferredPrompt(installEvent);
      setMode("prompt-ready");
      setShowGuidance(false);
      setStatus("This browser is ready to show its install prompt.");
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setMode("installed");
      setShowGuidance(false);
      setStatus("Fire Your Coworkers was installed successfully.");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const onInstallSelected = async () => {
    if (mode === "installed" || busy) return;

    if (deferredPrompt) {
      setBusy(true);
      try {
        // This is the only place the captured browser prompt may be opened.
        await deferredPrompt.prompt();
        trackAnalyticsEvent("install_cta_selected", {
          // The current schema has no install-section surface yet; do not mislabel it.
          surface: "unknown",
          result: "prompted",
        });

        const choice = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        setMode("instructions");
        setStatus(
          choice.outcome === "accepted"
            ? "Install accepted. Your browser will finish adding the app."
            : "Installation was not completed. You can use the browser menu or try again if the option returns.",
        );
        setShowGuidance(choice.outcome === "dismissed");
      } catch {
        setDeferredPrompt(null);
        setMode("unavailable");
        setShowGuidance(true);
        setStatus("The browser could not open an install prompt. You can keep playing here.");
        trackAnalyticsEvent("install_cta_selected", {
          surface: "unknown",
          result: "unavailable",
        });
      } finally {
        setBusy(false);
      }
      return;
    }

    if (hasInstallFoundation()) {
      setShowGuidance(true);
      setStatus("Use the browser's own menu when an install option is available.");
      trackAnalyticsEvent("install_cta_selected", {
        surface: "unknown",
        result: "instructions",
      });
      return;
    }

    setShowGuidance(true);
    setStatus("Installation is unavailable in this browser context. Browser play still works.");
    trackAnalyticsEvent("install_cta_selected", {
      surface: "unknown",
      result: "unavailable",
    });
  };

  if (mode === "installed") {
    return (
      <div className="site-install-control" data-install-state="installed">
        <p className="site-install-control__installed">App installed</p>
        <p aria-live="polite" className="site-install-control__status">
          {status}
        </p>
      </div>
    );
  }

  const buttonLabel =
    mode === "prompt-ready"
      ? "Install app"
      : mode === "instructions"
        ? "Show install steps"
        : mode === "unavailable"
          ? "Check install support"
          : "Checking install support";

  return (
    <div className="site-install-control" data-install-state={mode}>
      <button
        className="site-primary-link site-install-control__button"
        disabled={mode === "checking" || busy}
        onClick={() => void onInstallSelected()}
        type="button"
      >
        {busy ? "Opening browser prompt" : buttonLabel}
      </button>
      <p aria-live="polite" className="site-install-control__status">
        {status}
      </p>
      {showGuidance ? (
        <p className="site-install-control__guidance">{INSTALL_GUIDANCE}</p>
      ) : null}
    </div>
  );
}
