'use client'
import { useEffect, useState } from 'react'

export default function Support() {
  const [mess, setMess] = useState(null)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('mess')
    if (!stored) { window.location.href = '/'; return }
    setMess(JSON.parse(stored))
  }, [])

  async function handleSubmit() {
    if (!subject.trim() || !message.trim()) {
      setError('Please fill in both fields'); return
    }
    setSending(true)
    setError('')

    const res = await fetch('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messId: mess.messId,
        messName: mess.name,
        phone: mess.phone,
        subject: subject.trim(),
        message: message.trim()
      })
    })

    if (res.ok) {
      setSent(true)
      setSubject('')
      setMessage('')
      setTimeout(() => setSent(false), 4000)
    } else {
      setError('Failed to send. Please try WhatsApp instead.')
    }
    setSending(false)
  }

  if (!mess) return null

  const whatsappMsg = encodeURIComponent(
    'Hi, I need help with MessPass.\nMess: ' + mess.name + ' (' + mess.messId + ')\nPhone: ' + mess.phone
  )

  return (
    <div style={{minHeight:'100vh',background:'#f5f5f0',paddingBottom:80}}>
      <div style={{background:'white',padding:16,display:'flex',alignItems:'center',gap:12,boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}}>
        <a href="/dashboard" style={{textDecoration:'none',color:'#333',fontSize:20}}>←</a>
        <div style={{fontWeight:500,fontSize:16}}>Help &amp; Support</div>
      </div>

      <div style={{padding:'20px 16px'}}>

        <a href={'https://wa.me/919285273124?text=' + whatsappMsg} target="_blank" rel="noopener noreferrer"
          style={{display:'flex',alignItems:'center',gap:14,background:'#25D366',borderRadius:16,padding:16,textDecoration:'none',marginBottom:16}}>
          <div style={{width:44,height:44,borderRadius:'50%',background:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>💬</div>
          <div>
            <div style={{color:'white',fontWeight:600,fontSize:15}}>Chat on WhatsApp</div>
            <div style={{color:'#E7FFF0',fontSize:12}}>Fastest way to get help</div>
          </div>
        </a>

        <div style={{background:'white',borderRadius:16,padding:16}}>
          <div style={{fontWeight:500,fontSize:14,marginBottom:4}}>Or send a support ticket</div>
          <div style={{fontSize:12,color:'#999',marginBottom:14}}>We'll get back to you as soon as possible</div>

          <div style={{marginBottom:12}}>
            <label style={{fontSize:12,color:'#999',display:'block',marginBottom:4}}>Subject</label>
            <input
              type="text"
              placeholder="e.g. Can't approve a customer"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              style={{width:'100%',border:'1px solid #eee',borderRadius:10,padding:'10px 14px',fontSize:15,outline:'none',boxSizing:'border-box'}}
            />
          </div>

          <div style={{marginBottom:14}}>
            <label style={{fontSize:12,color:'#999',display:'block',marginBottom:4}}>Message</label>
            <textarea
              placeholder="Describe your issue..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              style={{width:'100%',border:'1px solid #eee',borderRadius:10,padding:'10px 14px',fontSize:15,outline:'none',boxSizing:'border-box',fontFamily:'inherit',resize:'vertical'}}
            />
          </div>

          {error && <div style={{color:'#cc0000',fontSize:13,marginBottom:12,textAlign:'center'}}>{error}</div>}
          {sent && <div style={{color:'#0F6E56',fontSize:13,marginBottom:12,textAlign:'center',fontWeight:500}}>Ticket sent! We'll be in touch.</div>}

          <button onClick={handleSubmit} disabled={sending}
            style={{width:'100%',padding:14,borderRadius:12,background:sending?'#9FE1CB':'#0F6E56',color:'white',fontSize:14,fontWeight:500,border:'none',cursor:'pointer'}}>
            {sending ? 'Sending...' : 'Send ticket'}
          </button>
        </div>

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
