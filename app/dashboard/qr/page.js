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
      width: 1000,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: { dark: '#1a1a1a', light: '#ffffff' }
    })
    setQrDataUrl(dataUrl)
  }

  function downloadPoster() {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    // A4 ratio at print resolution (2480x3508 = A4 @ 300dpi), scaled down to keep file size reasonable
    const W = 1240, H = 1754
    canvas.width = W
    canvas.height = H

    ctx.fillStyle = '#f5f5f0'
    ctx.fillRect(0, 0, W, H)

    // Header
    ctx.fillStyle = '#0F6E56'
    ctx.fillRect(0, 0, W, 340)

    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.arc(W/2, 130, 70, 0, Math.PI*2)
    ctx.fill()
    ctx.fillStyle = '#0F6E56'
    ctx.font = 'bold 68px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(mess.name.charAt(0).toUpperCase(), W/2, 152)

    ctx.fillStyle = 'white'
    ctx.font = 'bold 58px sans-serif'
    ctx.fillText(mess.name, W/2, 250)

    if (tagline) {
      ctx.fillStyle = '#9FE1CB'
      ctx.font = 'italic 30px sans-serif'
      ctx.fillText(tagline, W/2, 300)
    }

    ctx.fillStyle = '#333'
    ctx.font = '600 36px sans-serif'
    ctx.fillText('Scan to register or mark your meal', W/2, 420)

    const img = new Image()
    img.onload = () => {
      const qrSize = 560
      const qrX = (W - qrSize) / 2
      const qrY = 460

      // QR white card with border
      ctx.fillStyle = 'white'
      ctx.fillRect(qrX - 30, qrY - 30, qrSize + 60, qrSize + 60)
      ctx.strokeStyle = '#eee'
      ctx.lineWidth = 2
      ctx.strokeRect(qrX - 30, qrY - 30, qrSize + 60, qrSize + 60)
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize)

      ctx.fillStyle = '#666'
      ctx.font = '30px sans-serif'
      ctx.fillText(mess.address || '', W/2, qrY + qrSize + 90)

      // Instructions section
      const stepsY = qrY + qrSize + 150
      ctx.fillStyle = 'white'
      ctx.fillRect(60, stepsY, W - 120, 420)
      ctx.strokeStyle = '#eee'
      ctx.strokeRect(60, stepsY, W - 120, 420)

      ctx.fillStyle = '#1a1a1a'
      ctx.font = 'bold 34px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('How to use', 100, stepsY + 60)

      const steps = [
        ['1', 'Open your phone camera and point it at this QR code'],
        ['2', 'First time here? Fill your name and pick a meal plan'],
        ['3', 'Already registered? Just tap once — your meal is marked instantly'],
        ['4', 'Show your payment to the mess owner to get approved'],
      ]

      steps.forEach((s, i) => {
        const y = stepsY + 120 + (i * 75)
        ctx.fillStyle = '#0F6E56'
        ctx.beginPath()
        ctx.arc(130, y - 12, 26, 0, Math.PI*2)
        ctx.fill()
        ctx.fillStyle = 'white'
        ctx.font = 'bold 26px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(s[0], 130, y - 3)

        ctx.fillStyle = '#333'
        ctx.font = '28px sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(s[1], 175, y)
      })

      // Footer brand strip
      ctx.fillStyle = '#04342C'
      ctx.fillRect(0, H - 170, W, 170)

      ctx.fillStyle = '#9FE1CB'
      ctx.font = '24px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('Get MessPass for your mess', 80, H - 100)
      ctx.fillStyle = 'white'
      ctx.font = 'bold 40px sans-serif'
      ctx.fillText('92852 73124', 80, H - 50)

      ctx.fillStyle = '#5DCAA5'
      ctx.font = '20px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText('Powered by', W - 80, H - 100)
      ctx.fillStyle = 'white'
      ctx.font = 'bold 32px sans-serif'
      ctx.fillText('MessPass', W - 80, H - 55)

      const link = document.createElement('a')
      link.download = mess.name.replace(/\s+/g,'_') + '_QR_Poster.png'
      link.href = canvas.toDataURL('image/png', 1.0)
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
