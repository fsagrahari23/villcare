import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from "@/lib/db"
import HealthCenter from "@/lib/models/HealthCenter"

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // 1. Center Type Distribution
    const typeCounts = await HealthCenter.aggregate([
      { $group: { _id: "$type", value: { $sum: 1 } } }
    ])
    
    const centerTypeData = typeCounts.map(tc => ({
      name: tc._id.charAt(0).toUpperCase() + tc._id.slice(1),
      value: tc.value,
      fill: tc._id === 'hospital' ? '#0066cc' : tc._id === 'uhc' ? '#00aa88' : '#ffaa00'
    }))

    // 2. Monthly Trend (Last 6 Months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)

    const monthlyTrend = await HealthCenter.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { 
            month: { $month: "$createdAt" }, 
            year: { $year: "$createdAt" },
            status: "$status"
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ])

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const trendMap = new Map()

    // Initialize last 6 months
    for (let i = 0; i < 6; i++) {
        const d = new Date()
        d.setMonth(d.getMonth() - (5 - i))
        const key = `${monthNames[d.getMonth()]}`
        trendMap.set(key, { month: key, approved: 0, rejected: 0, pending: 0 })
    }

    monthlyTrend.forEach(item => {
        const key = monthNames[item._id.month - 1]
        if (trendMap.has(key)) {
            const entry = trendMap.get(key)
            entry[item._id.status] = item.count
        }
    })

    const approvalTrendData = Array.from(trendMap.values())

    // 3. Status Breakdown
    const statusCounts = await HealthCenter.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ])
    
    const total = statusCounts.reduce((acc, curr) => acc + curr.count, 0)
    const statusBreakdown = statusCounts.map(sc => ({
      status: sc._id.charAt(0).toUpperCase() + sc._id.slice(1),
      count: sc.count,
      percentage: total > 0 ? Math.round((sc.count / total) * 100) : 0,
      color: sc._id === 'approved' ? 'bg-accent' : sc._id === 'pending' ? 'bg-yellow-500' : 'bg-destructive'
    }))

    // 4. Recent Approvals
    const recentApprovals = await HealthCenter.find({ status: 'approved' })
      .sort({ approvedAt: -1 })
      .limit(5)
      .lean()

    // 5. Average Approval Time by Type
    const avgTimeResults = await HealthCenter.aggregate([
      { $match: { status: 'approved', approvedAt: { $exists: true }, createdAt: { $exists: true } } },
      {
        $project: {
          type: 1,
          duration: { $divide: [ { $subtract: ["$approvedAt", "$createdAt"] }, 1000 * 60 * 60 * 24 ] }
        }
      },
      { $group: { _id: "$type", avgDays: { $avg: "$duration" } } }
    ])

    const avgTimeData = avgTimeResults.map(r => ({
      type: r._id.charAt(0).toUpperCase() + r._id.slice(1),
      days: parseFloat(r.avgDays.toFixed(1))
    }))

    // 6. Statistics Cards
    const totalApproved = statusCounts.find(s => s._id === 'approved')?.count || 0
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    const approvedThisMonth = await HealthCenter.countDocuments({
        status: 'approved',
        approvedAt: { 
            $gte: new Date(currentYear, currentMonth - 1, 1),
            $lt: new Date(currentYear, currentMonth, 1)
        }
    })

    const avgTimeOverall = avgTimeData.length > 0 
      ? (avgTimeData.reduce((acc, curr) => acc + curr.days, 0) / avgTimeData.length).toFixed(1)
      : "0.0"

    const statisticsCards = [
      { label: 'Total Approvals', value: totalApproved, trend: '+5%' },
      { label: 'Avg Approval Time', value: `${avgTimeOverall} days`, trend: 'Refined' },
      { label: 'Current Month', value: `${approvedThisMonth} approved`, trend: 'Recently updated' },
      { label: 'Approval Rate', value: total > 0 ? `${((totalApproved / total) * 100).toFixed(1)}%` : '0%', trend: 'Steady' }
    ]

    return NextResponse.json({
      centerTypeData,
      approvalTrendData,
      statusBreakdown,
      avgTimeData,
      recentApprovals: recentApprovals.map(r => ({
        name: r.name,
        type: (r as any).type.charAt(0).toUpperCase() + (r as any).type.slice(1),
        date: r.approvedAt ? new Date(r.approvedAt).toLocaleDateString() : 'N/A',
        time: '2.1 days',
        staff: 'Admin'
      })),
      statisticsCards
    })
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch analytics", details: error.message }, { status: 500 })
  }
}
