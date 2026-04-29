'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Field, Input, Button, Select } from '@/components/ui/FormFields';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { parseOptionsJson } from '@/lib/adaptive-question-options';

type Subject = { id: number; name_id: string; name_en: string };
type LevelGrade = { id: number; name: string; school_name?: string };

type Props = {
  recordId?: string;
};

export default function AdaptiveQuestionsBankForm({ recordId }: Props) {
  const router = useRouter();
  const isEdit = Boolean(recordId);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [levelGrades, setLevelGrades] = useState<LevelGrade[]>([]);
  const [loading, setLoading] = useState(!!recordId);
  const [saving, setSaving] = useState(false);

  const [subjectId, setSubjectId] = useState('');
  const [gradeBand, setGradeBand] = useState('');
  const [difficulty, setDifficulty] = useState('0.50');
  const [questionText, setQuestionText] = useState('');
  const [optionRows, setOptionRows] = useState<string[]>(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [lang, setLang] = useState<'EN' | 'ID'>('ID');
  const [generatedBy, setGeneratedBy] = useState('');
  const [levelGradeId, setLevelGradeId] = useState('');

  const nonEmptyOptions = useMemo(
    () => optionRows.map((s) => s.trim()).filter(Boolean),
    [optionRows]
  );

  useEffect(() => {
    fetch('/api/academic/subjects')
      .then((r) => r.json())
      .then((d) => setSubjects(Array.isArray(d) ? d : []));
    fetch('/api/master/level-grades')
      .then((r) => r.json())
      .then((d) => setLevelGrades(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    if (!recordId) return;
    let cancelled = false;
    fetch(`/api/academic/adaptive-questions-bank/${recordId}`)
      .then(async (r) => {
        const row = (await r.json().catch(() => ({}))) as Record<string, unknown>;
        if (!r.ok) {
          return { ...row, _httpError: true as const };
        }
        return row;
      })
      .then((row) => {
        if (cancelled) return;
        if (row?._httpError || row?.error) {
          setLoading(false);
          const msg =
            typeof row.error === 'string'
              ? row.error === 'Not found'
                ? 'Soal tidak ditemukan'
                : row.error
              : 'Soal tidak ditemukan';
          alert(msg);
          router.push('/academic/adaptive-questions-bank');
          return;
        }
        setSubjectId(String(row.subject_id ?? ''));
        setGradeBand(String(row.grade_band ?? ''));
        setDifficulty(String(row.difficulty ?? '0.50'));
        setQuestionText(String(row.question_text ?? ''));
        const opts = parseOptionsJson(row.options_json);
        setOptionRows(opts.length > 0 ? opts.map(String) : ['', '', '', '']);
        setCorrectAnswer(String(row.correct_answer ?? ''));
        setExplanation(String(row.explanation ?? ''));
        const L = String(row.lang ?? '').toUpperCase();
        setLang(L === 'EN' ? 'EN' : 'ID');
        setGeneratedBy(String(row.generated_by ?? ''));
        setLevelGradeId(row.level_grade_id != null ? String(row.level_grade_id) : '');
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          alert('Gagal memuat soal');
          router.push('/academic/adaptive-questions-bank');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [recordId, router]);

  const setOptionAt = (i: number, v: string) => {
    setOptionRows((rows) => {
      const next = [...rows];
      next[i] = v;
      return next;
    });
  };

  const addOptionRow = () => setOptionRows((rows) => [...rows, '']);
  const removeOptionRow = (i: number) => {
    setOptionRows((rows) => (rows.length <= 2 ? rows : rows.filter((_, j) => j !== i)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nonEmptyOptions.length < 2) {
      alert('Isi minimal dua pilihan jawaban');
      return;
    }
    if (!nonEmptyOptions.includes(correctAnswer)) {
      alert('Jawaban benar harus sama persis dengan salah satu teks pilihan');
      return;
    }

    const payload = {
      subject_id: Number(subjectId),
      grade_band: gradeBand.trim(),
      difficulty: difficulty.trim(),
      question_text: questionText,
      options_json: nonEmptyOptions,
      correct_answer: correctAnswer,
      explanation: explanation.trim() || null,
      lang,
      generated_by: generatedBy.trim() || null,
      level_grade_id: levelGradeId ? Number(levelGradeId) : null,
    };

    setSaving(true);
    const url = isEdit ? `/api/academic/adaptive-questions-bank/${recordId}` : '/api/academic/adaptive-questions-bank';
    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      alert(j.error || 'Gagal menyimpan');
      return;
    }
    router.push('/academic/adaptive-questions-bank');
  };

  const backHref = '/academic/adaptive-questions-bank';
  const canSave =
    subjectId &&
    gradeBand.trim() &&
    difficulty.trim() &&
    questionText.trim() &&
    nonEmptyOptions.length >= 2 &&
    correctAnswer &&
    (lang === 'EN' || lang === 'ID');

  if (loading) return <div className="p-10 text-center text-slate-400">Memuat…</div>;

  return (
    <div className="p-6 max-w-[960px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={backHref}>
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{isEdit ? 'Edit soal bank' : 'Tambah soal bank'}</h2>
          <p className="text-slate-400 text-[13px]">Bank soal adaptif · teks soal mendukung gambar (paste / unggah)</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
        <div className="p-6 space-y-5">
          <Field label="Mata pelajaran" required>
            <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required>
              <option value="">Pilih mapel</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name_id} ({s.name_en})
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Tingkat kelas (opsional)">
            <Select value={levelGradeId} onChange={(e) => setLevelGradeId(e.target.value)}>
              <option value="">—</option>
              {levelGrades.map((lg) => (
                <option key={lg.id} value={lg.id}>
                  {(lg.school_name ? `${lg.school_name} · ` : '') + lg.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Rentang kelas (grade band)" required>
            <Input value={gradeBand} onChange={(e) => setGradeBand(e.target.value)} placeholder="mis. 4–6" />
          </Field>

          <Field label="Tingkat kesulitan" required>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            />
          </Field>

          <Field label="Bahasa soal" required>
            <div className="flex gap-6 text-[13px] text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="lang" checked={lang === 'ID'} onChange={() => setLang('ID')} />
                Bahasa Indonesia (ID)
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="lang" checked={lang === 'EN'} onChange={() => setLang('EN')} />
                English (EN)
              </label>
            </div>
          </Field>

          <Field label="Soal" required>
            <RichTextEditor
              value={questionText}
              onChange={setQuestionText}
              uploadPrefix="adaptive-questions-bank"
            />
          </Field>

          <div className="space-y-2">
            <p className="text-[13px] font-medium text-slate-700">Pilihan jawaban</p>
            <p className="text-[12px] text-slate-400">Minimal 2 baris terisi. Jawaban benar harus sama persis dengan teks salah satu pilihan.</p>
            <div className="space-y-2">
              {optionRows.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-[12px] text-slate-400 w-6 tabular-nums">{i + 1}.</span>
                  <Input value={row} onChange={(e) => setOptionAt(i, e.target.value)} placeholder={`Opsi ${i + 1}`} />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    disabled={optionRows.length <= 2}
                    onClick={() => removeOptionRow(i)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addOptionRow}>
              <Plus size={14} /> Tambah pilihan
            </Button>
          </div>

          <Field label="Jawaban benar" required>
            <Select value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} required>
              <option value="">Pilih teks yang benar</option>
              {nonEmptyOptions.map((o) => (
                <option key={o} value={o}>
                  {o.length > 80 ? `${o.slice(0, 80)}…` : o}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Penjelasan">
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400/20"
              placeholder="Opsional"
            />
          </Field>

          <Field label="Sumber / dibuat oleh">
            <Input value={generatedBy} onChange={(e) => setGeneratedBy(e.target.value)} placeholder="mis. AI, manual" />
          </Field>
        </div>

        <div className="bg-slate-50 border-t border-[#E2E8F1] p-5 flex justify-end gap-3">
          <Link href={backHref}>
            <Button variant="ghost" type="button">
              Batal
            </Button>
          </Link>
          <Button loading={saving} type="submit" disabled={!canSave}>
            {isEdit ? 'Simpan perubahan' : 'Simpan'}
          </Button>
        </div>
      </form>
    </div>
  );
}
