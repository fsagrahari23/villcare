'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Navigation from '@/components/Navigation'
import { Heart, Mic, FileText, MapPin, MessageSquare, User, AlertTriangle, Flame, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get user from localStorage (set during login)
    const storedUser = localStorage.getItem('user')
    const user = storedUser ? JSON.parse(storedUser) : null
    const effectiveUserId = user?._id || "65f123456789012345678901"

    const fetchData = async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          fetch(`/api/dashboard/stats?userId=${effectiveUserId}`),
          fetch(`/api/dashboard/activity?userId=${effectiveUserId}`)
        ])

        if (!statsRes.ok || !activityRes.ok) throw new Error('Failed to fetch data')

        const statsData = await statsRes.json()
        const activityData = await activityRes.json()

        setStats(statsData)
        setActivities(activityData)
      } catch (err) {
        console.error('Dashboard data fetch failed:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const riskLevel = stats?.riskLevel || 'low'

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-primary/90 to-blue-600 text-primary-foreground rounded-3xl p-8 mb-8 shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Welcome back!</h1>
            <p className="text-primary-foreground/80 font-medium">Your health dashboard is ready. Let&apos;s keep you healthy.</p>
          </div>
        </div>

        {/* Risk Alert */}
        {riskLevel === 'high' && (
          <Card className="mb-8 p-5 border-destructive/30 bg-destructive/5 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-destructive/10 rounded-full">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-bold text-destructive text-lg">High Risk Alert</h3>
                <p className="text-sm text-destructive/70">Our AI has detected potential health risks. Please consult with a healthcare provider immediately.</p>
              </div>
              <Button variant="default" className="ml-auto bg-destructive hover:bg-destructive/90 text-white font-bold">View Analysis</Button>
            </div>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Mic className="w-5 h-5" />, label: 'Voice Checkups', value: stats?.voiceCheckups ?? '...' },
            { icon: <FileText className="w-5 h-5" />, label: 'Medical Reports', value: stats?.medicalReports ?? '...' },
            { icon: <Flame className="w-5 h-5" />, label: 'Current Risk', value: riskLevel.toUpperCase() },
            { icon: <TrendingUp className="w-5 h-5" />, label: 'Health Score', value: stats?.healthScore ? `${stats.healthScore}/100` : '...' }
          ].map((stat, i) => (
            <Card key={i} className="p-6 border-border/50 bg-card/50 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">{stat.label}</p>
                  <p className={`text-xl font-bold tracking-tight ${stat.label === 'Current Risk' ? (riskLevel === 'high' ? 'text-destructive' : riskLevel === 'medium' ? 'text-yellow-600' : 'text-emerald-600') : ''}`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Quick Actions */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
            <div className="grid gap-3">
              {[
                { icon: <Mic className="w-6 h-6" />, title: 'Voice Checkup', desc: 'Record your symptoms', href: '/voice-input' },
                { icon: <FileText className="w-6 h-6" />, title: 'Upload Report', desc: 'Add medical documents', href: '/reports' },
                { icon: <MapPin className="w-6 h-6" />, title: 'Find Healthcare', desc: 'Locate nearby centers', href: '/map' },
                { icon: <MessageSquare className="w-6 h-6" />, title: 'Medical Chat', desc: 'Ask health questions', href: '/chat' }
              ].map((action, i) => (
                <Link key={i} href={action.href}>
                  <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 text-primary rounded-lg">
                        {action.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{action.title}</h3>
                        <p className="text-sm text-muted-foreground">{action.desc}</p>
                      </div>
                      <span className="text-primary">→</span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h2 className="text-2xl font-bold mb-4">AI Recommendations</h2>
            <Card className="p-6 border-accent/30 bg-accent/5">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-accent mb-2">💊 Medication</h4>
                  <p className="text-sm text-muted-foreground">Continue taking Aspirin 500mg twice daily with meals.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-accent mb-2">🥗 Diet</h4>
                  <p className="text-sm text-muted-foreground">Increase intake of leafy greens, reduce salt consumption.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-accent mb-2">🏃 Exercise</h4>
                  <p className="text-sm text-muted-foreground">30 minutes of moderate activity daily would be beneficial.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-accent mb-2">🏥 Follow-up</h4>
                  <p className="text-sm text-muted-foreground">Schedule check-up within 2 weeks with your healthcare provider.</p>
                </div>
              </div>
              <Button className="w-full mt-4 bg-accent hover:bg-accent/90">View Detailed Plan</Button>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="p-8 border-border/50 bg-card/50 shadow-xl rounded-3xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Recent Activity</h2>
            <Button variant="ghost" size="sm" className="text-primary font-bold">View All</Button>
          </div>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground italic font-medium">No recent activity found.</p>
              </div>
            ) : (
              activities.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-secondary/10 hover:bg-secondary/20 transition-colors rounded-2xl group/activity">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl ${item.type === 'voice' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
                      {item.type === 'voice' ? <Mic className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-foreground group-hover/activity:text-primary transition-colors">{item.action}</p>
                      <p className="text-xs font-medium text-muted-foreground/60">{item.date}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-3 py-1 rounded-full opacity-0 group-hover/activity:opacity-100 transition-opacity">
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </main>
    </div>
  )
}
