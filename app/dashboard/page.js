'use client'
import { useEffect, useRef } from 'react'

export default function Dashboard() {
  const ref = useRef(null)

  useEffect(() => {
    const stored = localStorage.getItem('mess')
    if (!stored) { window.location.href = '/'; return }
    const mess = JSON.parse(stored)

    async function load() {
      const res = await fetch('/api/dashboard?messId=' + mess.messId)
      const data = await res.json()

      const actions = [
        {label:'Manage customers', href:'/dashboard/customers'},
        {label:'Pending approvals', href:'/dashboard/approvals'},
        {label:'Manage plans', href:'/dashboard/plans'},
        {label:'QR and Poster', href:'/dashboard/qr'},
        {label:'Mess settings', href:'/dashboard/settings'},
        {label:'Audit log', href:'/dashboard/audit'},
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

      const mealLogHtml = (data.recentMeals && data.recentMeals.length > 0)
        ? data.recentMeals.map(m => {
            const time = new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})
            return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f5f5f0;font-size:13px">' +
              '<span style="font-weight:500">' + m.name + '</span>' +
              '<span style="color:#999;text-transform:capitalize">' + m.mealType + '</span>' +
              '<span style="color:#bbb;font-size:11px">' + time + '</span>' +
            '</div>'
          }).join('')
        : '<div style="font-size:14px;color:#ccc;text-align:center;padding:24px 0">No meals recorded today</div>'

      ref.current.innerHTML = `
        <div style="background:white;padding:16px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:40px;height:40px;border-radius:10px;background:#0F6E56;display:flex;align-items:center;justify-content:center;color:white;font-weight:500;font-size:18px">${mess.name.charAt(0)}</div>
            <div>
              <div style="font-weight:500;font-size:14px">${mess.name}</div>
              <div style="font-size:12px;color:#999">${mess.messId}</div>
            </div>
          </div>
          <button id="logout-btn" style="font-size:12px;color:#999;border:1px solid #eee;border-radius:8px;padding:6px 12px;background:white;cursor:pointer">Logout</button>
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

          <div style="background:white;border-radius:16px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
            <div style="font-weight:500;font-size:14px;margin-bottom:12px">Quick actions</div>
            ${actions.map(a => `
              <a href="${a.href}" style="display:flex;align-items:center;justify-content:space-between;padding:12px;border-radius:12px;background:#f5f5f0;margin-bottom:8px;text-decoration:none;color:#333;font-size:14px">
                <span>${a.label}</span><span style="color:#ccc">→</span>
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
    }

    load()
  }, [])

  return <div ref={ref} style={{minHeight:'100vh',background:'#f5f5f0',paddingBottom:80}} />
}
