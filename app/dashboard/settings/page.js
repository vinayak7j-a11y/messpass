'use client'
import { useEffect, useState } from 'react'

export default function Settings() {
  const [mess, setMess] = useState(null)
  const [form, setForm] = useState({ name:'', ownerName:'', phone:'', address:'', tagline:'' })
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('mess')
    if (!stored) { window.location.href = '/'; return }
    const m = JSON.parse(stored)
    fetchMess(m.messId)
  }, [])

  async function fetchMess(messId) {
    const res = await fetch('/api/mess?messId=' + messId)
    const data = await res.json()
    if (data.mess) {
      setMess(data.mess)
      setForm({
        name: data.mess.name || '',
        ownerName: data.mess.ownerName || '',
        phone: data.mess.phone || '',
        address: data.mess.address || '',
        tagline: data.mess.tagline || ''
      })
    }
  }

  async function handleSave() {
    if (!form.name || !form.ownerName || !form.phone || !form.address) {
      setError('Name, owner name, phone, and address are required'); return
    }
    setSaving(true); setError(''); setSaved(false)

    const payload = { messId: mess.messId, ...form }
    if (newPassword) payload.newPassword = newPassword

    const res = await fetch('/api/mess', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await res.json()

    if (res.ok) {
      setMess(data.mess)
      localStorage.setItem('mess', JSON.stringify({...JSON.parse(localStorage.getItem('mess')), ...data.mess}))
      setSaved(true)
      setNewPassword('')
      setTimeout(() => setSaved(false), 3000)
    } else {
      setError(data.error || 'Failed to save')
    }
    setSaving(false)
  }

  if (!mess) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f5f5f0'}}>
      <div style={{color:'#999'}}>Loading...</div>
    </div>
  )

  const fields = [
    { key:'name', label:'Mess name', placeholder:'Sharma Mess' },
    { key:'ownerName', label:'Owner name', placeholder:'Ramesh Sharma' },
    { key:'phone', label:'Phone number', placeholder:'98765 43210', type:'tel' },
    { key:'address', label:'Address', placeholder:'12 Sudama Nagar, Indore' },
  ]

  return (
    <div style={{minHeight:'100vh',background:'#f5f5f0',paddingBottom:80}}>
      <div style={{background:'white',padding:16,display:'flex',alignItems:'center',gap:12,boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}}>
        <a href="/dashboard" style={{textDecoration:'none',color:'#333',fontSize:20}}>←</a>
        <div style={{fontWeight:500,fontSize:16}}>Mess Settings</div>
      </div>

      <div style={{padding:'20px 16px'}}>

        <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
          <div style={{width:56,height:56,borderRadius:'50%',background:'#0F6E56',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:600,color:'white',flexShrink:0}}>
            {mess.name.charAt(0)}
          </div>
          <div>
            <div style={{fontSize:16,fontWeight:600}}>{mess.name}</div>
            <div style={{fontSize:12,color:'#999'}}>{mess.messId}</div>
          </div>
        </div>

        <div style={{background:'white',borderRadius:16,padding:16,marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:500,marginBottom:12}}>Mess details</div>
          {fields.map(f => (
            <div key={f.key} style={{marginBottom:12}}>
              <label style={{fontSize:12,color:'#999',display:'block',marginBottom:4}}>{f.label}</label>
              <input
                type={f.type || 'text'}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={e => setForm({...form, [f.key]: e.target.value})}
                style={{width:'100%',border:'1px solid #eee',borderRadius:10,padding:'10px 14px',fontSize:15,outline:'none',boxSizing:'border-box'}}
              />
            </div>
          ))}
          <div>
            <label style={{fontSize:12,color:'#999',display:'block',marginBottom:4}}>Tagline (optional)</label>
            <input
              type="text"
              placeholder="e.g. Ghar jaisa khana, roz"
              value={form.tagline}
              onChange={e => setForm({...form, tagline: e.target.value})}
              style={{width:'100%',border:'1px solid #eee',borderRadius:10,padding:'10px 14px',fontSize:15,outline:'none',boxSizing:'border-box'}}
            />
          </div>
        </div>

        <div style={{background:'white',borderRadius:16,padding:16,marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:500,marginBottom:12}}>Change password</div>
          <label style={{fontSize:12,color:'#999',display:'block',marginBottom:4}}>New password (leave blank to keep current)</label>
          <div style={{position:'relative'}}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter new password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              style={{width:'100%',border:'1px solid #eee',borderRadius:10,padding:'10px 40px 10px 14px',fontSize:15,outline:'none',boxSizing:'border-box'}}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#999',fontSize:12,cursor:'pointer'}}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {error && <div style={{color:'#cc0000',fontSize:13,marginBottom:12,textAlign:'center'}}>{error}</div>}
        {saved && <div style={{color:'#0F6E56',fontSize:13,marginBottom:12,textAlign:'center',fontWeight:500}}>Saved successfully</div>}

        <button onClick={handleSave} disabled={saving}
          style={{width:'100%',padding:14,borderRadius:14,background:saving?'#9FE1CB':'#0F6E56',color:'white',fontSize:15,fontWeight:500,border:'none',cursor:'pointer'}}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>

      </div>

      <div style={{position:'fixed',bottom:0,left:0,right:0,background:'white',borderTop:'1px solid #f0f0f0',padding:'12px 24px',display:'flex',justifyContent:'space-around'}}>
        {[
          {label:'Home',icon:'🏠',href:'/dashboard'},
          {label:'Customers',icon:'👥',href:'/dashboard/customers'},
          {label:'Plans',icon:'📋',href:'/dashboard/plans'},
          {label:'QR',icon:'📱',href:'/dashboard/qr'},
        ].map(n => (
          <a key={n.label} href={n.href} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,textDecoration:'none'}}>
            <span style={{fontSize:20}}>{n.icon}</span>
            <span style={{fontSize:11,color:'#999'}}>{n.label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
