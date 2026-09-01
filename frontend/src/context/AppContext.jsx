import { createContext, useContext, useState } from 'react'
import { createEmptyStyleDNA } from '../utils/styleDNA.js'

const AppContext = createContext(null)

// 默认风格 DNA
const DEFAULT_STYLE_DNA = createEmptyStyleDNA()

// 校园探店示例数据(含个人习惯 + 风格 DNA)
export const SAMPLE_PROFILE = {
  platform: '小红书',
  accountName: '小悠的探店日记',
  contentDirection: '校园探店',
  targetAudience: '学生党',
  valueProposition: '省钱避坑',
  currentFans: 320,
  targetFans: 2000,
  targetDays: 30,
  postFreq: '每周2-3条',
  avgViews: 800,
  avgInteraction: 35,
  newFans30d: 120,
  sustainableTopics: '4-5个',
  habits: {
    nickname: '小悠',
    contentStyle: '情绪共鸣',
    tone: '亲切学姐',
    shootCondition: '手机随手拍',
    activeTime: '夜猫型',
    personality: '外向爱分享',
    interests: '美食、校园周边探店',
    extraNote: '',
    styleDNA: createEmptyStyleDNA(),
  },
}

// 默认空画像(对话开始时)
export const EMPTY_PROFILE = {
  platform: '小红书',
  accountName: '',
  contentDirection: '校园探店',
  targetAudience: '学生党',
  valueProposition: '真实体验',
  currentFans: 0,
  targetFans: 1000,
  targetDays: 30,
  postFreq: '每周2-3条',
  avgViews: 0,
  avgInteraction: 0,
  newFans30d: 0,
  sustainableTopics: '2-3个',
  habits: {
    nickname: '小伙伴',
    contentStyle: '实用干货',
    tone: '亲切学姐',
    shootCondition: '手机随手拍',
    activeTime: '时间比较灵活',
    personality: '自然表达',
    interests: '校园探店',
    extraNote: '',
    styleDNA: createEmptyStyleDNA(),
  },
}

export { DEFAULT_STYLE_DNA }

export function AppProvider({ children }) {
  const [profile, setProfile] = useState(null)
  const [diagnosis, setDiagnosis] = useState(null)
  const [growthPlan, setGrowthPlan] = useState(null)
  const [generatedContent, setGeneratedContent] = useState(null)
  const [reviewData, setReviewData] = useState(null)
  // 创作工坊状态持久化(跨页面导航保留)
  const [workshopState, setWorkshopState] = useState({
    platform: '小红书',
    title: '',
    result: null,
    bodyText: '',
    initialBodyText: '',
    generationSourceId: '',
    selectedImage: 0,
  })

  /** 更新风格 DNA(滑块拖动或 AI 分析后调用) */
  const updateStyleDNA = (newDNA) => {
    setProfile((current) => {
      if (!current) return current
      return {
        ...current,
        habits: {
          ...current.habits,
          styleDNA: { ...createEmptyStyleDNA(), ...current.habits?.styleDNA, ...newDNA },
        },
      }
    })
  }

  /** 更新创作工坊状态(部分合并) */
  const updateWorkshop = (partial) => {
    setWorkshopState((prev) => ({ ...prev, ...partial }))
  }

  /** 清空创作工坊 */
  const clearWorkshop = () => {
    setWorkshopState({ platform: '小红书', title: '', result: null, bodyText: '', initialBodyText: '', generationSourceId: '', selectedImage: 0 })
  }

  return (
    <AppContext.Provider value={{
      profile, setProfile,
      diagnosis, setDiagnosis,
      growthPlan, setGrowthPlan,
      generatedContent, setGeneratedContent,
      reviewData, setReviewData,
      updateStyleDNA,
      workshopState, updateWorkshop, clearWorkshop,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
