import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from 'recharts'
import {
  Fingerprint, Tag, Sparkles, Target, Users, TrendingUp, Zap, Heart,
  Brain, Sword, Wifi, ArrowRight, FileText, RotateCcw, ShieldCheck,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { Empty } from '../components/ui.jsx'
import { STYLE_DIMENSIONS, getStyleStage } from '../utils/styleDNA.js'

const dimColors = {
  幽默: '#f59e0b', 情绪: '#ec4899', 专业: '#3b82f6',
  亲和: '#10b981', 犀利: '#ef4444', 网感: '#8b5cf6',
}

const dimDesc = {
  幽默: '梗 / 段子 / 逗趣',
  情绪: '情感共鸣 / 走心',
  专业: '干货 / 信息密度',
  亲和: '像朋友聊天',
  犀利: '观点 / 态度',
  网感: 'emoji / 热词 / 梗',
}

const dimIcons = {
  幽默: Zap, 情绪: Heart, 专业: Brain,
  亲和: Users, 犀利: Sword, 网感: Wifi,
}

function dimLevel(value) {
  if (value >= 80) return { label: '极强', color: '#10b981' }
  if (value >= 60) return { label: '较强', color: '#3b82f6' }
  if (value >= 40) return { label: '中等', color: '#f59e0b' }
  if (value >= 20) return { label: '较弱', color: '#f97316' }
  return { label: '极弱', color: '#ef4444' }
}

function SampleProgress({ sampleCount }) {
  return (
    <div className="flex items-center gap-2" aria-label={`已积累${sampleCount}篇风格样本`}>
      {[1, 2, 3].map((step) => (
        <span
          key={step}
          className={`h-1.5 w-10 rounded-full transition-colors ${sampleCount >= step ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700'}`}
        />
      ))}
      <span className="ml-1 text-xs font-medium text-slate-500 dark:text-slate-400">
        {Math.min(sampleCount, 3)}/3
      </span>
    </div>
  )
}

function UntrainedState({ profile, onStart }) {
  const preferences = [profile.habits?.contentStyle, profile.habits?.tone, profile.targetAudience].filter(Boolean)
  return (
    <div className="card !p-0 overflow-hidden">
      <div className="grid lg:grid-cols-[1.2fr_0.8fr] min-h-[430px]">
        <div className="p-7 sm:p-10 flex flex-col justify-center">
          <div className="w-14 h-14 rounded-xl bg-brand-50 dark:bg-brand-500/15 flex items-center justify-center mb-6">
            <Fingerprint size={26} className="text-brand-500 dark:text-pink-300" />
          </div>
          <span className="text-xs font-semibold text-brand-600 dark:text-pink-300 mb-2">0 篇已确认定稿</span>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">尚未建立风格画像</h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-300">
            风格分数只从你修改并确认过的正文中学习。完成第一篇定稿后，这里会生成低可信度的初步画像。
          </p>
          <div className="mt-6">
            <div className="mb-2 text-xs text-slate-400 dark:text-slate-500">当前创作偏好，不作为分析分数</div>
            <div className="flex flex-wrap gap-2">
              {preferences.map((preference) => (
                <span key={preference} className="tag bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  {preference}
                </span>
              ))}
            </div>
          </div>
          <button onClick={onStart} className="btn-primary mt-8 w-fit">
            <FileText size={16} /> 去完成第一篇定稿 <ArrowRight size={15} />
          </button>
        </div>

        <div className="border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-700/70 bg-slate-50/55 dark:bg-slate-900/35 p-7 sm:p-9 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-5">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-100">画像建立进度</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">可信度 待建立</span>
          </div>
          <SampleProgress sampleCount={0} />
          <div className="mt-8 space-y-5">
            {[
              ['01', '确认第一篇定稿', '形成初步画像'],
              ['02', '积累不同主题表达', '降低单篇偶然性'],
              ['03', '完成三篇有效样本', '解锁完整强弱判断'],
            ].map(([index, title, desc]) => (
              <div key={index} className="flex items-start gap-3">
                <span className="text-xs font-black text-slate-300 dark:text-slate-600 mt-0.5">{index}</span>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-200">{title}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function DimensionControl({ dim, value, baseline, color, onChange }) {
  const barRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const level = dimLevel(value)
  const Icon = dimIcons[dim] || Target

  const calcValue = useCallback((clientX) => {
    if (!barRef.current) return value
    const rect = barRef.current.getBoundingClientRect()
    return Math.round(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * 100)
  }, [value])

  useEffect(() => {
    if (!dragging) return undefined
    const handleMove = (event) => onChange(dim, calcValue(event.clientX))
    const handleUp = () => setDragging(false)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [dragging, dim, calcValue, onChange])

  const handleKeyDown = (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp'].includes(event.key)) return
    event.preventDefault()
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowUp' ? 5 : -5
    onChange(dim, Math.max(0, Math.min(100, value + delta)))
  }

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/80 p-4 shadow-sm transition hover:border-brand-200 dark:border-violet-300/20 dark:bg-slate-900/45 dark:hover:border-pink-300/35">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${color}16` }}>
            <Icon size={16} style={{ color }} />
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{dim}</span>
              <span className="rounded-md px-1.5 py-0.5 text-[9px] font-bold" style={{ background: `${level.color}16`, color: level.color }}>
                {level.label}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">样本基线 {baseline}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black tabular-nums" style={{ color }}>{value}</span>
          <span className="text-[10px] text-slate-300 dark:text-slate-600">/100</span>
        </div>
      </div>

      <div
        ref={barRef}
        role="slider"
        aria-label={`${dim}生成调性`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onClick={(event) => onChange(dim, calcValue(event.clientX))}
        onMouseDown={(event) => {
          event.preventDefault()
          setDragging(true)
          onChange(dim, calcValue(event.clientX))
        }}
        className="relative mt-4 h-4 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
        style={{ background: `linear-gradient(to right, ${color}0d, ${color}1f)` }}
      >
        <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}55, ${color})` }} />
        <span className="absolute top-1/2 h-6 w-px -translate-y-1/2 bg-slate-500/60 dark:bg-white/60" style={{ left: `${baseline}%` }} title={`样本基线 ${baseline}`} />
        <span
          className={`absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md ${dragging ? 'scale-110' : ''}`}
          style={{ left: `${value}%`, background: color }}
        />
      </div>
      <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">{dimDesc[dim]}</p>
    </div>
  )
}

export default function StyleLab() {
  const navigate = useNavigate()
  const { profile, updateStyleDNA } = useApp()
  const { dark } = useTheme()
  const [hoveredNode, setHoveredNode] = useState(null)

  if (!profile) return <Empty text="请先完成账号画像" to="/profile" label="去填写" />

  const dna = profile.habits?.styleDNA || {}
  const sampleCount = Number(dna.sampleCount) || 0
  const stage = getStyleStage(dna)

  if (stage === 'untrained') {
    return (
      <div className="animate-slide-up space-y-5">
        <div className="inline-flex items-center gap-2 rounded-lg border border-grape-100/60 bg-white/70 px-3 py-2 text-xs text-grape-600 dark:border-violet-300/20 dark:bg-slate-900/70 dark:text-grape-300">
          <Fingerprint size={13} /> 风格培养仓
        </div>
        <UntrainedState profile={profile} onStart={() => navigate('/workshop')} />
      </div>
    )
  }

  const dims = Object.fromEntries(STYLE_DIMENSIONS.map((dimension) => [dimension, Number(dna.dimensions?.[dimension]) || 0]))
  const generationDims = Object.keys(dna.generationDimensions || {}).length
    ? { ...dims, ...dna.generationDimensions }
    : dims
  const styleChartData = STYLE_DIMENSIONS.map((dimension) => ({ subject: dimension, score: dims[dimension] }))
  const avgScore = Math.round(styleChartData.reduce((sum, item) => sum + item.score, 0) / STYLE_DIMENSIONS.length)
  const sortedDims = STYLE_DIMENSIONS.map((dimension) => [dimension, dims[dimension]]).sort((a, b) => b[1] - a[1])
  const topDim = sortedDims[0]
  const lowDim = sortedDims[sortedDims.length - 1]
  const isEstablished = stage === 'established'
  const chartGrid = dark ? '#65708a' : '#e2e8f0'
  const chartText = dark ? '#cbd5e1' : '#64748b'
  const chartMuted = dark ? '#9aa8bd' : '#cbd5e1'

  const updateGenerationDim = (dimension, value) => {
    updateStyleDNA({ generationDimensions: { ...generationDims, [dimension]: value } })
  }
  const resetGenerationDims = () => updateStyleDNA({ generationDimensions: {} })

  const keywords = (dna.keywords || []).slice(0, 8)
  const cx = 140
  const cy = 140
  const nodes = keywords.map((keyword, index) => {
    const angle = (index / Math.max(keywords.length, 1)) * Math.PI * 2 - Math.PI / 2
    const dimension = STYLE_DIMENSIONS[index % STYLE_DIMENSIONS.length]
    return {
      keyword,
      dimension,
      value: dims[dimension],
      x: cx + Math.cos(angle) * 88,
      y: cy + Math.sin(angle) * 88,
      radius: 15 + (dims[dimension] / 100) * 8,
      color: dimColors[dimension],
    }
  })

  return (
    <div className="animate-slide-up space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-lg border border-grape-100/60 bg-white/70 px-3 py-2 text-xs text-grape-600 dark:border-violet-300/20 dark:bg-slate-900/70 dark:text-grape-300">
          <Fingerprint size={13} /> 风格培养仓
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SampleProgress sampleCount={sampleCount} />
          <span className={`tag ${isEstablished ? 'bg-mint-400/15 text-emerald-600 dark:text-emerald-300' : 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300'}`}>
            <ShieldCheck size={11} /> {isEstablished ? '画像已形成' : '初步画像'} · 可信度 {dna.confidence || '低'}
          </span>
          {isEstablished && (
            <div className="flex items-center gap-1.5 text-xs">
              <TrendingUp size={12} className="text-emerald-500" />
              <span className="text-slate-400 dark:text-slate-500">最强</span>
              <span className="font-bold" style={{ color: dimColors[topDim[0]] }}>{topDim[0]} {topDim[1]}</span>
            </div>
          )}
        </div>
      </div>

      {!isEstablished && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200/70 bg-amber-50/70 px-4 py-3 dark:border-amber-400/20 dark:bg-amber-400/10">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            当前结果仅基于 {sampleCount} 篇定稿，暂不判断最强或待提升维度。
          </p>
          <button onClick={() => navigate('/workshop')} className="btn-ghost text-xs py-1.5">
            继续积累样本 <ArrowRight size={13} />
          </button>
        </div>
      )}

      <div className="card">
        <div className="grid gap-7 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-100">
                <Sparkles size={15} className="text-grape-500 dark:text-grape-300" /> 样本风格雷达
              </h2>
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-slate-400 dark:text-slate-500">样本均值</span>
                <span className="text-2xl font-black text-brand-500 dark:text-pink-300">{avgScore}</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={styleChartData} outerRadius="72%">
                <PolarGrid stroke={chartGrid} strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: chartText, fontSize: 12, fontWeight: 500 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: chartMuted, fontSize: 9 }} axisLine={false} />
                <Radar dataKey="score" stroke="#8b5cf6" fill="#ec4899" fillOpacity={0.28} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-100">
              <Fingerprint size={15} className="text-brand-500 dark:text-pink-300" /> 样本关键词网络
            </h2>
            <div className="flex h-[280px] items-center justify-center rounded-xl border border-slate-200/70 bg-slate-50/70 dark:border-violet-300/20 dark:bg-slate-900/55">
              {nodes.length ? (
                <svg viewBox="0 0 280 280" className="w-full max-w-[300px]">
                  {[40, 65, 90].map((radius) => (
                    <circle key={radius} cx={cx} cy={cy} r={radius} fill="none" stroke={chartGrid} strokeWidth="0.6" strokeDasharray="2 3" />
                  ))}
                  {nodes.map((node, index) => (
                    <line key={`line-${node.keyword}`} x1={cx} y1={cy} x2={node.x} y2={node.y} stroke={hoveredNode === index ? node.color : chartMuted} strokeWidth={hoveredNode === index ? 1.5 : 0.8} strokeDasharray="3 2" />
                  ))}
                  <circle cx={cx} cy={cy} r="21" fill="#8b5cf6" />
                  <text x={cx} y={cy + 3} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">DNA</text>
                  {nodes.map((node, index) => (
                    <g key={node.keyword} onMouseEnter={() => setHoveredNode(index)} onMouseLeave={() => setHoveredNode(null)} className="cursor-default">
                      <circle cx={node.x} cy={node.y} r={node.radius + 5} fill={node.color} opacity={hoveredNode === index ? 0.2 : 0.08} />
                      <circle cx={node.x} cy={node.y} r={node.radius} fill={node.color} fillOpacity="0.14" stroke={node.color} strokeWidth="2" />
                      <text x={node.x} y={node.y + 3} textAnchor="middle" fill={node.color} fontSize="9" fontWeight="600">
                        {node.keyword.length > 4 ? `${node.keyword.slice(0, 3)}…` : node.keyword}
                      </text>
                    </g>
                  ))}
                </svg>
              ) : (
                <p className="text-sm text-slate-400 dark:text-slate-500">当前样本尚未提取到稳定关键词</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-100">
              <Target size={15} className="text-brand-500 dark:text-pink-300" /> 生成调性微调
            </h2>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">彩色手柄控制后续生成，细线标记样本画像基线。</p>
          </div>
          {Object.keys(dna.generationDimensions || {}).length > 0 && (
            <button onClick={resetGenerationDims} className="btn-ghost text-xs py-1.5">
              <RotateCcw size={13} /> 恢复样本基线
            </button>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STYLE_DIMENSIONS.map((dimension) => (
            <DimensionControl
              key={dimension}
              dim={dimension}
              value={Number(generationDims[dimension])}
              baseline={dims[dimension]}
              color={dimColors[dimension]}
              onChange={updateGenerationDim}
            />
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-200">
            <Sparkles size={13} className="text-brand-500 dark:text-pink-300" /> 样本风格总结
          </h2>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{dna.writingStyle}</p>
          <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">基于 {sampleCount} 篇确认定稿 · 可信度 {dna.confidence}</p>
        </div>
        <div className="card">
          <h2 className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-200">
            <Users size={13} className="text-grape-500 dark:text-grape-300" /> 创作对象与偏好
          </h2>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-100">{profile.targetAudience}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[profile.habits?.contentStyle, profile.habits?.tone].filter(Boolean).map((item) => (
              <span key={item} className="tag bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200">{item}</span>
            ))}
          </div>
        </div>
      </div>

      {keywords.length > 0 && (
        <div className="card">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-100">
            <Tag size={15} className="text-brand-500 dark:text-pink-300" /> 跨样本高频关键词
          </h2>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <span key={keyword} className="rounded-lg border border-slate-200/70 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 dark:border-violet-300/20 dark:bg-slate-800/70 dark:text-slate-200">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 border-t border-slate-200/70 pt-4 text-xs leading-5 text-slate-400 dark:border-slate-700 dark:text-slate-500">
        <ShieldCheck size={14} className="mt-0.5 shrink-0" />
        <p>
          样本画像只由已确认定稿累计，生成调性微调不会反向修改画像。
          {isEstablished && ` 当前相对较弱的是${lowDim[0]}，这表示表达更克制，不等同于缺点。`}
        </p>
      </div>
    </div>
  )
}
