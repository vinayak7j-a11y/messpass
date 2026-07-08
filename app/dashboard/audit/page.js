'use client'
import { useEffect, useState } from 'react'

export default function Audit() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('mess')
    if (!stored) { window.location.href = '/'; return }
    const m = JSON.parse(stored)
    fetchLogs(m.messId)
  }, [])

  async function fetchLogs(messId) {
    const res = await fetch('/api/adjust?messId=' + messId)
    const data = await res.json()
    if (data.logs) setLogs(data.logs)
    setLoading(false)
  }

  return (
    <div style={{minHeight:'100vh',background:'#f5f5f0',paddingBottom:80}}>
      <div style={{background:'white',padding:16,display:'flex',alignItems:'center',gap:12,boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}}>
        <a href="/dashboard" style={{textDecoration:'none',color:'#333',fontSize:20}}>←</a>
        <div style={{fontWeight:500,fontSize:16}}>Audit Log</div>
      </div>

      <div style={{padding:'16px'}}>
        {loading && <div style={{textAlign:'center',color:'#999',padding:40}}>Loading...</div>}

        {!loading && logs.length === 0 && (
          <div style={{background:'white',borderRadius:16,padding:32,textAlign:'center'}}>
            <div style={{fontSize:32,marginBottom:8}}>📋</div>
            <div style={{fontWeight:500,marginBottom:4}}>No adjustments yet</div>
            <div style={{fontSize:13,color:'#999'}}>Manual meal adjustments will appear here</div>
          </div>
        )}

        {logs.map(log => {
          const date = new Date(log.timestamp)
          return (
            <div key={log._id} style={{background:'white',borderRadius:14,padding:14,marginBottom:10,boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <div style={{fontWeight:500,fontSize:14}}>{log.customerName}</div>
                <span style={{fontSize:12,fontWeight:600,padding:'2px 10px',borderRadius:999,
                  background: log.action==='+1' ? '#E1F5EE' : '#FCEBEB',
                  color: log.action==='+1' ? '#0F6E56' : '#A32D2D'}}>
                  {log.action} meal
                </span>
              </div>
              <div style={{fontSize:13,color:'#666',marginBottom:4}}>{log.reason}</div>
              <div style={{fontSize:11,color:'#bbb'}}>{date.toLocaleDateString()} · {date.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
            </div>
          )
        })}
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