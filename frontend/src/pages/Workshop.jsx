import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PenTool, Send, Sparkles, Image as ImageIcon, Type, Hash,
  Zap, MessageCircle, Copy, Check, BarChart3, RefreshCw, Fingerprint,
  X, TrendingUp, TrendingDown, ArrowRight, Tag, ChevronLeft, ChevronRight,
  AlertCircle, CircleCheck, Info,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { api } from '../api/client.js'
import { Loading, SourceBadge, Empty } from '../components/ui.jsx'
import {
  contentFingerprint, isMeaningfulStyleSample, mergeStyleSample,
} from '../utils/styleDNA.js'

const platforms = [
  { key: '小红书', color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200', desc: '重图文质感' },
  { key: '抖音', color: 'text-slate-800', bg: 'bg-slate-100', border: 'border-slate-300', desc: '重前3秒' },
  { key: '视频号', color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200', desc: '重共鸣转发' },
  { key: 'B站', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', desc: '重内容深度' },
]

const coverStyles = ['温暖治愈', '清新简约', '活力吸睛']

const dimColors = {
  幽默: '#f59e0b', 情绪: '#ec4899', 专业: '#3b82f6',
  亲和: '#10b981', 犀利: '#ef4444', 网感: '#8b5cf6',
}

/** DNA 分析结果弹窗 */
function DnaResultModal({ open, loading, result, oldDNA, onClose, onGoToLab }) {
  if (!open) return null

  const oldDims = oldDNA?.dimensions || {}
  const newDims = result?.dimensions || {}
  const dimEntries = Object.entries(newDims)
  const previousSampleCount = Number(oldDNA?.sampleCount) || 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="relative bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-violet-300/25 rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部渐变条 */}
        <div className="h-1.5 bg-gradient-to-r from-grape-500 via-brand-500 to-pink-500" />

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-white transition z-10"
        >
          <X size={16} />
        </button>

        {loading ? (
          <div className="p-10">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-grape-500/20 to-brand-500/20 flex items-center justify-center">
                  <Fingerprint size={28} className="text-grape-500 animate-pulse" />
                </div>
                <div className="absolute -inset-2 rounded-full border-2 border-grape-200 border-t-transparent animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-700">AI 正在分析你的写作风格...</p>
                <p className="text-xs text-slate-400 mt-1">从 6 个维度提取你的风格 DNA</p>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {['幽默', '情绪', '专业', '亲和', '犀利', '网感'].map((dim, i) => (
                  <div
                    key={dim}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium"
                    style={{
                      background: `${dimColors[dim]}10`,
                      color: dimColors[dim],
                      animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: dimColors[dim] }} />
                    {dim}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : result ? (
          <div className="overflow-y-auto max-h-[calc(85vh-6px)]">
            {/* 成功头部 */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-mint-400 to-emerald-500 flex items-center justify-center text-white shadow-lg">
                  <Check size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">第 {result.sampleCount} 篇风格样本已计入</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">当前画像可信度 {result.confidence}</p>
                </div>
              </div>
            </div>

            {/* 维度对比 */}
            <div className="px-6 pb-4">
              <h4 className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1.5">
                <BarChart3 size={13} /> 维度变化对比
              </h4>
              <div className="space-y-2.5">
                {dimEntries.map(([dim, newVal]) => {
                  const oldVal = previousSampleCount > 0 ? oldDims[dim] : null
                  const diff = oldVal == null ? null : newVal - oldVal
                  const color = dimColors[dim] || '#8b5cf6'
                  return (
                    <div key={dim} className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 w-16 shrink-0">
                        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                        <span className="text-xs font-medium text-slate-600">{dim}</span>
                      </div>
                      {/* 进度条对比 */}
                      <div className="flex-1 relative h-6 bg-slate-50 dark:bg-slate-800/80 rounded-lg overflow-hidden">
                        {/* 旧值标记 */}
                        {oldVal != null && oldVal !== newVal && (
                          <div
                            className="absolute top-0 bottom-0 w-px bg-slate-300 z-10"
                            style={{ left: `${oldVal}%` }}
                            title={`旧值: ${oldVal}`}
                          />
                        )}
                        {/* 新值填充 */}
                        <div
                          className="absolute inset-y-0 left-0 rounded-lg flex items-center justify-end pr-2 transition-all duration-500"
                          style={{
                            width: `${newVal}%`,
                            background: `linear-gradient(90deg, ${color}30, ${color}80)`,
                          }}
                        >
                          <span className="text-[10px] font-bold text-white">{newVal}</span>
                        </div>
                      </div>
                      {/* 变化值 */}
                      <div className="w-14 shrink-0 text-right">
                        {diff == null ? (
                          <span className="text-[10px] text-brand-500 dark:text-pink-300">首次</span>
                        ) : diff === 0 ? (
                          <span className="text-[10px] text-slate-400">持平</span>
                        ) : diff > 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-500">
                            <TrendingUp size={10} /> +{diff}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-400">
                            <TrendingDown size={10} /> {diff}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 新关键词 */}
            {result.keywords?.length > 0 && (
              <div className="px-6 pb-4">
                <h4 className="text-xs font-bold text-slate-500 mb-2.5 flex items-center gap-1.5">
                  <Tag size={13} /> 提取的关键词
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {result.keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-pink-200 font-medium border border-brand-100/50 dark:border-pink-300/15"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI 总结 */}
            {result.summary && (
              <div className="mx-6 mb-4 p-4 rounded-xl bg-gradient-to-br from-grape-50/60 to-brand-50/40 dark:from-grape-500/12 dark:to-brand-500/12 border border-grape-100/40 dark:border-violet-300/20">
                <div className="flex items-start gap-2">
                  <Sparkles size={14} className="text-grape-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-grape-600 mb-1">AI 风格解读</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{result.summary}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="px-6 pb-6 pt-2 flex gap-3">
              <button onClick={onClose} className="btn-ghost flex-1 justify-center text-sm">
                继续创作
              </button>
              <button
                onClick={onGoToLab}
                className="btn-primary flex-1 justify-center text-sm"
              >
                <Fingerprint size={15} /> 去培养仓看看
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function Workshop() {
  const navigate = useNavigate()
  const { profile, setGeneratedContent, updateStyleDNA, workshopState, updateWorkshop, clearWorkshop } = useApp()
  const [copied, setCopied] = useState('')
  const [dnaLoading, setDnaLoading] = useState(false)
  const [dnaModal, setDnaModal] = useState({ open: false, loading: false, result: null, oldDNA: null })
  const [sampleNotice, setSampleNotice] = useState(null)
  const [coverTouchStart, setCoverTouchStart] = useState(null)
  const [coverSlidingTo, setCoverSlidingTo] = useState(null)
  const [coverSlideDirection, setCoverSlideDirection] = useState(1)

  // 从 context 读取持久化状态
  const platform = workshopState.platform
  const title = workshopState.title
  const result = workshopState.result
  const bodyText = workshopState.bodyText
  const initialBodyText = workshopState.initialBodyText || result?.body || ''
  const generationSourceId = workshopState.generationSourceId || ''
  const selectedImage = workshopState.selectedImage
  const loading = workshopState.loading || false

  // 状态更新函数 —— 同步到 context
  const setPlatform = (v) => updateWorkshop({ platform: v })
  const setTitle = (v) => updateWorkshop({ title: v })
  const setResult = (v) => updateWorkshop({ result: v })
  const setBodyText = (v) => updateWorkshop({ bodyText: v })
  const setInitialBodyText = (v) => updateWorkshop({ initialBodyText: v })
  const setGenerationSourceId = (v) => updateWorkshop({ generationSourceId: v })
  const setSelectedImage = (v) => updateWorkshop({ selectedImage: v })
  const setLoading = (v) => updateWorkshop({ loading: v })

  if (!profile) return <Empty text="请先完成账号画像" to="/profile" label="去填写" />

  const generate = async () => {
    if (!title.trim()) return
    setSampleNotice(null)
    setLoading(true)
    setResult(null)
    try {
      const r = await api.workshop(title, platform, profile)
      setResult(r)
      setBodyText(r.body || '')
      setInitialBodyText(r.body || '')
      setGenerationSourceId(contentFingerprint(`${platform}|${title}|${r.body || ''}`))
      setSelectedImage(0)
    } catch (e) {
      alert('生成失败:' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const copy = (text, key) => {
    navigator.clipboard?.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 1500)
  }

  const analyzeDNA = async () => {
    if (!bodyText.trim()) {
      setSampleNotice({ type: 'warning', text: '正文为空，无法作为风格样本。请先完成并人为修改正文。' })
      return
    }
    const oldDNA = profile.habits?.styleDNA || {}
    const sourceFingerprint = generationSourceId || contentFingerprint(`${platform}|${title}|${initialBodyText}`)
    if (!isMeaningfulStyleSample(bodyText, initialBodyText)) {
      setSampleNotice({
        type: 'warning',
        text: 'AI 初稿不能直接作为你的风格样本。请先人为修改正文，加入真实经历、个人判断或自己的表达方式，再提交定稿。',
      })
      return
    }
    if ((oldDNA.sampleSourceHashes || []).includes(sourceFingerprint)) {
      setSampleNotice({ type: 'success', text: '本轮定稿已经计入风格画像，请完成下一篇创作后继续积累。' })
      return
    }
    setSampleNotice(null)
    setDnaLoading(true)
    setDnaModal({ open: true, loading: true, result: null, oldDNA })
    try {
      const r = await api.analyzeStyle(bodyText, platform)
      const nextDNA = mergeStyleSample(oldDNA, r, bodyText, profile.targetAudience, sourceFingerprint)
      updateStyleDNA(nextDNA)
      setDnaModal({
        open: true,
        loading: false,
        result: {
          ...r,
          dimensions: nextDNA.dimensions,
          sampleCount: nextDNA.sampleCount,
          confidence: nextDNA.confidence,
        },
        oldDNA,
      })
      setSampleNotice({ type: 'success', text: `第 ${nextDNA.sampleCount} 篇人为确认定稿已计入风格画像。` })
    } catch (e) {
      setDnaModal({ open: false, loading: false, result: null, oldDNA: null })
      setSampleNotice({ type: 'error', text: `风格样本提交失败：${e.message}` })
    } finally {
      setDnaLoading(false)
    }
  }

  const publish = () => {
    setGeneratedContent({
      ...result,
      body: bodyText,
      titles: [{ text: title, style: '用户输入' }],
      selected_image: result.cover_images?.[selectedImage],
    })
    navigate('/review')
  }

  const sampleSourceFingerprint = result
    ? generationSourceId || contentFingerprint(`${platform}|${title}|${initialBodyText}`)
    : ''
  const currentBodyFingerprint = bodyText ? contentFingerprint(bodyText) : ''
  const sampleAlreadySubmitted = Boolean(
    (sampleSourceFingerprint && profile.habits?.styleDNA?.sampleSourceHashes?.includes(sampleSourceFingerprint))
    || (currentBodyFingerprint && profile.habits?.styleDNA?.sampleHashes?.includes(currentBodyFingerprint)),
  )
  const hasStyleSampleEdit = Boolean(result && isMeaningfulStyleSample(bodyText, initialBodyText))
  const sampleStatus = sampleNotice || (sampleAlreadySubmitted
    ? { type: 'success', text: '本轮人为确认定稿已计入风格画像。' }
    : hasStyleSampleEdit
      ? { type: 'ready', text: '已检测到有效的人工修改，当前正文可以作为风格样本提交。' }
      : { type: 'info', text: '提交风格样本前，需要先人为修改 AI 初稿并确认正文。' })
  const sampleStatusStyles = {
    info: 'border-blue-200/70 bg-blue-50/70 text-blue-700 dark:border-blue-300/20 dark:bg-blue-400/10 dark:text-blue-200',
    warning: 'border-amber-300/80 bg-amber-50 text-amber-800 dark:border-amber-300/25 dark:bg-amber-400/10 dark:text-amber-200',
    ready: 'border-emerald-200/80 bg-emerald-50/80 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-200',
    success: 'border-emerald-200/80 bg-emerald-50/80 text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-200',
    error: 'border-red-200/80 bg-red-50/80 text-red-700 dark:border-red-300/20 dark:bg-red-400/10 dark:text-red-200',
  }
  const SampleStatusIcon = sampleStatus.type === 'warning' || sampleStatus.type === 'error'
    ? AlertCircle
    : sampleStatus.type === 'ready' || sampleStatus.type === 'success'
      ? CircleCheck
      : Info

  const activePlatform = platforms.find((p) => p.key === platform)
  const coverImages = result?.cover_images || []
  const coverCount = coverImages.length
  const activeCoverIndex = coverCount ? Math.min(Math.max(selectedImage || 0, 0), coverCount - 1) : 0
  const prevCoverIndex = coverCount > 1 ? (activeCoverIndex - 1 + coverCount) % coverCount : activeCoverIndex
  const nextCoverIndex = coverCount > 1 ? (activeCoverIndex + 1) % coverCount : activeCoverIndex
  const previewCoverIndex = coverSlidingTo ?? activeCoverIndex
  const previewPrevCoverIndex = coverCount > 1 ? (previewCoverIndex - 1 + coverCount) % coverCount : previewCoverIndex
  const previewNextCoverIndex = coverCount > 1 ? (previewCoverIndex + 1) % coverCount : previewCoverIndex
  const slidePrevCoverIndex = coverSlidingTo != null && coverSlideDirection < 0 ? coverSlidingTo : prevCoverIndex
  const slideNextCoverIndex = coverSlidingTo != null && coverSlideDirection > 0 ? coverSlidingTo : nextCoverIndex
  const chooseCoverImage = (index) => {
    if (!coverCount || coverSlidingTo != null) return
    const normalized = (index + coverCount) % coverCount
    if (normalized === activeCoverIndex) return

    const forwardDistance = (normalized - activeCoverIndex + coverCount) % coverCount
    const backwardDistance = (activeCoverIndex - normalized + coverCount) % coverCount
    const direction = forwardDistance <= backwardDistance ? 1 : -1

    setCoverSlideDirection(direction)
    setCoverSlidingTo(normalized)
  }
  const finishCoverSlide = () => {
    if (coverSlidingTo == null) return
    setSelectedImage(coverSlidingTo)
    setCoverSlidingTo(null)
  }
  const handleCoverTouchEnd = (e) => {
    if (coverTouchStart == null || coverCount <= 1) return
    const deltaX = e.changedTouches[0].clientX - coverTouchStart
    if (Math.abs(deltaX) > 48) {
      chooseCoverImage(deltaX > 0 ? prevCoverIndex : nextCoverIndex)
    }
    setCoverTouchStart(null)
  }

  return (
    <div className="animate-slide-up space-y-5">
      {/* DNA 分析结果弹窗 */}
      <DnaResultModal
        open={dnaModal.open}
        loading={dnaModal.loading}
        result={dnaModal.result}
        oldDNA={dnaModal.oldDNA}
        onClose={() => setDnaModal({ ...dnaModal, open: false })}
        onGoToLab={() => {
          setDnaModal({ ...dnaModal, open: false })
          navigate('/style-lab')
        }}
      />

      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-900/70 px-4 py-1.5 rounded-full text-xs text-grape-600 dark:text-grape-300 border border-slate-200/60 dark:border-violet-300/20">
          <PenTool size={12} /> 创作工坊
        </div>
        <div className="flex items-center gap-2">
          {result && <SourceBadge source={result.source} />}
          {result && (
            <button
              onClick={() => {
                if (confirm('确定要清空当前创作记录吗?')) clearWorkshop()
              }}
              className="text-[10px] text-slate-400 hover:text-red-400 transition flex items-center gap-1"
            >
              <X size={11} /> 清空记录
            </button>
          )}
        </div>
      </div>

      {/* 平台切换 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {platforms.map((p) => (
          <button key={p.key} onClick={() => setPlatform(p.key)}
            className={`p-3 rounded-xl border-2 transition text-center bg-white/55 dark:bg-slate-900/35
              ${platform === p.key ? `${p.border} ${p.bg} dark:bg-brand-500/12 dark:border-pink-300/55 shadow-soft` : 'border-slate-200/70 dark:border-violet-300/18 hover:border-brand-200 dark:hover:border-pink-300/40'}`}>
            <div className={`text-sm font-bold ${platform === p.key ? p.color : 'text-slate-600 dark:text-slate-200'}`}>{p.key}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{p.desc}</div>
          </button>
        ))}
      </div>

      {/* 标题输入 + 生成按钮 */}
      <div className="card">
        <label className="text-xs text-slate-400 mb-2 flex items-center gap-1">
          <Type size={12} /> 输入你的标题
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generate()}
            placeholder="比如：校园周边人均25的宝藏拉面店"
            maxLength={30}
            className="input-field flex-1"
          />
          <button onClick={generate} disabled={!title.trim() || loading}
            className="btn-primary shrink-0 disabled:opacity-40 disabled:cursor-not-allowed">
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
            <span className="hidden sm:inline">{loading ? '生成中' : '生成'}</span>
          </button>
        </div>
        {title && <p className="text-[10px] text-slate-400 mt-1.5">{title.length}/30 字</p>}
      </div>

      {/* 生成结果区 */}
      {loading && (
        <div className="card">
          <Loading text="小悠正在生成内容包和封面图,约需 15-20 秒..." />
        </div>
      )}

      {result && !loading && (
        <div className="space-y-5 animate-slide-up">
          {/* 封面图选择区 */}
          <div className="card">
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <ImageIcon size={15} className="text-brand-500" /> 封面配图
              <span className="text-xs text-slate-400 font-normal">点击选择最合适的一张</span>
            </h3>

            {coverCount > 0 ? (
              <div className="mx-auto max-w-6xl">
                <div
                  className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-slate-50/80 px-3 py-4 shadow-inner dark:border-violet-300/20 dark:bg-slate-950/20 sm:px-8 sm:py-6"
                  onTouchStart={(e) => setCoverTouchStart(e.touches[0].clientX)}
                  onTouchEnd={handleCoverTouchEnd}
                  onTouchCancel={() => setCoverTouchStart(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft') chooseCoverImage(prevCoverIndex)
                    if (e.key === 'ArrowRight') chooseCoverImage(nextCoverIndex)
                  }}
                  tabIndex={0}
                >
                  {coverCount > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => chooseCoverImage(prevCoverIndex)}
                        aria-label="上一张封面"
                        className="absolute inset-y-8 left-3 hidden w-[30%] overflow-hidden rounded-[24px] opacity-65 transition-all duration-500 ease-out hover:opacity-85 md:block"
                      >
                        <img key={`prev-${previewPrevCoverIndex}-${coverImages[previewPrevCoverIndex]}`} src={coverImages[previewPrevCoverIndex]} alt="" className="h-full w-full -translate-x-8 scale-110 object-cover blur-[3px] transition-transform duration-500 ease-out" />
                        <span className="absolute inset-0 bg-gradient-to-r from-slate-50/80 via-white/45 to-white/10 dark:from-slate-950/80 dark:via-slate-950/55 dark:to-slate-950/10" />
                      </button>
                      <button
                        type="button"
                        onClick={() => chooseCoverImage(nextCoverIndex)}
                        aria-label="下一张封面"
                        className="absolute inset-y-8 right-3 hidden w-[30%] overflow-hidden rounded-[24px] opacity-65 transition-all duration-500 ease-out hover:opacity-85 md:block"
                      >
                        <img key={`next-${previewNextCoverIndex}-${coverImages[previewNextCoverIndex]}`} src={coverImages[previewNextCoverIndex]} alt="" className="h-full w-full translate-x-8 scale-110 object-cover blur-[3px] transition-transform duration-500 ease-out" />
                        <span className="absolute inset-0 bg-gradient-to-l from-slate-50/80 via-white/45 to-white/10 dark:from-slate-950/80 dark:via-slate-950/55 dark:to-slate-950/10" />
                      </button>
                    </>
                  )}

                  <div className="relative z-10 mx-auto w-full max-w-[620px] md:w-[56%]">
                    <div className="overflow-hidden rounded-[24px] bg-white p-2 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-200/70 transition-all duration-300 dark:bg-slate-900/70 dark:shadow-black/35 dark:ring-violet-300/20">
                      <div className="aspect-[3/4] overflow-hidden rounded-[18px] bg-slate-100 dark:bg-slate-950/70">
                        <div
                          key={`${activeCoverIndex}-${coverSlidingTo ?? 'idle'}`}
                          onAnimationEnd={finishCoverSlide}
                          className={`flex h-full w-[300%] ${coverSlidingTo != null ? (coverSlideDirection > 0 ? 'animate-cover-track-left' : 'animate-cover-track-right') : '-translate-x-1/3'}`}
                        >
                          <img
                            src={coverImages[slidePrevCoverIndex]}
                            alt=""
                            className="h-full w-1/3 shrink-0 object-cover"
                          />
                          <img
                            src={coverImages[activeCoverIndex]}
                            alt="封面预览"
                            className="h-full w-1/3 shrink-0 object-cover"
                          />
                          <img
                            src={coverImages[slideNextCoverIndex]}
                            alt=""
                            className="h-full w-1/3 shrink-0 object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {coverCount > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => chooseCoverImage(prevCoverIndex)}
                        aria-label="上一张封面"
                        className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-lg ring-1 ring-slate-200/80 transition hover:scale-105 hover:text-brand-500 dark:bg-slate-900/90 dark:text-slate-100 dark:ring-violet-300/20"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        type="button"
                        onClick={() => chooseCoverImage(nextCoverIndex)}
                        aria-label="下一张封面"
                        className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-lg ring-1 ring-slate-200/80 transition hover:scale-105 hover:text-brand-500 dark:bg-slate-900/90 dark:text-slate-100 dark:ring-violet-300/20"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                </div>

                {coverCount > 1 && (
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    {coverImages.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => chooseCoverImage(i)}
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition
                          ${activeCoverIndex === i ? 'bg-gradient-to-r from-grape-500 to-brand-500 text-white shadow-glow' : 'bg-slate-100/90 text-slate-500 hover:bg-brand-50 hover:text-brand-600 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-brand-500/15 dark:hover:text-pink-200'}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${activeCoverIndex === i ? 'bg-white' : 'bg-slate-300 dark:bg-slate-500'}`} />
                        {coverStyles[i] || `风格${i + 1}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* 无图片时的 CSS 降级封面 */
              <div className="rounded-xl overflow-hidden">
                <div className="aspect-square max-h-80 flex items-center justify-center bg-gradient-to-br from-grape-400 to-brand-400">
                  <Sparkles size={32} className="text-white/40" />
                </div>
                <p className="text-[10px] text-slate-400 text-center py-2">
                  <Sparkles size={10} className="inline mr-1" /> AI 配图暂不可用
                </p>
              </div>
            )}

            {/* 封面文案 */}
            <div className="mt-3 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/65 border border-slate-100 dark:border-violet-300/15">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400">封面文案</span>
                <button onClick={() => copy(`${result.cover?.title} ${result.cover?.subtitle}`, 'cover')}
                  className="text-slate-300 hover:text-brand-500">
                  {copied === 'cover' ? <Check size={12} className="text-mint-500" /> : <Copy size={12} />}
                </button>
              </div>
              <p className="text-sm font-bold text-slate-700">{result.cover?.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{result.cover?.subtitle}</p>
            </div>
          </div>

          {/* 正文(可编辑) */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Type size={15} className="text-brand-500" /> 正文内容
                <span className="text-xs text-slate-400 font-normal">可直接编辑修改</span>
              </h3>
              <button onClick={() => copy(bodyText, 'body')}
                className="text-slate-300 hover:text-brand-500">
                {copied === 'body' ? <Check size={14} className="text-mint-500" /> : <Copy size={14} />}
              </button>
            </div>
            <textarea
              value={bodyText}
              onChange={(e) => {
                setBodyText(e.target.value)
                if (sampleNotice) setSampleNotice(null)
              }}
              rows={8}
              className="input-field resize-none text-sm leading-relaxed"
              placeholder="AI 生成的正文会显示在这里,你可以直接编辑修改..."
            />
            <div className="mt-2 flex items-start justify-between gap-4">
              <p className="flex items-start gap-1.5 text-[11px] leading-5 text-slate-400 dark:text-slate-500">
                <Info size={12} className="mt-1 shrink-0" />
                风格画像只学习你人为修改并确认的正文，未经修改的 AI 初稿不会直接计入。
              </p>
              <p className="shrink-0 text-[10px] text-slate-400">{bodyText.length} 字</p>
            </div>
          </div>

          {/* 钩子 + 标签 + 评论话术 */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* 前三秒钩子 */}
            {result.hook && (
              <div className="card">
                <h4 className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                  <Zap size={12} className="text-orange-500" /> 前三秒钩子
                </h4>
                <div className="p-3 rounded-xl bg-orange-400/10 border border-orange-400/20">
                  <p className="text-sm text-slate-700 font-medium">"{result.hook}"</p>
                </div>
                <button onClick={() => copy(result.hook, 'hook')}
                  className="text-[10px] text-slate-300 hover:text-brand-500 mt-1.5">
                  {copied === 'hook' ? <Check size={10} className="inline text-mint-500" /> : <Copy size={10} className="inline" />} 复制
                </button>
              </div>
            )}

            {/* 话题标签 */}
            {result.hashtags?.length > 0 && (
              <div className="card">
                <h4 className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                  <Hash size={12} className="text-brand-500" /> 话题标签
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {result.hashtags.map((tag, i) => (
                    <span key={i} className="tag bg-brand-50 text-brand-600">{tag}</span>
                  ))}
                </div>
                <button onClick={() => copy(result.hashtags.join(' '), 'tags')}
                  className="text-[10px] text-slate-300 hover:text-brand-500 mt-2">
                  {copied === 'tags' ? <Check size={10} className="inline text-mint-500" /> : <Copy size={10} className="inline" />} 复制全部
                </button>
              </div>
            )}
          </div>

          {/* 评论话术 */}
          {result.comments && (
            <div className="card">
              <h4 className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                <MessageCircle size={12} className="text-grape-500" /> 评论互动话术
              </h4>
              <div className="space-y-2">
                {result.comments.pinned && (
                  <div className="p-2.5 rounded-lg bg-mint-400/8 border border-mint-400/20">
                    <span className="text-[10px] text-mint-500 font-medium">置顶评论</span>
                    <p className="text-xs text-slate-600 mt-0.5">{result.comments.pinned}</p>
                  </div>
                )}
                {result.comments.prompts?.map((p, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-transparent dark:border-violet-300/12">
                    <span className="text-[10px] text-slate-400">引导话术 {i + 1}</span>
                    <p className="text-xs text-slate-600 mt-0.5">{p}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className={`flex items-start gap-2 rounded-xl border px-3.5 py-3 text-xs leading-5 ${sampleStatusStyles[sampleStatus.type]}`} role="status" aria-live="polite">
            <SampleStatusIcon size={15} className="mt-0.5 shrink-0" />
            <p>{sampleStatus.text}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button onClick={generate} className="btn-ghost flex-1 justify-center">
              <RefreshCw size={16} /> 重新生成
            </button>
            <button onClick={analyzeDNA} disabled={dnaLoading || sampleAlreadySubmitted}
              className={`btn-ghost flex-1 justify-center disabled:cursor-not-allowed disabled:opacity-50 ${hasStyleSampleEdit && !sampleAlreadySubmitted ? 'border-brand-300 text-brand-600 dark:text-pink-300' : ''}`}
              title={sampleAlreadySubmitted ? '本轮创作已提交' : hasStyleSampleEdit ? '将当前定稿计入风格画像' : '先修改 AI 初稿后再提交'}>
              {dnaLoading ? <RefreshCw size={16} className="animate-spin" /> : <Fingerprint size={16} />}
              {dnaLoading ? '分析中' : sampleAlreadySubmitted ? '样本已提交' : '将定稿作为风格样本'}
            </button>
            <button onClick={publish} className="btn-primary flex-1 justify-center">
              <BarChart3 size={16} /> 模拟发布并复盘
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
