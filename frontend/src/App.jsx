import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import AssistantPanel from './components/AssistantPanel.jsx'
import Welcome from './pages/Welcome.jsx'
import AccountProfile from './pages/AccountProfile.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Workshop from './pages/Workshop.jsx'
import ExpertPlan from './pages/ExpertPlan.jsx'
import Review from './pages/Review.jsx'
import StyleLab from './pages/StyleLab.jsx'
import { useApp } from './context/AppContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { useState } from 'react'

/** 路由守卫:profile 未完成时重定向回画像问答页 */
function RequireProfile({ children }) {
  const { profile } = useApp()
  if (!profile) return <Navigate to="/profile" replace />
  return children
}

/** 主应用壳:顶部导航 + 助理面板,通过 context 传递 onOpenAssistant */
function AppShell() {
  const [assistantOpen, setAssistantOpen] = useState(false)
  return (
    <>
      <Layout onOpenAssistant={() => setAssistantOpen(true)} />
      <AssistantPanel open={assistantOpen} onOpen={() => setAssistantOpen(true)} onClose={() => setAssistantOpen(false)} />
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        {/* 全屏页面:无导航栏 */}
        <Route path="/" element={<Welcome />} />
        <Route path="/profile" element={<AccountProfile />} />
        {/* 主应用:有顶部导航栏 */}
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<RequireProfile><Dashboard /></RequireProfile>} />
          <Route path="/workshop" element={<RequireProfile><Workshop /></RequireProfile>} />
          <Route path="/expert" element={<RequireProfile><ExpertPlan /></RequireProfile>} />
          <Route path="/style-lab" element={<RequireProfile><StyleLab /></RequireProfile>} />
          <Route path="/review" element={<RequireProfile><Review /></RequireProfile>} />
          {/* 兼容旧路由 */}
          <Route path="/diagnosis" element={<Navigate to="/dashboard" replace />} />
          <Route path="/growth-plan" element={<Navigate to="/expert" replace />} />
          <Route path="/content" element={<Navigate to="/expert" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </ThemeProvider>
  )
}
