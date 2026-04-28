"use client";

import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                                */
/* ------------------------------------------------------------------ */
type PortalTheme = {
  appTitle: string;
  logoMainUrl: string | null;
  logoLoginUrl: string | null;
  primaryColor: string | null;
  loginWelcomeText: string | null;
  loginTitle: string | null;
  loginSubtitle: string | null;
  loginCtaText: string | null;
  loginBgUrl: string | null;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                              */
/* ------------------------------------------------------------------ */
/** Parse hex/rgb color → {r,g,b} */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.trim().replace(/^#/, "");
  if (clean.length !== 6 && clean.length !== 3) return null;
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

/** Lighten a hex color by mixing with white */
function lighten(hex: string, amount = 0.6): string {
  const c = hexToRgb(hex);
  if (!c) return hex;
  const r = Math.round(c.r + (255 - c.r) * amount);
  const g = Math.round(c.g + (255 - c.g) * amount);
  const b = Math.round(c.b + (255 - c.b) * amount);
  return `rgb(${r},${g},${b})`;
}

/** Google icon SVG */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.3-1.9 3l3.1 2.4c1.8-1.7 2.8-4.1 2.8-6.9 0-.7-.1-1.4-.2-2H12z" />
      <path fill="#34A853" d="M6.6 14.3 5.8 15.4l-2.5 2C5 20.7 8.3 22 12 22c2.4 0 4.5-.8 6-2.3l-3.1-2.4c-.8.5-1.8.9-2.9.9-2.2 0-4.1-1.5-4.8-3.6z" />
      <path fill="#FBBC05" d="M3.3 7.4C2.7 8.5 2.4 9.7 2.4 11s.3 2.5.9 3.6c0 0 1.6-2.5 1.7-2.6-.1-.3-.2-.7-.2-1s.1-.7.2-1L3.3 7.4z" />
      <path fill="#4285F4" d="M12 6.2c1.3 0 2.5.5 3.5 1.4l2.6-2.6C16.5 3.5 14.4 2.7 12 2.7 8.3 2.7 5 4 3.3 7.4l2 3.6C6 8.9 7.9 7.4 12 7.4z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Animated Canvas Particles                                            */
/* ------------------------------------------------------------------ */
function ParticleCanvas({ color }: { color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: Array<{
      x: number; y: number; r: number;
      vx: number; vy: number; alpha: number;
    }> = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const rgb = hexToRgb(color) ?? { r: 0, g: 61, b: 245 };

    // Init particles
    for (let i = 0; i < 55; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2.5 + 0.5,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        alpha: Math.random() * 0.4 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${p.alpha})`;
        ctx.fill();
      });

      // Draw connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${0.12 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [color]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Feature bullets for right panel                                      */
/* ------------------------------------------------------------------ */
const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    text: "Pantau aktivitas & transaksi real‑time",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
        <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    text: "Akses aman berbasis akun Google yayasan",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    text: "Multi‑sekolah, multi‑peran dalam satu sistem",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    text: "Dirancang untuk admin, operator & pimpinan",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                                 */
/* ------------------------------------------------------------------ */
export default function LoginPage() {
  const [theme, setTheme] = useState<PortalTheme>({
    appTitle: "Kreativa",
    logoMainUrl: null,
    logoLoginUrl: null,
    primaryColor: "#003df5",
    loginWelcomeText: "Selamat datang",
    loginTitle: null,
    loginSubtitle: null,
    loginCtaText: null,
    loginBgUrl: null,
  });
  const [themeReady, setThemeReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const p = new URLSearchParams(window.location.search).get("error");
    if (!p) return null;
    if (p === "AccessDenied") return "Akun Google Anda belum terdaftar. Hubungi admin yayasan.";
    if (p === "OAuthCallback" || p === "OAuthSignin") return "Gagal terhubung ke Google. Coba lagi beberapa saat.";
    return "Gagal masuk. Silakan coba lagi atau hubungi admin.";
  });

  /* Fetch theme */
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/settings/portal-theme", { cache: "no-store" });
        const j = (await res.json().catch(() => null)) as PortalTheme | null;
        if (j) setTheme(j);
      } finally {
        setThemeReady(true);
      }
    })();
  }, []);

  const handleGoogleLogin = async () => {
    setErrorText(null);
    setLoading(true);
    const result = await signIn("google", { callbackUrl: "/dashboard", redirect: false });
    setLoading(false);
    if (result?.error) {
      setErrorText(
        result.error === "AccessDenied"
          ? "Akun Google Anda belum terdaftar. Hubungi admin yayasan."
          : "Gagal masuk. Silakan coba lagi atau hubungi admin."
      );
      return;
    }
    if (result?.url) window.location.href = result.url;
  };

  /* ---- Derived values ---- */
  const primary = theme.primaryColor || "#003df5";
  const logoUrl = theme.logoLoginUrl || theme.logoMainUrl;
  const loginTitle = theme.loginTitle || "Selamat Datang";
  const loginSubtitle =
    theme.loginSubtitle ||
    "Masuk ke sistem manajemen sekolah Anda menggunakan akun Google yang telah terdaftar.";
  const loginCtaText = theme.loginCtaText || "Masuk dengan Google";
  const welcomeText =
    theme.loginWelcomeText || "Selamat datang di portal administrasi Kreativa ERP.";
  const primaryRgb = hexToRgb(primary) ?? { r: 0, g: 61, b: 245 };
  const primaryLight = lighten(primary, 0.88);

  /* CSS vars injected inline so Tailwind doesn't need to know the color */
  const cssVars = {
    "--primary": primary,
    "--primary-rgb": `${primaryRgb.r},${primaryRgb.g},${primaryRgb.b}`,
    "--primary-light": primaryLight,
  } as React.CSSProperties;

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={cssVars}
    >
      {/* ── Background ──────────────────────────────────────── */}
      {theme.loginBgUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={theme.loginBgUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg,
                rgba(${primaryRgb.r},${primaryRgb.g},${primaryRgb.b},0.82) 0%,
                rgba(15,23,42,0.88) 100%)`,
            }}
          />
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg,
              rgba(${primaryRgb.r},${primaryRgb.g},${primaryRgb.b},1) 0%,
              #0f172a 65%,
              #1e1b4b 100%)`,
          }}
        />
      )}

      {/* Subtle radial glow top-left */}
      <div
        className="absolute top-0 left-0 w-[60vw] h-[60vh] rounded-full blur-[120px] opacity-30 pointer-events-none"
        style={{ background: `rgba(${primaryRgb.r},${primaryRgb.g},${primaryRgb.b},1)` }}
        aria-hidden="true"
      />

      {/* ── Card ────────────────────────────────────────────── */}
      <div
        className="relative z-10 w-full max-w-5xl mx-4 my-8 rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-[1fr_1.1fr]"
        style={{
          opacity: themeReady ? 1 : 0,
          transform: themeReady ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.45s ease, transform 0.45s ease",
        }}
      >
        {/* ===== LEFT: Form ===================================== */}
        <div className="bg-white flex flex-col justify-between p-10 md:p-12">
          {/* Logo + App name */}
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm"
                style={{ background: primaryLight, border: `1.5px solid rgba(${primaryRgb.r},${primaryRgb.g},${primaryRgb.b},0.18)` }}
              >
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt={theme.appTitle} className="max-w-full max-h-full object-contain" />
                ) : (
                  <span
                    className="text-[18px] font-black leading-none"
                    style={{ color: primary }}
                  >
                    {theme.appTitle.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p className="text-[15px] font-bold text-slate-900 leading-tight">{theme.appTitle}</p>
                <p
                  className="text-[10px] font-semibold tracking-[0.22em] uppercase mt-0.5"
                  style={{ color: primary }}
                >
                  School ERP
                </p>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <h1 className="text-[28px] font-extrabold text-slate-900 leading-tight tracking-tight mb-2">
                {loginTitle}
              </h1>
              <p className="text-[13.5px] text-slate-500 leading-relaxed">{loginSubtitle}</p>
            </div>

            {/* Error */}
            {errorText && (
              <div
                className="mb-6 flex items-start gap-2.5 rounded-xl px-4 py-3 text-[13px] leading-snug"
                style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }}
                role="alert"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{errorText}</span>
              </div>
            )}

            {/* CTA Button */}
            <button
              id="btn-google-login"
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="group relative w-full inline-flex items-center justify-center gap-3 rounded-2xl px-5 py-3.5 text-[14.5px] font-semibold transition-all duration-200 overflow-hidden select-none"
              style={{
                background: loading
                  ? "#f1f5f9"
                  : "white",
                border: `1.5px solid ${loading ? "#e2e8f0" : "#e2e8f0"}`,
                color: "#1e293b",
                boxShadow: loading ? "none" : "0 2px 12px 0 rgba(0,0,0,0.08)",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    `0 4px 20px 0 rgba(${primaryRgb.r},${primaryRgb.g},${primaryRgb.b},0.18)`;
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    `rgba(${primaryRgb.r},${primaryRgb.g},${primaryRgb.b},0.45)`;
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 12px 0 rgba(0,0,0,0.08)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#e2e8f0";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  <span className="text-slate-500">Memproses…</span>
                </>
              ) : (
                <>
                  <GoogleIcon />
                  <span>{loginCtaText}</span>
                </>
              )}
            </button>

            {/* Divider hint */}
            <p className="mt-5 text-center text-[11.5px] text-slate-400">
              Hanya akun Google yang telah didaftarkan oleh admin yang dapat masuk.
            </p>
          </div>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[11px] text-slate-400">
              © {new Date().getFullYear()} {theme.appTitle}
            </p>
            <p className="text-[11px] text-slate-400">v2.0</p>
          </div>
        </div>

        {/* ===== RIGHT: Branding panel ========================== */}
        <div
          className="hidden md:flex flex-col justify-between relative overflow-hidden p-10"
          style={{
            background: `linear-gradient(155deg,
              rgba(${primaryRgb.r},${primaryRgb.g},${primaryRgb.b},1) 0%,
              #0f172a 100%)`,
          }}
        >
          {/* Particle canvas */}
          <ParticleCanvas color={primary} />

          {/* Decorative circle */}
          <div
            className="absolute -right-20 -top-20 w-72 h-72 rounded-full opacity-10 pointer-events-none"
            style={{ background: "white" }}
            aria-hidden="true"
          />
          <div
            className="absolute -left-14 bottom-0 w-56 h-56 rounded-full opacity-10 pointer-events-none"
            style={{ background: "white" }}
            aria-hidden="true"
          />

          {/* Top: Welcome text */}
          <div className="relative z-10">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-6 text-[11px] font-semibold tracking-widest uppercase"
              style={{
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(8px)",
                color: "rgba(255,255,255,0.85)",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "#4ade80" }}
              />
              Live System
            </div>

            <h2
              className="text-[32px] font-extrabold text-white leading-tight tracking-tight mb-4"
              style={{ textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}
            >
              {welcomeText}
            </h2>
            <p className="text-[13.5px] text-white/60 leading-relaxed max-w-xs">
              Platform manajemen sekolah terpadu yang dirancang untuk efisiensi dan kemudahan operasional yayasan.
            </p>
          </div>

          {/* Features */}
          <div className="relative z-10 mt-8">
            <div className="grid grid-cols-1 gap-3">
              {FEATURES.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    backdropFilter: "blur(6px)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    animationDelay: `${i * 80}ms`,
                  }}
                >
                  <span
                    className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
                  >
                    {f.icon}
                  </span>
                  <p className="text-[12.5px] font-medium text-white/80 leading-snug">{f.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom logo watermark */}
          {logoUrl && (
            <div className="relative z-10 mt-8 flex items-center gap-2 opacity-30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="" className="h-8 object-contain" aria-hidden="true" />
            </div>
          )}
        </div>
      </div>

      {/* Global keyframes */}
      <style>{`
        @keyframes loginFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
