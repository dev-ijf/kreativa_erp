"use client";

import { useEffect } from "react";

export default function DynamicFavicon() {
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/settings/portal-theme", { cache: "no-store" });
        const j = (await res.json().catch(() => null)) as { faviconUrl?: string | null } | null;
        if (!j || !j.faviconUrl || cancelled) return;

        const href = j.faviconUrl;
        const head = document.head;
        if (!head) return;

        const existingIcons = head.querySelectorAll<HTMLLinkElement>("link[rel='icon'], link[rel='shortcut icon']");
        existingIcons.forEach((el) => {
          head.removeChild(el);
        });

        const link = document.createElement("link");
        link.rel = "icon";
        link.type = "image/png";
        link.href = href;
        head.appendChild(link);
      } catch {
        // abaikan error, gunakan favicon default
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

