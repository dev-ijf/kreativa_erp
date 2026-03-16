import { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, required, error, hint, children }: FieldProps) {
  return (
    <div>
      <label className="block text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
}

const inputCls = (error?: string) =>
  `w-full bg-white border border-[#E2E8F1] rounded-lg px-3 py-2.5 text-[13.5px] outline-none transition-all placeholder:text-slate-400
   focus:ring-2 ${error ? 'border-rose-400 focus:ring-rose-500/20' : 'border-violet-400 focus:ring-violet-500/20'}`;

export function Input({ error, ...props }: InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return <input className={inputCls(error)} {...props} />;
}

export function Select({ error, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) {
  return (
    <select className={`${inputCls(error)} appearance-none`} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ error, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string; rows?: number }) {
  return <textarea className={`${inputCls(error)} resize-none`} rows={props.rows ?? 3} {...props} />;
}

interface BadgeProps {
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  children: ReactNode;
}

const badgeVariants = {
  success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  danger: 'bg-rose-100 text-rose-700 border-rose-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
};

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeVariants[variant]}`}>
      {children}
    </span>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md';
  loading?: boolean;
}

const btnVariants = {
  primary: 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm',
  danger: 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-600',
  outline: 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50',
};
const btnSizes = { sm: 'px-3 py-1.5 text-[12px]', md: 'px-4 py-2.5 text-[13px]' };

export function Button({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center gap-2 font-semibold rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed
        ${btnVariants[variant]} ${btnSizes[size]} ${className}`}
    >
      {loading && (
        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
          <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" className="opacity-75" />
        </svg>
      )}
      {children}
    </button>
  );
}
