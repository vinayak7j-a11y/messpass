'use client'
import { useState } from 'react'

export default function ForgotPassword() {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, name, newPassword })
    })
    const data = await res.json()

    if (res.ok) {
      setSuccess(true)
    } else {
      setError(data.error || 'Something went wrong')
    }
    setLoading(false)
  }

  if (success) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{background:'#f5f5f0'}}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{background:'#E1F5EE', border:'3px solid #9FE1CB', fontSize:40}}>✓</div>
      <h1 className="text-2xl font-semibold mb-2" style={{color:'#0F6E56'}}>Password reset!</h1>
      <p className="text-sm text-gray-500 mb-6">You can now log in with your new password.</p>
      <a href="/" className="w-full max-w-sm py-4 rounded-2xl text-white font-medium text-base block text-center" style={{background:'#0F6E56'}}>
        Go to login
      </a>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12" style={{background:'#f5f5f0'}}>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Reset password</h1>
        <p className="text-sm text-gray-500 mt-1">Verify your details to set a new password</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Registered phone number</label>
          <input
            type="tel"
            placeholder="98765 43210"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-green-700"
            required
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Your mess name (as registered)</label>
          <input
            type="text"
            placeholder="Sharma Mess"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-green-700"
            required
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">New password (min 6 characters)</label>
          <input
            type="password"
            placeholder="Create a new password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-green-700"
            required
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl text-white font-medium text-base"
          style={{background: loading ? '#9FE1CB' : '#0F6E56'}}
        >
          {loading ? 'Resetting...' : 'Reset password'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        <a href="/" className="font-medium" style={{color:'#0F6E56'}}>Back to login</a>
      </p>
    </div>
  )
}
