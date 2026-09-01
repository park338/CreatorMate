import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PenTool, Type, Zap, Film, Image, Hash, MessageCircle,
  ArrowRight, RefreshCw, Copy, Check, BarChart3,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { api } from '../api/client.js'
import { Loading, SectionTitle, SourceBadge, Empty } from '../components/ui.jsx'

export default function ContentGen() {
  const navigate = useNavigate()
  const { profile, growthPlan, generatedContent, setGeneratedContent } = useApp()
  const [selectedTopic, setSelectedTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState('')

  const topics = growthPlan?.calendar?.map((c) => c.topic) || []

  const generate = async (topic) => {
    if (!topic) return
    setSelectedTopic(topic)
    setLoading(true)
    setGeneratedContent(null)
    try {
      const result = await api.generateContent(topic, profile)
      setGeneratedContent(result)
    } catch (e) {
      alert('生成失败:' + e.message)
    } finally {
      setLoading(false)
    }
  }

  // 默认选中第一个选题
  useEffect(() => {
    if (topics.length && !selectedTopic && !generatedContent) {
      generate(topics[0])
    }
  }, [])

  const copy = (text, key) => {
    navigator.clipboard?.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 1500)
  }

  if (!profile) return <Empty text="请先完成账号画像" to="/profile" label="去填写" />

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div className="inline-flex items-center gap-2 bg-white/60 px-4 py-1.5 rounded-full text-xs text-grape-600">
          <PenTool size={12} /> 第四步 · 内容生成
        </div>
        {generatedContent && <SourceBadge source={generatedContent.source} />}
      </div>

      {/* 选题选择 */}
      <div className="card mb-6">
        <SectionTitle icon={Type} title="选择一条选题" desc="从增长规划日历中选取,小悠帮你生成完整内容包" />
        <div className="flex flex-wrap gap-2">
          {topics.map((t, i) => (
            <button key={i} onClick={() => generate(t)}
              className={`px-3 py-2 rounded-xl text-sm transition text-left max-w-md
                ${selectedTopic === t ? 'bg-gradient-to-r from-grape-500 to-brand-500 text-white shadow-glow' : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300'}`}>
              {t}
            </button>
          ))}
          {topics.length === 0 && <p className="text-sm text-slate-400">请先完成增长规划,<a href="/growth-plan" className="text-brand-500">去查看</a></p>}
        </div>
      </div>

      {loading && <Loading text="小悠正在生成标题、脚本、封面..." />}

      {generatedContent && !loading && (
        <div className="space-y-6">
          {/* 标题候选 */}
          <div className="card">
            <SectionTitle icon={Type} title="标题候选" desc="A/B 测试,选数据最好的" />
            <div className="space-y-2">
              {generatedContent.titles?.map((t, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-brand-50/40 group">
                  <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <span className="flex-1 text-slate-700 font-medium">{t.text}</span>
                  <span className="tag bg-slate-100 text-slate-400 hidden sm:inline">{t.style}</span>
                  <button onClick={() => copy(t.text, `t${i}`)} className="text-slate-300 hover:text-brand-500 transition">
                    {copied === `t${i}` ? <Check size={14} className="text-mint-500" /> : <Copy size={14} />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 前三秒钩子 */}
          <div className="card">
            <SectionTitle icon={Zap} title="前三秒钩子" desc="决定完播率的关键" />
            <div className="p-4 rounded-xl bg-gradient-to-r from-orange-400/10 to-brand-400/10 border border-orange-400/20">
              <p className="text-slate-700 leading-relaxed font-medium">"{generatedContent.hook}"</p>
            </div>
          </div>

          {/* 视频脚本 */}
          <div className="card">
            <SectionTitle icon={Film} title="视频脚本" desc="分镜表,可直接照拍" />
            <div className="space-y-3">
              {generatedContent.script?.map((s, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl border border-slate-100">
                  <span className="w-8 h-8 rounded-lg bg-grape-100 text-grape-600 text-xs font-bold flex items-center justify-center shrink-0">幕{i + 1}</span>
                  <div className="flex-1 grid sm:grid-cols-3 gap-2 text-xs">
                    <div><span className="text-slate-400">画面</span><p className="text-slate-600 mt-0.5">{s.scene}</p></div>
                    <div><span className="text-slate-400">口播</span><p className="text-slate-600 mt-0.5">{s.voice}</p></div>
                    <div><span className="text-slate-400">字幕</span><p className="text-slate-600 mt-0.5">{s.subtitle}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 封面 + 标签 */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card">
              <SectionTitle icon={Image} title="封面文案" />
              <div className="p-6 rounded-xl bg-gradient-to-br from-grape-500 to-brand-500 text-white text-center">
                <p className="text-2xl font-black tracking-wide">{generatedContent.cover?.title}</p>
                <p className="text-sm opacity-90 mt-2">{generatedContent.cover?.subtitle}</p>
              </div>
              <p className="text-xs text-slate-400 mt-3">💡 {generatedContent.cover?.tip}</p>
            </div>

            <div className="card">
              <SectionTitle icon={Hash} title="话题标签" />
              <div className="flex flex-wrap gap-2">
                {generatedContent.hashtags?.map((h, i) => (
                  <span key={i} className="tag bg-brand-50 text-brand-600 hover:bg-brand-100 transition cursor-pointer">{h}</span>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <SectionTitle icon={MessageCircle} title="评论区互动话术" />
                <div className="space-y-2 text-sm">
                  <div className="p-2.5 rounded-lg bg-mint-400/8"><span className="text-xs text-slate-400">置顶</span><p className="text-slate-600">{generatedContent.comments?.pinned}</p></div>
                  {generatedContent.comments?.prompts?.map((p, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-50"><span className="text-xs text-slate-400">引导</span><p className="text-slate-600">{p}</p></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button onClick={() => generate(selectedTopic)} className="btn-ghost">
              <RefreshCw size={16} /> 重新生成
            </button>
            <button onClick={() => navigate('/review')} className="btn-primary">
              <BarChart3 size={16} /> 模拟发布并复盘
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
