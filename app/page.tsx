"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Users, Eye, Clock, TrendingUp, Sparkles, Smartphone, Monitor, Globe } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const API_BASE = "https://ai-analytics-backend-d2t8.onrender.com/api/analytics";
const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"];

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [traffic, setTraffic] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [topPages, setTopPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, trafficRes, devicesRes, pagesRes] = await Promise.all([
          fetch(`${API_BASE}/overview`),
          fetch(`${API_BASE}/traffic`),
          fetch(`${API_BASE}/devices`),
          fetch(`${API_BASE}/top-pages`),
        ]);

        const overview = await overviewRes.json();
        const trafficData = await trafficRes.json();
        const devicesData = await devicesRes.json();
        const pagesData = await pagesRes.json();

        setData(overview);
        setTraffic(trafficData.data || []);
        
        // Format devices for PieChart
        if (devicesData.data) {
           const formatted = devicesData.data.map((d: any) => ({
             name: d.deviceCategory,
             value: d.users,
           }));
           setDevices(formatted);
        }
        
        setTopPages(pagesData.data || []);
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-10 w-10 border-t-2 border-b-2 border-blue-500 rounded-full"
        />
      </div>
    );
  }

  const metrics = [
    {
      title: "Total Users",
      value: data?.totalUsers || 0,
      trend: data?.usersTrend || "+12%",
      icon: <Users className="h-5 w-5 text-blue-400" />,
      color: "from-blue-500/20 to-transparent",
    },
    {
      title: "Page Views",
      value: data?.pageViews || 0,
      trend: data?.pageViewsTrend || "+18%",
      icon: <Eye className="h-5 w-5 text-purple-400" />,
      color: "from-purple-500/20 to-transparent",
    },
    {
      title: "Bounce Rate",
      value: data?.bounceRate ? `${data.bounceRate}%` : "0%",
      trend: data?.bounceTrend || "-2.4%",
      icon: <Activity className="h-5 w-5 text-emerald-400" />,
      color: "from-emerald-500/20 to-transparent",
    },
    {
      title: "Avg Session",
      value: data?.avgSessionDuration || "0s",
      trend: "+5.1%",
      icon: <Clock className="h-5 w-5 text-amber-400" />,
      color: "from-amber-500/20 to-transparent",
    },
  ];

  return (
    <div className="min-h-screen p-6 md:p-12 lg:p-20 font-sans max-w-7xl mx-auto">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 mb-2">
            AI Analytics
          </h1>
          <p className="text-zinc-400 text-lg">
            Real-time intelligence from your Google Analytics 4 property.
          </p>
        </div>
        <div className="glass-panel px-6 py-3 flex items-center gap-3 w-fit border-blue-500/20">
          <Sparkles className="h-5 w-5 text-blue-400" />
          <span className="text-sm font-medium text-blue-100">Live Production Data</span>
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse ml-2" />
        </div>
      </motion.header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="glass-panel p-6 metric-card transition-all duration-300 relative group"
          >
            <div className={`absolute inset-0 bg-gradient-to-b ${metric.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                  {metric.icon}
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                  <TrendingUp className="h-3 w-3" />
                  {metric.trend}
                </div>
              </div>
              <div>
                <p className="text-zinc-400 font-medium mb-1">{metric.title}</p>
                <h3 className="text-4xl font-bold tracking-tight text-white">{metric.value}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="glass-panel p-6 md:p-8 lg:col-span-2"
        >
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Traffic Overview</h2>
              <p className="text-zinc-400 text-sm">Unique visitors and sessions over time</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={traffic.length > 0 ? traffic : [{date: "N/A", users: 0}]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a1a1aa' }} 
                  dy={10} 
                  tickFormatter={(val) => val.length > 4 ? val.substring(4) : val}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#a1a1aa' }} 
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: 'rgba(9, 9, 11, 0.9)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(8px)',
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorUsers)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Devices Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="glass-panel p-6 md:p-8 flex flex-col"
        >
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white mb-2">Device Breakdown</h2>
            <p className="text-zinc-400 text-sm">Audience platform preference</p>
          </div>
          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={devices.length > 0 ? devices : [{name: 'Unknown', value: 1}]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {(devices.length > 0 ? devices : [{name: 'Unknown', value: 1}]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(9, 9, 11, 0.9)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Custom Legend */}
            <div className="flex justify-center gap-4 mt-2">
              {devices.map((device, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-xs text-zinc-400 capitalize">{device.name}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top Pages Table */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.6 }}
        className="glass-panel p-6 md:p-8 mt-6"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Top Performing Pages</h2>
            <p className="text-zinc-400 text-sm">Pages with the highest engagement</p>
          </div>
          <Globe className="h-6 w-6 text-zinc-500" />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="text-xs uppercase text-zinc-500 border-b border-white/10">
              <tr>
                <th className="px-4 py-3 font-medium">Page Path</th>
                <th className="px-4 py-3 font-medium text-right">Views</th>
                <th className="px-4 py-3 font-medium text-right">Avg. Time</th>
              </tr>
            </thead>
            <tbody>
              {topPages.length > 0 ? (
                topPages.map((page, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4 font-medium text-zinc-200">{page.pagePath}</td>
                    <td className="px-4 py-4 text-right text-blue-400 font-medium">{page.pageViews}</td>
                    <td className="px-4 py-4 text-right">{page.avgSessionDuration}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-zinc-500">
                    Not enough data collected yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}