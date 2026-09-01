export const STYLE_DIMENSIONS = ['幽默', '情绪', '专业', '亲和', '犀利', '网感']

const DIMENSION_DESCRIPTIONS = {
  幽默: '轻松幽默',
  情绪: '情绪共鸣',
  专业: '信息专业',
  亲和: '亲切自然',
  犀利: '观点鲜明',
  网感: '平台表达',
}

export function createEmptyStyleDNA() {
  return {
    dimensions: {},
    generationDimensions: {},
    writingStyle: '',
    targetAudience: '',
    keywords: [],
    keywordCounts: {},
    sceneKeywords: {},
    sampleCount: 0,
    sampleHashes: [],
    sampleSourceHashes: [],
    status: 'untrained',
    confidence: '待建立',
    lastSampleSummary: '',
    lastEvidence: {},
  }
}

export function getStyleStage(styleDNA) {
  const sampleCount = Number(styleDNA?.sampleCount) || 0
  if (sampleCount === 0) return 'untrained'
  if (sampleCount < 3) return 'learning'
  return 'established'
}

export function getStyleConfidence(sampleCount) {
  if (sampleCount >= 5) return '高'
  if (sampleCount >= 3) return '中'
  if (sampleCount > 0) return '低'
  return '待建立'
}

function normalizeContent(content) {
  return String(content || '').replace(/\s+/g, ' ').trim()
}

export function contentFingerprint(content) {
  const normalized = normalizeContent(content)
  let hash = 2166136261
  for (let i = 0; i < normalized.length; i += 1) {
    hash ^= normalized.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return `${normalized.length}-${(hash >>> 0).toString(36)}`
}

export function isMeaningfulStyleSample(content, generatedContent = '') {
  const current = normalizeContent(content)
  const original = normalizeContent(generatedContent)
  if (current.length < 60) return false
  if (!original) return true
  if (current === original) return false

  const maxLength = Math.max(current.length, original.length)
  let changedCharacters = Math.abs(current.length - original.length)
  const overlap = Math.min(current.length, original.length)
  for (let i = 0; i < overlap; i += 1) {
    if (current[i] !== original[i]) changedCharacters += 1
  }
  const threshold = Math.max(12, Math.ceil(maxLength * 0.05))
  return changedCharacters >= threshold
}

function normalizeDimensions(dimensions) {
  const normalized = {}
  for (const dimension of STYLE_DIMENSIONS) {
    const value = Number(dimensions?.[dimension])
    if (!Number.isFinite(value)) {
      throw new Error(`风格分析缺少“${dimension}”维度`)
    }
    normalized[dimension] = Math.max(0, Math.min(100, Math.round(value)))
  }
  return normalized
}

function buildStyleSummary(dimensions) {
  const sorted = STYLE_DIMENSIONS
    .map((dimension) => [dimension, dimensions[dimension]])
    .sort((a, b) => b[1] - a[1])
  const strongest = sorted.slice(0, 2).map(([dimension]) => DIMENSION_DESCRIPTIONS[dimension])
  const weakest = sorted[sorted.length - 1][0]
  return `整体以${strongest.join('和')}为主要特征，${DIMENSION_DESCRIPTIONS[weakest]}表达相对克制。`
}

export function mergeStyleSample(currentDNA, analysis, content, targetAudience = '', sourceFingerprint = '') {
  const previous = currentDNA || createEmptyStyleDNA()
  const previousCount = Number(previous.sampleCount) || 0
  const sampleDimensions = normalizeDimensions(analysis?.dimensions)
  const fingerprint = contentFingerprint(content)
  const previousHashes = Array.isArray(previous.sampleHashes) ? previous.sampleHashes : []
  if (previousHashes.includes(fingerprint)) {
    throw new Error('这篇定稿已经提交过风格样本')
  }
  const previousSourceHashes = Array.isArray(previous.sampleSourceHashes) ? previous.sampleSourceHashes : []
  if (sourceFingerprint && previousSourceHashes.includes(sourceFingerprint)) {
    throw new Error('本轮创作已经提交过风格样本')
  }

  const dimensions = {}
  for (const dimension of STYLE_DIMENSIONS) {
    const oldValue = Number(previous.dimensions?.[dimension])
    dimensions[dimension] = previousCount > 0 && Number.isFinite(oldValue)
      ? Math.round((oldValue * previousCount + sampleDimensions[dimension]) / (previousCount + 1))
      : sampleDimensions[dimension]
  }

  const keywordCounts = { ...(previous.keywordCounts || {}) }
  for (const keyword of new Set(analysis?.keywords || [])) {
    const cleanKeyword = String(keyword || '').trim()
    if (cleanKeyword) keywordCounts[cleanKeyword] = (keywordCounts[cleanKeyword] || 0) + 1
  }
  const keywords = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
    .slice(0, 8)
    .map(([keyword]) => keyword)

  const sampleCount = previousCount + 1
  return {
    ...createEmptyStyleDNA(),
    ...previous,
    dimensions,
    generationDimensions: { ...(previous.generationDimensions || {}) },
    writingStyle: buildStyleSummary(dimensions),
    targetAudience,
    keywords,
    keywordCounts,
    sampleCount,
    sampleHashes: [...previousHashes, fingerprint].slice(-50),
    sampleSourceHashes: sourceFingerprint
      ? [...previousSourceHashes, sourceFingerprint].slice(-50)
      : previousSourceHashes,
    status: getStyleStage({ sampleCount }),
    confidence: getStyleConfidence(sampleCount),
    lastSampleSummary: String(analysis?.summary || '').trim(),
    lastEvidence: { ...(analysis?.evidence || {}) },
  }
}
