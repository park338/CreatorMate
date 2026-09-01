import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles, Send, Wand2, ArrowRight, User, ArrowLeft, Check,
} from 'lucide-react'
import { useApp, SAMPLE_PROFILE, EMPTY_PROFILE } from '../context/AppContext.jsx'

export default function AccountProfile() {
  const [mode, setMode] = useState('simple')

  return (
    <div className="relative">
      <BookFoldSwitch mode={mode} onSwitch={() => setMode(mode === 'simple' ? 'detailed' : 'simple')} />
      {mode === 'simple' ? <SimpleMode /> : <DetailedMode />}
    </div>
  )
}

function BookFoldSwitch({ mode, onSwitch }) {
  const [flipping, setFlipping] = useState(false)
  const nextLabel = mode === 'simple' ? '详细说明' : '简约说明'
  const foldColor = mode === 'simple' ? '#a855f7' : '#ec4899'

  const handleSwitch = () => {
    setFlipping(true)
    setTimeout(() => { onSwitch(); setFlipping(false) }, 350)
  }

  return (
    <button
      onClick={handleSwitch}
      className="fixed top-16 right-0 z-50 w-32 h-32 group"
      style={{ cursor: 'pointer', transformOrigin: 'top right' }}
      title={`切换至${nextLabel}`}
    >
      <div
        className={`absolute inset-0 transition-all duration-300 ${flipping ? 'rotate-180' : 'group-hover:scale-110'}`}
        style={{
          clipPath: 'polygon(100% 0, 100% 100%, 0 0)',
          background: `linear-gradient(135deg, ${foldColor}, ${foldColor}cc)`,
          boxShadow: '-4px 4px 14px rgba(0,0,0,0.12)',
          transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div
          className="absolute top-0 right-0"
          style={{
            width: 36, height: 36,
            clipPath: 'polygon(100% 0, 100% 100%, 0 0)',
            background: 'rgba(255,255,255,0.25)',
          }}
        />
      </div>
      <div className="absolute top-4 right-3 text-right pointer-events-none" style={{ maxWidth: 80 }}>
        <div className="text-[9px] text-white/60 mb-0.5">切换至</div>
        <div className="text-xs font-bold text-white leading-tight">{nextLabel}</div>
      </div>
    </button>
  )
}

const PROFILE_STEPS = [
  {
    phase: '账号方向',
    ask: '先确定你准备在哪里、做什么内容',
    desc: '平台和赛道只提供诊断背景，不会直接决定账号分数。',
    fields: [
      { path: 'platform', label: '内容平台', type: 'select', options: ['小红书', '抖音', '视频号', 'B站', '快手'] },
      { path: 'contentDirection', label: '主要方向', type: 'select', options: ['校园探店', '本地生活', '美食分享', '好物种草', '穿搭分享', '学习干货'] },
    ],
  },
  {
    phase: '定位基础',
    ask: '用户是谁，为什么值得关注你',
    desc: '这两项用于判断定位清晰度，而不是根据账号名称猜定位。',
    fields: [
      { path: 'targetAudience', label: '主要受众', type: 'select', options: ['学生党', '年轻职场人', '本地消费者', '宝妈家庭', '泛兴趣用户', '其他人群'] },
      { path: 'valueProposition', label: '核心关注理由', type: 'select', options: ['实用信息', '真实体验', '省钱避坑', '专业知识', '情绪陪伴', '轻松娱乐'] },
    ],
  },
  {
    phase: '近期数据',
    ask: '用最近一段时间的数据做客观判断',
    desc: '建议按最近10条内容填写；新号或没有数据可以填0，不会被强行判低分。',
    fields: [
      { path: 'currentFans', label: '当前粉丝', type: 'number', placeholder: '如 320', allowZero: true },
      { path: 'avgViews', label: '近10条平均播放', type: 'number', placeholder: '如 800', allowZero: true },
      { path: 'avgInteraction', label: '近10条平均互动', type: 'number', placeholder: '点赞+评论+收藏', allowZero: true },
      { path: 'newFans30d', label: '近30天新增粉丝', type: 'number', placeholder: '不知道可填0', allowZero: true },
    ],
  },
  {
    phase: '内容供给',
    ask: '判断你能否稳定、持续地产出内容',
    desc: '这里评估真实供给能力，不用性格或口吻代替运营表现。',
    fields: [
      { path: 'postFreq', label: '近30天实际更新频率', type: 'select', options: ['每周1条', '每周2-3条', '每周3-5条', '日更'] },
      { path: 'sustainableTopics', label: '可持续输出的主题数', type: 'select', options: ['1个以内', '2-3个', '4-5个', '6个以上'] },
      { path: 'habits.shootCondition', label: '当前制作条件', type: 'select', options: ['手机随手拍', '有相机/微单', '会基础剪辑', '团队/专业制作'] },
    ],
  },
  {
    phase: '目标与风格',
    ask: '最后补充增长目标和内容表达偏好',
    desc: '增长目标用于规划；风格与口吻只用于后续内容生成，不参与五维表现评分。',
    fields: [
      { path: 'targetFans', label: '目标粉丝', type: 'number', placeholder: '如 2000' },
      { path: 'targetDays', label: '目标周期（天）', type: 'number', placeholder: '如 30' },
      { path: 'accountName', label: '账号名称（选填）', type: 'input', placeholder: '如 小悠的探店日记', optional: true },
      { path: 'habits.contentStyle', label: '内容风格', type: 'select', options: ['实用干货', '情绪共鸣', '趣味搞笑', '精致美学'] },
      { path: 'habits.tone', label: '表达口吻', type: 'select', options: ['亲切学姐', '闺蜜感', '专业博主', '搞笑吐槽'] },
    ],
  },
]

const STEP_REPLIES = [
  '方向确认好了。接下来把受众和关注理由说清楚，定位评分才有依据。',
  '定位信息够了。后续会分别判断内容供给、触达、互动和增长，不会混在一起。',
  '这些数据会直接用于触达效率、互动效率和增长动能计算；没有数据的维度会标记待评估。',
  '供给条件确认好了。实际更新频率和主题储备比“想要日更”更能说明持续能力。',
  '资料完成。目标只用于判断增长计划是否现实，不会反过来改变账号表现分。',
]

function readField(source, path) {
  return path.split('.').reduce((value, key) => value?.[key], source)
}

function writeField(source, path, value) {
  const next = structuredClone(source)
  const keys = path.split('.')
  let target = next
  for (let i = 0; i < keys.length - 1; i++) target = target[keys[i]]
  target[keys[keys.length - 1]] = value
  return next
}

function fieldComplete(form, field) {
  if (field.optional) return true
  const value = readField(form, field.path)
  if (field.type === 'number') {
    if (value === '' || value == null) return false
    return field.allowZero ? Number(value) >= 0 : Number(value) > 0
  }
  return String(value || '').trim().length > 0
}

function stepComplete(form, step) {
  return step.fields.every((field) => fieldComplete(form, field))
}

function prepareProfile(form) {
  const contentDirection = form.contentDirection || '内容分享'
  return {
    ...form,
    accountName: String(form.accountName || '').trim() || `${contentDirection}成长账号`,
    currentFans: Number(form.currentFans) || 0,
    targetFans: Number(form.targetFans) || 1000,
    targetDays: Number(form.targetDays) || 30,
    avgViews: Number(form.avgViews) || 0,
    avgInteraction: Number(form.avgInteraction) || 0,
    newFans30d: Number(form.newFans30d) || 0,
    habits: {
      ...form.habits,
      nickname: form.habits?.nickname || '小伙伴',
      contentStyle: form.habits?.contentStyle || '实用干货',
      tone: form.habits?.tone || '亲切自然',
      shootCondition: form.habits?.shootCondition || '手机随手拍',
      activeTime: form.habits?.activeTime || '时间比较灵活',
      personality: form.habits?.personality || '自然表达',
      interests: form.habits?.interests || contentDirection,
    },
  }
}

function stepSummary(form, step) {
  return step.fields
    .map((field) => `${field.label}：${readField(form, field.path) || '未填写'}`)
    .join(' · ')
}

function ProfileStepFields({ step, form, onChange, compact = false }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${compact ? 'gap-3' : 'gap-4'}`}>
      {step.fields.map((field) => {
        const value = readField(form, field.path)
        if (field.type === 'select') {
          return (
            <div key={field.path} className="sm:col-span-2">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-300 mb-2">{field.label}</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {field.options.map((option) => {
                  const selected = value === option
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => onChange(field.path, option)}
                      className={`min-h-11 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left
                        ${selected
                          ? 'border-brand-400 bg-brand-50 text-brand-600 shadow-sm dark:bg-brand-500/15 dark:text-pink-200'
                          : 'border-slate-200/80 bg-white/80 text-slate-600 hover:border-brand-300 hover:bg-brand-50/50 dark:border-violet-300/20 dark:bg-slate-900/45 dark:text-slate-200 dark:hover:border-pink-300/40'}`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        {option}
                        {selected && <Check size={14} className="shrink-0 text-brand-500 dark:text-pink-300" />}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        }

        return (
          <label key={field.path} className="block">
            <span className="block text-xs font-medium text-slate-500 dark:text-slate-300 mb-2">{field.label}</span>
            <input
              type={field.type === 'number' ? 'number' : 'text'}
              min={field.type === 'number' ? 0 : undefined}
              value={value ?? ''}
              onChange={(event) => {
                const raw = event.target.value
                onChange(field.path, field.type === 'number' ? (raw === '' ? '' : Math.max(0, Number(raw))) : raw)
              }}
              placeholder={field.placeholder}
              className="input-field"
            />
          </label>
        )
      })}
    </div>
  )
}

function ProfileReady({ form, onEnter }) {
  const profile = prepareProfile(form)
  const tags = [profile.targetAudience, profile.valueProposition, profile.postFreq, profile.sustainableTopics, profile.habits.contentStyle, profile.habits.tone].filter(Boolean)
  return (
    <div className="max-w-xl mx-auto pt-8 animate-slide-up">
      <div className="card text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-mint-400 to-grape-500 flex items-center justify-center text-white mx-auto mb-6 shadow-glow">
          <Check size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-100 mb-2">画像已就绪</h2>
        <p className="text-sm text-slate-400 dark:text-slate-400 mb-6">
          {profile.accountName} · {profile.platform} · {profile.contentDirection}
        </p>
        <div className="flex flex-wrap gap-2 justify-center mb-6 max-w-md mx-auto">
          {tags.map((value) => <span key={value} className="tag bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-pink-200 text-xs">{value}</span>)}
        </div>
        <button onClick={onEnter} className="btn-primary">
          进入专属画布 <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

function SimpleMode() {
  const navigate = useNavigate()
  const { setProfile, setDiagnosis } = useApp()
  const [form, setForm] = useState(() => structuredClone(EMPTY_PROFILE))
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)
  const currentStep = PROFILE_STEPS[step]
  const progress = Math.round(((step + 1) / PROFILE_STEPS.length) * 100)

  const updateField = (path, value) => setForm((current) => writeField(current, path, value))
  const goNext = () => {
    if (!stepComplete(form, currentStep)) return
    if (step + 1 < PROFILE_STEPS.length) setStep(step + 1)
    else setDone(true)
  }
  const enterDashboard = () => {
    setDiagnosis(null)
    setProfile(prepareProfile(form))
    navigate('/dashboard')
  }

  if (done) return <ProfileReady form={form} onEnter={enterDashboard} />

  return (
    <div className="max-w-2xl mx-auto pt-4">
      <div className="flex items-center gap-3 mb-6">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="text-slate-400 hover:text-brand-500 transition shrink-0" title="上一步">
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="flex-1">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>{currentStep.phase}</span>
            <span>{step + 1} / {PROFILE_STEPS.length}</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-200/60 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-grape-500 to-brand-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div key={step} className="card animate-slide-up min-h-[360px]">
        <span className="tag bg-grape-500/10 text-grape-600 dark:text-grape-300 mb-3">{currentStep.phase}</span>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{currentStep.ask}</h2>
        <p className="text-sm text-slate-400 dark:text-slate-400 mb-6">{currentStep.desc}</p>
        <ProfileStepFields step={currentStep} form={form} onChange={updateField} />
        <div className="flex justify-end mt-6">
          <button onClick={goNext} disabled={!stepComplete(form, currentStep)} className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
            {step + 1 === PROFILE_STEPS.length ? '完成画像' : '下一步'} <ArrowRight size={15} />
          </button>
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <button onClick={() => { setForm(structuredClone(SAMPLE_PROFILE)); setDone(true) }} className="btn-ghost text-xs">
          <Wand2 size={13} /> 用校园探店示例快速填写
        </button>
      </div>
    </div>
  )
}

function DetailedMode() {
  const navigate = useNavigate()
  const { setProfile, setDiagnosis } = useApp()
  const [form, setForm] = useState(() => structuredClone(EMPTY_PROFILE))
  const [step, setStep] = useState(0)
  const [messages, setMessages] = useState(() => [{ role: 'bot', text: PROFILE_STEPS[0].ask }])
  const [typing, setTyping] = useState(false)
  const [done, setDone] = useState(false)
  const scrollRef = useRef(null)
  const currentStep = PROFILE_STEPS[step]
  const progress = Math.round((step / (PROFILE_STEPS.length - 1)) * 100)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  const updateField = (path, value) => setForm((current) => writeField(current, path, value))
  const submitStep = () => {
    if (!stepComplete(form, currentStep)) return
    const userMessage = { role: 'user', text: stepSummary(form, currentStep) }
    setMessages((current) => [...current, userMessage])
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages((current) => {
        const next = [...current, { role: 'bot', text: STEP_REPLIES[step] }]
        if (step + 1 < PROFILE_STEPS.length) next.push({ role: 'bot', text: PROFILE_STEPS[step + 1].ask })
        else next.push({ role: 'bot', text: '资料已经足够，可以进入专属画布查看规则评分和AI解读。' })
        return next
      })
      if (step + 1 < PROFILE_STEPS.length) setStep(step + 1)
      else setDone(true)
    }, 550)
  }
  const enterDashboard = () => {
    setDiagnosis(null)
    setProfile(prepareProfile(form))
    navigate('/dashboard')
  }
  const fillSample = () => {
    setForm(structuredClone(SAMPLE_PROFILE))
    setDone(true)
    setMessages((current) => [
      ...current,
      { role: 'user', text: '用校园探店示例快速填写' },
      { role: 'bot', text: '示例数据已填好，可以直接查看新的五维诊断。' },
    ])
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-3 px-1">
        <div className="flex-1 h-1.5 rounded-full bg-slate-200/60 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-grape-500 to-brand-500 transition-all duration-500" style={{ width: `${done ? 100 : progress}%` }} />
        </div>
        <span className="text-xs text-slate-400 shrink-0">{done ? '已完成' : `${currentStep.phase} · ${step + 1}/${PROFILE_STEPS.length}`}</span>
        {!done && <button onClick={fillSample} className="btn-ghost text-xs py-1.5 shrink-0"><Wand2 size={13} /> 示例</button>}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 px-1 py-2">
        {messages.map((message, index) => <Bubble key={index} role={message.role} text={message.text} />)}
        {typing && (
          <div className="flex gap-2 items-end">
            <BotAvatar />
            <div className="bg-white dark:bg-slate-900/70 rounded-2xl rounded-bl-sm px-4 py-3 shadow-soft border border-white/60 dark:border-violet-300/20">
              <span className="flex gap-1">
                {[0, 150, 300].map((delay) => <span key={delay} className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: `${delay}ms` }} />)}
              </span>
            </div>
          </div>
        )}
      </div>

      {!done && !typing && (
        <div className="pt-3 px-1">
          <div className="card !p-4 max-h-[46vh] overflow-y-auto">
            <ProfileStepFields step={currentStep} form={form} onChange={updateField} compact />
            <div className="flex justify-end mt-4">
              <button onClick={submitStep} disabled={!stepComplete(form, currentStep)} className="btn-primary px-4 disabled:opacity-40 disabled:cursor-not-allowed">
                确认本阶段 <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {done && (
        <div className="pt-3 px-1 animate-slide-up">
          <div className="card flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-mint-400 to-grape-500 flex items-center justify-center text-white"><Sparkles size={20} /></div>
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-100">画像已就绪</p>
                <p className="text-xs text-slate-400">{prepareProfile(form).accountName} · {form.platform} · {form.contentDirection}</p>
              </div>
            </div>
            <button onClick={enterDashboard} className="btn-primary">进入专属画布 <ArrowRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  )
}

function BotAvatar() {
  return <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-grape-500 to-brand-500 flex items-center justify-center text-white shrink-0 shadow-glow"><Sparkles size={16} /></div>
}

function Bubble({ role, text }) {
  const isBot = role === 'bot'
  return (
    <div className={`flex gap-2 items-end ${isBot ? '' : 'flex-row-reverse'}`}>
      {isBot ? <BotAvatar /> : <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-300 shrink-0"><User size={16} /></div>}
      <div className={`max-w-[78%] px-4 py-2.5 text-sm leading-relaxed shadow-soft border
        ${isBot
          ? 'bg-white text-slate-700 rounded-2xl rounded-bl-sm border-white/60 dark:bg-slate-900/70 dark:text-slate-100 dark:border-violet-300/20'
          : 'bg-gradient-to-r from-grape-500 to-brand-500 text-white rounded-2xl rounded-br-sm border-transparent'}`}>
        {text}
      </div>
    </div>
  )
}
