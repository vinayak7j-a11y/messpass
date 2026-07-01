'use client'
import { useEffect, useState } from 'react'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [messId, setMessId] = useState(null)
  const [plans, setPlans] = useState([])
  const [showRenew, setShowRenew] = useState(false)
  const [renewing, setRenewing] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('mess')
    if (!stored) { window.location.href = '/'; return }
    const m = JSON.parse(stored)
    setMessId(m.messId)
    fetchCustomers(m.messId)
    fetchPlans(m.messId)
  }, [])

  async function fetchPlans(mid) {
    const res = await fetch('/api/plans?messId=' + mid)
    const data = await res.json()
    if (data.plans) setPlans(data.plans)
  }

  async function handleRenew(planId) {
    setRenewing(true)
    const res = await fetch('/api/customers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: selected._id, renewPlanId: planId })
    })
    const data = await res.json()
    if (data.customer) {
      setSelected(data.customer)
      setCustomers(customers.map(c => c._id === data.customer._id ? data.customer : c))
      setShowRenew(false)
    }
    setRenewing(false)
  }

  async function fetchCustomers(mid) {
    const res = await fetch('/api/customers?messId=' + mid)
    const data = await res.json()
    if (data.customers) setCustomers(data.customers.filter(c => c.status !== 'pending' && c.status !== 'rejected'))
    setLoading(false)
  }

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.mobile.includes(search)
  )

  if (selected) {
    const pct = Math.round((selected.usedMeals / selected.totalMeals) * 100)
    return (
      <div style={{minHeight:'100vh',background:'#f5f5f0',paddingBottom:80}}>
        <div style={{background:'white',padding:16,display:'flex',alignItems:'center',gap:12,boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}}>
          <button onClick={() => setSelected(null)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#333'}}>←</button>
          <div style={{fontWeight:500,fontSize:16}}>{selected.name}</div>
        </div>

        <div style={{padding:'20px 16px'}}>
          <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
            <div style={{width:56,height:56,borderRadius:'50%',background:'#E1F5EE',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:600,color:'#0F6E56',flexShrink:0}}>
              {selected.name.charAt(0)}
            </div>
            <div>
              <div style={{fontSize:18,fontWeight:600}}>{selected.name}</div>
              <div style={{fontSize:13,color:'#999'}}>{selected.mobile}</div>
            </div>
            <div style={{marginLeft:'auto'}}>
              <span style={{fontSize:12,fontWeight:500,padding:'4px 10px',borderRadius:999,
                background: selected.remainingMeals <= 5 ? '#FCEBEB' : '#E1F5EE',
                color: selected.remainingMeals <= 5 ? '#A32D2D' : '#0F6E56'}}>
                {selected.remainingMeals <= 5 ? 'Low balance' : 'Active'}
              </span>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
            <div style={{background:'white',borderRadius:14,padding:14}}>
              <div style={{fontSize:11,color:'#999',marginBottom:4}}>Total meals</div>
              <div style={{fontSize:22,fontWeight:600}}>{selected.totalMeals}</div>
            </div>
            <div style={{background:'white',borderRadius:14,padding:14}}>
              <div style={{fontSize:11,color:'#999',marginBottom:4}}>Used</div>
              <div style={{fontSize:22,fontWeight:600}}>{selected.usedMeals}</div>
            </div>
            <div style={{background:'white',borderRadius:14,padding:14}}>
              <div style={{fontSize:11,color:'#999',marginBottom:4}}>Remaining</div>
              <div style={{fontSize:22,fontWeight:600,color:'#0F6E56'}}>{selected.remainingMeals}</div>
            </div>
            <div style={{background:'white',borderRadius:14,padding:14}}>
              <div style={{fontSize:11,color:'#999',marginBottom:4}}>Progress</div>
              <div style={{fontSize:22,fontWeight:600}}>{pct}%</div>
            </div>
          </div>

          <button onClick={() => setShowRenew(true)}
            style={{width:'100%',padding:14,borderRadius:14,background:'#0F6E56',color:'white',fontSize:14,fontWeight:500,border:'none',cursor:'pointer',marginBottom:16}}>
            Renew subscription
          </button>

          {showRenew && (
            <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'flex-end',zIndex:50}} onClick={() => setShowRenew(false)}>
              <div style={{background:'white',borderRadius:'20px 20px 0 0',padding:20,width:'100%',maxHeight:'70vh',overflowY:'auto'}} onClick={e => e.stopPropagation()}>
                <div style={{fontWeight:600,fontSize:16,marginBottom:14}}>Choose a plan to renew</div>
                {plans.map(p => (
                  <button key={p._id} disabled={renewing} onClick={() => handleRenew(p._id)}
                    style={{width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center',padding:14,borderRadius:12,border:'1px solid #eee',background:'white',marginBottom:8,cursor:'pointer'}}>
                    <div style={{textAlign:'left'}}>
                      <div style={{fontWeight:500,fontSize:15}}>{p.name}</div>
                      <div style={{fontSize:13,color:'#999'}}>{p.totalMeals} meals</div>
                    </div>
                    <div style={{fontWeight:600,color:'#0F6E56'}}>&#8377;{p.price}</div>
                  </button>
                ))}
                <button onClick={() => setShowRenew(false)} style={{width:'100%',padding:12,borderRadius:12,background:'#f5f5f0',border:'none',fontSize:14,color:'#666',marginTop:8,cursor:'pointer'}}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{background:'white',borderRadius:16,padding:16}}>
            <div style={{fontWeight:500,fontSize:14,marginBottom:12}}>Meal tracker</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {Array.from({length: selected.totalMeals}, (_, i) => i + 1).map(n => (
                <div key={n} title={'Meal ' + n}
                  style={{width:30,height:30,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:500,
                    background: n <= selected.usedMeals ? '#0F6E56' : '#f5f5f0',
                    color: n <= selected.usedMeals ? 'white' : '#bbb',
                    border: n <= selected.usedMeals ? 'none' : '1px solid #eee'}}>
                  {n <= selected.usedMeals ? '✓' : n}
                </div>
              ))}
            </div>
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
              <span style={{fontSize:11,color: n.href==='/dashboard/customers' ? '#0F6E56' : '#999'}}>{n.label}</span>
            </a>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh',background:'#f5f5f0',paddingBottom:80}}>
      <div style={{background:'white',padding:16,display:'flex',alignItems:'center',gap:12,boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}}>
        <a href="/dashboard" style={{textDecoration:'none',color:'#333',fontSize:20}}>←</a>
        <div style={{fontWeight:500,fontSize:16}}>Subscribers</div>
      </div>

      <div style={{padding:'16px'}}>
        <input type="text" placeholder="Search by name or phone..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{width:'100%',border:'1px solid #eee',borderRadius:12,padding:'12px 14px',fontSize:14,outline:'none',boxSizing:'border-box',marginBottom:16,background:'white'}} />

        {loading && <div style={{textAlign:'center',color:'#999',padding:40}}>Loading...</div>}

        {!loading && filtered.length === 0 && (
          <div style={{background:'white',borderRadius:16,padding:32,textAlign:'center'}}>
            <div style={{fontSize:32,marginBottom:8}}>👥</div>
            <div style={{fontWeight:500,marginBottom:4}}>No subscribers found</div>
            <div style={{fontSize:13,color:'#999'}}>Active customers will appear here</div>
          </div>
        )}

        {filtered.map(c => (
          <div key={c._id} onClick={() => setSelected(c)}
            style={{background:'white',borderRadius:14,padding:14,marginBottom:10,display:'flex',alignItems:'center',gap:12,cursor:'pointer',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
            <div style={{width:44,height:44,borderRadius:'50%',background:'#E1F5EE',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:600,color:'#0F6E56',flexShrink:0}}>
              {c.name.charAt(0)}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:500,fontSize:14}}>{c.name}</div>
              <div style={{fontSize:12,color:'#999'}}>{c.mobile}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:13,fontWeight:600,color: c.remainingMeals <= 5 ? '#A32D2D' : '#0F6E56'}}>{c.remainingMeals}</div>
              <div style={{fontSize:11,color:'#999'}}>left</div>
            </div>
            <span style={{color:'#ccc',fontSize:16}}>→</span>
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
            <span style={{fontSize:11,color: n.href==='/dashboard/customers' ? '#0F6E56' : '#999'}}>{n.label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
