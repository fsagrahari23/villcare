'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Navigation from '@/components/Navigation'
import { TrendingUp, Clock, CheckCircle, AlertCircle, Users, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default function StaffDashboardPage() {
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    approvalRate: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/staff/stats')
        if (!res.ok) throw new Error('Failed to fetch staff stats')
        const data = await res.json()
        setStats(data)
      } catch (err) {
        console.error('Staff stats fetch failed:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-2xl p-8 mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome, Staff Member!</h1>
          <p className="text-primary-foreground/90">Manage hospital registrations and approvals</p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Clock className="w-5 h-5" />, label: 'Pending', value: stats.pending, bg: 'bg-yellow-500/10', text: 'text-yellow-600' },
            { icon: <CheckCircle className="w-5 h-5" />, label: 'Approved', value: stats.approved, bg: 'bg-accent/10', text: 'text-accent' },
            { icon: <AlertCircle className="w-5 h-5" />, label: 'Rejected', value: stats.rejected, bg: 'bg-destructive/10', text: 'text-destructive' },
            { icon: <TrendingUp className="w-5 h-5" />, label: 'Approval Rate', value: `${stats.approvalRate}%`, bg: 'bg-primary/10', text: 'text-primary' }
          ].map((stat, i) => (
            <Card key={i} className="p-4">
              <div className={`flex items-center gap-3`}>
                <div className={`p-2 ${stat.bg} ${stat.text} rounded-lg`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-bold">{stat.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link href="/staff/pending-approvals">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <Clock className="w-8 h-8 text-yellow-600 mb-3" />
              <h3 className="font-bold mb-2">Pending Approvals</h3>
              <p className="text-sm text-muted-foreground mb-4">Review {stats.pending} pending hospital registrations</p>
              <Button size="sm" variant="outline" className="w-full">View Pending</Button>
            </Card>
          </Link>

          <Link href="/staff/analytics">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <BarChart3 className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-bold mb-2">Analytics</h3>
              <p className="text-sm text-muted-foreground mb-4">View approval trends and statistics</p>
              <Button size="sm" variant="outline" className="w-full">View Analytics</Button>
            </Card>
          </Link>

          <Link href="/staff/map">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <Users className="w-8 h-8 text-secondary mb-3" />
              <h3 className="font-bold mb-2">Map View</h3>
              <p className="text-sm text-muted-foreground mb-4">See all health centers on map</p>
              <Button size="sm" variant="outline" className="w-full">View Map</Button>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { action: 'Central Hospital', status: 'Approved', date: 'Today', by: 'You' },
              { action: 'City Medical Center', status: 'Pending', date: 'Yesterday', by: 'Awaiting Review' },
              { action: 'Rural Health Post', status: 'Rejected', date: '2 days ago', by: 'System' }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-secondary/5 rounded-lg">
                <div>
                  <p className="font-medium">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${item.status === 'Approved' ? 'bg-accent/20 text-accent' :
                      item.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-600' :
                        'bg-destructive/20 text-destructive'
                    }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  )
}
