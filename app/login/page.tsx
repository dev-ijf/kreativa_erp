"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

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

export default function LoginPage() {
  const [theme, setTheme] = useState<PortalTheme>({
    appTitle: "Kreativa",
    logoMainUrl: null,
    logoLoginUrl: null,
    primaryColor: null,
    loginWelcomeText:
      "Selamat datang di portal administrasi Kreativa ERP. Silakan masuk menggunakan akun Google yang terdaftar.",
    loginTitle: null,
    loginSubtitle: null,
    loginCtaText: null,
    loginBgUrl: null,
  });
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(() => {
    const initialError = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("error") : null;
    if (!initialError) return null;
    if (initialError === "AccessDenied") {
      return "Akun Google Anda belum terdaftar di sistem. Silakan hubungi admin yayasan.";
    }
    if (initialError === "OAuthCallback" || initialError === "OAuthSignin") {
      return "Gagal terhubung ke Google. Silakan coba lagi beberapa saat lagi.";
    }
    return "Gagal masuk. Silakan coba lagi atau hubungi admin.";
  });

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/settings/portal-theme", { cache: "no-store" });
        const j = (await res.json().catch(() => null)) as PortalTheme | null;
        if (!j) return;
        setTheme(j);
      } catch {
        // fallback ke default
      }
    })();
  }, []);

  // Tidak perlu effect untuk errorText; sudah diinisialisasi dari query param sekali di atas

  const handleGoogleLogin = async () => {
    setErrorText(null);
    setLoading(true);
    const result = await signIn("google", {
      callbackUrl: "/dashboard",
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      if (result.error === "AccessDenied") {
        setErrorText("Akun Google Anda belum terdaftar di sistem. Silakan hubungi admin yayasan.");
      } else {
        setErrorText("Gagal masuk. Silakan coba lagi atau hubungi admin.");
      }
      return;
    }
    if (result?.url) {
      window.location.href = result.url;
    }
  };

  const logoUrl = theme.logoLoginUrl || theme.logoMainUrl;
  const primaryColor = theme.primaryColor || "#4f46e5";
  const loginTitle = theme.loginTitle || "Masuk ke dashboard";
  const loginSubtitle =
    theme.loginSubtitle ||
    "Masuk ke sistem manajemen sekolah Anda. Gunakan akun Google yang telah terdaftar untuk mengakses dashboard admin.";
  const loginCtaText = theme.loginCtaText || "Masuk dengan Google";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <div className="p-8 md:p-10 flex flex-col justify-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={theme.appTitle} className="max-w-full max-h-full object-contain" />
              ) : (
                <span className="text-[20px] font-bold text-slate-700">K</span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{theme.appTitle}</h1>
              <p className="text-[11px] font-semibold tracking-[0.2em] text-slate-400 uppercase mt-0.5">
                Global School ERP
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{loginTitle}</h2>
            <p className="text-[13px] text-slate-500 whitespace-pre-line">{loginSubtitle}</p>
          </div>

          {errorText && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] text-rose-900">
              {errorText}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[14px] font-semibold shadow-md transition-all disabled:opacity-70 bg-white text-slate-800 border border-slate-200 hover:bg-slate-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-sm bg-white">
                  {/* Google icon */}
                  <svg viewBox="0 0 24 24" className="w-4 h-4">
                    <path
                      fill="#EA4335"
                      d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.3-1.9 3l3.1 2.4c1.8-1.7 2.8-4.1 2.8-6.9 0-.7-.1-1.4-.2-2H12z"
                    />
                    <path
                      fill="#34A853"
                      d="M6.6 14.3 5.8 15.4l-2.5 2C5 20.7 8.3 22 12 22c2.4 0 4.5-.8 6-2.3l-3.1-2.4c-.8.5-1.8.9-2.9.9-2.2 0-4.1-1.5-4.8-3.6z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M3.3 7.4C2.7 8.5 2.4 9.7 2.4 11s.3 2.5.9 3.6c0 0 1.6-2.5 1.7-2.6-.1-.3-.2-.7-.2-1s.1-.7.2-1L3.3 7.4z"
                    />
                    <path
                      fill="#4285F4"
                      d="M12 6.2c1.3 0 2.5.5 3.5 1.4l2.6-2.6C16.5 3.5 14.4 2.7 12 2.7 8.3 2.7 5 4 3.3 7.4l2 3.6C6 8.9 7.9 7.4 12 7.4z"
                    />
                  </svg>
                </span>
                <span>{loginCtaText}</span>
              </>
            )}
          </button>

         
        </div>

        <div className="hidden md:block relative bg-slate-900">
          {theme.loginBgUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={theme.loginBgUrl}
                alt="Background login"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-purple-900/60" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 opacity-60 bg-gradient-to-br from-sky-500 via-indigo-600 to-fuchsia-500" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.9),_transparent_60%)]" />
            </>
          )}
          <div className="relative h-full flex flex-col justify-between p-8 text-white">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-sky-100/80 mb-3">
                {theme.appTitle.toUpperCase()}
              </p>
              <h3 className="text-2xl font-semibold leading-snug">
                Kelola data dan kehadiran
                <br />
                dengan lebih efisien.
              </h3>
            </div>
            <div className="space-y-2 text-[12px] text-sky-50/90">
              <p>• Pantau aktivitas dan transaksi dalam satu tampilan.</p>
              <p>• Akses aman berbasis akun Google yayasan.</p>
              <p>• Dirancang untuk admin, operator, dan pimpinan sekolah.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

