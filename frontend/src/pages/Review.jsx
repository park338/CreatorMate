import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3, Eye, Heart, Bookmark, MessageSquare, UserPlus,
  PlayCircle, TrendingUp, Lightbulb, ArrowRight, RefreshCw, RotateCcw,
  PenTool, Rocket, Fingerprint, Inbox,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { useApp } from '../context/AppContext.jsx'
import { api } from '../api/client.js'
import { Loading, SectionTitle, SourceBadge, Empty } from '../components/ui.jsx'

const statusColor = { '高于大盘': 'text-mint-500 bg-mint-400/10', '低于大盘': 'text-red-500 bg-red-50', '持平大盘': 'text-slate-500 bg-slate-100' }

export default function Review() {
  const navigate = useNavigate()
  const { profile, generatedContent, reviewData, setReviewData } = useApp()
  const [loading, setLoading] = useState(false)

  const title = generatedContent?.titles?.[0]?.text || ''

  const fetchReview = async () => {
    if (!profile || !title) return
    setLoading(true)
    setReviewData(null)
    try {
      const r = await api.review(profile, title)
      setReviewData(r)
    } catch (e) {
      alert('复盘失败:' + e.message)
    } finally {
      setLoading(false)
    }
  }

  // title 变化时重新复盘(每次从创作工坊/专家规划点"模拟发布"都会更新 generatedContent → title 变化 → 重新获取)
  useEffect(() => {
    if (profile && title) fetchReview()
  }, [title])

  if (!profile) return <Empty text="请先完成账号画像" to="/profile" label="去填写" />

  // 没有「模拟发布」过内容时,引导用户去创作
  if (!title) {
    return (
      <div className="animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div className="inline-flex items-center gap-2 bg-white/60 px-4 py-1.5 rounded-full text-xs text-grape-600">
            <BarChart3 size={12} /> 数据复盘
          </div>
        </div>
        <div className="card text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Inbox size={28} className="text-slate-300" />
          </div>
          <h3 className="text-base font-bold text-slate-700 mb-1.5">还没有复盘数据</h3>
          <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto leading-relaxed">
            先去创作工坊或专家规划生成内容并「模拟发布」,回来就能看到详细的复盘数据和优化建议了
          </p>
          <div className="flex justify-center gap-3">
            <button onClick={() => navigate('/workshop')} className="btn-ghost">
              <PenTool size={16} /> 去创作工坊
            </button>
            <button onClick={() => navigate('/expert')} className="btn-primary">
              <Rocket size={16} /> 去专家规划
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) return <Loading text="小悠正在复盘发布数据..." />

  const { metrics = {}, reasons = [], suggestions = [], analysis = '', source } = reviewData
  const trendData = (metrics.trend || []).map((v, i) => ({ day: metrics.dailyLabels?.[i] || `第${i + 1}天`, views: v }))

  const cards = [
    { icon: Eye, label: '播放量', value: metrics.views, color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: Heart, label: '点赞', value: metrics.likes, color: 'text-rose-500', bg: 'bg-rose-50' },
    { icon: Bookmark, label: '收藏', value: metrics.collects, color: 'text-amber-500', bg: 'bg-amber-50' },
    { icon: MessageSquare, label: '评论', value: metrics.comments, color: 'text-grape-500', bg: 'bg-grape-50' },
    { icon: UserPlus, label: '转粉', value: metrics.newFans, color: 'text-pink-500', bg: 'bg-pink-50' },
    { icon: PlayCircle, label: '完播率', value: metrics.completion, suffix: '%', color: 'text-mint-500', bg: 'bg-mint-400/10' },
    { icon: TrendingUp, label: 'CTR提升', value: metrics.ctrUp, suffix: '%', color: 'text-orange-500', bg: 'bg-orange-50' },
    { icon: Eye, label: '历史均值', value: metrics.avgViews, color: 'text-slate-400', bg: 'bg-slate-50' },
  ]

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div className="inline-flex items-center gap-2 bg-white/60 px-4 py-1.5 rounded-full text-xs text-grape-600">
          <BarChart3 size={12} /> 数据复盘
        </div>
        <div className="flex items-center gap-2">
          <SourceBadge source={source} />
          <button onClick={fetchReview} className="btn-ghost text-xs py-1.5"><RefreshCw size={13} /> 重新复盘</button>
        </div>
      </div>

      {title && <p className="text-sm text-slate-500 mb-4">复盘内容:<span className="text-slate-700 font-medium">「{title}」</span></p>}

      {/* 数据卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {cards.map((c, i) => (
          <div key={i} className="card !p-4">
            <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center mb-2`}>
              <c.icon size={16} className={c.color} />
            </div>
            <div className="text-2xl font-bold text-slate-800">{c.value}{c.suffix || ''}</div>
            <div className="text-xs text-slate-400">{c.label}</div>
          </div>
        ))}
      </div>

      {/* 趋势图 */}
      <div className="card mb-6">
        <SectionTitle icon={TrendingUp} title="播放趋势" />
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ec4899" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#cbd5e1' }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,.08)' }} />
            <Area type="monotone" dataKey="views" stroke="#ec4899" fill="url(#g)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 复盘分析 */}
      <div className="card mb-6">
        <SectionTitle icon={Lightbulb} title="复盘分析" />
        <p className="p-4 rounded-xl bg-gradient-to-r from-grape-500/8 to-brand-500/8 text-slate-700 font-medium mb-4">{analysis}</p>
        <div className="space-y-2">
          {reasons.map((r, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100">
              <span className={`tag ${statusColor[r.status] || statusColor['持平大盘']}`}>{r.status}</span>
              <div className="flex-1">
                <span className="text-sm font-medium text-slate-700">{r.metric}</span>
                <p className="text-xs text-slate-400 mt-0.5">{r.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 优化建议 */}
      <div className="card mb-6">
        <SectionTitle icon={TrendingUp} title="下一轮优化建议" desc="让每一轮都比上一轮更好" />
        <div className="grid md:grid-cols-3 gap-4">
          {suggestions.map((s, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-100 hover:shadow-soft transition">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-mint-400/15 text-mint-500 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <span className="tag bg-brand-50 text-brand-600">{s.target}</span>
              </div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">{s.action}</h4>
              <p className="text-xs text-slate-400">{s.how}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 闭环 */}
      <div className="card text-center py-8">
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="text-lg font-bold text-slate-700 mb-1">一轮完整运营闭环完成!</h3>
        <p className="text-sm text-slate-400 mb-5">画布 → 创作工坊 → 专家规划 → 数据复盘,循环迭代持续涨粉</p>
        <div className="flex justify-center gap-3">
          <button onClick={() => navigate('/expert')} className="btn-ghost">
            <RotateCcw size={16} /> 回到专家规划
          </button>
          <button onClick={() => navigate('/workshop')} className="btn-primary">
            下一轮优化 <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
