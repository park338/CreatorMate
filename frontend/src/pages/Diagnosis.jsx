import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'
import {
  Activity, Target, Layers3, RadioTower, MessageCircle, TrendingUp,
  ArrowRight, RefreshCw, AlertTriangle,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { api } from '../api/client.js'
import { Loading, SectionTitle, SourceBadge, Empty } from '../components/ui.jsx'

const iconMap = { positioning: Target, supply: Layers3, reach: RadioTower, engagement: MessageCircle, growth: TrendingUp }
const priorityColor = {
  '高': 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300',
  '中': 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300',
  '低': 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300',
  '待评估': 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300',
}
const isScored = (score) => Number.isFinite(score)
const scoreColor = (score) => !isScored(score) ? '#94a3b8' : score >= 85 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444'

export default function Diagnosis() {
  const navigate = useNavigate()
  const { profile, diagnosis, setDiagnosis, setGrowthPlan } = useApp()
  const [loading, setLoading] = useState(false)
  const [planning, setPlanning] = useState(false)

  useEffect(() => {
    if (!diagnosis && profile) {
      setLoading(true)
      api.diagnose(profile)
        .then(setDiagnosis)
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [])

  if (!profile) return <Empty text="请先完成账号画像" to="/profile" label="去填写" />
  if (loading || !diagnosis) return <Loading text="小悠正在为你的账号做 AI 五维诊断,约需 10 秒..." />

  const { dimensions = [], summary = '', priorities = [], source, scoringNote = '' } = diagnosis
  const chartData = dimensions.filter((d) => isScored(d.score)).map((d) => ({ subject: d.name, score: d.score }))

  const goPlan = async () => {
    setPlanning(true)
    try {
      const plan = await api.growthPlan(profile)
      setGrowthPlan(plan)
      navigate('/growth-plan')
    } catch (e) {
      alert('生成规划失败:' + e.message)
    } finally {
      setPlanning(false)
    }
  }

  const reDiagnose = async () => {
    setDiagnosis(null)
    setLoading(true)
    try {
      const r = await api.diagnose(profile)
      setDiagnosis(r)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-2">
        <div className="inline-flex items-center gap-2 bg-white/60 dark:bg-slate-900/50 px-4 py-1.5 rounded-full text-xs text-grape-600 dark:text-grape-300">
          <Activity size={12} /> 第二步 · AI 五维诊断
        </div>
        <div className="flex items-center gap-2">
          <SourceBadge source={source} />
          <button onClick={reDiagnose} className="btn-ghost text-xs py-1.5"><RefreshCw size={13} /> 重新诊断</button>
        </div>
      </div>
      <p className="text-slate-600 dark:text-slate-300 mb-2">{summary}</p>
      {scoringNote && <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">{scoringNote}</p>}

      <div className="grid lg:grid-cols-5 gap-6">
        {/* 雷达图 */}
        <div className="card lg:col-span-2">
          <SectionTitle title="五维评分雷达" />
          {chartData.length >= 3 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={chartData} outerRadius="75%">
                <PolarGrid stroke="rgba(148,163,184,0.35)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Radar dataKey="score" stroke="#ec4899" fill="#ec4899" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 px-6">
              <Activity size={24} className="text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-300">至少3项有数据后显示雷达图</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">当前已评估 {chartData.length}/5 项</p>
            </div>
          )}
        </div>

        {/* 五维详情 */}
        <div className="lg:col-span-3 space-y-3">
          {dimensions.map((d) => {
            const Icon = iconMap[d.key] || Activity
            return (
              <div key={d.key} className="card !p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-brand-500 dark:text-brand-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-700 dark:text-slate-100">{d.name}</span>
                      <span className={`tag ${priorityColor[d.priority] || priorityColor['低']}`}>
                        {d.priority === '待评估' ? '待评估' : `${d.priority}优先级`}
                      </span>
                      {d.confidence && <span className="text-[10px] text-slate-400 dark:text-slate-500">可信度 {d.confidence}</span>}
                    </div>
                    <span className={`${isScored(d.score) ? 'text-lg' : 'text-xs mt-1'} font-bold shrink-0`} style={{ color: scoreColor(d.score) }}>
                      {isScored(d.score) ? d.score : '待评估'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-300 leading-relaxed">{d.desc}</p>
                  {d.evidence && <p className="mt-2 text-xs text-slate-400 dark:text-slate-500 leading-relaxed">依据：{d.evidence}</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 优先级建议 */}
      <div className="card mt-6">
        <SectionTitle icon={Target} title="优先级行动建议" desc="按影响力排序,先做最重要的事" />
        <div className="grid md:grid-cols-3 gap-4">
          {priorities.map((p) => (
            <div key={p.rank} className="rounded-xl border border-slate-100 dark:border-slate-700 p-4 hover:shadow-soft transition bg-white/50 dark:bg-slate-900/35">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-grape-500 to-brand-500 text-white text-xs font-bold flex items-center justify-center">
                  {p.rank}
                </span>
                {p.rank === 1 && <AlertTriangle size={14} className="text-orange-500" />}
              </div>
              <h4 className="font-medium text-slate-700 dark:text-slate-100 mb-2 text-sm">{p.action}</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">{p.reason}</p>
              <div className="flex items-start gap-1 text-xs text-mint-500 dark:text-emerald-300">
                <ArrowRight size={12} className="mt-0.5 shrink-0" /> {p.expected}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button onClick={goPlan} disabled={planning} className="btn-primary">
          {planning ? <Loading text="" /> : null}
          制定增长规划 <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
