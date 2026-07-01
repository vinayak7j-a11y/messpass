'use client'
import { useEffect, useRef, useState } from 'react'

export default function Plans() {
  const ref = useRef(null)
  const [plans, setPlans] = useState([])
  const [mess, setMess] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({name:'', totalMeals:'', price:''})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('mess')
    if (!stored) { window.location.href = '/'; return }
    const m = JSON.parse(stored)
    setMess(m)
    fetchPlans(m.messId)
  }, [])

  async function fetchPlans(messId) {
    const res = await fetch('/api/plans?messId=' + messId)
    const data = await res.json()
    if (data.plans) setPlans(data.plans)
  }

  async function handleCreate() {
    if (!form.name || !form.totalMeals || !form.price) {
      setError('All fields required'); return
    }
    setLoading(true)
    const res = await fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, messId: mess.messId })
    })
    const data = await res.json()
    if (res.ok) {
      setPlans([...plans, data.plan])
      setForm({name:'', totalMeals:'', price:''})
      setShowForm(false)
      setError('')
    } else {
      setError(data.error)
    }
    setLoading(false)
  }

  async function handleDelete(planId) {
    if (!confirm('Delete this plan?')) return
    const res = await fetch('/api/plans?id=' + planId, { method: 'DELETE' })
    if (res.ok) setPlans(plans.filter(p => p._id !== planId))
  }

  return (
    <div style={{minHeight:'100vh',background:'#f5f5f0',paddingBottom:80}}>
      <div style={{background:'white',padding:16,display:'flex',alignItems:'center',gap:12,boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}}>
        <a href="/dashboard" style={{textDecoration:'none',color:'#333',fontSize:20}}>←</a>
        <div style={{fontWeight:500,fontSize:16}}>Meal Plans</div>
      </div>

      <div style={{padding:'20px 16px'}}>
        {plans.length === 0 && !showForm && (
          <div style={{background:'white',borderRadius:16,padding:24,textAlign:'center',marginBottom:16}}>
            <div style={{fontSize:32,marginBottom:8}}>📋</div>
            <div style={{fontWeight:500,marginBottom:4}}>No plans yet</div>
            <div style={{fontSize:13,color:'#999'}}>Create your first meal plan</div>
          </div>
        )}

        {plans.map(p => (
          <div key={p._id} style={{background:'white',borderRadius:16,padding:16,marginBottom:12,boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <div style={{fontWeight:500,fontSize:16}}>{p.name}</div>
                <div style={{fontSize:28,fontWeight:500,color:'#0F6E56',marginTop:4}}>{p.totalMeals}</div>
                <div style={{fontSize:12,color:'#999'}}>meals</div>
                <div style={{fontSize:15,fontWeight:500,marginTop:8}}>₹{p.price}</div>
              </div>
              <button onClick={() => handleDelete(p._id)}
                style={{fontSize:12,color:'#cc0000',border:'1px solid #fcc',borderRadius:8,padding:'6px 12px',background:'white',cursor:'pointer'}}>
                Delete
              </button>
            </div>
          </div>
        ))}

        {showForm && (
          <div style={{background:'white',borderRadius:16,padding:16,marginBottom:12,boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
            <div style={{fontWeight:500,marginBottom:16}}>New plan</div>
            {[
              {key:'name', label:'Plan name', placeholder:'e.g. Standard'},
              {key:'totalMeals', label:'Number of meals', placeholder:'e.g. 58', type:'number'},
              {key:'price', label:'Price (₹)', placeholder:'e.g. 1500', type:'number'},
            ].map(f => (
              <div key={f.key} style={{marginBottom:12}}>
                <label style={{fontSize:12,color:'#999',display:'block',marginBottom:4}}>{f.label}</label>
                <input
                  type={f.type || 'text'}
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={e => setForm({...form, [f.key]: e.target.value})}
                  style={{width:'100%',border:'1px solid #eee',borderRadius:10,padding:'10px 14px',fontSize:15,outline:'none',boxSizing:'border-box'}}
                />
              </div>
            ))}
            {error && <div style={{color:'#cc0000',fontSize:13,marginBottom:12}}>{error}</div>}
            <div style={{display:'flex',gap:8}}>
              <button onClick={handleCreate} disabled={loading}
                style={{flex:1,padding:'12px',borderRadius:10,background:'#0F6E56',color:'white',fontSize:14,fontWeight:500,border:'none',cursor:'pointer'}}>
                {loading ? 'Saving...' : 'Save plan'}
              </button>
              <button onClick={() => {setShowForm(false);setError('')}}
                style={{flex:1,padding:'12px',borderRadius:10,background:'#f5f5f0',color:'#333',fontSize:14,border:'none',cursor:'pointer'}}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {!showForm && (
          <button onClick={() => setShowForm(true)}
            style={{width:'100%',padding:'14px',borderRadius:16,background:'#0F6E56',color:'white',fontSize:15,fontWeight:500,border:'none',cursor:'pointer'}}>
            + Add new plan
          </button>
        )}
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
            <span style={{fontSize:11,color: n.href==='/dashboard/plans' ? '#0F6E56' : '#999'}}>{n.label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
