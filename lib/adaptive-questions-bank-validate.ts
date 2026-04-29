import { parseOptionsJson } from '@/lib/adaptive-question-options';

export function normalizeLang(v: unknown): 'EN' | 'ID' | null {
  if (v == null || v === '') return null;
  const s = String(v).toUpperCase();
  if (s === 'EN' || s === 'ID') return s;
  return null;
}

export function validateAdaptiveQuestionsBankPayload(
  b: Record<string, unknown> | null
): { error: string } | null {
  if (!b) return { error: 'Body JSON tidak valid' };
  if (b.subject_id == null || String(b.subject_id).trim() === '') return { error: 'subject_id wajib' };
  if (!b.grade_band || !String(b.grade_band).trim()) return { error: 'grade_band wajib' };
  if (b.difficulty == null || String(b.difficulty).trim() === '') return { error: 'difficulty wajib' };
  if (!b.question_text || !String(b.question_text).trim()) return { error: 'question_text wajib' };
  const opts = parseOptionsJson(b.options_json);
  const nonEmpty = opts.map((x) => String(x).trim()).filter(Boolean);
  if (nonEmpty.length < 2) return { error: 'options_json harus berisi minimal 2 opsi teks' };
  const ca = b.correct_answer != null ? String(b.correct_answer).trim() : '';
  if (!ca) return { error: 'correct_answer wajib' };
  if (!nonEmpty.some((o) => o === ca)) return { error: 'correct_answer harus salah satu nilai opsi' };
  const lang = normalizeLang(b.lang);
  if (lang == null) return { error: 'lang wajib: EN atau ID' };
  return null;
}
