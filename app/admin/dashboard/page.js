'use client'
import { useEffect, useState } from 'react'

export default function AdminDashboard() {
  const [messes, setMesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const pw = sessionStorage.getItem('admin_password')
    if (!pw) { window.location.href = '/admin'; return }
    fetchMesses(pw)
  }, [])

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
    window.location.href = '/admin'
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

  return (
    <div style={{minHeight:'100vh',background:'#1a1a1a',paddingBottom:40}}>
      <div style={{padding:20,display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid #333'}}>
        <div style={{fontSize:18,fontWeight:600,color:'white'}}>MessPass Admin</div>
        <button onClick={logout} style={{fontSize:12,color:'#999',border:'1px solid #444',borderRadius:8,padding:'6px 12px',background:'transparent',cursor:'pointer'}}>
          Logout
        </button>
      </div>

      <div style={{padding:20}}>

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
      </div>
    </div>
  )
}
