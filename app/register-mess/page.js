'use client'
import { useState } from 'react'

const TAGLINES = [
  'Ghar jaisa khana, roz',
  'Fresh meals, every day',
  'Sasta, swadisht, bharosa',
  'Your daily meal, sorted',
]

export default function RegisterMess() {
  const [form, setForm] = useState({
    name: '', ownerName: '', phone: '', address: '', password: '', tagline: ''
  })
  const [customTagline, setCustomTagline] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setLoading(false); return }

      localStorage.setItem('pending_mess', JSON.stringify(data.pending))
      setSuccess(data.pending.messId)

      setTimeout(() => {
        window.location.href = '/subscribe'
      }, 1800)
    } catch {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  if (success) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{background:'#f5f5f0'}}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{background:'#E1F5EE', border:'3px solid #9FE1CB', fontSize:40}}>✓</div>
      <h1 className="text-2xl font-semibold mb-2" style={{color:'#0F6E56'}}>Mess registered!</h1>
      <p className="text-sm text-gray-500 mb-1">Your Mess ID</p>
      <div className="text-lg font-mono font-semibold mb-6" style={{color:'#1a1a1a'}}>{success}</div>
      <p className="text-sm text-gray-500">Taking you to your dashboard...</p>
    </div>
  )

  return (
    <div className="min-h-screen px-6 py-10" style={{background:'#f5f5f0'}}>
      <div className="mb-8">
        <a href="/" className="text-sm" style={{color:'#0F6E56'}}>← Back to login</a>
        <h1 className="text-2xl font-medium mt-4">Register your mess</h1>
        <p className="text-sm text-gray-500 mt-1">Set up your MessPass account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { key: 'name', label: 'Mess name', placeholder: 'Sharma Mess' },
          { key: 'ownerName', label: 'Your name', placeholder: 'Ramesh Sharma' },
          { key: 'phone', label: 'Phone number', placeholder: '98765 43210', type: 'tel' },
          { key: 'address', label: 'Address', placeholder: '12 Sudama Nagar, Indore' },
          { key: 'password', label: 'Password (min 6 characters)', placeholder: 'Create a password', type: 'password' },
        ].map(f => (
          <div key={f.key} className="bg-white rounded-2xl p-4">
            <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
            <input
              type={f.type || 'text'}
              placeholder={f.placeholder}
              value={form[f.key]}
              onChange={e => setForm({...form, [f.key]: e.target.value})}
              className="w-full text-base focus:outline-none"
              required
            />
          </div>
        ))}

        <div className="bg-white rounded-2xl p-4">
          <label className="text-xs text-gray-500 mb-2 block">Tagline <span className="text-gray-400">(optional)</span></label>
          <div className="space-y-2">
            {TAGLINES.map(t => (
              <div
                key={t}
                onClick={() => { setForm({...form, tagline: t}); setCustomTagline(false) }}
                className="flex items-center gap-3 p-2 rounded-xl cursor-pointer"
                style={{background: form.tagline === t ? '#E1F5EE' : '#f5f5f0'}}
              >
                <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={{borderColor: form.tagline === t ? '#0F6E56' : '#ccc', background: form.tagline === t ? '#0F6E56' : 'white'}}>
                  {form.tagline === t && <div className="w-1.5 h-1.5 rounded-full bg-white"/>}
                </div>
                <span className="text-sm">{t}</span>
              </div>
            ))}
            <div
              onClick={() => { setCustomTagline(true); setForm({...form, tagline: ''}) }}
              className="flex items-center gap-3 p-2 rounded-xl cursor-pointer"
              style={{background: customTagline ? '#E1F5EE' : '#f5f5f0'}}
            >
              <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{borderColor: customTagline ? '#0F6E56' : '#ccc', background: customTagline ? '#0F6E56' : 'white'}}>
                {customTagline && <div className="w-1.5 h-1.5 rounded-full bg-white"/>}
              </div>
              <span className="text-sm">Write my own</span>
            </div>
            {customTagline && (
              <input
                type="text"
                placeholder="Your tagline..."
                value={form.tagline}
                onChange={e => setForm({...form, tagline: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600 mt-1"
              />
            )}
            <div
              onClick={() => { setCustomTagline(false); setForm({...form, tagline: ''}) }}
              className="flex items-center gap-3 p-2 rounded-xl cursor-pointer"
              style={{background: !form.tagline && !customTagline ? '#E1F5EE' : '#f5f5f0'}}
            >
              <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{borderColor: !form.tagline && !customTagline ? '#0F6E56' : '#ccc', background: !form.tagline && !customTagline ? '#0F6E56' : 'white'}}>
                {!form.tagline && !customTagline && <div className="w-1.5 h-1.5 rounded-full bg-white"/>}
              </div>
              <span className="text-sm">No tagline</span>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl text-white font-medium text-base"
          style={{background: loading ? '#9FE1CB' : '#0F6E56'}}
        >
          {loading ? 'Registering...' : 'Register mess'}
        </button>
      </form>
    </div>
  )
}
