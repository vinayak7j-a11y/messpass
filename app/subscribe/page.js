'use client'
import { useEffect, useState } from 'react'

const UPI_ID = '9407163090@ibl'
const UPI_NAME = 'MessPass'

const PLANS = [
  { key: 'monthly', label: 'Monthly', price: 149, sub: 'Billed every 30 days' },
  { key: 'quarterly', label: '3 Months', price: 349, sub: 'Billed every 90 days · Save ₹98' },
]

export default function Subscribe() {
  const [messId, setMessId] = useState(null)
  const [messName, setMessName] = useState('')
  const [activationToken, setActivationToken] = useState(null)
  const [isNewRegistration, setIsNewRegistration] = useState(false)
  const [selected, setSelected] = useState('monthly')
  const [stage, setStage] = useState('checking')
  const [loading, setLoading] = useState(false)
  const [isRenewal, setIsRenewal] = useState(false)
  useEffect(() => { 
    const pendingStored = localStorage.getItem('pending_mess')
    const messStored = localStorage.getItem('mess') 
    const params = new URLSearchParams(window.location.search)
    const renewal = params.get('renew') === '1'
    setIsRenewal(renewal)

    if (pendingStored) {
      const p = JSON.parse(pendingStored)
      setMessId(p.messId)
      setMessName(p.name)
      setActivationToken(p.token || null)
      setIsNewRegistration(true)
      checkExistingStatus(p.messId, true)
    } else if (messStored) {
      const m = JSON.parse(messStored)
      setMessId(m.messId)
      setMessName(m.name)
      setIsNewRegistration(false)
      checkExistingStatus(m.messId, false, renewal)
    } else {
      window.location.href = '/'
    }
  }, [])

  async function checkExistingStatus(mid, isNew, renewal = false) {
  if (!isNew) {
    const res = await fetch('/api/subscription/status?messId=' + mid)
    const data = await res.json()

    if (data.subscriptionStatus === 'active' && !renewal) {
      window.location.href = '/dashboard'
      return
    }
  }

  const payRes = await fetch('/api/subscription?messId=' + mid)
  const payData = await payRes.json()

  if (payData.payment) {
    setSelected(payData.payment.plan)
    setStage('pay')
  } else {
    setStage('select')
  }
}

  async function handleProceed() {
    setLoading(true)
    const res = await fetch('/api/subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messId, plan: selected })
    })
    if (res.ok) {
      setStage('pay')
    }
    setLoading(false)
  }

  async function checkStatusNow() {
    setLoading(true)

    if (isNewRegistration) {
      const res = await fetch('/api/subscription/status?messId=' + messId)
      const data = await res.json()
      if (data.subscriptionStatus === 'active') {
        // Payment was approved — a real Mess account now exists. Log them in properly.
        const loginRes = await fetch('/api/subscription/activated?messId=' + messId + '&token=' + encodeURIComponent(activationToken || ''))
        const loginData = await loginRes.json()
        if (loginData.mess) {
          localStorage.removeItem('pending_mess')
          localStorage.setItem('mess', JSON.stringify(loginData.mess))
          window.location.href = '/dashboard'
          return
        }
      }
    }
if (isRenewal) {
  const res = await fetch('/api/subscription/status?messId=' + messId)
  const data = await res.json()

  if (data.subscriptionStatus === 'active') {
    window.location.href = '/dashboard'
    return
  }
}
    await checkExistingStatus(messId, isNewRegistration, isRenewal)
    setLoading(false)
  }

  if (!messId || stage === 'checking') return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f5f5f0'}}>
      <div style={{color:'#999'}}>Loading...</div>
    </div>
  )

  const plan = PLANS.find(p => p.key === selected)
  const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${plan.price}&cu=INR&tn=${encodeURIComponent('MessPass ' + plan.label + ' - ' + messId)}`

  if (stage === 'pay') return (
    <div style={{minHeight:'100vh',background:'#f5f5f0',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center'}}>
      <div style={{width:80,height:80,borderRadius:'50%',background:'#FAEEDA',border:'3px solid #FAC775',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px',fontSize:40}}>⏳</div>
      <div style={{fontSize:22,fontWeight:600,color:'#1a1a1a',marginBottom:8}}>{isRenewal ? 'Complete your renewal payment' : 'Complete your payment'}</div>
      <div style={{fontSize:14,color:'#999',marginBottom:24,maxWidth:340}}>
        {isRenewal ? (
  <>
    Pay <b style={{color:'#0F6E56'}}>₹{plan.price}</b> via UPI to renew your
    MessPass subscription.
    {' '}Once confirmed, your subscription will be extended.
  </>
) : (
  <>
    Pay <b style={{color:'#0F6E56'}}>₹{plan.price}</b> via UPI for {plan.label} access.
    {isNewRegistration
      ? ' Your mess account activates the moment we confirm your payment.'
      : ' Once confirmed, your subscription renews automatically.'}
  </>
)}
      </div>

      <a
  href={upiLink}
  style={{
    display:'inline-block',
    width:'100%',
    maxWidth:320,
    padding:16,
    borderRadius:14,
    background:'#0F6E56',
    color:'white',
    fontSize:16,
    fontWeight:600,
    textDecoration:'none',
    marginBottom:16
  }}
>
  {isRenewal
    ? `Renew with UPI (₹${plan.price})`
    : `Pay ₹${plan.price} via UPI`}
</a>

      <div style={{background:'white',borderRadius:14,padding:16,width:'100%',maxWidth:320,marginBottom:20}}>
        <div style={{fontSize:12,color:'#999',marginBottom:4}}>UPI ID</div>
        <div style={{fontSize:15,fontWeight:600}}>{UPI_ID}</div>
        <div style={{fontSize:12,color:'#999',marginTop:10,marginBottom:4}}>Amount</div>
        <div style={{fontSize:15,fontWeight:600,color:'#0F6E56'}}>₹{plan.price}</div>
        <div style={{fontSize:12,color:'#999',marginTop:10,marginBottom:4}}>Reference</div>
        <div style={{fontSize:13,fontWeight:500}}>{messId}</div>
      </div>

      <div style={{fontSize:'12px',color:'#999',lineHeight:1.6,marginBottom:20}}>
  {isRenewal ? (
    <>
      After paying, We&apos;ll verify your renewal.<br/>
      Your MessPass subscription will be extended once approved.
    </>
  ) : (
    <>
      After paying, We&apos;ll verify and approve your account.<br/>
      This usually takes a few minutes.
    </>
  )}
</div>

      <button onClick={checkStatusNow} disabled={loading}
        style={{padding:'12px 24px',borderRadius:12,background:loading?'#9FE1CB':'#0F6E56',color:'white',fontSize:14,fontWeight:500,border:'none',cursor:'pointer'}}>
        {loading
  ? 'Checking...'
  : isRenewal
    ? "I've renewed — check status"
    : "I've paid — check my status"}
      </button>
    </div>
  )
return (
  <div style={{minHeight:'100vh',background:'#f5f5f0'}}>
    <div style={{background:'#0F6E56',padding:'24px 16px',textAlign:'center'}}>
      <div style={{fontSize:20,fontWeight:600,color:'white'}}>
        {isRenewal ? 'Renew Your Subscription' : 'Choose your plan'}
      </div>

      <div style={{fontSize:13,color:'#9FE1CB',marginTop:4}}>
        {isRenewal
          ? `Renew your MessPass subscription for ${messName}`
          : `Get ${messName} up and running`}
      </div>
    </div>
  

      <div style={{padding:'24px 16px'}}>
        {PLANS.map(p => (
          <div key={p.key} onClick={() => setSelected(p.key)}
            style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:18,borderRadius:16,marginBottom:12,cursor:'pointer',
              border: selected === p.key ? '2px solid #0F6E56' : '1px solid #eee',
              background: selected === p.key ? '#E1F5EE' : 'white'}}>
            <div>
              <div style={{fontWeight:600,fontSize:16}}>{p.label}</div>
              <div style={{fontSize:12,color:'#999'}}>{p.sub}</div>
            </div>
            <div style={{fontSize:22,fontWeight:700,color:'#0F6E56'}}>₹{p.price}</div>
          </div>
        ))}

        <button onClick={handleProceed} disabled={loading}
          style={{width:'100%',padding:16,borderRadius:14,background:loading?'#9FE1CB':'#0F6E56',color:'white',fontSize:16,fontWeight:500,border:'none',cursor:'pointer',marginTop:12}}>
          {loading
  ? 'Please wait...'
  : isRenewal
    ? 'Continue to Renewal Payment'
    : 'Continue to payment'}
        </button>
      </div>
    </div>
  )
}
