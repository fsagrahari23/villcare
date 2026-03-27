'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Navigation from '@/components/Navigation'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Download, Calendar, Loader2 } from 'lucide-react'

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/staff/analytics')
      if (!res.ok) throw new Error('Failed to fetch')
      const result = await res.json()
      setData(result)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  const { approvalTrendData, centerTypeData, avgTimeData, statusBreakdown, recentApprovals, statisticsCards } = data

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Hospital registration and approval analytics</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Calendar className="w-4 h-4" />
              Date Range
            </Button>
            <Button className="bg-primary hover:bg-primary/90 gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {statisticsCards.map((card: any, i: number) => (
            <Card key={i} className="p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">{card.label}</p>
              <p className="text-3xl font-bold mb-1">{card.value}</p>
              <p className="text-xs text-accent flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {card.trend}
              </p>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Approval Trend */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Approval Trend (Last 6 Months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={approvalTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="approved"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--accent)' }}
                />
                <Line
                  type="monotone"
                  dataKey="rejected"
                  stroke="var(--destructive)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--destructive)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Center Type Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Centers by Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={centerTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {centerTypeData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Average Approval Time */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Average Approval Time by Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={avgTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="type" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }} />
                <Bar dataKey="days" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Approval Breakdown */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Approval Status Breakdown</h3>
            <div className="space-y-4">
              {statusBreakdown.map((item: any) => (
                <div key={item.status}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{item.status}</span>
                    <span className="font-bold">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Approvals */}
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Recent Approvals</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Center Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Type</th>
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Approval Time</th>
                  <th className="text-left py-3 px-4 font-semibold">Staff</th>
                </tr>
              </thead>
              <tbody>
                {recentApprovals.map((row: any, i: number) => (
                  <tr key={i} className="border-b border-border hover:bg-secondary/5">
                    <td className="py-3 px-4">{row.name}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded">
                        {row.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">{row.date}</td>
                    <td className="py-3 px-4">{row.time}</td>
                    <td className="py-3 px-4">{row.staff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  )
}
