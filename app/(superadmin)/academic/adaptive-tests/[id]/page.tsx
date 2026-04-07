'use client';

import { useEffect, useState, use } from 'react';
import { Button } from '@/components/ui/FormFields';
import { ArrowLeft, Check, X } from 'lucide-react';
import Link from 'next/link';
import {
  answersEqual,
  optionLetter,
  parseOptionsJson,
} from '@/lib/adaptive-question-options';

interface Q {
  id: number;
  grade_band: string;
  difficulty: string;
  question_text: string;
  options_json: unknown;
  correct_answer: string;
  student_answer: string | null;
  explanation: string | null;
}

export default function AdaptiveTestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [test, setTest] = useState<Record<string, unknown> | null>(null);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const r = await fetch(`/api/academic/adaptive-tests/${id}`);
        const raw = await r.text();
        let d: { error?: string; test?: Record<string, unknown>; questions?: Q[] } = {};
        if (raw) {
          try {
            d = JSON.parse(raw) as typeof d;
          } catch {
            d = {};
          }
        }
        if (cancelled) return;
        if (!r.ok) {
          setTest(d.test ?? null);
          setQuestions(Array.isArray(d.questions) ? d.questions : []);
          setFetchError(d.error || `Permintaan gagal (${r.status})`);
          setLoading(false);
          return;
        }
        if (d.error && !d.test) {
          setTest(null);
          setQuestions([]);
          setFetchError(d.error);
        } else {
          setTest(d.test ?? null);
          setQuestions(Array.isArray(d.questions) ? d.questions : []);
        }
      } catch {
        if (!cancelled) {
          setTest(null);
          setQuestions([]);
          setFetchError('Tidak dapat memuat data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <div className="p-10 text-center text-slate-400">Memuat…</div>;
  if (!test) {
    return (
      <div className="p-10 text-center space-y-2">
        <p className="text-rose-500">{fetchError || 'Tes tidak ditemukan'}</p>
        <Link href="/academic/adaptive-tests" className="text-[13px] text-sky-600 hover:underline">
          Kembali ke daftar
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[960px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/academic/adaptive-tests">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0 justify-center">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Detail tes adaptif</h2>
          <p className="text-slate-500 text-[13px]">
            {(test.student_name as string) || '—'} · {(test.subject_name as string) || '—'} · Skor:{' '}
            {String(test.score)} · Penguasaan: {String(test.mastery_level)}
          </p>
        </div>
      </div>

      {fetchError ? (
        <p className="text-[13px] text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          {fetchError}
        </p>
      ) : null}

      <div className="bg-white rounded-2xl border border-[#E2E8F1] shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
          <p className="text-[12px] font-bold text-slate-500 uppercase">Soal terkait tes ({questions.length})</p>
        </div>
        <div className="divide-y divide-slate-100">
          {questions.length === 0 ? (
            <p className="p-8 text-center text-slate-400 text-[13px]">Belum ada soal terhubung ke tes ini</p>
          ) : (
            questions.map((q, i) => {
              const opts = parseOptionsJson(q.options_json);
              const studentOk =
                q.student_answer != null &&
                answersEqual(q.student_answer, q.correct_answer);
              return (
                <div key={q.id} className="p-5 space-y-3">
                  <p className="text-[11px] text-slate-400 font-mono">
                    #{i + 1} · {q.grade_band} · kesulitan {q.difficulty}
                  </p>
                  <p className="text-[13px] text-slate-800 whitespace-pre-wrap">{q.question_text}</p>

                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                      Pilihan jawaban
                    </p>
                    <ul className="space-y-2">
                      {opts.length === 0 ? (
                        <li className="text-[12px] text-slate-400">Tidak ada opsi (format tidak dikenali)</li>
                      ) : (
                        opts.map((label, idx) => {
                          const letter = optionLetter(idx);
                          const isCorrect = answersEqual(label, q.correct_answer);
                          const isStudentPick = answersEqual(label, q.student_answer);
                          return (
                            <li
                              key={`${q.id}-${idx}`}
                              className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 text-[13px] ${
                                isCorrect && isStudentPick
                                  ? 'border-emerald-300 bg-emerald-50/80 text-slate-800'
                                  : isCorrect
                                    ? 'border-emerald-200 bg-emerald-50/50 text-slate-800'
                                    : isStudentPick
                                      ? 'border-rose-300 bg-rose-50/80 text-slate-800'
                                      : 'border-slate-100 bg-slate-50/40 text-slate-700'
                              }`}
                            >
                              <span className="font-mono font-semibold text-slate-500 w-7 shrink-0 pt-0.5">
                                {letter}.
                              </span>
                              <span className="flex-1 min-w-0">{label}</span>
                              <span className="flex items-center gap-1 shrink-0">
                                {isCorrect ? (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold uppercase text-emerald-700">
                                    <Check size={12} strokeWidth={2.5} /> Benar
                                  </span>
                                ) : null}
                                {isStudentPick ? (
                                  <span
                                    className={`inline-flex items-center gap-0.5 text-[10px] font-semibold uppercase ${
                                      studentOk ? 'text-emerald-700' : 'text-rose-700'
                                    }`}
                                  >
                                    {studentOk ? <Check size={12} /> : <X size={12} />}
                                    Siswa
                                  </span>
                                ) : null}
                              </span>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-[12px] pt-1 border-t border-slate-50">
                    <p className="text-slate-600">
                      Jawaban siswa:{' '}
                      <strong className={studentOk ? 'text-emerald-700' : 'text-rose-700'}>
                        {q.student_answer != null && q.student_answer !== ''
                          ? q.student_answer
                          : '— belum tercatat'}
                      </strong>
                      {q.student_answer != null && q.student_answer !== '' ? (
                        <span className="ml-1.5 text-[11px] font-medium">
                          {studentOk ? '(benar)' : '(salah)'}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-emerald-800">
                      Kunci: <strong>{q.correct_answer}</strong>
                    </p>
                  </div>

                  {q.explanation ? (
                    <p className="text-[12px] text-slate-500 whitespace-pre-wrap border-t border-slate-50 pt-2">
                      {q.explanation}
                    </p>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
