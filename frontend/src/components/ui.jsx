import { Loader2, Sparkles } from 'lucide-react'

export function Loading({ text = '小悠正在分析中...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-grape-500 to-brand-500 flex items-center justify-center text-white shadow-glow animate-pulse">
          <Sparkles size={28} />
        </div>
      </div>
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <Loader2 className="animate-spin" size={16} />
        <span className="text-sm">{text}</span>
      </div>
    </div>
  )
}

export function SectionTitle({ icon: Icon, title, desc }) {
  return (
    <div className="mb-6">
      <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-slate-100">
        {Icon && <Icon size={20} className="text-grape-500 dark:text-grape-400" />}
        {title}
      </h2>
      {desc && <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{desc}</p>}
    </div>
  )
}

export function SourceBadge({ source }) {
  if (!source) return null
  const isAI = source === 'ai'
  const isRules = source === 'rules'
  return (
    <span className={`tag ${isAI ? 'bg-mint-400/15 text-mint-500 dark:text-emerald-400' : isRules ? 'bg-blue-400/15 text-blue-600 dark:text-blue-300' : 'bg-orange-400/15 text-orange-500 dark:text-orange-400'}`}>
      <Sparkles size={11} /> {isAI ? 'AI 生成' : isRules ? '规则诊断' : '本地示例'}
    </span>
  )
}

export function Empty({ text, to, label }) {
  return (
    <div className="card text-center py-16">
      <p className="text-slate-400 dark:text-slate-500 mb-4">{text}</p>
      {to && <a href={to} className="btn-primary">{label}</a>}
    </div>
  )
}
