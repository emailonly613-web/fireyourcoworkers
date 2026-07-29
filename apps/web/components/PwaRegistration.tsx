"use client";

import { useEffect } from "react";

export const SERVICE_WORKER_PATH = "/sw.js";
export const SERVICE_WORKER_SCOPE = "/";
export const PWA_UPDATE_READY_EVENT = "fyc:pwa-update-ready";
export const PWA_STATUS_EVENT = "fyc:pwa-status";

const UPDATE_INTERVAL_MS = 60 * 60 * 1_000;

type PwaRuntimeStatus =
  | "unsupported"
  | "registering"
  | "ready"
  | "controlled"
  | "update-ready"
  | "error";

function exposeRuntimeStatus(status: PwaRuntimeStatus, cacheName?: string): void {
  document.documentElement.dataset.pwaStatus = status;
  if (cacheName) document.documentElement.dataset.pwaCache = cacheName;
  window.dispatchEvent(
    new CustomEvent(PWA_STATUS_EVENT, {
      detail: Object.freeze({ cacheName: cacheName ?? null, status }),
    }),
  );
}

function readWorkerVersion(worker: ServiceWorker): Promise<string | undefined> {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timeout = window.setTimeout(() => resolve(undefined), 1_500);
    channel.port1.onmessage = (event: MessageEvent<{ cacheName?: string }>) => {
      window.clearTimeout(timeout);
      resolve(event.data?.cacheName);
    };
    worker.postMessage({ type: "GET_VERSION" }, [channel.port2]);
  });
}

function requestActivation(worker: ServiceWorker): void {
  const updateEvent = new CustomEvent(PWA_UPDATE_READY_EVENT, {
    cancelable: true,
  });

  // A future update banner may call preventDefault() and activate after consent.
  if (window.dispatchEvent(updateEvent)) {
    exposeRuntimeStatus("update-ready");
    worker.postMessage({ type: "SKIP_WAITING" });
  }
}

export function PwaRegistration() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator) ||
      !window.isSecureContext
    ) {
      exposeRuntimeStatus("unsupported");
      return;
    }

    exposeRuntimeStatus("registering");

    let disposed = false;
    let refreshing = false;
    let hadController = Boolean(navigator.serviceWorker.controller);
    let updateTimer: ReturnType<typeof setInterval> | undefined;
    let registration: ServiceWorkerRegistration | undefined;
    let installingWorker: ServiceWorker | null = null;

    const onControllerChange = () => {
      exposeRuntimeStatus("controlled", document.documentElement.dataset.pwaCache);
      if (!hadController) {
        hadController = true;
        return;
      }
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    const onStateChange = () => {
      if (
        installingWorker?.state === "installed" &&
        navigator.serviceWorker.controller
      ) {
        requestActivation(installingWorker);
      }
    };

    const onUpdateFound = () => {
      installingWorker?.removeEventListener("statechange", onStateChange);
      installingWorker = registration?.installing ?? null;
      installingWorker?.addEventListener("statechange", onStateChange);
    };

    const checkForUpdate = () => {
      if (navigator.onLine) void registration?.update().catch(() => undefined);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") checkForUpdate();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
          scope: SERVICE_WORKER_SCOPE,
          updateViaCache: "none",
        });

        if (disposed) return;
        registration.addEventListener("updatefound", onUpdateFound);

        const readyRegistration = await navigator.serviceWorker.ready;
        const activeWorker = readyRegistration.active;
        const cacheName = activeWorker
          ? await readWorkerVersion(activeWorker)
          : undefined;
        exposeRuntimeStatus(
          navigator.serviceWorker.controller ? "controlled" : "ready",
          cacheName,
        );

        if (registration.waiting && navigator.serviceWorker.controller) {
          requestActivation(registration.waiting);
        }

        checkForUpdate();
        updateTimer = setInterval(checkForUpdate, UPDATE_INTERVAL_MS);
        window.addEventListener("online", checkForUpdate);
        document.addEventListener("visibilitychange", onVisibilityChange);
      } catch {
        exposeRuntimeStatus("error");
        // Registration failure leaves the online app intact; no readiness claim is emitted.
      }
    };

    if (document.readyState === "complete") {
      void register();
    } else {
      window.addEventListener("load", register, { once: true });
    }

    return () => {
      disposed = true;
      window.removeEventListener("load", register);
      window.removeEventListener("online", checkForUpdate);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
      registration?.removeEventListener("updatefound", onUpdateFound);
      installingWorker?.removeEventListener("statechange", onStateChange);
      if (updateTimer) clearInterval(updateTimer);
    };
  }, []);

  return null;
}
