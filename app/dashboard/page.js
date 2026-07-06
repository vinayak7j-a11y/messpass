'use client'
import { useEffect, useRef } from 'react'

export default function Dashboard() {
  const ref = useRef(null)

  useEffect(() => {
    const stored = localStorage.getItem('mess')
    if (!stored) { window.location.href = '/'; return }
    const mess = JSON.parse(stored)

    function escapeHtml(str) {
      const div = document.createElement('div')
      div.textContent = str
      return div.innerHTML
    }

    async function handleApprove(customerId) {
      await fetch('/api/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, status: 'active' })
      })
      load()
    }

    async function handleReject(customerId, name) {
      if (!confirm('Reject ' + name + '? This can be undone later from Rejected customers.')) return
      await fetch('/api/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, status: 'rejected' })
      })
      load()
    }

    window.__handleApprove = handleApprove
    window.__handleReject = handleReject

    async function load() {
      const res = await fetch('/api/dashboard?messId=' + mess.messId)
      const data = await res.json()

      const pendingRes = await fetch('/api/customers?messId=' + mess.messId + '&status=pending')
      const pendingData = await pendingRes.json()
      const pendingList = pendingData.customers || []

      const actions = [
        {label:'Manage customers', href:'/dashboard/customers'},
        {label:'Pending approvals', href:'/dashboard/approvals'},
        {label:'Manage plans', href:'/dashboard/plans'},
        {label:'QR and Poster', href:'/dashboard/qr'},
        {label:'Mess settings', href:'/dashboard/settings'},
        {label:'Audit log', href:'/dashboard/audit'},
        {label:'Help & Support', href:'/dashboard/support'},
      ]

      const nav = [
        {label:'Home', icon:'🏠', href:'/dashboard'},
        {label:'Customers', icon:'👥', href:'/dashboard/customers'},
        {label:'Plans', icon:'📋', href:'/dashboard/plans'},
        {label:'QR', icon:'📱', href:'/dashboard/qr'},
      ]

      const stats = [
        {label:'Total customers', value: String(data.total ?? 0), color:'#1a1a1a'},
        {label:'Active', value: String(data.active ?? 0), color:'#0F6E56'},
        {label:'Pending', value: String(data.pending ?? 0), color:'#BA7517'},
        {label:'Meals today', value: String(data.mealsToday ?? 0), color:'#0F6E56'},
      ]

      const plansRes = await fetch('/api/plans?messId=' + mess.messId)
      const plansData = await plansRes.json()
      const hasPlans = (plansData.plans && plansData.plans.length > 0)
      const hasCustomers = (data.total ?? 0) > 0

      const onboardingHtml = (!hasPlans || !hasCustomers) ? `
        <div style="background:white;border-radius:16px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);border:1px solid #E1F5EE">
          <div style="font-weight:600;font-size:14px;margin-bottom:12px;color:#0F6E56">Getting started</div>
          <a href="/dashboard/plans" style="display:flex;align-items:center;gap:10px;padding:10px 0;text-decoration:none;color:#333;border-bottom:1px solid #f5f5f0">
            <span style="width:22px;height:22px;border-radius:50%;border:2px solid ${hasPlans ? '#0F6E56' : '#ccc'};background:${hasPlans ? '#0F6E56' : 'white'};display:flex;align-items:center;justify-content:center;font-size:12px;color:white;flex-shrink:0">${hasPlans ? '✓' : ''}</span>
            <span style="font-size:14px;text-decoration:${hasPlans ? 'line-through' : 'none'};color:${hasPlans ? '#999' : '#333'}">Create your first meal plan</span>
          </a>
          <a href="/dashboard/qr" style="display:flex;align-items:center;gap:10px;padding:10px 0;text-decoration:none;color:#333;border-bottom:1px solid #f5f5f0">
            <span style="width:22px;height:22px;border-radius:50%;border:2px solid #ccc;background:white;display:flex;align-items:center;justify-content:center;font-size:12px;color:white;flex-shrink:0"></span>
            <span style="font-size:14px;color:#333">Download and print your QR poster</span>
          </a>
          <a href="/dashboard/qr" style="display:flex;align-items:center;gap:10px;padding:10px 0;text-decoration:none;color:#333">
            <span style="width:22px;height:22px;border-radius:50%;border:2px solid ${hasCustomers ? '#0F6E56' : '#ccc'};background:${hasCustomers ? '#0F6E56' : 'white'};display:flex;align-items:center;justify-content:center;font-size:12px;color:white;flex-shrink:0">${hasCustomers ? '✓' : ''}</span>
            <span style="font-size:14px;text-decoration:${hasCustomers ? 'line-through' : 'none'};color:${hasCustomers ? '#999' : '#333'}">Get your first customer to scan and register</span>
          </a>
        </div>
      ` : ''

      const pendingHtml = pendingList.length > 0 ? `
        <div style="background:white;border-radius:16px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);border:1px solid #FAC775">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <div style="font-weight:600;font-size:14px;color:#854F0B">🔔 New registrations</div>
            <div style="font-size:11px;color:#999">${pendingList.length} waiting</div>
          </div>
          ${pendingList.map(c => `
            <div style="border:1px solid #f5f5f0;border-radius:12px;padding:12px;margin-bottom:8px">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
                <div style="width:34px;height:34px;border-radius:50%;background:#E1F5EE;display:flex;align-items:center;justify-content:center;font-weight:500;color:#0F6E56;font-size:14px;flex-shrink:0">${escapeHtml(c.name.charAt(0))}</div>
                <div>
                  <div style="font-weight:500;font-size:14px">${escapeHtml(c.name)}</div>
                  <div style="font-size:12px;color:#999">${escapeHtml(c.mobile)} · ${c.totalMeals} meals</div>
                </div>
              </div>
              <div style="display:flex;gap:8px">
                <button onclick="window.__handleApprove('${c._id}')" style="flex:1;padding:8px;border-radius:8px;background:#0F6E56;color:white;font-size:13px;font-weight:500;border:none;cursor:pointer">Approve</button>
                <button onclick="window.__handleReject('${c._id}', '${escapeHtml(c.name)}')" style="flex:1;padding:8px;border-radius:8px;background:white;color:#cc0000;font-size:13px;font-weight:500;border:1px solid #fcc;cursor:pointer">Reject</button>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''

      const mealLogHtml = (data.recentMeals && data.recentMeals.length > 0)
        ? data.recentMeals.map(m => {
            const time = new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})
            return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f5f5f0;font-size:13px">' +
              '<span style="font-weight:500">' + escapeHtml(m.name) + '</span>' +
              '<span style="color:#999;text-transform:capitalize">' + escapeHtml(m.mealType) + '</span>' +
              '<span style="color:#bbb;font-size:11px">' + time + '</span>' +
            '</div>'
          }).join('')
        : '<div style="font-size:14px;color:#ccc;text-align:center;padding:24px 0">No meals recorded today</div>'

      ref.current.innerHTML = `
        <div style="background:white;padding:16px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:40px;height:40px;border-radius:10px;background:#0F6E56;display:flex;align-items:center;justify-content:center;color:white;font-weight:500;font-size:18px">${escapeHtml(mess.name.charAt(0))}</div>
            <div>
              <div style="font-weight:500;font-size:14px">${escapeHtml(mess.name)}</div>
              <div style="font-size:12px;color:#999">${mess.messId}</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <button id="install-btn" style="display:none;font-size:12px;color:white;border:none;border-radius:8px;padding:6px 12px;background:#0F6E56;cursor:pointer;font-weight:500">Install app</button>
            <button id="logout-btn" style="font-size:12px;color:#999;border:1px solid #eee;border-radius:8px;padding:6px 12px;background:white;cursor:pointer">Logout</button>
          </div>
        </div>

        <div style="padding:20px 16px;display:flex;flex-direction:column;gap:16px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            ${stats.map(s => `
              <div style="background:white;border-radius:16px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
                <div style="font-size:12px;color:#999;margin-bottom:4px">${s.label}</div>
                <div style="font-size:28px;font-weight:500;color:${s.color}">${s.value}</div>
              </div>
            `).join('')}
          </div>

          ${pendingHtml}

          ${onboardingHtml}

          <div style="background:white;border-radius:16px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
            <div style="font-weight:500;font-size:14px;margin-bottom:12px">Quick actions</div>
            ${actions.map(a => `
              <a href="${a.href}" style="display:flex;align-items:center;justify-content:space-between;padding:12px;border-radius:12px;background:${a.highlight ? '#FAEEDA' : '#f5f5f0'};margin-bottom:8px;text-decoration:none;color:${a.highlight ? '#854F0B' : '#333'};font-size:14px;font-weight:${a.highlight ? '600' : '400'};border:${a.highlight ? '1px solid #FAC775' : 'none'}">
                <span>${a.label}</span><span style="color:${a.highlight ? '#854F0B' : '#ccc'}">→</span>
              </a>
            `).join('')}
          </div>

          <div style="background:white;border-radius:16px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
            <div style="font-weight:500;font-size:14px;margin-bottom:12px">Today's meal log</div>
            ${mealLogHtml}
          </div>
        </div>

        <div style="position:fixed;bottom:0;left:0;right:0;background:white;border-top:1px solid #f0f0f0;padding:12px 24px;display:flex;justify-content:space-around">
          ${nav.map(n => `
            <a href="${n.href}" style="display:flex;flex-direction:column;align-items:center;gap:4px;text-decoration:none">
              <span style="font-size:20px">${n.icon}</span>
              <span style="font-size:11px;color:#999">${n.label}</span>
            </a>
          `).join('')}
        </div>
      `

      document.getElementById('logout-btn').onclick = () => {
        localStorage.removeItem('mess')
        window.location.href = '/'
      }

      const installBtn = document.getElementById('install-btn')
      if (window.deferredInstallPrompt) {
        installBtn.style.display = 'block'
      }
      installBtn.onclick = async () => {
        if (window.deferredInstallPrompt) {
          window.deferredInstallPrompt.prompt()
          await window.deferredInstallPrompt.userChoice
          window.deferredInstallPrompt = null
          installBtn.style.display = 'none'
        }
      }
    }

    load()

    let prevPending = null
    let audioCtx = null

    function playPing() {
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.connect(gain)
        gain.connect(audioCtx.destination)
        osc.frequency.value = 880
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4)
        osc.start()
        osc.stop(audioCtx.currentTime + 0.4)
      } catch (e) {}
      if (navigator.vibrate) navigator.vibrate([100, 50, 100])
    }

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/dashboard?messId=' + mess.messId)
        const d = await res.json()
        if (prevPending !== null && d.pending > prevPending) {
          playPing()
          load()
        }
        prevPending = d.pending
      } catch (e) {}
    }, 8000)

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      window.deferredInstallPrompt = e
      const btn = document.getElementById('install-btn')
      if (btn) btn.style.display = 'block'
    })

    return () => clearInterval(pollInterval)
  }, [])

  return <div ref={ref} style={{minHeight:'100vh',background:'#f5f5f0',paddingBottom:80}} />
}
