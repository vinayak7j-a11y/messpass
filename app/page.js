'use client'
import { useRef } from 'react'

export default function LoginPage() {
  const phoneRef = useRef(null)
  const passwordRef = useRef(null)
  const errorRef = useRef(null)
  const btnRef = useRef(null)

  async function handleLogin() {
    const phone = phoneRef.current.value.trim().replace(/\s/g, '')
    const password = passwordRef.current.value
    btnRef.current.textContent = 'Logging in...'
    btnRef.current.disabled = true
    errorRef.current.textContent = ''

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    })

    const data = await res.json()

    if (!res.ok) {
      errorRef.current.textContent = data.error || 'Login failed'
      btnRef.current.textContent = 'Login'
      btnRef.current.disabled = false
      return
    }

    localStorage.setItem('mess', JSON.stringify(data.mess))
    window.location.href = '/dashboard'
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',justifyContent:'center',padding:'0 24px',background:'#f5f5f0'}}>
      <div style={{textAlign:'center',marginBottom:40}}>
        <div style={{width:64,height:64,borderRadius:16,background:'#0F6E56',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
          <span style={{color:'white',fontSize:24,fontWeight:'bold'}}>M</span>
        </div>
        <h1 style={{fontSize:24,fontWeight:600,color:'#1a1a1a',margin:0}}>MessPass</h1>
        <p style={{fontSize:14,color:'#999',marginTop:4}}>Owner login</p>
      </div>

      <div style={{background:'white',borderRadius:20,padding:24,boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}}>
        <div style={{marginBottom:16}}>
          <label style={{fontSize:12,color:'#999',display:'block',marginBottom:6}}>Phone number</label>
          <input ref={phoneRef} type="tel" placeholder="9876543210" autoComplete="off"
            style={{width:'100%',border:'1px solid #eee',borderRadius:12,padding:'12px 16px',fontSize:16,outline:'none',boxSizing:'border-box'}} />
        </div>
        <div style={{marginBottom:16}}>
          <label style={{fontSize:12,color:'#999',display:'block',marginBottom:6}}>Password</label>
          <input ref={passwordRef} type="password" placeholder="Enter password" autoComplete="new-password"
            style={{width:'100%',border:'1px solid #eee',borderRadius:12,padding:'12px 16px',fontSize:16,outline:'none',boxSizing:'border-box'}} />
        </div>
        <div ref={errorRef} style={{color:'#cc0000',fontSize:14,textAlign:'center',marginBottom:12,minHeight:20}}></div>
        <button ref={btnRef} type="button" onClick={handleLogin}
          style={{width:'100%',padding:'14px',borderRadius:12,background:'#0F6E56',color:'white',fontSize:16,fontWeight:500,border:'none',cursor:'pointer'}}>
          Login
        </button>
      </div>

      <p style={{textAlign:'center',fontSize:14,color:'#999',marginTop:24}}>
        New mess? <a href="/register-mess" style={{color:'#0F6E56',fontWeight:500}}>Register here</a>
      </p>
      <p style={{textAlign:'center',fontSize:13,color:'#999',marginTop:10}}>
        <a href="/forgot-password" style={{color:'#999'}}>Forgot password?</a>
      </p>
    </div>
  )
}
