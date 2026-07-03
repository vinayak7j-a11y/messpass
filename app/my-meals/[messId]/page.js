'use client'
import { useEffect, useState } from 'react'

export default function MyMeals({ params }) {
  const [messId, setMessId] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    params.then(p => {
      setMessId(p.messId)
      const mobile = localStorage.getItem('mobile_' + p.messId)
      if (!mobile) {
        setError('We could not find your registration on this device.')
        setLoading(false)
        return
      }
      fetchData(p.messId, mobile)
    })
  }, [])

  async function fetchData(mid, mobile) {
    const res = await fetch('/api/my-meals?messId=' + mid + '&mobile=' + mobile)
    const d = await res.json()
    if (res.ok) {
      setData(d)
    } else {
      setError(d.error || 'Something went wrong')
    }
    setLoading(false)
  }

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f5f5f0'}}>
      <div style={{color:'#999'}}>Loading...</div>
    </div>
  )

  if (error) return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#f5f5f0',padding:24,textAlign:'center'}}>
      <div style={{fontSize:32,marginBottom:12}}>😕</div>
      <div style={{fontSize:16,fontWeight:500,marginBottom:8}}>{error}</div>
      <a href={'/register/' + messId} style={{color:'#0F6E56',fontSize:14,fontWeight:500,marginTop:12}}>Go back</a>
    </div>
  )

  const { customer, meals } = data
  const mealsByNumber = {}
  meals.forEach(m => { mealsByNumber[m.mealNumber] = m })

  return (
    <div style={{minHeight:'100vh',background:'#f5f5f0',paddingBottom:40}}>
      <div style={{background:'#0F6E56',padding:'24px 16px',textAlign:'center'}}>
        <div style={{fontSize:14,color:'#9FE1CB',marginBottom:4}}>{customer.name}</div>
        <div style={{fontSize:22,fontWeight:600,color:'white'}}>Your meal tracker</div>
      </div>

      <div style={{padding:'20px 16px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:16}}>
          <div style={{background:'white',borderRadius:14,padding:14,textAlign:'center'}}>
            <div style={{fontSize:11,color:'#999',marginBottom:4}}>Total</div>
            <div style={{fontSize:22,fontWeight:600}}>{customer.totalMeals}</div>
          </div>
          <div style={{background:'white',borderRadius:14,padding:14,textAlign:'center'}}>
            <div style={{fontSize:11,color:'#999',marginBottom:4}}>Used</div>
            <div style={{fontSize:22,fontWeight:600,color:'#0F6E56'}}>{customer.usedMeals}</div>
          </div>
          <div style={{background:'white',borderRadius:14,padding:14,textAlign:'center'}}>
            <div style={{fontSize:11,color:'#999',marginBottom:4}}>Remaining</div>
            <div style={{fontSize:22,fontWeight:600,color: customer.remainingMeals <= 5 ? '#A32D2D' : '#0F6E56'}}>{customer.remainingMeals}</div>
          </div>
        </div>

        <div style={{background:'white',borderRadius:16,padding:16}}>
          <div style={{fontWeight:500,fontSize:14,marginBottom:4}}>Meal history</div>
          <div style={{fontSize:12,color:'#999',marginBottom:14}}>Green means done, empty means not yet used</div>

          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {Array.from({length: customer.totalMeals}, (_, i) => i + 1).map(n => {
              const meal = mealsByNumber[n]
              const done = n <= customer.usedMeals
              return (
                <div key={n} title={meal ? new Date(meal.timestamp).toLocaleDateString() + ' · ' + meal.mealType : 'Not used yet'}
                  style={{
                    width:36,height:36,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:11,fontWeight:600,
                    background: done ? '#0F6E56' : 'white',
                    color: done ? 'white' : '#bbb',
                    border: done ? 'none' : '1.5px solid #eee'
                  }}>
                  {done ? '✓' : n}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
