import { useState } from 'react'
import { Send } from 'lucide-react'

const MODES = [
  { id: 'DO', label: 'Do', hint: 'Describe an action' },
  { id: 'SAY', label: 'Say', hint: 'Speak to the selected person' },
]

export default function AuroraActionInput({ onSubmit, onWait, disabled, hasTarget }) {
  const [mode, setMode] = useState('DO')
  const [text, setText] = useState('')
  const submit = (event) => {
    event?.preventDefault?.()
    const body = text.trim()
    if (!body || disabled || !hasTarget) return
    onSubmit({ mode, text: body })
    setText('')
  }
  return (
    <form onSubmit={submit} className="p-4 md:p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex gap-2">
          {MODES.map((item) => (
            <button key={item.id} type="button" title={item.hint} onClick={() => setMode(item.id)} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all ${mode === item.id ? 'bg-white/10 text-white border-white/20' : 'text-white/30 border-transparent hover:text-white/70 hover:bg-white/5'}`}>{item.label}</button>
          ))}
        </div>
        <button type="button" onClick={onWait} disabled={disabled} className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-white/50 border border-white/10 hover:text-white hover:border-white/30 disabled:opacity-30">Wait</button>
      </div>
      <div className="flex gap-3 items-end">
        <textarea value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(event) } }} disabled={disabled || !hasTarget} rows={2} placeholder={!hasTarget ? 'Choose someone present before interacting…' : mode === 'SAY' ? 'What do you say?' : 'What do you do?'} className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-white/40 resize-none text-sm font-light" />
        <button type="submit" disabled={disabled || !hasTarget || !text.trim()} className="bg-white text-black hover:bg-gray-200 rounded-full px-5 h-[52px] flex items-center justify-center disabled:opacity-30" title="Send"><Send size={18} /></button>
      </div>
    </form>
  )
}
