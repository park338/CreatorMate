import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from 'recharts'
import {
  Sparkles, User, Activity, Rocket, PenTool, BarChart3,
  ArrowRight, Users, Eye, Target, Clock, Layers3, RadioTower,
  RefreshCw, AlertTriangle, Fingerprint, MessageCircle, TrendingUp,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { api } from '../api/client.js'
import { Loading, SourceBadge } from '../components/ui.jsx'

const iconMap = { positioning: Target, supply: Layers3, reach: RadioTower, engagement: MessageCircle, growth: TrendingUp }
const priorityColor = {
  '高': 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-300',
  '中': 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300',
  '低': 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300',
  '待评估': 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300',
}
const isScored = (score) => Number.isFinite(score)
const scoreColor = (score) => !isScored(score) ? '#94a3b8' : score >= 85 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444'

export default function Dashboard() {
  const { onOpenAssistant } = useOutletContext() || {}
  const { profile, diagnosis, setDiagnosis } = useApp()
  const [diagLoading, setDiagLoading] = useState(false)

  useEffect(() => {
    if (!diagnosis && profile) {
      setDiagLoading(true)
      api.diagnose(profile)
        .then(setDiagnosis)
        .catch(() => {})
        .finally(() => setDiagLoading(false))
    }
  }, [])

  if (!profile) return null

  const h = profile.habits || {}
  const dna = h.styleDNA || {}
  const dims = diagnosis?.dimensions || []
  const scoredDims = dims.filter((d) => isScored(d.score))
  const chartData = scoredDims.map((d) => ({ subject: d.name, score: d.score }))
  const avgScore = scoredDims.length ? Math.round(scoredDims.reduce((sum, d) => sum + d.score, 0) / scoredDims.length) : null

  const stats = [
    { icon: Users, label: '当前粉丝', value: profile.currentFans, color: 'text-brand-500 dark:text-brand-400', bg: 'bg-brand-50 dark:bg-brand-950/40' },
    { icon: Target, label: '目标粉丝', value: profile.targetFans, color: 'text-grape-500 dark:text-grape-400', bg: 'bg-grape-50 dark:bg-grape-950/40' },
    { icon: Clock, label: '目标周期', value: profile.targetDays + '天', color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/40' },
    { icon: Eye, label: '平均播放', value: profile.avgViews, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40' },
  ]

  const functions = [
    { path: '/workshop', label: '创作工坊', icon: PenTool, desc: '你主导创作,AI 辅助优化', color: 'from-blue-400 to-grape-500' },
    { path: '/expert', label: '专家规划', icon: Rocket, desc: 'AI 自动生成规划与内容日历', color: 'from-grape-400 to-brand-500' },
    { path: '/style-lab', label: '风格培养仓', icon: Fingerprint, desc: '培养专属写作风格 DNA', color: 'from-purple-400 to-pink-500' },
    { path: '/review', label: '数据复盘', icon: BarChart3, desc: '发布数据复盘与优化', color: 'from-orange-400 to-amber-500' },
  ]

  const reDiagnose = async () => {
    setDiagnosis(null)
    setDiagLoading(true)
    try {
      setDiagnosis(await api.diagnose(profile))
    } finally {
      setDiagLoading(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto">
      {/* 欢迎横幅 */}
      <div className="card !p-6 bg-gradient-to-br from-grape-500/5 to-brand-500/5 border-brand-100/40">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-grape-500 to-brand-500 flex items-center justify-center text-white shadow-glow shrink-0">
            <Sparkles size={26} />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {h.nickname || '小伙伴'},你的专属画布已就绪!
            </h1>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
              {profile.accountName} · {profile.platform} · {profile.contentDirection}
            </p>
          </div>
        </div>
      </div>

      {/* 数据概览 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="card !p-4">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
              <s.icon size={16} className={s.color} />
            </div>
            <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{s.value}</div>
            <div className="text-xs text-slate-400 dark:text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* AI 诊断嵌入区 */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Activity size={15} className="text-grape-500 dark:text-grape-400" /> AI 五维诊断
          </h3>
          <div className="flex items-center gap-2">
            {diagnosis && <SourceBadge source={diagnosis.source} />}
            {diagnosis && (
              <button onClick={reDiagnose} className="btn-ghost text-xs py-1.5">
                <RefreshCw size={13} /> 重新诊断
              </button>
            )}
          </div>
        </div>

        {diagLoading ? (
          <Loading text="小悠正在为你的账号做 AI 五维诊断,约需 10 秒..." />
        ) : diagnosis ? (
          <>
            {diagnosis.summary && (
              <div className="flex items-center gap-4 mb-4 p-4 rounded-xl bg-gradient-to-r from-grape-500/8 to-brand-500/8">
                <div className="text-center shrink-0">
                  <div className="text-3xl font-black" style={{ color: scoreColor(avgScore) }}>{avgScore ?? '--'}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {scoredDims.length === 5 ? '综合得分' : '已评估均分'} · {scoredDims.length}/5
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium flex-1">{diagnosis.summary}</p>
              </div>
            )}

            <div className="grid lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                {chartData.length >= 3 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart data={chartData} outerRadius="75%">
                      <PolarGrid stroke="rgba(148,163,184,0.35)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Radar dataKey="score" stroke="#ec4899" fill="#ec4899" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 text-center px-6">
                    <Activity size={22} className="text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-300">至少3项有数据后显示雷达图</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">当前已评估 {scoredDims.length}/5 项</p>
                  </div>
                )}
              </div>

              <div className="lg:col-span-3 space-y-2">
                {dims.map((d) => {
                  const Icon = iconMap[d.key] || Activity
                  return (
                    <div key={d.key} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/35 border border-transparent dark:border-slate-700/50">
                      <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center shrink-0">
                        <Icon size={14} className="text-brand-500 dark:text-brand-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-100">{d.name}</span>
                          <span className={`tag ${priorityColor[d.priority] || priorityColor['低']}`}>
                            {d.priority === '待评估' ? '待评估' : `${d.priority}优先级`}
                          </span>
                          {d.confidence && <span className="text-[10px] text-slate-400 dark:text-slate-500">可信度 {d.confidence}</span>}
                        </div>
                        {d.evidence && <p className="mt-1 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{d.evidence}</p>}
                      </div>
                      <span className={`${isScored(d.score) ? 'text-lg' : 'text-xs mt-1'} font-bold shrink-0`} style={{ color: scoreColor(d.score) }}>
                        {isScored(d.score) ? d.score : '待评估'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {diagnosis.scoringNote && (
              <p className="mt-3 text-[11px] leading-5 text-slate-400 dark:text-slate-500">{diagnosis.scoringNote}</p>
            )}

            {diagnosis.priorities?.length > 0 && (
              <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-700">
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-4 flex items-center gap-2 tracking-wide">
                  <AlertTriangle size={14} className="text-orange-500 dark:text-orange-400" /> 优先级行动建议
                </h4>
                <div className="grid gap-4 lg:grid-cols-3">
                  {diagnosis.priorities.map((p) => (
                    <div key={p.rank} className="relative min-h-[132px] overflow-hidden rounded-2xl border border-[rgba(226,232,240,0.8)] bg-[rgba(255,255,255,0.72)] p-4 pl-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-[rgba(196,181,253,0.24)] dark:bg-[rgba(15,17,36,0.72)]">
                      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-grape-500 via-brand-500 to-mint-400" />
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <span className="inline-flex h-7 min-w-10 items-center justify-center rounded-lg bg-gradient-to-br from-grape-500 to-brand-500 px-2 text-[11px] font-black text-white shadow-glow">
                          #{String(p.rank).padStart(2, '0')}
                        </span>
                      </div>
                      <p className="text-sm font-semibold leading-6 text-slate-700 dark:text-slate-100">{p.action}</p>
                      <p className="mt-3 rounded-xl border border-mint-400/20 bg-mint-400/10 px-3 py-2 text-xs leading-5 text-emerald-600 dark:border-emerald-300/15 dark:bg-emerald-400/10 dark:text-emerald-300">{p.expected}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-sm text-slate-400 dark:text-slate-500">
            诊断加载失败,<button onClick={reDiagnose} className="text-brand-500 dark:text-brand-400">点击重试</button>
          </div>
        )}
      </div>

      {/* 个人习惯标签 */}
      <div className="card">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
          <User size={15} className="text-grape-500 dark:text-grape-400" /> 个人画像
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: '内容风格', value: h.contentStyle },
            { label: '口吻', value: h.tone },
            { label: '拍摄条件', value: h.shootCondition },
            { label: '活跃时段', value: h.activeTime },
            { label: '性格', value: h.personality },
            { label: '兴趣', value: h.interests },
          ].filter((t) => t.value).map((t, i) => (
            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50/60 dark:bg-brand-950/40 border border-brand-100/40">
              <span className="text-[10px] text-slate-400 dark:text-slate-500">{t.label}</span>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{t.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 功能入口卡片 */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
          <Rocket size={15} className="text-brand-500 dark:text-brand-400" /> 运营功能
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {functions.map((f) => (
            <Link key={f.path} to={f.path}
              className="card !p-5 hover:shadow-glow transition group cursor-pointer relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${f.color}`} />
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white shrink-0`}>
                  <f.icon size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-brand-600 transition">{f.label}</span>
                    <ArrowRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-brand-400 group-hover:translate-x-0.5 transition" />
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{f.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
