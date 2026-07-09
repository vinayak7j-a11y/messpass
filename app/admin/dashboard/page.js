'use client'
import { useEffect, useState } from 'react'

export default function AdminDashboard() {
  const [messes, setMesses] = useState([])
  const [tickets, setTickets] = useState([]) 
  const [payments, setPayments] = useState([])
  const [tab, setTab] = useState('messes')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('') 

  useEffect(() => {
    const pw = sessionStorage.getItem('admin_password')
    if (!pw) { window.location.href = '/admin'; return }
    fetchMesses(pw)
fetchTickets(pw)
fetchPayments(pw)
  }, [])
async function fetchTickets(pw) {
  const res = await fetch('/api/support', {
    headers: { 'x-admin-password': pw }
  })

  if (res.status === 401) {
    window.location.href = '/admin'
    return
  }

  const data = await res.json()

  if (data.tickets) {
    setTickets(data.tickets)
  }
}
  
async function fetchPayments(pw) {
  
  const res = await fetch('/api/subscription', {
  headers: { 'x-admin-password': pw }
})

if (res.status === 401) {
  window.location.href = '/admin'
  return
}

const data = await res.json()

if (data.payments) {
  setPayments(data.payments)
}
}
  
  async function resolveTicket(ticketId) {
  const pw = sessionStorage.getItem('admin_password')

  const res = await fetch('/api/support', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': pw
    },
    body: JSON.stringify({
      ticketId,
      status: 'resolved'
    })
  })

  if (res.status === 401) {
    window.location.href = '/admin'
    return
  }

  if (!res.ok) {
    alert('Failed to resolve ticket')
    return
  }

  fetchTickets(pw)
}
async function handlePayment(paymentId, action) {
  const pw = sessionStorage.getItem('admin_password')

  const res = await fetch('/api/subscription', { 
    
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': pw
    }, 
    
    body: JSON.stringify({
      paymentId,
      action 
    })
  }) 
  if (res.status === 401) {
  window.location.href = '/admin'
  return
}
if (!res.ok) {
    alert("Failed to update payment.")
    return
}
  fetchPayments(pw)
  fetchMesses(pw) 
  fetchTickets(pw) 
}
  async function fetchMesses(pw) {
    const res = await fetch('/api/admin/messes', {
      headers: { 'x-admin-password': pw }
    })
    if (res.status === 401) { window.location.href = '/admin'; return }
    const data = await res.json()
    if (data.messes) setMesses(data.messes)
    else setError(data.error || 'Failed to load')
    setLoading(false)
  }

  async function toggleBlock(messId, currentlyBlocked) {
    const pw = sessionStorage.getItem('admin_password')
    if (!currentlyBlocked && !confirm('Block this mess? The owner will not be able to log in.')) return
    await fetch('/api/admin/messes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': pw },
      body: JSON.stringify({ messId, blocked: !currentlyBlocked })
    })
    fetchMesses(pw)
  }

  async function deleteMess(messId, name) {
    const pw = sessionStorage.getItem('admin_password')
    if (!confirm('Permanently delete "' + name + '" and ALL its data (customers, meals, plans)? This cannot be undone.')) return
    await fetch('/api/admin/messes?messId=' + messId, {
      method: 'DELETE',
      headers: { 'x-admin-password': pw }
    })
    fetchMesses(pw)
  }

  function logout() {
    sessionStorage.removeItem('admin_password')
   window.location.replace('/admin')
  }

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#1a1a1a',color:'#999'}}>
      Loading...
    </div>
  )

  const totalMesses = messes.length
  const totalCustomersAll = messes.reduce((sum, m) => sum + m.totalCustomers, 0)
  const totalMealsAll = messes.reduce((sum, m) => sum + m.totalMeals, 0)
  const activeMesses = messes.filter(m => !m.blocked).length 
  const registrationPayments = payments.filter(
  p => p.type !== 'renewal' 
) 
const renewalPayments = payments.filter(
  p => p.type === 'renewal'
)
  return (
    <div style={{minHeight:'100vh',background:'#1a1a1a',paddingBottom:40}}>
      <div style={{padding:20,display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid #333'}}>
        <div style={{fontSize:18,fontWeight:600,color:'white'}}>MessPass Admin</div>
        <button onClick={logout} style={{fontSize:12,color:'#999',border:'1px solid #444',borderRadius:8,padding:'6px 12px',background:'transparent',cursor:'pointer'}}>
          Logout
        </button>
      </div>

      <div style={{padding:20}}>

        <div style={{display:'flex',gap:8,marginBottom:20}}>
          <button onClick={() => setTab('messes')}
            style={{padding:'8px 16px',borderRadius:10,background: tab==='messes' ? '#0F6E56' : '#262626',color:'white',fontSize:13,fontWeight:500,border:'none',cursor:'pointer'}}>
            Messes
          </button>
          <button onClick={() => setTab('tickets')}
            style={{padding:'8px 16px',borderRadius:10,background: tab==='tickets' ? '#0F6E56' : '#262626',color:'white',fontSize:13,fontWeight:500,border:'none',cursor:'pointer',position:'relative'}}>
            Support tickets
            {tickets.filter(t => t.status === 'open').length > 0 && (
              <span style={{position:'absolute',top:-6,right:-6,background:'#ff6b6b',color:'white',fontSize:10,fontWeight:700,borderRadius:999,width:18,height:18,display:'flex',alignItems:'center',justifyContent:'center'}}>
                {tickets.filter(t => t.status === 'open').length}
              </span>
            )}
          </button>
          <button onClick={() => setTab('payments')}
            style={{padding:'8px 16px',borderRadius:10,background: tab==='payments' ? '#0F6E56' : '#262626',color:'white',fontSize:13,fontWeight:500,border:'none',cursor:'pointer',position:'relative'}}>
            Payments
            {payments.length > 0 && (
              <span style={{position:'absolute',top:-6,right:-6,background:'#FAC775',color:'#1a1a1a',fontSize:10,fontWeight:700,borderRadius:999,width:18,height:18,display:'flex',alignItems:'center',justifyContent:'center'}}>
                {payments.length}
              </span>
            )}
          </button>
        </div>

        {tab === 'payments' && (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {payments.length === 0 && <div style={{textAlign:'center',color:'#666',padding:40}}>No pending payments</div>}
            
              <div style={{ marginBottom: 28 }}>
  <div
    style={{
      color: 'white',
      fontSize: 16,
      fontWeight: 600,
      marginBottom: 14
    }}
  >
    New Registrations ({registrationPayments.length})
  </div>

  {registrationPayments.length === 0 && (
    <div style={{ color: '#888', marginBottom: 20 }}>
      No pending registrations
    </div>
  )}

  {registrationPayments.map(p => (
              <div key={p._id} style={{background:'#262626',borderRadius:16,padding:16,border:'1px solid #FAC775'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                  <div>
  <div
    style={{
      fontWeight: 600,
      color: 'white',
      fontSize: 15
    }}
  >
    {p.messName || 'Unknown Mess'}
  </div>

  <div
    style={{
      fontSize: 12,
      color: '#999'
    }}
  >
    {p.messId}
  </div>
</div>
                  <div style={{fontSize:18,fontWeight:700,color:'#FAC775'}}>₹{p.amount}</div>
                </div>
                <div
  style={{
    display:'flex',
    gap:8,
    alignItems:'center',
    marginBottom:4
  }}
>
  <span
    style={{
      fontSize:13,
      color:'#ccc',
      textTransform:'capitalize'
    }}
  >
    {p.plan} plan
  </span>

  <span
    style={{
      fontSize:11,
      background:'#3a2f1f',
      color:'#FAC775',
      padding:'2px 8px',
      borderRadius:999,
      fontWeight:600
    }}
  >
    NEW REGISTRATION
  </span>
</div>
                <div style={{fontSize:11,color:'#777',marginBottom:14}}>Submitted {new Date(p.createdAt).toLocaleString()}</div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={() => handlePayment(p._id, 'approve')}
                    style={{flex:1,padding:10,borderRadius:10,background:'#0F6E56',color:'white',fontSize:13,fontWeight:500,border:'none',cursor:'pointer'}}>
                    ✓ Confirm payment received
                  </button>
                  <button onClick={() => handlePayment(p._id, 'reject')}
                    style={{flex:1,padding:10,borderRadius:10,background:'transparent',color:'#ff6b6b',fontSize:13,fontWeight:500,border:'1px solid #663333',cursor:'pointer'}}>
                    Reject
                  </button>
                </div>
              </div> 

            ))}
          </div>
          <div style={{ marginTop: 28 }}>
  <div
    style={{
      color: 'white',
      fontSize: 16,
      fontWeight: 600,
      marginBottom: 14
    }}
  >
    Renewals ({renewalPayments.length})
  </div>

  {renewalPayments.length === 0 && (
    <div style={{ color: '#888', marginBottom: 20 }}>
      No pending renewals
    </div>
  )}

  {renewalPayments.map(p => (
    <div
      key={p._id}
      style={{
        background:'#262626',
        borderRadius:16,
        padding:16,
        border:'1px solid #5DCAA5'
      }}
    >
      
        <div
  style={{
    display:'flex',
    justifyContent:'space-between',
    marginBottom:8
  }}
>
  <div>
    <div
      style={{
        fontWeight:600,
        color:'white',
        fontSize:15
      }}
    >
      {p.messName || 'Unknown Mess'}
    </div>

    <div
      style={{
        fontSize:12,
        color:'#999'
      }}
    >
      {p.messId}
    </div>
  </div>

  <div
    style={{
      fontSize:18,
      fontWeight:700,
      color:'#5DCAA5'
    }}
  >
    ₹{p.amount}
  </div>
</div> 
<div
  style={{
    display:'flex',
    gap:8,
    alignItems:'center',
    flexWrap:'wrap',
    marginBottom:8
  }}
>
  <span
    style={{
      fontSize:13,
      color:'#ccc',
      textTransform:'capitalize'
    }}
  >
    New Plan: {p.plan}
  </span>

  <span
    style={{
      fontSize:11,
      background:'#1f3a2f',
      color:'#5DCAA5',
      padding:'2px 8px',
      borderRadius:999,
      fontWeight:600
    }}
  >
    RENEWAL
  </span>
</div>

<div
  style={{
    fontSize:12,
    color:'#aaa',
    lineHeight:1.7,
    marginBottom:10
  }}
>
  <div><strong>Mess:</strong> {p.messName || '-'}</div>
  <div><strong>Current Plan:</strong> {p.currentPlan || '-'}</div>
  <div>
    <strong>Current Expiry:</strong>{' '}
    {p.currentExpiry
      ? new Date(p.currentExpiry).toLocaleDateString()
      : '-'}
  </div>

  <div>
    <strong>Days Remaining:</strong>{' '}
    {typeof p.daysRemaining === 'number'
      ? p.daysRemaining
      : '-'}
  </div>
</div>
      
      
      <div
        style={{
          fontSize:11,
          color:'#777',
          marginBottom:14
        }}
      >
        Submitted {new Date(p.createdAt).toLocaleString()}
      </div>

      <div style={{display:'flex',gap:8}}>
        <button
          onClick={() => handlePayment(p._id,'approve')}
          style={{
            flex:1,
            padding:10,
            borderRadius:10,
            background:'#0F6E56',
            color:'white',
            fontSize:13,
            fontWeight:500,
            border:'none',
            cursor:'pointer'
          }}
        >
          ✓ Confirm payment received
        </button>

        <button
          onClick={() => handlePayment(p._id,'reject')}
          style={{
            flex:1,
            padding:10,
            borderRadius:10,
            background:'transparent',
            color:'#ff6b6b',
            fontSize:13,
            fontWeight:500,
            border:'1px solid #663333',
            cursor:'pointer'
          }}
        >
          Reject
        </button>
      </div>
    </div>
  ))}
</div>
</div>

)}

        {tab === 'tickets' && (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {tickets.length === 0 && <div style={{textAlign:'center',color:'#666',padding:40}}>No support tickets</div>}
            {tickets.map(t => (
              <div key={t._id} style={{background:'#262626',borderRadius:16,padding:16,border: t.status==='open' ? '1px solid #FAC775' : '1px solid #333'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                  <div style={{fontWeight:600,color:'white',fontSize:14}}>{t.subject}</div>
                  <span style={{fontSize:11,fontWeight:600,color: t.status==='open' ? '#FAC775' : '#5DCAA5',background: t.status==='open' ? '#3a2f1f' : '#1f3a2f',padding:'3px 10px',borderRadius:999}}>
                    {t.status.toUpperCase()}
                  </span>
                </div>
                <div style={{fontSize:13,color:'#ccc',marginBottom:8}}>{t.message}</div>
                <div style={{fontSize:11,color:'#777',marginBottom:12}}>{t.messName} · {t.phone} · {new Date(t.createdAt).toLocaleString()}</div>
                {t.status === 'open' && (
                  <button onClick={() => resolveTicket(t._id)}
                    style={{padding:'8px 16px',borderRadius:8,background:'#0F6E56',color:'white',fontSize:12,fontWeight:500,border:'none',cursor:'pointer'}}>
                    Mark resolved
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'messes' && <>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24}}>
          {[
            {label:'Total messes', value: totalMesses},
            {label:'Active messes', value: activeMesses},
            {label:'Total customers', value: totalCustomersAll},
            {label:'Total meals served', value: totalMealsAll},
          ].map(s => (
            <div key={s.label} style={{background:'#262626',borderRadius:14,padding:16}}>
              <div style={{fontSize:11,color:'#999',marginBottom:4}}>{s.label}</div>
              <div style={{fontSize:24,fontWeight:600,color:'white'}}>{s.value}</div>
            </div>
          ))}
        </div>

        {error && <div style={{color:'#ff6b6b',marginBottom:16}}>{error}</div>}

        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {messes.map(m => (
            <div key={m._id} style={{background:'#262626',borderRadius:16,padding:18,border: m.blocked ? '1px solid #663333' : '1px solid #333'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                <div>
                  <div style={{fontSize:16,fontWeight:600,color:'white'}}>{m.name}</div>
                  <div style={{fontSize:12,color:'#999',marginTop:2}}>{m.messId} · {m.ownerName} · {m.phone}</div>
                  <div style={{fontSize:12,color:'#777',marginTop:2}}>{m.address}</div>
                  <div style={{fontSize:11,color:'#666',marginTop:4}}>Registered {new Date(m.createdAt).toLocaleDateString()}</div>
                </div>
                {m.blocked && (
                  <span style={{fontSize:11,fontWeight:600,color:'#ff6b6b',background:'#3a1f1f',padding:'4px 10px',borderRadius:999}}>BLOCKED</span>
                )}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
                <div style={{background:'#1a1a1a',borderRadius:10,padding:10,textAlign:'center'}}>
                  <div style={{fontSize:10,color:'#999'}}>Customers</div>
                  <div style={{fontSize:16,fontWeight:600,color:'white'}}>{m.totalCustomers}</div>
                </div>
                <div style={{background:'#1a1a1a',borderRadius:10,padding:10,textAlign:'center'}}>
                  <div style={{fontSize:10,color:'#999'}}>Active</div>
                  <div style={{fontSize:16,fontWeight:600,color:'#5DCAA5'}}>{m.activeCustomers}</div>
                </div>
                <div style={{background:'#1a1a1a',borderRadius:10,padding:10,textAlign:'center'}}>
                  <div style={{fontSize:10,color:'#999'}}>Total meals</div>
                  <div style={{fontSize:16,fontWeight:600,color:'white'}}>{m.totalMeals}</div>
                </div>
                <div style={{background:'#1a1a1a',borderRadius:10,padding:10,textAlign:'center'}}>
                  <div style={{fontSize:10,color:'#999'}}>Meals today</div>
                  <div style={{fontSize:16,fontWeight:600,color:'#5DCAA5'}}>{m.mealsToday}</div>
                </div>
              </div>

              <div style={{display:'flex',gap:8}}>
                <button onClick={() => toggleBlock(m.messId, m.blocked)}
                  style={{flex:1,padding:10,borderRadius:10,background: m.blocked ? '#0F6E56' : '#3a1f1f',color: m.blocked ? 'white' : '#ff6b6b',fontSize:13,fontWeight:500,border:'none',cursor:'pointer'}}>
                  {m.blocked ? 'Unblock' : 'Block'}
                </button>
                <button onClick={() => deleteMess(m.messId, m.name)}
                  style={{flex:1,padding:10,borderRadius:10,background:'transparent',color:'#ff6b6b',fontSize:13,fontWeight:500,border:'1px solid #663333',cursor:'pointer'}}>
                  Delete
                </button>
              </div>
            </div>
          ))}

          {messes.length === 0 && !error && (
            <div style={{textAlign:'center',color:'#666',padding:40}}>No messes registered yet</div>
          )}
        </div>
        </>}
      </div>
    </div>
  )
}
