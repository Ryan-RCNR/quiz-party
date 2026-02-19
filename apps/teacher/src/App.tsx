import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn, UserButton } from '@clerk/clerk-react'
import { BookOpen, AlertCircle, PlusCircle } from 'lucide-react'
import { Dashboard } from './pages/Dashboard'
import { CreateSession } from './pages/CreateSession'
import { HostScreen } from './pages/HostScreen'
import { QuestionBanks } from './pages/QuestionBanks'
import { HowItWorksOverlay, useHowItWorks } from './components/HowItWorksOverlay'
import type { ReactNode } from 'react'

/* ── RCNR Nav Components ─────────────────────────────────────── */

function RCNRLogo(): React.JSX.Element {
  return (
    <a
      href="https://teacher.rcnr.net"
      className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand/10 hover:bg-brand/20 transition-colors"
      title="Back to Dashboard"
    >
      <svg
        width="28"
        height="24"
        viewBox="0 0 120 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M10,90l26.48-39.76h.31s4.54,5.02,4.54,5.02l.32-.16,23.06-37.14,17.34,28.63,3.65-4.61,30.22,48.03h-8.43c-7.17-12.26-15.51-24.35-23.06-36.26-1.43.52-2.03,3.6-3.49,3.97l-16.31-25.93-21.87,34.36-5.09-5.01-19.48,28.87h-8.19Z" fill="#fff" />
        <path d="M89.84,90h-5.73c-6.34-8.18-12.93-16.89-19.64-24.65-6.66,8.19-13.04,16.6-19.89,24.65h-5.81l25.69-39.76,25.37,39.76Z" fill="#fff" />
      </svg>
    </a>
  )
}

function NavButton({ onClick, icon, label, title }: {
  onClick: () => void
  icon: ReactNode
  label: string
  title: string
}): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 text-brand/70 hover:text-brand hover:bg-white/5 rounded-lg transition-colors"
      title={title}
    >
      {icon}
      <span className="hidden md:inline text-sm">{label}</span>
    </button>
  )
}

function NavActions({ onHowItWorks }: { onHowItWorks?: () => void }): React.JSX.Element {
  const handleReport = () => {
    window.open('https://teacher.rcnr.net?report=true&tool=quizparty', '_blank')
  }

  const handleRequest = () => {
    window.open('https://teacher.rcnr.net?request=true', '_blank')
  }

  return (
    <>
      {onHowItWorks && (
        <NavButton
          onClick={onHowItWorks}
          title="How this tool works"
          label="How It Works"
          icon={<BookOpen size={18} />}
        />
      )}
      <NavButton
        onClick={handleReport}
        title="Report an issue"
        label="Report Issue"
        icon={<AlertCircle size={18} />}
      />
      <NavButton
        onClick={handleRequest}
        title="Request a tool to be made"
        label="Request Tool"
        icon={<PlusCircle size={18} />}
      />
    </>
  )
}

/* ── How It Works Sections ───────────────────────────────────── */

const HOW_IT_WORKS_SECTIONS = [
  {
    title: "Getting Started",
    icon: <BookOpen size={16} />,
    items: [
      "Create a new quiz session from your question bank or import from QuizForge",
      "Share the game code with students -- no accounts needed to play",
      "Host the live game with real-time leaderboard on your screen",
      "Review results and scores after the session ends",
    ],
  },
  {
    title: "Tips",
    icon: <BookOpen size={16} />,
    items: [
      "Import questions directly from QuizForge to save time",
      "Use team mode for collaborative review sessions",
      "The leaderboard and music keep students engaged and competitive",
      "Save your games to reuse them across different class periods",
    ],
  },
  {
    title: "Limitations",
    icon: <BookOpen size={16} />,
    items: [
      "Maximum 100 students per game session",
      "Requires stable internet for all participants",
      "No team mode yet (coming soon)",
    ],
  },
]

/* ── Layout ──────────────────────────────────────────────────── */

function Layout({ children, onHowItWorks }: { children: React.ReactNode; onHowItWorks: () => void }) {
  return (
    <div className="min-h-screen">
      <header className="glass border-b border-brand/15 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <RCNRLogo />
            <h1 className="text-xl font-bold text-brand" style={{ fontFamily: 'var(--font-display)' }}>
              Quiz Party
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <NavActions onHowItWorks={onHowItWorks} />
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}

/* ── Protected Route ─────────────────────────────────────────── */

function ProtectedRoute({ children, onHowItWorks }: { children: React.ReactNode; onHowItWorks: () => void }) {
  return (
    <>
      <SignedIn>
        <Layout onHowItWorks={onHowItWorks}>{children}</Layout>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}

/* ── App ─────────────────────────────────────────────────────── */

export default function App() {
  const howItWorks = useHowItWorks("quizparty")

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute onHowItWorks={howItWorks.open}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create"
          element={
            <ProtectedRoute onHowItWorks={howItWorks.open}>
              <CreateSession />
            </ProtectedRoute>
          }
        />
        <Route
          path="/banks"
          element={
            <ProtectedRoute onHowItWorks={howItWorks.open}>
              <QuestionBanks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/host/:code"
          element={
            <ProtectedRoute onHowItWorks={howItWorks.open}>
              <HostScreen />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <HowItWorksOverlay
        isOpen={howItWorks.isOpen}
        onClose={howItWorks.close}
        toolName="Quiz Party"
        sections={HOW_IT_WORKS_SECTIONS}
      />
    </BrowserRouter>
  )
}
