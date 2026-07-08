'use client'
import { useEffect, useRef, useState } from 'react'

export default function Approvals() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [flash, setFlash] = useState(false)

  const messIdRef = useRef(null)
  const prevCountRef = useRef(0)
  const audioCtxRef = useRef(null)

  useEffect(() => {
    const stored = localStorage.getItem('mess')

    if (!stored) {
      window.location.href = '/'
      return
    }

    const m = JSON.parse(stored)
    messIdRef.current = m.messId

    fetchPending(m.messId, true)

    const interval = setInterval(() => {
      fetchPending(m.messId, false)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  function playPing() {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.start()
      osc.stop(ctx.currentTime + 0.4)
    } catch {}
    if (navigator.vibrate) navigator.vibrate([100, 50, 100])
  }

  async function fetchPending(messId, isInitial) {
    const res = await fetch('/api/customers?messId=' + messId + '&status=pending')
    const data = await res.json()
    if (data.customers) {
      if (!isInitial && data.customers.length > prevCountRef.current) {
        playPing()
        setFlash(true)
        setTimeout(() => setFlash(false), 1500)
      }
      prevCountRef.current = data.customers.length
      setCustomers(data.customers)
    }
    setLoading(false)
  }

  async function handleApprove(customerId) {
    await fetch('/api/customers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, status: 'active' })
    })
    setCustomers(prev => {
      const next = prev.filter(c => c._id !== customerId)
      prevCountRef.current = next.length
      return next
    })
  }

  async function handleReject(customerId, name) {
    if (!confirm('Reject ' + name + '? This can be undone later from Rejected customers.')) return
    await fetch('/api/customers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, status: 'rejected' })
    })
    setCustomers(prev => {
      const next = prev.filter(c => c._id !== customerId)
      prevCountRef.current = next.length
      return next
    })
  }

  return (
    <div style={{minHeight:'100vh',background: flash ? '#FAEEDA' : '#f5f5f0',paddingBottom:80,transition:'background 0.3s ease'}}>
      <div style={{background:'white',padding:16,display:'flex',alignItems:'center',gap:12,boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}}>
        <a href="/dashboard" style={{textDecoration:'none',color:'#333',fontSize:20}}>←</a>
        <div style={{fontWeight:500,fontSize:16}}>Pending Approvals</div>
        {customers.length > 0 && (
          <div style={{marginLeft:'auto',background:'#FAEEDA',color:'#854F0B',fontSize:12,fontWeight:500,padding:'3px 10px',borderRadius:999}}>
            {customers.length} pending
          </div>
        )}
      </div>

      <div style={{padding:'20px 16px'}}>
        {loading && <div style={{textAlign:'center',color:'#999',padding:40}}>Loading...</div>}

        {!loading && customers.length === 0 && (
          <div style={{background:'white',borderRadius:16,padding:32,textAlign:'center'}}>
            <div style={{fontSize:32,marginBottom:8}}>✅</div>
            <div style={{fontWeight:500,marginBottom:4}}>All caught up</div>
            <div style={{fontSize:13,color:'#999'}}>New registrations will alert you here</div>
          </div>
        )}

        {customers.map(c => (
          <div key={c._id} style={{background:'white',borderRadius:16,padding:16,marginBottom:12,boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
              <div style={{width:40,height:40,borderRadius:'50%',background:'#E1F5EE',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:500,color:'#0F6E56',fontSize:16,flexShrink:0}}>
                {c.name.charAt(0)}
              </div>
              <div>
                <div style={{fontWeight:500,fontSize:15}}>{c.name}</div>
                <div style={{fontSize:13,color:'#999'}}>{c.mobile}</div>
              </div>
              <div style={{marginLeft:'auto',textAlign:'right'}}>
                <div style={{fontSize:12,color:'#999'}}>{c.planId?.name || 'Plan'}</div>
                <div style={{fontSize:13,fontWeight:500}}>{c.totalMeals} meals</div>
              </div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button type="button" onClick={() => handleApprove(c._id)}
                style={{flex:1,padding:'10px',borderRadius:10,background:'#0F6E56',color:'white',fontSize:14,fontWeight:500,border:'none',cursor:'pointer'}}>
                Approve
              </button>
              <button type="button" onClick={() => handleReject(c._id, c.name)}
                style={{flex:1,padding:'10px',borderRadius:10,background:'white',color:'#cc0000',fontSize:14,fontWeight:500,border:'1px solid #fcc',cursor:'pointer'}}>
                Reject
              </button>
            </div>
          </div>
        ))}
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
