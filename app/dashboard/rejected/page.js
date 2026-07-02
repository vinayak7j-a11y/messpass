'use client'
import { useEffect, useState } from 'react'

export default function Rejected() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('mess')
    if (!stored) { window.location.href = '/'; return }
    const m = JSON.parse(stored)
    fetchRejected(m.messId)
  }, [])

  async function fetchRejected(messId) {
    const res = await fetch('/api/customers?messId=' + messId + '&status=rejected')
    const data = await res.json()
    if (data.customers) setCustomers(data.customers)
    setLoading(false)
  }

  async function handleRestore(customerId) {
    await fetch('/api/customers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, status: 'pending' })
    })
    setCustomers(prev => prev.filter(c => c._id !== customerId))
  }

  return (
    <div style={{minHeight:'100vh',background:'#f5f5f0',paddingBottom:80}}>
      <div style={{background:'white',padding:16,display:'flex',alignItems:'center',gap:12,boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}}>
        <a href="/dashboard" style={{textDecoration:'none',color:'#333',fontSize:20}}>←</a>
        <div style={{fontWeight:500,fontSize:16}}>Rejected Customers</div>
      </div>

      <div style={{padding:'20px 16px'}}>
        {loading && <div style={{textAlign:'center',color:'#999',padding:40}}>Loading...</div>}

        {!loading && customers.length === 0 && (
          <div style={{background:'white',borderRadius:16,padding:32,textAlign:'center'}}>
            <div style={{fontSize:32,marginBottom:8}}>🗑️</div>
            <div style={{fontWeight:500,marginBottom:4}}>No rejected customers</div>
            <div style={{fontSize:13,color:'#999'}}>Rejected registrations will appear here</div>
          </div>
        )}

        {customers.map(c => (
          <div key={c._id} style={{background:'white',borderRadius:16,padding:16,marginBottom:12,boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
              <div style={{width:40,height:40,borderRadius:'50%',background:'#FCEBEB',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:500,color:'#A32D2D',fontSize:16,flexShrink:0}}>
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
            <button type="button" onClick={() => handleRestore(c._id)}
              style={{width:'100%',padding:'10px',borderRadius:10,background:'white',color:'#0F6E56',fontSize:14,fontWeight:500,border:'1px solid #0F6E56',cursor:'pointer'}}>
              Restore to pending
            </button>
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
