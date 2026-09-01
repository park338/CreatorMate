import { Outlet, Link, useLocation } from 'react-router-dom'
import { Sparkles, User, PenTool, Rocket, BarChart3, TrendingUp, Fingerprint, Sun, Moon } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

const navItems = [
  { path: '/dashboard', label: '专属画布', icon: User },
  { path: '/workshop', label: '创作工坊', icon: PenTool },
  { path: '/expert', label: '专家规划', icon: Rocket },
  { path: '/style-lab', label: '风格培养仓', icon: Fingerprint },
  { path: '/review', label: '数据复盘', icon: BarChart3 },
]

export default function Layout({ onOpenAssistant }) {
  const { pathname } = useLocation()
  const { profile } = useApp()
  const { dark, toggle } = useTheme()

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-white/60 dark:border-slate-700/60">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-1">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 mr-4 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-grape-500 to-brand-500 flex items-center justify-center text-white shadow-glow">
              <Sparkles size={16} />
            </div>
            <span className="font-bold text-sm bg-gradient-to-r from-grape-600 to-brand-600 bg-clip-text text-transparent hidden sm:inline">
              小悠涨粉搭子
            </span>
          </Link>

          {/* 导航菜单 */}
          <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto">
            {navItems.map((item) => {
              const active = pathname === item.path
              const Icon = item.icon
              return (
                <Link key={item.path} to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap
                    ${active ? 'bg-gradient-to-r from-grape-500 to-brand-500 text-white shadow-glow' : 'text-slate-500 dark:text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-slate-800'}`}>
                  <Icon size={15} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* 暗色模式切换 */}
          <button
            onClick={toggle}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0 ml-1"
            title={dark ? '切换到亮色模式' : '切换到暗色模式'}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>


        </div>
      </header>

      {/* 内容区 */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 relative z-10">
        <Outlet context={{ onOpenAssistant }} />
      </main>

      {/* 页脚 */}
      <footer className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
        <p className="flex items-center justify-center gap-1">
          <TrendingUp size={12} /> 小悠涨粉搭子 · 让每个新手博主都能科学涨粉
        </p>
      </footer>
    </div>
  )
}
