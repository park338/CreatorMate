import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Rocket, Layers, CalendarDays, MessagesSquare, ArrowRight,
  Clock, Hash, Lightbulb, RefreshCw,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { api } from '../api/client.js'
import { Loading, SectionTitle, SourceBadge, Empty } from '../components/ui.jsx'

const stageColors = ['from-grape-500 to-brand-500', 'from-brand-500 to-orange-400', 'from-orange-400 to-amber-400']

export default function GrowthPlan() {
  const navigate = useNavigate()
  const { profile, growthPlan, setGrowthPlan } = useApp()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!growthPlan && profile) {
      setLoading(true)
      api.growthPlan(profile)
        .then(setGrowthPlan)
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [])

  if (!profile) return <Empty text="请先完成账号画像" to="/profile" label="去填写" />
  if (loading || !growthPlan) return <Loading text="小悠正在制定你的专属增长规划..." />

  const { stages = [], columns = [], schedule = [], interaction = {}, calendar = [], source } = growthPlan
  const regen = async () => {
    setGrowthPlan(null); setLoading(true)
    try { setGrowthPlan(await api.growthPlan(profile)) } finally { setLoading(false) }
  }

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div className="inline-flex items-center gap-2 bg-white/60 px-4 py-1.5 rounded-full text-xs text-grape-600">
          <Rocket size={12} /> 第三步 · 增长规划
        </div>
        <div className="flex items-center gap-2">
          <SourceBadge source={source} />
          <button onClick={regen} className="btn-ghost text-xs py-1.5"><RefreshCw size={13} /> 重新生成</button>
        </div>
      </div>

      {/* 阶段目标 */}
      <div className="mb-6">
        <SectionTitle icon={Rocket} title="阶段目标" desc="把目标周期拆解为可执行的阶段" />
        <div className="grid md:grid-cols-3 gap-4">
          {stages.map((s, i) => (
            <div key={i} className="relative card overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stageColors[i % 3]}`} />
              <div className="flex items-center justify-between mb-3">
                <span className={`font-bold text-lg bg-gradient-to-r ${stageColors[i % 3]} bg-clip-text text-transparent`}>{s.name}</span>
                <span className="text-xs text-slate-400">{s.range}</span>
              </div>
              <p className="text-sm text-slate-600 mb-3 font-medium">{s.goal}</p>
              <div className="text-xs text-slate-400 mb-2"><Lightbulb size={11} className="inline mr-1" />{s.focus}</div>
              <ul className="space-y-1.5">
                {s.actions?.map((a, j) => (
                  <li key={j} className="text-xs text-slate-500 flex items-start gap-1.5">
                    <span className="text-brand-400 mt-0.5">•</span>{a}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 内容栏目 + 发布时间 */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <SectionTitle icon={Layers} title="内容栏目" />
          <div className="space-y-3">
            {columns.map((c, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-brand-50/40 hover:bg-brand-50 transition">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-grape-400 to-brand-400 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {c.name?.[0] || '栏'}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-slate-700">{c.name}</span>
                    <span className="tag bg-grape-500/10 text-grape-600">{c.freq}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{c.desc}</p>
                  <p className="text-xs text-brand-500 mt-1">例:{c.example}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <SectionTitle icon={Clock} title="发布时间建议" />
          <div className="space-y-3">
            {schedule.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100">
                <span className="w-12 text-center font-bold text-grape-600">{s.day}</span>
                <div className="flex-1">
                  <div className="flex flex-wrap gap-1.5">
                    {s.slots?.map((slot, j) => (
                      <span key={j} className="tag bg-brand-50 text-brand-600"><Clock size={10} />{slot}</span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{s.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 互动策略 */}
      <div className="card mb-6">
        <SectionTitle icon={MessagesSquare} title="互动策略" />
        <p className="text-sm text-slate-600 mb-3 font-medium">{interaction.strategy}</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {interaction.tactics?.map((t, i) => (
            <div key={i} className="p-3 rounded-xl bg-mint-400/8 border border-mint-400/20">
              <MessagesSquare size={14} className="text-mint-500 mb-1.5" />
              <p className="text-xs text-slate-600">{t}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 7天日历 */}
      <div className="card mb-6">
        <SectionTitle icon={CalendarDays} title="7 天内容日历" desc="照着发就行" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                <th className="py-2 pr-4">日期</th>
                <th className="py-2 pr-4">栏目</th>
                <th className="py-2 pr-4">选题</th>
                <th className="py-2 pr-4">时间</th>
                <th className="py-2">目标</th>
              </tr>
            </thead>
            <tbody>
              {calendar.map((c, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-brand-50/30 transition">
                  <td className="py-3 pr-4"><span className="font-medium text-grape-600">{c.date}</span></td>
                  <td className="py-3 pr-4"><span className="tag bg-grape-500/10 text-grape-600">{c.column}</span></td>
                  <td className="py-3 pr-4 text-slate-600 max-w-xs">{c.topic}</td>
                  <td className="py-3 pr-4 text-slate-400 text-xs"><Clock size={10} className="inline mr-1" />{c.time}</td>
                  <td className="py-3 text-xs text-slate-400">{c.goal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => navigate('/content')} className="btn-primary">
          去生成内容 <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
