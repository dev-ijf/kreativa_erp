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

        // Update semua favicon yang sudah ada (termasuk bawaan Vercel)
        const allIcons = head.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
        allIcons.forEach((el) => {
          el.href = href;
        });

        // Favicon utama khusus (fallback jika browser hanya baca sebagian)
        let icon = head.querySelector<HTMLLinkElement>("link#dynamic-favicon");
        if (!icon) {
          icon = document.createElement("link");
          icon.id = "dynamic-favicon";
          icon.rel = "icon";
          icon.type = "image/png";
          head.appendChild(icon);
        }
        icon.href = href;

        // Shortcut icon (beberapa browser masih mengandalkan ini)
        let shortcut = head.querySelector<HTMLLinkElement>("link#dynamic-favicon-shortcut");
        if (!shortcut) {
          shortcut = document.createElement("link");
          shortcut.id = "dynamic-favicon-shortcut";
          shortcut.rel = "shortcut icon";
          shortcut.type = "image/png";
          head.appendChild(shortcut);
        }
        shortcut.href = href;
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

