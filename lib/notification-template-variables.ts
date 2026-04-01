export type VariableDef = { key: string; label: string; example: string };

export type TriggerKey =
  | 'REMINDER'
  | 'CHECKOUT'
  | 'PAID'
  | 'PAYMENT_SUCCESS';

const COMMON: VariableDef[] = [
  { key: '{{customer_name}}', label: 'Nama customer', example: 'Budi' },
];

export const TRIGGER_OPTIONS: { value: TriggerKey; label: string }[] = [
  { value: 'REMINDER', label: 'Reminder' },
  { value: 'CHECKOUT', label: 'Checkout' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PAYMENT_SUCCESS', label: 'Payment Success' },
];

export const VARIABLES_BY_TRIGGER: Record<TriggerKey, VariableDef[]> = {
  REMINDER: [
    ...COMMON,
    { key: '{{event_name}}', label: 'Nama event', example: 'Tech Conference 2024' },
    { key: '{{event_date}}', label: 'Tanggal event', example: 'Sabtu, 26 Juli 2025' },
    { key: '{{event_location}}', label: 'Lokasi event', example: 'Jakarta Convention Center' },
    { key: '{{event_start_date}}', label: 'Tanggal & jam mulai', example: 'Sabtu, 26 Juli 2025 08:00' },
    { key: '{{ticket_link}}', label: 'Link e-ticket', example: 'https://example.com/ticket/abc' },
  ],
  CHECKOUT: [
    ...COMMON,
    { key: '{{order_form_reference}}', label: 'Nomor referensi', example: 'ORD-2026-0001' },
    { key: '{{order_final_amount}}', label: 'Total pembayaran', example: 'Rp 250.000' },
    { key: '{{payment_deadline}}', label: 'Batas waktu pembayaran', example: '2026-04-01 23:59' },
    { key: '{{payment_channel_pt_name}}', label: 'Nama payment gateway', example: 'Faspay' },
    { key: '{{virtual_account_number}}', label: 'Nomor virtual account', example: '8808123456789012' },
    { key: '{{payment_response_url}}', label: 'URL response pembayaran', example: 'https://example.com/payment/return' },
  ],
  PAID: [
    ...COMMON,
    { key: '{{order_form_reference}}', label: 'Nomor referensi', example: 'ORD-2026-0001' },
    { key: '{{order_final_amount}}', label: 'Total pembayaran', example: 'Rp 250.000' },
    { key: '{{ticket_link}}', label: 'Link e-ticket', example: 'https://example.com/ticket/abc' },
  ],
  PAYMENT_SUCCESS: [
    { key: '{name}', label: 'Nama', example: 'Budi' },
    { key: '{bill_title}', label: 'Judul tagihan', example: 'SPP Juli 2025' },
    { key: '{amount}', label: 'Jumlah', example: 'Rp 800.000' },
  ],
};

export function renderPreview(template: string, trigger: TriggerKey) {
  const vars = VARIABLES_BY_TRIGGER[trigger] ?? [];
  let out = template;
  for (const v of vars) {
    out = out.split(v.key).join(v.example);
  }
  return out;
}

