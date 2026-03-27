'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Heart, Mail, Lock, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'patient' | 'staff' | 'healthcenter' | 'doctor'>('patient')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      })
      
      if (res.ok) {
        const data = await res.json()
        // Save full user object for dynamic page usage
        localStorage.setItem('user', JSON.stringify(data.user))
        
        // Dynamic redirection based on user role
        if (data.user.role === 'staff' || data.user.role === 'admin') {
          window.location.href = '/staff/dashboard'
        } else if (data.user.role === 'healthcenter') {
          window.location.href = '/healthcenter/dashboard'
        } else if (data.user.role === 'doctor') {
          window.location.href = '/doctor/dashboard'
        } else {
          window.location.href = '/dashboard'
        }
      } else {
        const data = await res.json()
        setError(data.message || 'Login failed')
      }
    } catch (err) {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-10 h-10 text-primary fill-primary" />
            <span className="text-2xl font-bold text-primary">VoiceCare AI</span>
          </div>
          <p className="text-muted-foreground">Healthcare at your voice</p>
        </div>

        <Card className="p-8 border-border/50">
          <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground mb-6 text-sm">Sign in to your account</p>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex gap-2 items-start">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label>Login As</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'patient', label: 'Patient' },
                  { value: 'staff', label: 'Staff/Admin' },
                  { value: 'healthcenter', label: 'Health Center' },
                  { value: 'doctor', label: 'Doctor' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value as 'patient' | 'staff' | 'healthcenter' | 'doctor')}
                    className={`p-2 rounded-lg border transition-colors ${
                      role === opt.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:bg-secondary/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center text-sm">
            <p className="text-muted-foreground mb-3">
              Don&apos;t have an account?
            </p>
            <Link href="/auth/register">
              <Button variant="outline" className="w-full">
                Create Account
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
