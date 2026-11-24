import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import Button from '../ui/Button'
import Field from '../ui/Field'
import Select from '../ui/Select'
import { toast } from '../ui/Toast'
import { saveTemplates, useTemplates } from '../../lib/customers'
import { Card } from './shared'

const VARS = ['{first_name}', '{device}', '{booking_link}', '{review_link}', '{order_ref}']
const EMPTY = { id: '', name: '', type: 'service', text: '' }

// Settings > Templates: messages used for follow-ups. Marketing ones only go to customers who agreed.
export default function TemplatesCard() {
  const templates = useTemplates()
  const [edit, setEdit] = useState(null) // template being edited / created

  const save = (e) => {
    e.preventDefault()
    if (!edit.name.trim() || !edit.text.trim()) return
    const item = { ...edit, id: edit.id || `tpl-${Date.now()}`, name: edit.name.trim(), text: edit.text.trim() }
    saveTemplates(edit.id ? templates.map((t) => (t.id === edit.id ? item : t)) : [...templates, item])
    toast('Template saved')
    setEdit(null)
  }
  const remove = (id) => { if (window.confirm('Delete this template?')) saveTemplates(templates.filter((t) => t.id !== id)) }

  return (
    <Card title="Message templates" action={!edit && <Button onClick={() => setEdit(EMPTY)} className="!h-9 !px-4 !text-sm"><Plus size={14} /> New</Button>}>
      {edit && (
        <form onSubmit={save} className="mb-5 space-y-3 rounded-2xl bg-[#F6F7F9] p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
            <Field label="Name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            <Select label="Type" value={edit.type} onChange={(v) => setEdit({ ...edit, type: v })} options={[{ value: 'service', label: 'Service (anyone)' }, { value: 'marketing', label: 'Marketing (consent only)' }]} />
          </div>
          <div>
            <label htmlFor="tpl-text" className="mb-1.5 block text-[13px] font-bold text-body">Message</label>
            <textarea id="tpl-text" rows={4} value={edit.text} onChange={(e) => setEdit({ ...edit, text: e.target.value })} className="w-full rounded-[14px] border border-field bg-white px-4 py-3 text-[15px] outline-none focus:border-accent focus:ring-2 focus:ring-accent" />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {VARS.map((v) => <button key={v} type="button" onClick={() => setEdit({ ...edit, text: `${edit.text}${edit.text.endsWith(' ') || !edit.text ? '' : ' '}${v}` })} className="rounded-full border border-line bg-white px-2.5 py-1 text-xs font-bold text-accent hover:border-accent">{v}</button>)}
            </div>
          </div>
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setEdit(null)} className="!h-10 !text-sm">Cancel</Button><Button type="submit" className="!h-10 !text-sm">Save template</Button></div>
        </form>
      )}
      <ul className="divide-y divide-line">
        {templates.map((t) => (
          <li key={t.id} className="flex items-start gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{t.name} <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${t.type === 'marketing' ? 'bg-[#FFF4DB] text-[#9A6A00]' : 'bg-success-tint text-success'}`}>{t.type}</span></p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted">{t.text}</p>
            </div>
            <button type="button" onClick={() => setEdit(t)} aria-label={`Edit ${t.name}`} className="grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-[#F1F3F7] hover:text-ink"><Pencil size={14} /></button>
            <button type="button" onClick={() => remove(t.id)} aria-label={`Delete ${t.name}`} className="grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-[#FDECEA] hover:text-danger"><Trash2 size={14} /></button>
          </li>
        ))}
      </ul>
    </Card>
  )
}
