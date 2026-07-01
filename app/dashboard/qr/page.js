'use client'
import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

const TAGLINES = [
  'Ghar jaisa khana, roz',
  'Fresh meals, every day',
  'Sasta, swadisht, bharosa',
  'Your daily meal, sorted',
]

export default function QRPage() {
  const canvasRef = useRef(null)
  const [mess, setMess] = useState(null)
  const [tagline, setTagline] = useState('')
  const [customTagline, setCustomTagline] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('mess')
    if (!stored) { window.location.href = '/'; return }
    const m = JSON.parse(stored)
    setMess(m)
    setTagline(m.tagline || TAGLINES[0])
    generateQR(m.messId)
  }, [])

  async function generateQR(messId) {
    const url = window.location.origin + '/register/' + messId
    const dataUrl = await QRCode.toDataURL(url, {
      width: 400,
      margin: 1,
      color: { dark: '#1a1a1a', light: '#ffffff' }
    })
    setQrDataUrl(dataUrl)
  }

  function downloadPoster() {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const W = 800, H = 1100
    canvas.width = W
    canvas.height = H

    ctx.fillStyle = '#f5f5f0'
    ctx.fillRect(0, 0, W, H)

    ctx.fillStyle = '#0F6E56'
    ctx.fillRect(0, 0, W, 240)

    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.arc(W/2, 90, 50, 0, Math.PI*2)
    ctx.fill()
    ctx.fillStyle = '#0F6E56'
    ctx.font = 'bold 48px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(mess.name.charAt(0).toUpperCase(), W/2, 106)

    ctx.fillStyle = 'white'
    ctx.font = 'bold 40px sans-serif'
    ctx.fillText(mess.name, W/2, 175)

    if (tagline) {
      ctx.fillStyle = '#9FE1CB'
      ctx.font = 'italic 22px sans-serif'
      ctx.fillText(tagline, W/2, 210)
    }

    ctx.fillStyle = '#666'
    ctx.font = '500 26px sans-serif'
    ctx.fillText('Scan to register or record your meal', W/2, 300)

    const img = new Image()
    img.onload = () => {
      const qrSize = 420
      ctx.drawImage(img, (W-qrSize)/2, 330, qrSize, qrSize)

      ctx.fillStyle = '#666'
      ctx.font = '22px sans-serif'
      ctx.fillText(mess.address || '', W/2, 800)

      ctx.fillStyle = '#04342C'
      ctx.fillRect(0, 950, W, 150)

      ctx.fillStyle = '#9FE1CB'
      ctx.font = '18px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('Get MessPass for your mess', 60, 1010)
      ctx.fillStyle = 'white'
      ctx.font = 'bold 30px sans-serif'
      ctx.fillText('92852 73124', 60, 1050)

      ctx.fillStyle = '#5DCAA5'
      ctx.font = '16px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText('Powered by', W-60, 1010)
      ctx.fillStyle = 'white'
      ctx.font = 'bold 24px sans-serif'
      ctx.fillText('MessPass', W-60, 1045)

      const link = document.createElement('a')
      link.download = mess.name.replace(/\s+/g,'_') + '_QR_Poster.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = qrDataUrl
  }

  if (!mess) return null

  return (
    <div style={{minHeight:'100vh',background:'#f5f5f0',paddingBottom:80}}>
      <div style={{background:'white',padding:16,display:'flex',alignItems:'center',gap:12,boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}}>
        <a href="/dashboard" style={{textDecoration:'none',color:'#333',fontSize:20}}>←</a>
        <div style={{fontWeight:500,fontSize:16}}>My QR &amp; Poster</div>
      </div>

      <div style={{padding:'20px 16px'}}>

        <div style={{background:'white',borderRadius:16,padding:16,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:500,marginBottom:10}}>Tagline (optional)</div>
          {TAGLINES.map(t => (
            <div key={t} onClick={() => { setTagline(t); setCustomTagline(false) }}
              style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:10,cursor:'pointer',marginBottom:6,
                background: tagline===t && !customTagline ? '#E1F5EE' : '#f5f5f0'}}>
              <div style={{width:14,height:14,borderRadius:'50%',border:'1.5px solid',
                borderColor: tagline===t && !customTagline ? '#0F6E56' : '#ccc',
                background: tagline===t && !customTagline ? '#0F6E56' : 'white'}} />
              <span style={{fontSize:13}}>{t}</span>
            </div>
          ))}
          <div onClick={() => setCustomTagline(true)}
            style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:10,cursor:'pointer',marginBottom:6,
              background: customTagline ? '#E1F5EE' : '#f5f5f0'}}>
            <div style={{width:14,height:14,borderRadius:'50%',border:'1.5px solid',
              borderColor: customTagline ? '#0F6E56' : '#ccc',
              background: customTagline ? '#0F6E56' : 'white'}} />
            <span style={{fontSize:13}}>Write my own</span>
          </div>
          {customTagline && (
            <input type="text" placeholder="Your tagline..." value={tagline}
              onChange={e => setTagline(e.target.value)}
              style={{width:'100%',border:'1px solid #eee',borderRadius:10,padding:'10px 12px',fontSize:13,outline:'none',boxSizing:'border-box',marginTop:6}} />
          )}
          <div onClick={() => { setTagline(''); setCustomTagline(false) }}
            style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:10,cursor:'pointer',marginTop:6,
              background: !tagline && !customTagline ? '#E1F5EE' : '#f5f5f0'}}>
            <div style={{width:14,height:14,borderRadius:'50%',border:'1.5px solid',
              borderColor: !tagline && !customTagline ? '#0F6E56' : '#ccc',
              background: !tagline && !customTagline ? '#0F6E56' : 'white'}} />
            <span style={{fontSize:13}}>No tagline</span>
          </div>
        </div>

        <div style={{background:'white',borderRadius:16,overflow:'hidden',marginBottom:16}}>
          <div style={{background:'#0F6E56',padding:'20px 16px',textAlign:'center'}}>
            <div style={{width:52,height:52,borderRadius:'50%',background:'white',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 10px',fontSize:18,fontWeight:600,color:'#0F6E56'}}>
              {mess.name.charAt(0)}
            </div>
            <div style={{fontSize:20,fontWeight:600,color:'white'}}>{mess.name}</div>
            {tagline && <div style={{fontSize:12,color:'#9FE1CB',marginTop:4,fontStyle:'italic'}}>{tagline}</div>}
          </div>
          <div style={{padding:16,textAlign:'center'}}>
            <div style={{fontSize:12,color:'#999',marginBottom:12,fontWeight:500}}>Scan to register or record your meal</div>
            {qrDataUrl && <img src={qrDataUrl} alt="QR code" style={{width:160,height:160,margin:'0 auto',display:'block'}} />}
            <div style={{fontSize:11,color:'#999',marginTop:12}}>{mess.address}</div>
          </div>
          <div style={{background:'#04342C',padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{fontSize:10,color:'#9FE1CB'}}>Get MessPass for your mess</div>
              <div style={{fontSize:13,fontWeight:500,color:'white'}}>92852 73124</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:10,color:'#5DCAA5'}}>Powered by</div>
              <div style={{fontSize:12,fontWeight:500,color:'white'}}>MessPass</div>
            </div>
          </div>
        </div>

        <button onClick={downloadPoster}
          style={{width:'100%',padding:14,borderRadius:14,background:'#0F6E56',color:'white',fontSize:14,fontWeight:500,border:'none',cursor:'pointer',marginBottom:10}}>
          Download poster as PNG
        </button>

        <div style={{fontSize:12,color:'#999',textAlign:'center'}}>
          Mess ID: {mess.messId}
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
            <span style={{fontSize:11,color: n.href==='/dashboard/qr' ? '#0F6E56' : '#999'}}>{n.label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
