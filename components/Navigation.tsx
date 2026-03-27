'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BarChart3,
  FileText,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Mic,
  Stethoscope,
  User,
  Users,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

type AppRole = 'patient' | 'staff' | 'admin' | 'healthcenter'

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userRole, setUserRole] = useState<AppRole>('patient')

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (!storedUser) return

    try {
      const user = JSON.parse(storedUser)
      if (user?.role) {
        setUserRole(user.role)
      }
    } catch (error) {
      console.error('Failed to parse stored user:', error)
    }
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    localStorage.removeItem('user')
    window.location.href = '/'
  }

  const patientLinks = [
    { icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard', href: '/dashboard' },
    { icon: <Mic className="w-4 h-4" />, label: 'Voice Input', href: '/voice-input' },
    { icon: <FileText className="w-4 h-4" />, label: 'Reports', href: '/reports' },
    { icon: <MapPin className="w-4 h-4" />, label: 'Map', href: '/map' },
    { icon: <User className="w-4 h-4" />, label: 'Profile', href: '/profile' },
  ]

  const staffLinks = [
    { icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard', href: '/staff/dashboard' },
    { icon: <FileText className="w-4 h-4" />, label: 'Pending Approvals', href: '/staff/pending-approvals' },
    { icon: <MapPin className="w-4 h-4" />, label: 'Centers Map', href: '/staff/map' },
    { icon: <BarChart3 className="w-4 h-4" />, label: 'Analytics', href: '/staff/analytics' },
  ]

  const healthCenterLinks = [
    { icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard', href: '/healthcenter/dashboard' },
    { icon: <Users className="w-4 h-4" />, label: 'Doctors', href: '/healthcenter/dashboard#doctors' },
    { icon: <Stethoscope className="w-4 h-4" />, label: 'Meetings', href: '/healthcenter/dashboard#consultations' },
  ]

  const links = userRole === 'healthcenter'
    ? healthCenterLinks
    : userRole === 'staff' || userRole === 'admin'
      ? staffLinks
      : patientLinks

  const homeHref = userRole === 'healthcenter'
    ? '/healthcenter/dashboard'
    : userRole === 'staff' || userRole === 'admin'
      ? '/staff/dashboard'
      : '/dashboard'

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={homeHref} className="flex items-center gap-2">
          <Heart className="h-6 w-6 fill-primary text-primary" />
          <span className="text-lg font-bold text-primary">VoiceCare</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button variant="ghost" size="sm" className="gap-2">
                {link.icon}
                <span className="hidden lg:inline">{link.label}</span>
              </Button>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleLogout} variant="outline" size="sm" className="gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>

          <button
            onClick={() => setMobileMenuOpen((current) => !current)}
            className="rounded-lg p-2 hover:bg-secondary md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-border px-4 pb-4 md:hidden">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button
                variant="ghost"
                className="mb-1 w-full justify-start gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.icon}
                {link.label}
              </Button>
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
