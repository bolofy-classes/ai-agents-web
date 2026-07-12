import { useMemo, useState } from 'react'

const statCards = [
  { label: 'Total Users', value: '12,847', trend: '+12.4% this month', trendColor: 'text-green-600', icon: '👥' },
  { label: 'Revenue', value: '$48,290', trend: '+8.1% this month', trendColor: 'text-green-600', icon: '💵' },
  { label: 'Active Sessions', value: '1,204', trend: '-2.3% this month', trendColor: 'text-red-600', icon: '⚡' },
  { label: 'Conversion Rate', value: '3.42%', trend: '+0.4% this month', trendColor: 'text-green-600', icon: '📈' },
]

const chartData = [40, 65, 50, 80, 60, 90, 70]
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const activity = [
  { text: 'New user registered — Sarah Chen', time: '5 minutes ago' },
  { text: 'Payment received from Acme Corp', time: '1 hour ago' },
  { text: 'Server deployment completed', time: '3 hours ago' },
  { text: 'Weekly report generated', time: 'Yesterday' },
]

const transactions = [
  { name: 'Sarah Chen', date: 'Jul 12, 2026', status: 'Completed', badge: 'bg-green-100 text-green-600', amount: '$1,240.00' },
  { name: 'James Wilson', date: 'Jul 11, 2026', status: 'Pending', badge: 'bg-amber-100 text-amber-700', amount: '$890.00' },
  { name: 'Acme Corp', date: 'Jul 10, 2026', status: 'Completed', badge: 'bg-green-100 text-green-600', amount: '$5,600.00' },
  { name: 'Maria Garcia', date: 'Jul 9, 2026', status: 'Failed', badge: 'bg-red-100 text-red-600', amount: '$320.00' },
  { name: 'Tom Baker', date: 'Jul 8, 2026', status: 'Completed', badge: 'bg-green-100 text-green-600', amount: '$2,150.00' },
]

const emails = [
  { initial: 'A', from: 'Alex Turner', subject: 'Q3 roadmap review — feedback needed', time: '10:24 AM' },
  { initial: 'M', from: 'Maya Patel', subject: 'Re: Design handoff for dashboard', time: '9:02 AM' },
  { initial: 'G', from: 'GitHub', subject: '[repo] 3 new pull requests opened', time: 'Yesterday' },
  { initial: 'L', from: 'Linda Park', subject: 'Invoice #4021 attached', time: 'Yesterday' },
  { initial: 'S', from: 'Slack', subject: 'You have 4 unread messages', time: 'Mon' },
  { initial: 'N', from: 'Nina Rossi', subject: 'Lunch next week?', time: 'Mon' },
]

const navDefs = [
  { key: 'dashboard', label: 'Dashboard', icon: '▦' },
  { key: 'gmail', label: 'Gmail', icon: '✉' },
]

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    let eErr = ''
    let pErr = ''
    if (!email.trim()) eErr = 'Email is required'
    else if (!emailRe.test(email)) eErr = 'Enter a valid email address'
    if (!password.trim()) pErr = 'Password is required'
    else if (password.length < 6) pErr = 'Password must be at least 6 characters'

    if (eErr || pErr) {
      setEmailError(eErr)
      setPasswordError(pErr)
      return
    }
    const name = email.split('@')[0]
    onLogin(name.charAt(0).toUpperCase() + name.slice(1))
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-[400px] rounded-2xl border border-neutral-200 bg-white p-10 shadow-sm animate-[fadeIn_0.4s_ease]">
        <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-[10px] bg-neutral-900">
          <div className="h-4 w-4 rounded bg-white" />
        </div>
        <h1 className="mb-1 text-[22px] font-semibold text-neutral-900">Welcome back</h1>
        <p className="mb-7 text-sm text-neutral-500">Sign in to continue to your dashboard</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-neutral-800">Email</label>
            <input
              type="text"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError('') }}
              placeholder="you@example.com"
              className={`w-full rounded-[9px] border px-3.5 py-2.5 text-sm text-neutral-900 outline-none ${emailError ? 'border-red-600' : 'border-neutral-200'}`}
            />
            {emailError && <p className="mt-1.5 text-xs text-red-600">{emailError}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-neutral-800">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError('') }}
              placeholder="••••••••"
              className={`w-full rounded-[9px] border px-3.5 py-2.5 text-sm text-neutral-900 outline-none ${passwordError ? 'border-red-600' : 'border-neutral-200'}`}
            />
            {passwordError && <p className="mt-1.5 text-xs text-red-600">{passwordError}</p>}
          </div>
          <button
            type="submit"
            className="mt-2 w-full cursor-pointer rounded-[9px] bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-700"
          >
            Sign in
          </button>
        </form>
        <p className="mt-5 text-center text-xs text-neutral-400">Use any email + password of 6+ characters</p>
      </div>
    </div>
  )
}

function Dashboard({ userName }) {
  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      <h1 className="mb-1 text-[22px] font-semibold text-neutral-900">Welcome back, {userName}</h1>
      <p className="mb-7 text-sm text-neutral-500">Here's what's happening with your account today.</p>

      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="mb-3.5 flex items-center justify-between">
              <span className="text-[13px] font-medium text-neutral-500">{card.label}</span>
              <span className="text-base">{card.icon}</span>
            </div>
            <div className="mb-1.5 text-[26px] font-bold text-neutral-900">{card.value}</div>
            <div className={`text-xs font-medium ${card.trendColor}`}>{card.trend}</div>
          </div>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="mb-[18px] text-sm font-semibold text-neutral-900">Weekly Activity</div>
          <div className="flex h-40 items-end gap-2.5">
            {chartData.map((v, i) => (
              <div key={days[i]} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <div className="w-full max-w-[28px] rounded-t-[5px] bg-neutral-900" style={{ height: `${v}%` }} />
                <span className="text-[11px] text-neutral-400">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="mb-4 text-sm font-semibold text-neutral-900">Recent Activity</div>
          <div className="flex flex-col gap-3.5">
            {activity.map((act) => (
              <div key={act.text} className="flex items-start gap-2.5">
                <div className="mt-[5px] h-2 w-2 flex-shrink-0 rounded-full bg-neutral-900" />
                <div className="min-w-0">
                  <div className="text-[13px] text-neutral-800">{act.text}</div>
                  <div className="mt-0.5 text-[11px] text-neutral-400">{act.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-100 px-5 py-[18px] text-sm font-semibold text-neutral-900">
          Recent Transactions
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-neutral-50">
              {['Name', 'Date', 'Status'].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">{h}</th>
              ))}
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.name} className="border-t border-neutral-100">
                <td className="px-5 py-3.5 text-[13px] font-medium text-neutral-900">{tx.name}</td>
                <td className="px-5 py-3.5 text-[13px] text-neutral-500">{tx.date}</td>
                <td className="px-5 py-3.5">
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tx.badge}`}>{tx.status}</span>
                </td>
                <td className="px-5 py-3.5 text-right text-[13px] font-semibold text-neutral-900">{tx.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Gmail() {
  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      <h1 className="mb-1 text-[22px] font-semibold text-neutral-900">Gmail</h1>
      <p className="mb-6 text-sm text-neutral-500">Your inbox, connected.</p>
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        {emails.map((mail) => (
          <div key={mail.subject} className="flex items-center gap-3.5 border-b border-neutral-100 px-5 py-4 hover:bg-neutral-50">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[13px] font-semibold text-white">
              {mail.initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-neutral-900">{mail.from}</div>
              <div className="truncate text-[13px] text-neutral-600">{mail.subject}</div>
            </div>
            <div className="flex-shrink-0 text-xs text-neutral-400">{mail.time}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [userName, setUserName] = useState('User')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activePage, setActivePage] = useState('dashboard')
  const [profileOpen, setProfileOpen] = useState(false)

  const userInitial = (userName || 'U').charAt(0).toUpperCase()
  const userEmail = useMemo(() => `${(userName || 'user').toLowerCase()}@example.com`, [userName])

  const handleLogout = () => {
    setLoggedIn(false)
    setUserName('User')
    setProfileOpen(false)
    setActivePage('dashboard')
  }

  if (!loggedIn) {
    return <Login onLogin={(name) => { setUserName(name); setLoggedIn(true) }} />
  }

  const activeLabel = activePage === 'dashboard' ? 'Dashboard' : 'Gmail'

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Sidebar */}
      <div
        className="flex flex-shrink-0 flex-col overflow-hidden bg-neutral-900 text-white transition-all duration-200"
        style={{ width: sidebarOpen ? 220 : 72 }}
      >
        <div className="flex min-h-6 items-center gap-2.5 border-b border-neutral-800 px-[18px] py-5">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[7px] bg-white">
            <div className="h-2.5 w-2.5 rounded-[3px] bg-neutral-900" />
          </div>
          {sidebarOpen && <span className="whitespace-nowrap text-[15px] font-semibold">Acme Inc</span>}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-3">
          {navDefs.map((item) => {
            const active = activePage === item.key
            return (
              <button
                key={item.key}
                onClick={() => { setActivePage(item.key); setProfileOpen(false) }}
                className={`flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white hover:bg-neutral-800 ${active ? 'bg-neutral-800' : 'bg-transparent'}`}
              >
                <span className="w-5 flex-shrink-0 text-center text-[17px]">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            )
          })}
        </div>

        <div className="border-t border-neutral-800 p-3">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] text-neutral-400 hover:bg-neutral-800 hover:text-white ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
          >
            <span className="inline-block text-[15px]" style={{ transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)' }}>←</span>
            {sidebarOpen && <span>Collapse</span>}
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col bg-neutral-50">
        {/* Topbar */}
        <div className="relative flex h-16 flex-shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-7">
          <div className="text-[15px] font-semibold text-neutral-900">{activeLabel}</div>
          <div className="flex items-center gap-1.5">
            <button className="relative flex h-[38px] w-[38px] items-center justify-center rounded-[9px] border border-neutral-200 bg-white text-base hover:bg-neutral-100">
              🔔
              <span className="absolute right-2 top-[7px] h-[7px] w-[7px] rounded-full border-[1.5px] border-white bg-neutral-900" />
            </button>

            <div className="relative">
              <button
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 rounded-[9px] border border-neutral-200 bg-white py-[5px] pl-[5px] pr-2.5 hover:bg-neutral-100"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">{userInitial}</div>
                <span className="text-[13px] font-medium text-neutral-900">{userName}</span>
                <span className="text-[10px] text-neutral-400">▾</span>
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-[46px] z-10 w-50 animate-[fadeIn_0.15s_ease] rounded-xl border border-neutral-200 bg-white p-2 shadow-lg">
                  <div className="mb-1.5 border-b border-neutral-100 px-3 py-2.5">
                    <div className="text-[13px] font-semibold text-neutral-900">{userName}</div>
                    <div className="text-xs text-neutral-400">{userEmail}</div>
                  </div>
                  <button className="w-full rounded-lg px-3 py-2.5 text-left text-[13px] text-neutral-800 hover:bg-neutral-100">Settings</button>
                  <button
                    onClick={handleLogout}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-[13px] font-medium text-red-600 hover:bg-red-50"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 pb-10 pt-7">
          {activePage === 'dashboard' ? <Dashboard userName={userName} /> : <Gmail />}
        </div>
      </div>
    </div>
  )
}

export default App
