'use client'
import { useEffect, useState } from 'react'

export default function Register({ params }) {
  const [messId, setMessId] = useState(null)
  const [mess, setMess] = useState(null)
  const [plans, setPlans] = useState([])
  const [stage, setStage] = useState('loading')
  const [mobile, setMobile] = useState('')
  const [form, setForm] = useState({ name: '', planId: '' })
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [customer, setCustomer] = useState(null)
  const [scanResult, setScanResult] = useState(null)
  const [rememberedMobile, setRememberedMobile] = useState(null)

  useEffect(() => {
    params.then(p => {
      const mid = p.messId
      setMessId(mid)
      fetchMess(mid)
      const saved = localStorage.getItem('mobile_' + mid)
      if (saved) {
        setRememberedMobile(saved)
        setMobile(saved)
        setStage('remembered')
      } else {
        setStage('mobile')
      }
    })
  }, [])

  useEffect(() => {
    if (stage !== 'pending' || !messId || !mobile) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/register?messId=' + messId + '&mobile=' + mobile)
        const data = await res.json()
        if (data.customer?.status === 'active') {
          setCustomer(data.customer)
          localStorage.setItem('mobile_' + messId, mobile)
          setStage('approved')
          clearInterval(interval)
        } else if (data.customer?.status === 'rejected') {
          setCustomer(data.customer)
          setStage('rejected')
          clearInterval(interval)
        }
      } catch(e) {}
    }, 3000)
    return () => clearInterval(interval)
  }, [stage, messId, mobile])

  async function fetchMess(id) {
    const res = await fetch('/api/register?messId=' + id)
    const data = await res.json()
    if (data.mess) { setMess(data.mess); setPlans(data.plans) }
  }

  function reset() {
    setStage('mobile'); setMobile(''); setForm({name:'',planId:''})
    setCustomer(null); setScanResult(null); setError('')
  }

  function forgetDevice() {
    localStorage.removeItem('mobile_' + messId)
    setRememberedMobile(null)
    setStage('mobile')
    setMobile('')
    setForm({name:'',planId:''})
    setCustomer(null)
    setScanResult(null)
    setError('')
  }

  async function doScan(mobileNumber) {
    setLoading(true)
    try {
      const scanRes = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messId, mobile: mobileNumber })
      })
      const scanData = await scanRes.json()
      setCustomer(scanData.customer || null)
      setScanResult(scanData)
      setStage('scan_result')
    } catch (e) {
      setScanResult({ error: 'not_found' })
      setStage('scan_result')
    }
    setLoading(false)
  }

  async function handleMobileSubmit() {
    if (mobile.replace(/\s/g,'').length < 10) { setError('Enter valid mobile number'); return }
    setLoading(true); setError('')

    const check = await fetch('/api/register?messId=' + messId + '&mobile=' + mobile)
    const checkData = await check.json()

    if (!checkData.customer) { setStage('register'); setLoading(false); return }

    const c = checkData.customer
    if (c.status === 'pending') { setCustomer(c); setStage('pending'); setLoading(false); return }
    if (c.status === 'rejected') { setCustomer(c); setStage('rejected'); setLoading(false); return }
    if (c.status === 'active') {
      localStorage.setItem('mobile_' + messId, mobile)
      await doScan(mobile)
      return
    }
    setLoading(false)
  }

  async function handleRegisterSubmit() {
    if (!form.name || !form.planId) { setError('All fields required'); return }
    if (!consent) { setError('Please agree to the data usage terms to continue'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messId, mobile, name: form.name, planId: form.planId })
    })
    const data = await res.json()
    if (res.ok) { setCustomer({...data.customer, name: form.name, mobile}); setStage('pending') }
    else { setError(data.error || 'Something went wrong') }
    setLoading(false)
  }

  if (stage === 'loading' || !mess) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f5f5f0'}}>
      <div style={{color:'#999'}}>Loading...</div>
    </div>
  )

  // STAGE: remembered device — one tap
  if (stage === 'remembered') return (
    <div style={{minHeight:'100vh',background:'#f5f5f0',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center'}}>
      <div style={{width:64,height:64,borderRadius:'50%',background:'white',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontSize:24,fontWeight:600,color:'#0F6E56',boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}}>
        {mess.name.charAt(0)}
      </div>
      <div style={{fontSize:18,fontWeight:600,marginBottom:4}}>{mess.name}</div>
      <div style={{fontSize:13,color:'#999',marginBottom:32}}>{rememberedMobile}</div>

      <button type="button" disabled={loading} onClick={() => doScan(rememberedMobile)}
        style={{width:160,height:160,borderRadius:'50%',background:loading?'#9FE1CB':'#0F6E56',color:'white',fontSize:18,fontWeight:600,border:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6,boxShadow:'0 4px 16px rgba(15,110,86,0.3)'}}>
        <span style={{fontSize:36}}>{loading ? '...' : '🍽️'}</span>
        {loading ? 'Marking...' : 'Tap to mark meal'}
      </button>

      <button type="button" onClick={forgetDevice}
        style={{marginTop:40,padding:'8px 16px',borderRadius:10,background:'transparent',color:'#999',fontSize:12,border:'none',cursor:'pointer',textDecoration:'underline'}}>
        Not you? Use a different number
      </button>
    </div>
  )

  // STAGE: mobile entry
  if (stage === 'mobile') return (
    <div style={{minHeight:'100vh',background:'#f5f5f0'}}>
      <div style={{background:'#0F6E56',padding:'24px 16px',textAlign:'center'}}>
        <div style={{width:56,height:56,borderRadius:'50%',background:'white',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',fontSize:22,fontWeight:600,color:'#0F6E56'}}>
          {mess.name.charAt(0)}
        </div>
        <div style={{fontSize:20,fontWeight:600,color:'white'}}>{mess.name}</div>
        {mess.tagline && <div style={{fontSize:13,color:'#9FE1CB',marginTop:4,fontStyle:'italic'}}>{mess.tagline}</div>}
      </div>
      <div style={{padding:'40px 24px',textAlign:'center'}}>
        <div style={{fontSize:18,fontWeight:500,marginBottom:6}}>Enter your mobile number</div>
        <div style={{fontSize:13,color:'#999',marginBottom:24}}>New here? We'll get you registered.<br/>Already a member? We'll mark your meal.<br/>This device will remember you next time.</div>
        <input type="tel" placeholder="10-digit mobile number" value={mobile}
          onChange={e => setMobile(e.target.value)}
          style={{width:'100%',maxWidth:320,border:'1px solid #eee',borderRadius:12,padding:'16px',fontSize:18,textAlign:'center',outline:'none',boxSizing:'border-box',marginBottom:16}} />
        {error && <div style={{color:'#cc0000',fontSize:13,marginBottom:12}}>{error}</div>}
        <button type="button" onClick={handleMobileSubmit} disabled={loading}
          style={{width:'100%',maxWidth:320,padding:'16px',borderRadius:14,background:loading?'#9FE1CB':'#0F6E56',color:'white',fontSize:16,fontWeight:500,border:'none',cursor:'pointer'}}>
          {loading ? 'Checking...' : 'Continue'}
        </button>
      </div>
    </div>
  )

  // STAGE: scan result
  if (stage === 'scan_result') {
    const err = scanResult?.error
    if (err === 'pending') return (
      <div style={{minHeight:'100vh',background:'#f5f5f0',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center'}}>
        <div style={{width:100,height:100,borderRadius:'50%',background:'#FAEEDA',border:'3px solid #FAC775',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px',fontSize:48}}>⏳</div>
        <div style={{fontSize:22,fontWeight:600,color:'#854F0B',marginBottom:8}}>Still pending approval</div>
        <div style={{fontSize:14,color:'#999',marginBottom:24}}>The mess owner hasn't approved your registration yet.</div>
        <button type="button" onClick={() => setStage('closed')} style={{padding:'12px 32px',borderRadius:12,background:'#0F6E56',color:'white',fontSize:15,fontWeight:500,border:'none',cursor:'pointer'}}>Done</button>
      </div>
    )
    if (err === 'rejected') return (
      <div style={{minHeight:'100vh',background:'#f5f5f0',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center'}}>
        <div style={{width:100,height:100,borderRadius:'50%',background:'#FCEBEB',border:'3px solid #F09595',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px',fontSize:48}}>✗</div>
        <div style={{fontSize:22,fontWeight:600,color:'#cc0000',marginBottom:8}}>Registration was rejected</div>
        <div style={{fontSize:14,color:'#999',marginBottom:24}}>Please contact the mess owner for more information.</div>
        <button type="button" onClick={() => setStage('closed')} style={{padding:'12px 32px',borderRadius:12,background:'#0F6E56',color:'white',fontSize:15,fontWeight:500,border:'none',cursor:'pointer'}}>Done</button>
      </div>
    )
    if (err === 'not_found') return (
      <div style={{minHeight:'100vh',background:'#f5f5f0',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center'}}>
        <div style={{width:100,height:100,borderRadius:'50%',background:'#FCEBEB',border:'3px solid #F09595',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px',fontSize:48}}>⚠️</div>
        <div style={{fontSize:22,fontWeight:600,color:'#cc0000',marginBottom:8}}>Something went wrong</div>
        <div style={{fontSize:14,color:'#999',marginBottom:24}}>We couldn't find your registration. Please try again.</div>
        <button type="button" onClick={forgetDevice} style={{padding:'12px 32px',borderRadius:12,background:'#0F6E56',color:'white',fontSize:15,fontWeight:500,border:'none',cursor:'pointer'}}>Start over</button>
      </div>
    )
    if (err === 'duplicate') return (
      <div style={{minHeight:'100vh',background:'#f5f5f0',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center'}}>
        <div style={{width:100,height:100,borderRadius:'50%',background:'#FCEBEB',border:'3px solid #F09595',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px',fontSize:48}}>🚫</div>
        <div style={{fontSize:22,fontWeight:600,color:'#A32D2D',marginBottom:8}}>Already scanned</div>
        <div style={{fontSize:14,color:'#999',marginBottom:24}}>You already recorded this meal today.</div>
        <button type="button" onClick={() => setStage('closed')} style={{padding:'12px 32px',borderRadius:12,background:'#0F6E56',color:'white',fontSize:15,fontWeight:500,border:'none',cursor:'pointer'}}>Done</button>
      </div>
    )
    if (err === 'expired') return (
      <div style={{minHeight:'100vh',background:'#f5f5f0',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center'}}>
        <div style={{width:100,height:100,borderRadius:'50%',background:'#FAEEDA',border:'3px solid #FAC775',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px',fontSize:48}}>⚠️</div>
        <div style={{fontSize:22,fontWeight:600,color:'#854F0B',marginBottom:8}}>No meals remaining</div>
        <div style={{fontSize:14,color:'#999',marginBottom:24}}>Please contact the mess owner to renew your plan.</div>
        <button type="button" onClick={() => setStage('closed')} style={{padding:'12px 32px',borderRadius:12,background:'#0F6E56',color:'white',fontSize:15,fontWeight:500,border:'none',cursor:'pointer'}}>Done</button>
      </div>
    )
    return (
      <div style={{minHeight:'100vh',background:'#f5f5f0',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center'}}>
        <div style={{width:120,height:120,borderRadius:'50%',background:'#E1F5EE',border:'4px solid #0F6E56',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px',fontSize:60,color:'#0F6E56'}}>✓</div>
        <div style={{fontSize:40,fontWeight:700,color:'#1a1a1a'}}>Meal {scanResult?.mealNumber}</div>
        <div style={{fontSize:16,color:'#999',marginTop:6,marginBottom:24,textTransform:'capitalize'}}>recorded · {scanResult?.mealType}</div>
        <a href={'/my-meals/' + messId} style={{background:'white',borderRadius:999,padding:'10px 24px',fontSize:14,color:'#999',textDecoration:'none',display:'inline-block'}}>
          <span style={{color:'#0F6E56',fontWeight:600}}>{scanResult?.remainingMeals}</span> meals remaining <span style={{color:'#ccc'}}>→</span>
        </a>
        <button type="button" onClick={() => setStage('closed')} style={{marginTop:32,padding:'12px 32px',borderRadius:12,background:'white',color:'#0F6E56',fontSize:14,fontWeight:500,border:'1px solid #0F6E56',cursor:'pointer'}}>Done</button>
      </div>
    )
  }

  // STAGE: register
  if (stage === 'register') return (
    <div style={{minHeight:'100vh',background:'#f5f5f0'}}>
      <div style={{background:'#0F6E56',padding:'24px 16px',textAlign:'center'}}>
        <div style={{width:56,height:56,borderRadius:'50%',background:'white',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px',fontSize:22,fontWeight:600,color:'#0F6E56'}}>
          {mess.name.charAt(0)}
        </div>
        <div style={{fontSize:20,fontWeight:600,color:'white'}}>{mess.name}</div>
      </div>
      <div style={{padding:'20px 16px'}}>
        <div style={{fontSize:18,fontWeight:500,marginBottom:4}}>New here — let's get you set up</div>
        <div style={{fontSize:13,color:'#999',marginBottom:20}}>Mobile: {mobile}</div>

        <div style={{background:'white',borderRadius:16,padding:16,marginBottom:12}}>
          <label style={{fontSize:12,color:'#999',display:'block',marginBottom:6}}>Your name</label>
          <input type="text" placeholder="Enter your full name" value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            style={{width:'100%',border:'1px solid #eee',borderRadius:10,padding:'12px 14px',fontSize:15,outline:'none',boxSizing:'border-box'}} />
        </div>

        <div style={{background:'white',borderRadius:16,padding:16,marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:500,marginBottom:12}}>Select a plan</div>
          {plans.map(p => (
            <div key={p._id} onClick={() => setForm({...form, planId: p._id})}
              style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:14,borderRadius:12,marginBottom:8,cursor:'pointer',
                border: form.planId === p._id ? '2px solid #0F6E56' : '1px solid #eee',
                background: form.planId === p._id ? '#E1F5EE' : 'white'}}>
              <div>
                <div style={{fontWeight:500,fontSize:15}}>{p.name}</div>
                <div style={{fontSize:13,color:'#999'}}>{p.totalMeals} meals</div>
              </div>
              <div style={{fontWeight:600,fontSize:16,color:'#0F6E56'}}>&#8377;{p.price}</div>
            </div>
          ))}
        </div>

        <div onClick={() => setConsent(!consent)}
          style={{display:'flex',alignItems:'flex-start',gap:10,padding:14,background:'white',borderRadius:14,marginBottom:14,cursor:'pointer'}}>
          <div style={{width:18,height:18,borderRadius:5,border:'2px solid',borderColor: consent ? '#0F6E56' : '#ccc',background: consent ? '#0F6E56' : 'white',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
            {consent && <span style={{color:'white',fontSize:12,fontWeight:700}}>✓</span>}
          </div>
          <div style={{fontSize:12,color:'#666',lineHeight:1.5}}>
            I agree that my name and mobile number will be used by {mess.name} to manage my meal subscription.{' '}
            <a href="/privacy" target="_blank" onClick={e => e.stopPropagation()} style={{color:'#0F6E56',textDecoration:'underline'}}>Read privacy policy</a>
          </div>
        </div>

        {error && <div style={{color:'#cc0000',fontSize:13,marginBottom:12,textAlign:'center'}}>{error}</div>}

        <button type="button" onClick={handleRegisterSubmit} disabled={loading}
          style={{width:'100%',padding:'16px',borderRadius:14,background:loading?'#9FE1CB':'#0F6E56',color:'white',fontSize:16,fontWeight:500,border:'none',cursor:'pointer'}}>
          {loading ? 'Submitting...' : 'Register'}
        </button>
      </div>
    </div>
  )

  // STAGE: pending
  if (stage === 'pending') return (
    <div style={{minHeight:'100vh',background:'#f5f5f0',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center'}}>
      <div style={{width:80,height:80,borderRadius:'50%',background:'#FAEEDA',border:'3px solid #FAC775',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px',fontSize:40}}>⏳</div>
      <div style={{fontSize:22,fontWeight:600,color:'#1a1a1a',marginBottom:8}}>Waiting for approval</div>
      <div style={{fontSize:14,color:'#999',lineHeight:1.6,marginBottom:24}}>Complete your payment and show it to the mess owner.<br/>This page will update automatically once approved.</div>
      <div style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:'#bbb',marginBottom:20}}>
        <div style={{width:8,height:8,borderRadius:'50%',background:'#0F6E56',animation:'pulse 1.5s infinite'}}></div>
        Checking for approval...
      </div>
      <button type="button" onClick={reset} style={{padding:'10px 24px',borderRadius:12,background:'white',color:'#999',fontSize:13,border:'1px solid #eee',cursor:'pointer'}}>Not me — go back</button>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.2}}`}</style>
    </div>
  )

  // STAGE: approved
  if (stage === 'approved') return (
    <div style={{minHeight:'100vh',background:'#f5f5f0',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center'}}>
      <div style={{width:100,height:100,borderRadius:'50%',background:'#E1F5EE',border:'4px solid #0F6E56',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px',fontSize:52,color:'#0F6E56',fontWeight:'bold'}}>✓</div>
      <div style={{fontSize:26,fontWeight:700,color:'#0F6E56',marginBottom:8}}>Registered successfully!</div>
      <div style={{fontSize:15,color:'#999',lineHeight:1.6,marginBottom:28}}>You are now an active member of {mess.name}.</div>
      <button type="button" onClick={() => setStage('closed')} style={{padding:'12px 32px',borderRadius:12,background:'#0F6E56',color:'white',fontSize:15,fontWeight:500,border:'none',cursor:'pointer'}}>Done</button>
    </div>
  )

  // STAGE: rejected
  if (stage === 'rejected') return (
    <div style={{minHeight:'100vh',background:'#f5f5f0',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center'}}>
      <div style={{width:80,height:80,borderRadius:'50%',background:'#FCEBEB',border:'3px solid #F09595',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px',fontSize:40}}>✗</div>
      <div style={{fontSize:22,fontWeight:600,color:'#cc0000',marginBottom:8}}>Registration rejected</div>
      <div style={{fontSize:14,color:'#999',marginBottom:24}}>Please contact the mess owner for more information.</div>
      <button type="button" onClick={reset} style={{padding:'12px 24px',borderRadius:12,background:'#0F6E56',color:'white',fontSize:14,fontWeight:500,border:'none',cursor:'pointer'}}>Go back</button>
    </div>
  )

  // STAGE: closed — meal done, nothing more to do today
  if (stage === 'closed') return (
    <div style={{minHeight:'100vh',background:'#f5f5f0',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center'}}>
      <div style={{fontSize:40,marginBottom:16}}>👋</div>
      <div style={{fontSize:18,fontWeight:500,color:'#1a1a1a',marginBottom:8}}>All set for now</div>
      <div style={{fontSize:14,color:'#999'}}>See you at your next meal.</div>
    </div>
  )

  return null
}
