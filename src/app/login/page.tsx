'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('owner@hadi-kaya.id')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if already logged in
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.success) router.push('/')
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success(`Selamat datang, ${data.data.name}!`)
        router.push('/')
        router.refresh()
      } else {
        setError(data.error || 'Login gagal')
      }
    } catch (err) {
      setError('Network error. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center p-4">
      <Toaster />
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 items-center justify-center shadow-lg shadow-emerald-500/30 mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Menuju Hadi Kaya</h1>
          <p className="text-sm text-emerald-300/70 mt-1">Virtual Office · Multi-Agent System</p>
        </div>

        <Card className="p-6 bg-slate-900/60 backdrop-blur border-slate-800">
          <h2 className="text-lg font-bold text-white mb-1">Login Owner</h2>
          <p className="text-xs text-slate-400 mb-6">
            Masuk untuk mengakses dashboard virtual office.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-md pl-10 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="owner@hadi-kaya.id"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoFocus
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-md pl-10 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-950/30 border border-rose-700/30 rounded-md px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </form>

          {/* First login hint */}
          <div className="mt-6 p-3 bg-emerald-950/30 border border-emerald-700/30 rounded-md">
            <p className="text-[10px] text-emerald-300">
              💡 <strong>First login:</strong> Password pertama yang kamu masukkan akan otomatis di-set sebagai password baru.
              Email default: <code className="text-emerald-200">owner@hadi-kaya.id</code>
            </p>
          </div>
        </Card>

        <p className="text-center text-[10px] text-slate-500 mt-6">
          © 2026 Menuju Hadi Kaya · Anjayo 16 · Pangkalpinang
        </p>
      </div>
    </div>
  )
}
