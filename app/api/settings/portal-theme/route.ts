import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

type PortalThemeResp = {
  appTitle: string;
  logoMainUrl: string | null;
  logoLoginUrl: string | null;
  primaryColor: string | null;
  loginWelcomeText: string | null;
  faviconUrl: string | null;
  loginTitle: string | null;
  loginSubtitle: string | null;
  loginCtaText: string | null;
  loginBgUrl: string | null;
};

export async function GET(_req: NextRequest) {
  const rows = await sql<{
    setting_key: string;
    setting_value: string | null;
  }>`
    SELECT setting_key, setting_value
    FROM core_settings
    WHERE school_id IS NULL
  `;

  const map: Record<string, string | null> = {};
  for (const r of rows) {
    const key = r.setting_key;
    if (!key) continue;
    if (
      key === 'app_title' ||
      key === 'logo_main_url' ||
      key === 'logo_login_url' ||
      key === 'primary_color' ||
      key === 'login_welcome_text' ||
      key === 'favicon_url' ||
      key === 'login_title' ||
      key === 'login_subtitle' ||
      key === 'login_cta_text' ||
      key === 'login_bg_url'
    ) {
      map[key] = r.setting_value;
    }
  }

  const resp: PortalThemeResp = {
    appTitle: map.app_title || 'Kreativa',
    logoMainUrl: map.logo_main_url ?? null,
    logoLoginUrl: map.logo_login_url ?? map.logo_main_url ?? null,
    primaryColor: map.primary_color ?? null,
    loginWelcomeText:
      map.login_welcome_text ??
      'Selamat datang di portal administrasi Kreativa ERP. Silakan masuk menggunakan akun Google yang terdaftar.',
    faviconUrl: map.favicon_url ?? null,
    loginTitle: map.login_title ?? null,
    loginSubtitle: map.login_subtitle ?? null,
    loginCtaText: map.login_cta_text ?? null,
    loginBgUrl: map.login_bg_url ?? null,
  };

  return NextResponse.json(resp);
}

