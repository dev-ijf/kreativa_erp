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

        // Pakai satu tag favicon khusus, tanpa menghapus node lain
        let link = head.querySelector<HTMLLinkElement>("link#dynamic-favicon");
        if (!link) {
          link = document.createElement("link");
          link.id = "dynamic-favicon";
          link.rel = "icon";
          link.type = "image/png";
          head.appendChild(link);
        }
        link.href = href;
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

