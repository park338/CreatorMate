/** 后端 API 封装 —— 统一调用 + 错误处理 */

async function request(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`接口异常 ${res.status}`)
  return res.json()
}

export const api = {
  diagnose: (profile) => request('/api/diagnose', { profile }),
  growthPlan: (profile) => request('/api/growth-plan', { profile }),
  generateContent: (topic, profile) => request('/api/generate-content', { topic, profile }),
  review: (profile, contentTitle) => request('/api/review', { profile, contentTitle }),
  assistant: (message, profile) => request('/api/assistant', { message, profile }),
  workshop: (title, platform, profile) => request('/api/workshop/generate', { title, platform, profile }),
  coverImage: (cover, platform) => request('/api/workshop/cover-image', { cover, platform }),
  analyzeStyle: (content, platform) => request('/api/style-dna/analyze', { content, platform }),
  health: () => fetch('/api/health').then((r) => r.json()),
}
