import { useRef, useState } from 'react'
import {
  Building2,
  MapPin,
  Users,
  Bell,
  Printer,
  Upload,
  Trash2,
  Plus,
  Check,
  Store,
  Image as ImageIcon,
  AlertTriangle,
} from 'lucide-react'
import { useApp } from '../store/AppStore'
import { usePrint } from '../store/PrintProvider'
import { useToast } from '../components/ui/Toast'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Field, Input, Select, Textarea } from '../components/ui/Field'
import { Toggle } from '../components/ui/Toggle'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { Badge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/Modal'
import type { Attendant, ParkSettings } from '../types'
import { sampleDemoTicket } from '../lib/sampleData'

type Tab = 'profile' | 'destinations' | 'staff' | 'notifications' | 'printing'

export function Settings() {
  const { settings, saveSettings, reseed } = useApp()
  const { printTicket, printDigital } = usePrint()
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('profile')
  const [draft, setDraft] = useState<ParkSettings>(settings)
  const [newDest, setNewDest] = useState('')
  const [newAtt, setNewAtt] = useState({ name: '', phone: '', role: 'Attendant' })
  const [reseedOpen, setReseedOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const save = (patch: Partial<ParkSettings>) => {
    const next = { ...draft, ...patch }
    setDraft(next)
    saveSettings(patch)
  }

  const onLogo = (file?: File) => {
    if (!file) return
    if (file.size > 1_500_000) {
      toast.error('Image too large', 'Please use an image under 1.5 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => save({ logoDataUrl: reader.result as string })
    reader.readAsDataURL(file)
    toast.success('Logo uploaded')
  }

  const addDestination = () => {
    const d = newDest.trim()
    if (!d) return
    if (draft.destinations.includes(d)) { toast.warning('Destination already exists'); return }
    save({ destinations: [...draft.destinations, d].sort() })
    setNewDest('')
    toast.success('Destination added', d)
  }
  const removeDestination = (d: string) => save({ destinations: draft.destinations.filter((x) => x !== d) })

  const addAttendant = () => {
    if (!newAtt.name.trim()) { toast.error('Name required'); return }
    const att: Attendant = { id: `a${Date.now()}`, name: newAtt.name.trim(), phone: newAtt.phone.trim(), role: newAtt.role.trim() || 'Attendant', active: true }
    save({ attendants: [...draft.attendants, att] })
    setNewAtt({ name: '', phone: '', role: 'Attendant' })
    toast.success('Attendant added', att.name)
  }
  const removeAttendant = (id: string) => save({ attendants: draft.attendants.filter((a) => a.id !== id) })
  const toggleAttendant = (id: string) => save({ attendants: draft.attendants.map((a) => a.id === id ? { ...a, active: !a.active } : a) })

  const printTest = (width: 48 | 80) => {
    const t = { ...sampleDemoTicket(), printWidth: width }
    saveSettings({ defaultPrintWidth: width })
    setDraft({ ...draft, defaultPrintWidth: width })
    printTicket(t)
  }

  const tabs = [
    { label: 'Profile', value: 'profile' as const, icon: Store },
    { label: 'Destinations', value: 'destinations' as const, icon: MapPin },
    { label: 'Staff', value: 'staff' as const, icon: Users },
    { label: 'Notifications', value: 'notifications' as const, icon: Bell },
    { label: 'Printing', value: 'printing' as const, icon: Printer },
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Manage your park profile, staff, and preferences" />

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <SegmentedControl<Tab> options={tabs.map((t) => ({ label: t.label, value: t.value }))} value={tab} onChange={setTab} />
      </div>

      {/* Profile */}
      {tab === 'profile' && (
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4 text-brand-600" /> Park / business profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Park or business name" htmlFor="parkName" required>
                <Input id="parkName" value={draft.parkName} onChange={(e) => save({ parkName: e.target.value })} placeholder="e.g. Mbarara Bus Park" />
              </Field>
              <Field label="Address" htmlFor="parkAddress">
                <Textarea id="parkAddress" value={draft.parkAddress} onChange={(e) => save({ parkAddress: e.target.value })} placeholder="Plot 12, High Street, Mbarara City" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Phone number" htmlFor="parkPhone">
                  <Input id="parkPhone" value={draft.parkPhone} onChange={(e) => save({ parkPhone: e.target.value })} placeholder="+256 772 112 233" />
                </Field>
                <Field label="Default origin park" htmlFor="defaultOrigin">
                  <Input id="defaultOrigin" value={draft.defaultOrigin} onChange={(e) => save({ defaultOrigin: e.target.value })} placeholder="e.g. Mbarara" />
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-brand-600" /> Logo</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex h-32 items-center justify-center overflow-hidden rounded-xl border border-dashed border-ink-200 bg-ink-50">
                {draft.logoDataUrl ? (
                  <img src={draft.logoDataUrl} alt="Park logo" className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="text-center text-ink-400">
                    <Upload className="mx-auto h-8 w-8" />
                    <p className="mt-1 text-xs">No logo uploaded</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(e.target.files?.[0])} />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" leftIcon={<Upload className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>Upload</Button>
                {draft.logoDataUrl && <Button variant="ghost" size="icon" onClick={() => save({ logoDataUrl: undefined })} aria-label="Remove logo"><Trash2 className="h-4 w-4 text-red-500" /></Button>}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader><CardTitle>Ticket numbering & currency</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Ticket prefix" htmlFor="prefix" hint="e.g. MBR, KLA">
                  <Input id="prefix" value={draft.ticketPrefix} onChange={(e) => save({ ticketPrefix: e.target.value.toUpperCase().slice(0, 5) })} />
                </Field>
                <Field label="Number padding" htmlFor="pad" hint="Digits in the sequence number">
                  <Select id="pad" value={draft.ticketPad} onChange={(e) => save({ ticketPad: Number(e.target.value) })}>
                    <option value={4}>4 (e.g. 0184)</option>
                    <option value={5}>5 (e.g. 00184)</option>
                    <option value={6}>6 (e.g. 000184)</option>
                  </Select>
                </Field>
                <Field label="Currency" htmlFor="currency">
                  <Select id="currency" value={draft.currency} onChange={(e) => save({ currency: e.target.value })}>
                    <option value="UGX">UGX — Uganda Shillings</option>
                    <option value="USD">USD — US Dollars</option>
                  </Select>
                </Field>
              </div>
              <p className="mt-3 text-xs text-ink-400">
                Example ticket ID: <span className="font-mono font-semibold text-ink-600">{draft.ticketPrefix}-2026-{'0'.repeat(draft.ticketPad)}1</span>
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Destinations */}
      {tab === 'destinations' && (
        <Card>
          <CardHeader><CardTitle>Destination management</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={newDest} onChange={(e) => setNewDest(e.target.value)} placeholder="Add a destination, e.g. Kabale" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDestination())} />
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={addDestination}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {draft.destinations.map((d) => (
                <span key={d} className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-ink-50 px-3 py-1.5 text-sm text-ink-700">
                  {d}
                  <button onClick={() => removeDestination(d)} className="rounded-full text-ink-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                </span>
              ))}
            </div>
            <p className="text-xs text-ink-400">These destinations appear as suggestions in the New ticket form.</p>
          </CardContent>
        </Card>
      )}

      {/* Staff */}
      {tab === 'staff' && (
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Add attendant</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-4">
                <Input value={newAtt.name} onChange={(e) => setNewAtt((a) => ({ ...a, name: e.target.value }))} placeholder="Full name" />
                <Input value={newAtt.phone} onChange={(e) => setNewAtt((a) => ({ ...a, phone: e.target.value }))} placeholder="Phone number" />
                <Input value={newAtt.role} onChange={(e) => setNewAtt((a) => ({ ...a, role: e.target.value }))} placeholder="Role" />
                <Button leftIcon={<Plus className="h-4 w-4" />} onClick={addAttendant}>Add attendant</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Attendants ({draft.attendants.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-ink-100">
                {draft.attendants.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">{a.name.slice(0, 1)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink-900">{a.name}</p>
                      <p className="text-xs text-ink-500">{a.role} · {a.phone || 'No phone'}</p>
                    </div>
                    <Badge tone={a.active ? 'green' : 'gray'}>{a.active ? 'Active' : 'Inactive'}</Badge>
                    <Toggle checked={a.active} onChange={() => toggleAttendant(a.id)} />
                    <Button variant="ghost" size="icon" onClick={() => removeAttendant(a.id)} aria-label="Remove"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications */}
      {tab === 'notifications' && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4 text-brand-600" /> Notification preferences</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <NotifRow title="New ticket created" desc="Notify when a new parcel ticket is created" checked={draft.notifications.newTicket} onChange={(v) => save({ notifications: { ...draft.notifications, newTicket: v } })} />
            <NotifRow title="Status changes" desc="Notify when a parcel status changes" checked={draft.notifications.statusChange} onChange={(v) => save({ notifications: { ...draft.notifications, statusChange: v } })} />
            <NotifRow title="Delayed parcels" desc="Alert when a parcel is marked delayed" checked={draft.notifications.delayedParcel} onChange={(v) => save({ notifications: { ...draft.notifications, delayedParcel: v } })} />
          </CardContent>
        </Card>
      )}

      {/* Printing */}
      {tab === 'printing' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Printer className="h-4 w-4 text-brand-600" /> Default printer width</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Default thermal printer width" htmlFor="dwidth">
                <Select id="dwidth" value={draft.defaultPrintWidth} onChange={(e) => save({ defaultPrintWidth: Number(e.target.value) as 48 | 80 })}>
                  <option value={48}>48 mm (narrow receipt)</option>
                  <option value={80}>80 mm (wide receipt)</option>
                </Select>
              </Field>
              <p className="text-xs text-ink-400">Used as the default when creating new tickets. You can still change it per ticket.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Print test</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-ink-500">Print a sample ticket to verify your thermal printer is set up correctly.</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" className="flex-1" leftIcon={<Printer className="h-4 w-4" />} onClick={() => printTest(48)}>Test 48 mm</Button>
                <Button variant="outline" className="flex-1" leftIcon={<Printer className="h-4 w-4" />} onClick={() => printTest(80)}>Test 80 mm</Button>
              </div>
              <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
                In the print dialog set: <strong>Paper size = Custom (48/80mm)</strong>, Margins = None, Scale = 100%, Headers and footers OFF.
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Danger zone */}
      <Card className="border-red-100">
        <CardHeader><CardTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-4 w-4" /> Demo data</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-500">Reset all tickets and settings to the original sample data. This cannot be undone.</p>
          <Button variant="danger" leftIcon={<Check className="h-4 w-4" />} onClick={() => setReseedOpen(true)}>Reset demo data</Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={reseedOpen}
        onClose={() => setReseedOpen(false)}
        onConfirm={() => { reseed(); setDraft({ ...settings }); setReseedOpen(false); toast.success('Demo data reset', 'Sample tickets and settings restored.') }}
        title="Reset demo data?"
        message="This will replace all current tickets and settings with the original sample data. This cannot be undone."
        confirmLabel="Reset everything"
        variant="danger"
      />
    </div>
  )
}

function NotifRow({ title, desc, checked, onChange }: { title: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-ink-100 p-3">
      <div>
        <p className="text-sm font-medium text-ink-800">{title}</p>
        <p className="text-xs text-ink-500">{desc}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}
