import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Heart, TrendingUp, Rocket } from 'lucide-react'

const MOTIVATIONAL = [
  { text: '每个百万博主,都从第 0 个粉丝开始', icon: Rocket },
  { text: '小悠陪你,从今天起科学涨粉', icon: Heart },
  { text: '不只是涨粉,更是找到属于你的内容节奏', icon: TrendingUp },
]

export default function Welcome() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(0)
  const [textIdx, setTextIdx] = useState(0)

  useEffect(() => {
    // 进度条动画 ~3 秒
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer)
          setTimeout(() => navigate('/profile'), 400)
          return 100
        }
        return p + 2
      })
    }, 60)

    // 轮播激励语
    const textTimer = setInterval(() => {
      setTextIdx((i) => (i + 1) % MOTIVATIONAL.length)
    }, 1100)

    return () => { clearInterval(timer); clearInterval(textTimer) }
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* 装饰光斑 */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-brand-200/30 blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-grape-200/30 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <div className="mb-8 animate-slide-up">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-grape-500 to-brand-500 flex items-center justify-center text-white shadow-glow mb-6 mx-auto">
            <Sparkles size={36} />
          </div>
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-grape-600 to-brand-600 bg-clip-text text-transparent">
            小悠涨粉搭子
          </h1>
          <p className="text-center text-slate-400 text-sm mt-2">AI 社媒运营 Agent · 学习工作赛道</p>
        </div>

        {/* 激励语轮播 */}
        <div className="h-20 flex items-center justify-center mb-10 max-w-md">
          <div key={textIdx} className="flex items-center gap-2.5 animate-fade-in">
            {(() => {
              const Icon = MOTIVATIONAL[textIdx].icon
              return <Icon size={18} className="text-brand-400 shrink-0" />
            })()}
            <p className="text-lg text-slate-600 text-center leading-relaxed">
              {MOTIVATIONAL[textIdx].text}
            </p>
          </div>
        </div>

        {/* 进度条 */}
        <div className="w-64">
          <div className="h-1.5 rounded-full bg-slate-200/60 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-grape-500 to-brand-500 transition-all duration-100 ease-linear rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-400">
            <span>正在准备你的专属搭子...</span>
            <span>{progress}%</span>
          </div>
        </div>
      </div>

      {/* 页脚 */}
      <div className="absolute bottom-8 flex items-center gap-1 text-xs text-slate-300 z-10">
        <Heart size={12} /> 让每个新手博主都能科学涨粉
      </div>
    </div>
  )
}
