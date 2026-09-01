import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Rocket, Layers, CalendarDays, MessagesSquare, ArrowRight,
  Clock, Hash, Lightbulb, RefreshCw, ChevronDown, ChevronUp,
  Type, Zap, Film, Image, MessageCircle, Copy, Check, BarChart3,
  Sparkles,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { api } from '../api/client.js'
import { Loading, SectionTitle, SourceBadge, Empty } from '../components/ui.jsx'

const stageColors = ['from-grape-500 to-brand-500', 'from-brand-500 to-orange-400', 'from-orange-400 to-amber-400']

export default function ExpertPlan() {
  const navigate = useNavigate()
  const { profile, growthPlan, setGrowthPlan, setGeneratedContent } = useApp()
  const [loading, setLoading] = useState(false)
  const [expandedDay, setExpandedDay] = useState(null)
  const [contentLoading, setContentLoading] = useState(null)
  const [contentCache, setContentCache] = useState({})
  const [imageLoading, setImageLoading] = useState({})
  const [imageCache, setImageCache] = useState({})
  const [copied, setCopied] = useState('')

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

  const expandDay = async (day, topic) => {
    if (expandedDay === day) { setExpandedDay(null); return }
    setExpandedDay(day)
    if (!contentCache[day]) {
      setContentLoading(day)
      try {
        const result = await api.generateContent(topic, profile)
        setContentCache((prev) => ({ ...prev, [day]: result }))
        // 内容生成成功后自动触发封面图生成
        if (result.cover) {
          fetchCoverImage(day, result.cover)
        }
      } catch (e) {
        alert('生成内容失败:' + e.message)
      } finally {
        setContentLoading(null)
      }
    }
  }

  const fetchCoverImage = async (day, cover) => {
    setImageLoading((prev) => ({ ...prev, [day]: true }))
    try {
      const r = await api.coverImage(cover, profile.platform || '小红书')
      if (r.image_url) {
        setImageCache((prev) => ({ ...prev, [day]: r.image_url }))
      }
    } catch (e) {
      // 降级：不显示图片，用 CSS 封面
    } finally {
      setImageLoading((prev) => ({ ...prev, [day]: false }))
    }
  }

  const copy = (text, key) => {
    navigator.clipboard?.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 1500)
  }

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div className="inline-flex items-center gap-2 bg-white/60 px-4 py-1.5 rounded-full text-xs text-grape-600">
          <Rocket size={12} /> 专家规划
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

      {/* 内容日历(可展开生成内容 + 封面图) */}
      <div className="card mb-6">
        <SectionTitle icon={CalendarDays} title="内容日历" desc="点击选题展开,AI 自动生成完整内容包 + 封面配图" />
        <div className="space-y-2">
          {calendar.map((c, i) => {
            const expanded = expandedDay === c.day
            const content = contentCache[c.day]
            const isLoading = contentLoading === c.day
            const coverImg = imageCache[c.day]
            const imgLoading = imageLoading[c.day]
            return (
              <div key={i} className="rounded-xl border border-slate-100 overflow-hidden">
                {/* 日历行 */}
                <button onClick={() => expandDay(c.day, c.topic)}
                  className={`w-full flex items-center gap-3 p-3 transition text-left
                    ${expanded ? 'bg-brand-50/40' : 'hover:bg-slate-50/50'}`}>
                  <span className="w-12 text-center font-bold text-grape-600 text-sm">{c.date}</span>
                  <span className="tag bg-grape-500/10 text-grape-600 shrink-0">{c.column}</span>
                  <span className="flex-1 text-sm text-slate-600 truncate">{c.topic}</span>
                  <span className="text-xs text-slate-400 hidden sm:flex items-center gap-1"><Clock size={10} />{c.time}</span>
                  {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </button>

                {/* 展开的内容包(上下排列) */}
                {expanded && (
                  <div className="p-4 bg-slate-50/30 border-t border-slate-100 animate-slide-up">
                    {isLoading ? (
                      <Loading text="小悠正在为这条选题生成完整内容包..." />
                    ) : content ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <SourceBadge source={content.source} />
                          <span className="text-xs text-slate-400">AI 生成的完整内容包</span>
                        </div>

                        {/* 1. 封面图(顶部,全宽) */}
                        {content.cover && (
                          <div className="rounded-xl overflow-hidden border border-slate-100">
                            <div className="flex items-center justify-between px-3 py-2 bg-white">
                              <h5 className="text-xs font-bold text-slate-600 flex items-center gap-1">
                                <Image size={12} className="text-brand-500" /> AI 封面配图
                              </h5>
                              <span className="text-[10px] text-slate-400">{content.cover.title} · {content.cover.subtitle}</span>
                            </div>
                            {imgLoading ? (
                              <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-grape-100 to-brand-100">
                                <div className="text-center">
                                  <RefreshCw size={20} className="text-brand-400 animate-spin mx-auto mb-1" />
                                  <p className="text-xs text-slate-400">正在生成封面图...</p>
                                </div>
                              </div>
                            ) : coverImg ? (
                              <img src={coverImg} alt="封面配图" className="w-full max-h-64 object-cover" />
                            ) : (
                              <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-grape-400 to-brand-400">
                                <Sparkles size={28} className="text-white/40" />
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. 标题候选 */}
                        <div>
                          <h5 className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1"><Type size={12} className="text-brand-500" /> 标题候选</h5>
                          <div className="space-y-1.5">
                            {content.titles?.map((t, j) => (
                              <div key={j} className="flex items-center gap-2 p-2 rounded-lg bg-white">
                                <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-600 text-[10px] font-bold flex items-center justify-center shrink-0">{j + 1}</span>
                                <span className="flex-1 text-sm text-slate-700">{t.text}</span>
                                <span className="tag bg-slate-100 text-slate-400 hidden sm:inline">{t.style}</span>
                                <button onClick={() => copy(t.text, `t${c.day}-${j}`)} className="text-slate-300 hover:text-brand-500">
                                  {copied === `t${c.day}-${j}` ? <Check size={12} className="text-mint-500" /> : <Copy size={12} />}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 3. 前三秒钩子 */}
                        {content.hook && (
                          <div>
                            <h5 className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1"><Zap size={12} className="text-orange-500" /> 前三秒钩子</h5>
                            <div className="p-3 rounded-lg bg-orange-400/10 border border-orange-400/20">
                              <p className="text-sm text-slate-700 font-medium">"{content.hook}"</p>
                            </div>
                          </div>
                        )}

                        {/* 4. 视频脚本(全宽,不再分栏) */}
                        {content.script?.length > 0 && (
                          <div>
                            <h5 className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1"><Film size={12} className="text-grape-500" /> 视频脚本</h5>
                            <div className="space-y-1.5">
                              {content.script.map((s, j) => (
                                <div key={j} className="p-2.5 rounded-lg bg-white">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="w-6 h-6 rounded bg-grape-100 text-grape-600 text-[10px] font-bold flex items-center justify-center shrink-0">幕{j + 1}</span>
                                    <span className="text-[11px] text-slate-400">{s.scene}</span>
                                  </div>
                                  <div className="pl-8 grid gap-1 text-[11px]">
                                    <div><span className="text-slate-400">口播:</span><span className="text-slate-600 ml-1">{s.voice}</span></div>
                                    <div><span className="text-slate-400">字幕:</span><span className="text-slate-600 ml-1">{s.subtitle}</span></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 5. 话题标签 */}
                        {content.hashtags?.length > 0 && (
                          <div>
                            <h5 className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1"><Hash size={12} className="text-brand-500" /> 话题标签</h5>
                            <div className="flex flex-wrap gap-1">
                              {content.hashtags.map((t, j) => (
                                <span key={j} className="tag bg-brand-50 text-brand-600">{t}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 6. 评论话术 */}
                        {content.comments && (
                          <div>
                            <h5 className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1"><MessageCircle size={12} className="text-grape-500" /> 评论互动话术</h5>
                            <div className="space-y-1.5">
                              {content.comments.pinned && (
                                <div className="p-2.5 rounded-lg bg-mint-400/8 border border-mint-400/20">
                                  <span className="text-[10px] text-mint-500 font-medium">置顶评论</span>
                                  <p className="text-xs text-slate-600 mt-0.5">{content.comments.pinned}</p>
                                </div>
                              )}
                              {content.comments.prompts?.map((p, j) => (
                                <div key={j} className="p-2 rounded-lg bg-white">
                                  <span className="text-[10px] text-slate-400">引导话术 {j + 1}</span>
                                  <p className="text-xs text-slate-600 mt-0.5">{p}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 操作按钮 */}
                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                          <button onClick={() => { setGeneratedContent(content); navigate('/review') }} className="btn-primary text-xs py-2 flex-1 justify-center">
                            <BarChart3 size={14} /> 模拟发布并复盘
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 text-center py-4">内容生成失败,<button onClick={() => expandDay(c.day, c.topic)} className="text-brand-500">重试</button></p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => navigate('/review')} className="btn-primary">
          去数据复盘 <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
