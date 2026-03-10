/**
 * UI Bileşenleri — globals.css sınıflarına dayalı React sarmalayıcılar.
 * Wireframe'deki tüm tekrarlayan UI elementleri burada merkezi olarak tanımlı.
 */
import { clsx } from 'clsx'

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children:  React.ReactNode
  className?: string
  accent?:   'orange' | 'green' | 'brown' | 'blue'
}

export function Card({ children, className, accent }: CardProps) {
  return (
    <div
      className={clsx(
        'card',
        accent && 'border-t-[3px]',
        accent === 'orange' && 'border-t-orange',
        accent === 'green'  && 'border-t-green',
        accent === 'brown'  && 'border-t-brown',
        accent === 'blue'   && 'border-t-blue-500',
        className
      )}
    >
      {children}
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label:   string
  value:   string | number
  change?: string
  icon?:   string
  accent?: 'orange' | 'green' | 'brown' | 'blue'
}

export function StatCard({ label, value, change, icon, accent = 'orange' }: StatCardProps) {
  return (
    <Card accent={accent} className="relative overflow-hidden">
      {icon && (
        <span className="absolute right-4 top-5 text-[28px] opacity-15">{icon}</span>
      )}
      <div className="text-[11px] text-gray uppercase tracking-wide font-semibold">
        {label}
      </div>
      <div className="font-serif text-[32px] font-bold text-brown my-1.5">
        {value}
      </div>
      {change && (
        <div className="text-xs text-green font-medium">{change}</div>
      )}
    </Card>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'orange' | 'green' | 'gray' | 'red' | 'blue'

interface BadgeProps {
  children:  React.ReactNode
  variant?:  BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span className={clsx(`badge badge-${variant}`, className)}>
      {children}
    </span>
  )
}

// ─── Button ───────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'green' | 'danger'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?:    'sm' | 'md'
  loading?: boolean
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'btn',
        `btn-${variant}`,
        size === 'sm' && 'btn-sm',
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="animate-spin">⏳</span>}
      {children}
    </button>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

interface ToggleProps {
  checked:   boolean
  onChange:  (checked: boolean) => void
  disabled?: boolean
}

export function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      className={clsx('toggle', checked && 'on', disabled && 'opacity-50 cursor-not-allowed')}
    />
  )
}

// ─── StockBar ─────────────────────────────────────────────────────────────────

interface StockBarProps {
  current: number
  total:   number
}

export function StockBar({ current, total }: StockBarProps) {
  const pct = total > 0 ? (current / total) * 100 : 0
  const level = pct <= 0 ? 'critical' : pct <= 30 ? 'low' : ''

  return (
    <div className="stock-bar">
      <div
        className={clsx('stock-fill', level)}
        style={{ width: `${Math.max(0, pct)}%` }}
      />
    </div>
  )
}

// ─── ProgressSteps ────────────────────────────────────────────────────────────

interface Step {
  label: string
  icon?: string
}

interface ProgressStepsProps {
  steps:       Step[]
  currentStep: number  // 0-indexed
}

export function ProgressSteps({ steps, currentStep }: ProgressStepsProps) {
  return (
    <div className="flex items-center">
      {steps.map((step, i) => {
        const done    = i < currentStep
        const current = i === currentStep

        return (
          <div key={i} className="flex flex-col items-center flex-1 relative">
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div
                className={clsx(
                  'absolute top-3.5 left-1/2 w-full h-0.5 z-0',
                  done ? 'bg-green' : 'bg-gray-light'
                )}
              />
            )}

            {/* Dot */}
            <div
              className={clsx(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs relative z-10',
                done    && 'bg-green text-white',
                current && 'bg-orange text-white',
                !done && !current && 'bg-gray-light text-gray'
              )}
            >
              {done ? '✓' : step.icon ?? (i + 1)}
            </div>

            {/* Label */}
            <div
              className={clsx(
                'text-[10px] mt-1 text-center',
                (done || current) ? 'text-brown font-semibold' : 'text-gray'
              )}
            >
              {step.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Rozet ────────────────────────────────────────────────────────────────────

type RozetVariant = 'gold' | 'silver' | 'green' | 'crown'

interface RozetProps {
  variant: RozetVariant
  children: React.ReactNode
}

export function Rozet({ variant, children }: RozetProps) {
  return (
    <span className={`rozet rozet-${variant}`}>{children}</span>
  )
}
