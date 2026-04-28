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

const ALLOWED_KEYS = new Set([
  'app_title',
  'logo_main_url',
  'logo_login_url',
  'login_welcome_text',
  'favicon_url',
  'login_title',
  'login_subtitle',
  'login_cta_text',
  'login_bg_url',
  'primary_color',
]);

export async function GET(_req: NextRequest) {
  const rows = (await sql`
    SELECT setting_key, setting_value
    FROM core_settings
    WHERE school_id IS NULL
    ORDER BY id ASC
  `) as {
    setting_key: string;
    setting_value: string | null;
  }[];

  // Last-write-wins per key
  const map: Record<string, string | null> = {};
  for (const r of rows) {
    const key = r.setting_key;
    if (!key || !ALLOWED_KEYS.has(key)) continue;
    map[key] = r.setting_value;
  }

  const resp: PortalThemeResp = {
    appTitle: map.app_title || 'Kreativa',
    logoMainUrl: map.logo_main_url ?? null,
    logoLoginUrl: map.logo_login_url ?? map.logo_main_url ?? null,
    primaryColor: map.primary_color ?? '#003df5',
    loginWelcomeText:
      map.login_welcome_text ??
      'Selamat datang di portal administrasi Kreativa ERP. Silakan masuk menggunakan akun Google yang terdaftar.',
    faviconUrl: map.favicon_url ?? null,
    loginTitle: map.login_title ?? null,
    loginSubtitle: map.login_subtitle ?? null,
    loginCtaText: map.login_cta_text ?? null,
    loginBgUrl: map.login_bg_url ?? null,
  };

  return NextResponse.json(resp, {
    headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
  });
}
