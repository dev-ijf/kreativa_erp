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

        // Cari favicon yang sudah ada
        const existingIcon = head.querySelector<HTMLLinkElement>(
          "link[rel='icon'], link[rel='shortcut icon']"
        );

        if (existingIcon) {
          // Jika sudah ada favicon, cukup update href-nya saja
          existingIcon.href = href;
        } else {
          // Jika belum ada, buat favicon baru
          const link = document.createElement("link");
          link.rel = "icon";
          link.type = "image/png";
          link.href = href;
          head.appendChild(link);
        }
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

