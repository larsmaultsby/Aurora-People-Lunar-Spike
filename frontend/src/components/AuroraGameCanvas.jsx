import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Backpack, BookOpen, Compass, RefreshCw, Users, Handshake } from 'lucide-react'
import { auroraContext, conversationToMessages, interactionMessage } from '../aurora/adapter'
import { auroraBaseUrl, fetchAuroraView, interactAurora, moveAurora, waitAurora } from '../aurora/api'
import AuroraActionInput from './AuroraActionInput'

const TABS = [
  { id: 'inventory', label: 'Inventory', icon: Backpack },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'relationships', label: 'Relationships', icon: Users },
  { id: 'commitments', label: 'Commitments', icon: Handshake },
]

function ContextPanel({ active, context }) {
  if (!active) return null
  const items = context[active] || []
  return <aside className="w-full md:w-80 border-l border-white/5 bg-black/60 p-4 overflow-y-auto">
    <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-white/50 mb-4">{active}</h2>
    {items.length === 0 ? <p className="text-sm text-white/30">Nothing to show yet.</p> : <div className="space-y-3">{items.map((item, index) => {
      const title = item.name || item.title || item.personName || item.summary || item.typeLabel || `Entry ${index + 1}`
      const detail = item.detail || item.description || item.status || [item.familiarity, item.trust].filter(Boolean).join(' · ')
      return <article key={item.id || `${active}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><h3 className="text-sm font-semibold text-white">{title}</h3>{detail && <p className="text-xs text-white/45 mt-1 leading-relaxed">{detail}</p>}</article>
    })}</div>}
  </aside>
}

export default function AuroraGameCanvas() {
  const [view, setView] = useState(null)
  const [selectedPersonId, setSelectedPersonId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [activePanel, setActivePanel] = useState(null)
  const bottomRef = useRef(null)

  const adoptView = (next) => {
    setView(next)
    setSelectedPersonId((current) => next.scene.people.some((person) => person.id === current) ? current : next.scene.people[0]?.id || null)
  }
  const load = async () => {
    setBusy(true); setError('')
    try { adoptView(await fetchAuroraView()) } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  useEffect(() => { load() }, [])
  const context = useMemo(() => auroraContext(view), [view])
  const messages = useMemo(() => conversationToMessages(view), [view])
  const selectedPerson = context.people.find((person) => person.id === selectedPersonId) || null
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length])
  const run = async (operation) => {
    setBusy(true); setError('')
    try { adoptView(await operation()) } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  if (!view) return <div className="min-h-screen bg-black text-white flex items-center justify-center p-8"><div className="max-w-lg text-center"><p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-4">Aurora People Link</p><h1 className="text-3xl font-bold mb-4">{busy ? 'Connecting…' : 'Connection unavailable'}</h1>{error && <p className="text-rose-300/80 text-sm mb-6">{error}</p>}<p className="text-white/30 text-xs font-mono mb-6">{auroraBaseUrl}</p><button onClick={load} className="px-6 py-3 rounded-full bg-white text-black font-bold text-sm">Retry</button></div></div>

  const location = view.scene.location
  return <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
    <header className="flex-none border-b border-white/5 bg-black/85 backdrop-blur-xl px-4 md:px-6 py-4"><div className="flex items-center justify-between gap-4"><div className="min-w-0"><p className="text-[10px] uppercase tracking-[0.3em] text-white/35">{view.world.name} · moment {view.world.worldTime}</p><h1 className="text-xl md:text-2xl font-bold truncate">{location?.name || 'Unknown location'}</h1><p className="text-sm text-white/45 line-clamp-1">{location?.description || 'The scene is still resolving.'}</p></div><div className="flex items-center gap-2">{TABS.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setActivePanel((current) => current === id ? null : id)} title={label} aria-label={label} className={`p-2.5 rounded-xl border transition-colors ${activePanel === id ? 'bg-white text-black border-white' : 'bg-white/5 text-white/60 border-white/10 hover:text-white'}`}><Icon size={15} /></button>)}<button onClick={load} disabled={busy} title="Refresh" className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white disabled:opacity-30"><RefreshCw size={15} className={busy ? 'animate-spin' : ''} /></button><a href="/" className="px-3 py-2 rounded-xl border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white">Lunar</a></div></div></header>
    {error && <div className="flex-none px-4 py-2 bg-rose-950/60 border-b border-rose-500/20 text-rose-200 text-xs">{error}</div>}
    <div className="flex flex-1 min-h-0"><main className="flex-1 min-w-0 flex flex-col"><section className="flex-none px-4 md:px-8 py-4 border-b border-white/5 bg-white/[0.015]"><div className="max-w-4xl mx-auto"><div className="flex items-center gap-2 mb-3 text-[10px] uppercase tracking-[0.25em] text-white/35"><Users size={13} /> Present</div><div className="flex gap-3 overflow-x-auto pb-1">{context.people.length === 0 ? <p className="text-sm text-white/30">No one else is here.</p> : context.people.map((person) => <button key={person.id} onClick={() => setSelectedPersonId(person.id)} className={`min-w-[180px] text-left rounded-2xl p-4 border transition-all ${person.id === selectedPersonId ? 'border-white/40 bg-white/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'}`}><div className="font-semibold text-sm">{person.name}</div><div className="text-[11px] text-white/40 mt-1">{[person.relationship?.familiarity, person.relationship?.trust].filter(Boolean).join(' · ')}</div>{person.description && <div className="text-xs text-white/35 mt-2 line-clamp-2">{person.description}</div>}</button>)}</div></div></section>
      <section className="flex-1 overflow-y-auto px-4 md:px-8 py-6"><div className="max-w-4xl mx-auto space-y-7">{messages.length === 0 && <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8"><p className="text-xs uppercase tracking-[0.25em] text-white/30 mb-3">Current scene</p><p className="font-serif text-lg text-white/80 leading-relaxed">{location?.description || 'Your story begins here.'}</p></div>}{messages.map((message) => message.role === 'user' ? <div key={message.id} className="flex justify-end"><div className="max-w-2xl rounded-2xl rounded-tr-sm border border-white/20 bg-white/10 px-5 py-3.5 text-sm text-white/90">{message.content}</div></div> : <div key={message.id} className="max-w-3xl"><div className="text-[10px] uppercase tracking-[0.25em] text-white/35 mb-2">{message.personName || 'World'}</div><div className="prose prose-invert prose-p:text-white/85 prose-p:font-light max-w-none font-serif"><ReactMarkdown>{message.content}</ReactMarkdown></div></div>)}{busy && <div className="text-xs uppercase tracking-[0.25em] text-white/25 animate-pulse">World updating…</div>}<div ref={bottomRef} /></div></section>
      <section className="flex-none border-t border-white/5 bg-black/85 backdrop-blur-2xl"><div className="max-w-4xl mx-auto px-4 pt-3"><div className="flex items-center justify-between gap-3 text-xs text-white/35"><span>Focus: <strong className="text-white/70">{selectedPerson?.name || 'No one'}</strong></span><div className="flex items-center gap-2"><Compass size={13} />{context.destinations.map((destination) => <button key={destination.id} disabled={busy} onClick={() => run(() => moveAurora(destination.id))} className="px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/30 hover:text-white disabled:opacity-30">{destination.name}</button>)}</div></div></div><AuroraActionInput disabled={busy} hasTarget={Boolean(selectedPerson)} onWait={() => run(() => waitAurora(1))} onSubmit={({ mode, text }) => run(() => interactAurora({ message: interactionMessage(mode, text), personId: selectedPerson.id, privacyMode: 'public' }))} /></section>
    </main><ContextPanel active={activePanel} context={context} /></div>
  </div>
}
