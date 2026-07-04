'use client'
import { useState } from 'react'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    })
    const data = await res.json()
    if (res.ok) {
      sessionStorage.setItem('admin_password', password)
      window.location.href = '/admin/dashboard'
    } else {
      setError(data.error || 'Wrong password')
    }
    setLoading(false)
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',justifyContent:'center',padding:'0 24px',background:'#1a1a1a'}}>
      <div style={{textAlign:'center',marginBottom:32}}>
        <div style={{fontSize:20,fontWeight:600,color:'white'}}>MessPass Admin</div>
        <div style={{fontSize:13,color:'#999',marginTop:4}}>Platform administration</div>
      </div>

      <div style={{background:'#262626',borderRadius:16,padding:24}}>
        <label style={{fontSize:12,color:'#999',display:'block',marginBottom:6}}>Admin password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{width:'100%',border:'1px solid #444',borderRadius:10,padding:'12px 14px',fontSize:15,outline:'none',boxSizing:'border-box',background:'#1a1a1a',color:'white',marginBottom:14}}
        />
        {error && <div style={{color:'#ff6b6b',fontSize:13,marginBottom:14,textAlign:'center'}}>{error}</div>}
        <button onClick={handleLogin} disabled={loading}
          style={{width:'100%',padding:14,borderRadius:10,background:loading?'#444':'#0F6E56',color:'white',fontSize:15,fontWeight:500,border:'none',cursor:'pointer'}}>
          {loading ? 'Checking...' : 'Login'}
        </button>
      </div>
    </div>
  )
}
