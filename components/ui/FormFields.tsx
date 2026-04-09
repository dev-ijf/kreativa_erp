'use client';

import {
  ReactNode,
  Children,
  isValidElement,
  useMemo,
  useState,
  useEffect,
  useId,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import ReactSelect, { StylesConfig, SingleValue } from 'react-select';

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
  `w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-[13.5px] outline-none transition-all placeholder:text-slate-400
   focus:ring-2 ${error ? 'border-rose-400 focus:ring-rose-500/20' : 'focus:border-slate-400 focus:ring-slate-400/20'}`;

export function Input({ error, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return <input className={`${inputCls(error)} ${className ?? ''}`} {...props} />;
}

type RsOption = { value: string; label: string; disabled?: boolean };

function optionLabel(node: ReactNode): string {
  if (node == null || node === false) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(optionLabel).join('');
  if (isValidElement(node)) {
    const ch = (node.props as { children?: ReactNode }).children;
    return optionLabel(ch);
  }
  return '';
}

function parseOptions(children: ReactNode): RsOption[] {
  const out: RsOption[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type !== 'option') return;
    const p = child.props as React.OptionHTMLAttributes<HTMLOptionElement> & { children?: ReactNode };
    const value = p.value != null ? String(p.value) : '';
    const label = optionLabel(p.children) || value;
    out.push({ value, label, disabled: !!p.disabled });
  });
  return out;
}

export function Select({
  error,
  children,
  value: valueProp,
  defaultValue,
  onChange,
  disabled,
  id,
  name,
  autoFocus,
  required,
  className,
  variant = 'default',
  onBlur,
  onFocus,
  form,
  size: _size,
  multiple: _multiple,
}: SelectHTMLAttributes<HTMLSelectElement> & { error?: string; variant?: 'default' | 'compact' }) {
  const options = useMemo(() => parseOptions(children), [children]);
  const isControlled = valueProp !== undefined;
  const [internal, setInternal] = useState(() => String(defaultValue ?? ''));
  const current = isControlled ? String(valueProp ?? '') : internal;

  const selected = useMemo(
    () => options.find((o) => o.value === current) ?? null,
    [options, current]
  );

  const handleChange = (opt: SingleValue<RsOption>) => {
    const v = opt?.value ?? '';
    if (!isControlled) setInternal(v);
    const synthetic = {
      target: { value: v, name: name ?? '' },
      currentTarget: { value: v, name: name ?? '' },
    } as React.ChangeEvent<HTMLSelectElement>;
    onChange?.(synthetic);
  };

  const borderIdle = error ? '#f87171' : '#e2e8f0';
  const borderFocus = error ? '#f87171' : '#94a3b8';
  const focusRing = error ? 'rgba(244, 63, 94, 0.2)' : 'rgba(148, 163, 184, 0.2)';

  const minH = variant === 'compact' ? 32 : 42;
  const fontSize = variant === 'compact' ? '12px' : '13.5px';

  const styles: StylesConfig<RsOption, false> = {
    control: (base, state) => ({
      ...base,
      minHeight: minH,
      borderRadius: 8,
      borderColor: state.isFocused ? borderFocus : borderIdle,
      boxShadow: state.isFocused ? `0 0 0 2px ${focusRing}` : 'none',
      fontSize,
      cursor: 'pointer',
      '&:hover': { borderColor: error ? '#f87171' : '#cbd5e1' },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: variant === 'compact' ? '0 6px' : '2px 8px',
    }),
    singleValue: (base) => ({ ...base, color: '#334155' }),
    input: (base) => ({ ...base, margin: 0, padding: 0 }),
    placeholder: (base) => ({ ...base, color: '#94a3b8' }),
    menu: (base) => ({
      ...base,
      borderRadius: 8,
      overflow: 'hidden',
      border: '1px solid #e2e8f0',
      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.08)',
      zIndex: 9999,
    }),
    menuPortal: (base) => ({ ...base, zIndex: 10000 }),
    menuList: (base) => ({ ...base, padding: 4 }),
    option: (base, state) => ({
      ...base,
      fontSize,
      cursor: 'pointer',
      backgroundColor: state.isSelected ? '#7c3aed' : state.isFocused ? '#f1f5f9' : 'white',
      color: state.isSelected ? 'white' : '#334155',
    }),
    indicatorsContainer: (base) => ({ ...base, height: minH - 2 }),
    dropdownIndicator: (base) => ({ ...base, padding: variant === 'compact' ? 4 : 8 }),
  };

  const hasEmptyOption = options.some((o) => o.value === '');
  const reactId = useId();
  const instanceId = (id ?? reactId).replace(/:/g, '');

  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  return (
    <div className={[className, 'w-full'].filter(Boolean).join(' ')}>
      {name != null && name !== '' && (
        <input type="hidden" name={name} value={current} readOnly form={form} aria-hidden />
      )}
      <ReactSelect<RsOption, false>
        instanceId={instanceId}
        inputId={id}
        options={options}
        value={selected}
        onChange={handleChange}
        onBlur={onBlur as React.FocusEventHandler<HTMLInputElement> | undefined}
        onFocus={onFocus as React.FocusEventHandler<HTMLInputElement> | undefined}
        isDisabled={disabled}
        isSearchable
        isClearable={false}
        autoFocus={autoFocus}
        required={required}
        aria-invalid={error ? true : undefined}
        styles={styles}
        menuPosition="fixed"
        menuPortalTarget={portalTarget}
        placeholder={hasEmptyOption ? undefined : 'Pilih...'}
        noOptionsMessage={() => 'Tidak ada data'}
        classNamePrefix="rs"
        filterOption={(option, input) => {
          if (!input) return true;
          const q = input.toLowerCase();
          return (
            option.label.toLowerCase().includes(q) ||
            option.value.toLowerCase().includes(q)
          );
        }}
      />
    </div>
  );
}

export function Textarea({
  error,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string; rows?: number }) {
  return (
    <textarea
      className={`${inputCls(error)} resize-none ${className ?? ''}`}
      rows={props.rows ?? 3}
      {...props}
    />
  );
}

export function MoneyInput({
  value,
  onChange,
  error,
  className,
  placeholder,
  disabled,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  value: string | number;
  onChange: (val: string) => void;
  error?: string;
}) {
  const format = (val: string | number) => {
    const n = typeof val === 'number' ? val : parseFloat(val.replace(/[^0-9]/g, ''));
    if (isNaN(n)) return '';
    return new Intl.NumberFormat('id-ID').format(n);
  };

  const [display, setDisplay] = useState(format(value));

  useEffect(() => {
    setDisplay(format(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setDisplay(format(raw));
    onChange(raw);
  };

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[13px] font-semibold pointer-events-none">Rp</div>
      <input
        {...props}
        type="text"
        value={display}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`${inputCls(error)} pl-9 text-right font-medium ${className ?? ''}`}
      />
    </div>
  );
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
