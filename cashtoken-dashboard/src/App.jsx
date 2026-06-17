import './index.css'

export default function App() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-[#00C896] rounded-md flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-zinc-900 text-sm leading-tight">CashToken</div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-stone-400">Marketing Ops</div>
          </div>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 mb-2">
          Hello CashToken
        </h1>
        <p className="text-stone-500 text-sm">Phase 0 complete — Tailwind is working.</p>
      </div>
    </div>
  )
}
