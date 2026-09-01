import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, X, MessageCircle } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { api } from '../api/client.js'

const QUICK_QUESTIONS = [
  '我不知道该做什么方向,怎么选?',
  '我的账号定位对吗?',
  '新手怎么快速涨粉?',
  '标题怎么写更吸引人?',
  '什么时间发布最好?',
]

export default function AssistantPanel({ open, onClose, onOpen }) {
  const { profile } = useApp()
  const [messages, setMessages] = useState([
    { role: 'bot', text: '嗨~我是小悠,你的专属运营助理!有什么运营问题随时问我,定位、选题、涨粉、互动都行~' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text) => {
    if (!text.trim()) return
    const newMsgs = [...messages, { role: 'user', text }]
    setMessages(newMsgs)
    setInput('')
    setLoading(true)
    try {
      const res = await api.assistant(text, profile)
      setMessages([...newMsgs, { role: 'bot', text: res.reply }])
    } catch (e) {
      setMessages([...newMsgs, { role: 'bot', text: '抱歉,我暂时没法回复,稍后再试~' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* 遮罩 */}
      {open && <div className="fixed inset-0 bg-black/10 dark:bg-black/40 z-40" onClick={onClose} />}

      {/* 浮动按钮(未打开时) */}
      {!open && (
        <button
          onClick={onOpen}
          className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-gradient-to-br from-grape-500 to-brand-500 shadow-glow flex items-center justify-center text-white hover:scale-105 transition active:scale-95"
        >
          <Sparkles size={24} />
        </button>
      )}

      {/* 面板 */}
      <div className={`fixed top-0 right-0 h-screen w-96 max-w-[90vw] bg-white/95 dark:bg-slate-950/90 backdrop-blur-xl shadow-2xl border-l border-slate-200/70 dark:border-violet-300/20 z-50 flex flex-col transition-transform duration-300
        ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80 dark:border-violet-300/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-grape-500 to-brand-500 flex items-center justify-center text-white">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-700">小悠助理</div>
              <div className="text-[10px] text-slate-400">专属运营搭子 · 随时在线</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        {/* 消息区 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role} text={m.text} />
          ))}
          {loading && (
            <div className="flex gap-2 items-end">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-grape-500 to-brand-500 flex items-center justify-center text-white shrink-0">
                <Sparkles size={14} />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl rounded-bl-sm px-4 py-3">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 快捷问题 */}
        {messages.length <= 1 && (
          <div className="px-4 py-2 border-t border-slate-100 dark:border-violet-300/20">
            <div className="text-[10px] text-slate-400 mb-2">试试这些问题:</div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map((q) => (
                <button key={q} onClick={() => send(q)}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-pink-200 dark:hover:bg-brand-500/25 border border-transparent dark:border-pink-300/15 transition">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 输入区 */}
        <div className="p-3 border-t border-slate-200/80 dark:border-violet-300/20">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && send(input)}
              placeholder="问我任何运营问题..."
              className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:bg-slate-900/80 dark:border-violet-300/25 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-pink-300 dark:focus:ring-pink-300/15 transition"
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="px-3 rounded-xl bg-gradient-to-r from-grape-500 to-brand-500 text-white disabled:opacity-40 transition active:scale-95"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function Bubble({ role, text }) {
  const isBot = role === 'bot'
  return (
    <div className={`flex gap-2 items-end ${isBot ? '' : 'flex-row-reverse'}`}>
      {isBot ? (
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-grape-500 to-brand-500 flex items-center justify-center text-white shrink-0">
          <Sparkles size={14} />
        </div>
      ) : (
        <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500 shrink-0 text-xs font-bold">你</div>
      )}
      <div className={`max-w-[80%] px-3.5 py-2.5 text-sm leading-relaxed
        ${isBot ? 'bg-slate-50 text-slate-700 dark:bg-slate-800/80 dark:text-slate-100 border border-slate-100 dark:border-violet-300/15 rounded-2xl rounded-bl-sm' : 'bg-gradient-to-r from-grape-500 to-brand-500 text-white rounded-2xl rounded-br-sm'}`}>
        {text}
      </div>
    </div>
  )
}
