"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Search, Filter, Shield, LogOut, Download, Eye, 
  CheckCircle, Clock, Trash2, Calendar, Phone, Mail, 
  Building, X, AlertCircle, RefreshCw, Sparkles 
} from "lucide-react";

export default function AdminDashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  
  // Storage and Sync states
  const [isStandaloneMode, setIsStandaloneMode] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Authenticate using simple stored state
  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const isLocal = typeof window !== "undefined" && 
        (window.location.hostname === "localhost" || 
         window.location.hostname === "127.0.0.1" ||
         window.location.hostname.startsWith("192.168."));
      
      const apiBase = isLocal
        ? "http://localhost:8000/api"
        : "https://ai-analytics-backend-d2t8.onrender.com/api";

      const res = await fetch(`${apiBase}/leads`);
      if (!res.ok) throw new Error("API not responding");
      
      const data = await res.json();
      setLeads(data);
      setIsStandaloneMode(false);
    } catch (err) {
      console.warn("Backend down. Fallback to client browser storage list.", err);
      
      // Load from localStorage
      const localData = JSON.parse(localStorage.getItem("dashboard_leads") || "[]");
      setLeads(localData);
      setIsStandaloneMode(true);
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    // Optimistic state update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );

    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead((prev: any) => ({ ...prev, status: newStatus }));
    }

    try {
      if (isStandaloneMode) {
        const localData = JSON.parse(localStorage.getItem("dashboard_leads") || "[]");
        const updated = localData.map((l: any) => l.id === leadId ? { ...l, status: newStatus } : l);
        localStorage.setItem("dashboard_leads", JSON.stringify(updated));
        return;
      }

      const isLocal = typeof window !== "undefined" && 
        (window.location.hostname === "localhost" || 
         window.location.hostname === "127.0.0.1" ||
         window.location.hostname.startsWith("192.168."));
      
      const apiBase = isLocal
        ? "http://localhost:8000/api"
        : "https://ai-analytics-backend-d2t8.onrender.com/api";

      const res = await fetch(`${apiBase}/leads/${leadId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Status sync failed");
    } catch (err) {
      console.error("Failed to sync status:", err);
    }
  };

  const deleteLead = async (leadId: string) => {
    if (!confirm("Are you sure you want to permanently delete this lead record?")) return;

    // Optimistic deletion
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    if (selectedLead?.id === leadId) setSelectedLead(null);

    try {
      if (isStandaloneMode) {
        const localData = JSON.parse(localStorage.getItem("dashboard_leads") || "[]");
        const filtered = localData.filter((l: any) => l.id !== leadId);
        localStorage.setItem("dashboard_leads", JSON.stringify(filtered));
        return;
      }

      const isLocal = typeof window !== "undefined" && 
        (window.location.hostname === "localhost" || 
         window.location.hostname === "127.0.0.1" ||
         window.location.hostname.startsWith("192.168."));
      
      const apiBase = isLocal
        ? "http://localhost:8000/api"
        : "https://ai-analytics-backend-d2t8.onrender.com/api";

      const res = await fetch(`${apiBase}/leads/${leadId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");
    } catch (err) {
      console.error("Failed to delete lead:", err);
    }
  };

  const exportCSV = () => {
    if (leads.length === 0) return alert("No lead records available to export!");

    // Construct headers and rows
    const headers = ["ID", "Full Name", "Email", "Company Name", "Phone Number", "Message", "Status", "Date Captured"];
    const rows = leads.map((lead) => [
      lead.id,
      `"${lead.full_name.replace(/"/g, '""')}"`,
      lead.email,
      `"${lead.company_name.replace(/"/g, '""')}"`,
      lead.phone_number,
      `"${lead.message.replace(/"/g, '""')}"`,
      lead.status,
      lead.created_at,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute unique companies filter dropdown
  const uniqueCompanies = Array.from(new Set(leads.map((l) => l.company_name))).filter(Boolean);

  // Filter & Search Logic
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.full_name.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      lead.company_name.toLowerCase().includes(search.toLowerCase()) ||
      lead.message.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesCompany = companyFilter === "all" || lead.company_name === companyFilter;

    return matchesSearch && matchesStatus && matchesCompany;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "New":
        return "bg-blue-500/10 border-blue-500/30 text-blue-400";
      case "Contacted":
        return "bg-amber-500/10 border-amber-500/30 text-amber-400";
      case "Closed":
        return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
      default:
        return "bg-zinc-500/10 border-zinc-500/30 text-zinc-400";
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-12 lg:p-20 font-sans max-w-7xl mx-auto text-zinc-200">
      
      {/* Dynamic Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
              Leads Hub
            </h1>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
              isStandaloneMode 
                ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full inline-block ${isStandaloneMode ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
              {isStandaloneMode ? "Local Storage Mode" : "API Connected"}
            </div>
          </div>
          <p className="text-zinc-500 text-sm mt-1">
            Monitor and manage inbound "Book a Demo" and "Contact Us" leads seamlessly.
          </p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={loadLeads}
            className="glass-panel px-5 py-3 flex items-center gap-2 transition-all duration-200 hover:border-zinc-700 bg-zinc-900/40 hover:scale-105 border border-zinc-800 text-sm font-semibold text-zinc-300"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>

          <button
            onClick={exportCSV}
            className="glass-panel px-5 py-3 flex items-center gap-2 transition-all duration-200 hover:border-zinc-700 bg-blue-600 hover:bg-blue-500 hover:scale-105 text-sm font-semibold text-white border border-transparent"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </motion.header>

      {/* Metric Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">All Leads</span>
          </div>
          <p className="text-zinc-500 text-sm">Total Leads Collected</p>
          <h3 className="text-3xl font-bold text-white mt-1">{leads.length}</h3>
        </div>

        <div className="glass-panel p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
            <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">New Requests</span>
          </div>
          <p className="text-zinc-500 text-sm">Awaiting Response</p>
          <h3 className="text-3xl font-bold text-white mt-1">
            {leads.filter((l) => l.status === "New").length}
          </h3>
        </div>

        <div className="glass-panel p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Closed Deal</span>
          </div>
          <p className="text-zinc-500 text-sm">Finished Sessions</p>
          <h3 className="text-3xl font-bold text-white mt-1">
            {leads.filter((l) => l.status === "Closed").length}
          </h3>
        </div>
      </div>

      {/* Filter / Search Dashboard Area */}
      <div className="glass-panel p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-zinc-900 bg-zinc-950/20">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search leads name, company, message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-950/40 border border-zinc-800/80 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors text-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-3.5 text-zinc-500 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-500 flex-shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-400 focus:outline-none focus:border-zinc-700 transition-colors cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-400 focus:outline-none focus:border-zinc-700 transition-colors cursor-pointer"
          >
            <option value="all">All Companies</option>
            {uniqueCompanies.map((company: string) => (
              <option key={company} value={company}>{company}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-panel overflow-hidden border-zinc-900/60 shadow-xl">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="h-10 w-10 border-t-2 border-b-2 border-blue-500 rounded-full"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="text-xs uppercase text-zinc-500 border-b border-white/5 bg-zinc-950/45">
                <tr>
                  <th className="px-6 py-4 font-semibold">Contact & Company</th>
                  <th className="px-6 py-4 font-semibold">Communications</th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                  <th className="px-6 py-4 font-semibold">Registered At</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLeads.length > 0 ? (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-5">
                        <div className="font-semibold text-white text-base">{lead.full_name}</div>
                        <div className="flex items-center gap-1 text-zinc-500 text-xs mt-1">
                          <Building className="h-3 w-3" />
                          {lead.company_name}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-zinc-300 font-medium">{lead.email}</div>
                        <div className="text-zinc-500 text-xs mt-1">{lead.phone_number}</div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <select
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer focus:outline-none transition-colors ${getStatusBadge(lead.status)}`}
                        >
                          <option value="New" className="bg-[#0b0b0f] text-zinc-200">New</option>
                          <option value="Contacted" className="bg-[#0b0b0f] text-zinc-200">Contacted</option>
                          <option value="Closed" className="bg-[#0b0b0f] text-zinc-200">Closed</option>
                        </select>
                      </td>
                      <td className="px-6 py-5 text-zinc-500 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(lead.created_at).toLocaleDateString(undefined, {
                            year: 'numeric', month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => setSelectedLead(lead)}
                            className="p-2 hover:bg-zinc-800 border border-transparent hover:border-zinc-700/60 rounded-xl text-zinc-400 hover:text-white transition-colors"
                            title="Detailed View"
                          >
                            <Eye className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => deleteLead(lead.id)}
                            className="p-2 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-xl text-zinc-500 hover:text-rose-400 transition-colors"
                            title="Delete Lead"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-zinc-500">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      No leads match current queries.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed View Modal */}
      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel p-8 w-full max-w-xl border-zinc-800 shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedLead(null)}
                className="absolute top-5 right-5 p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 hover:border-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 border rounded-2xl ${getStatusBadge(selectedLead.status)}`}>
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-white">{selectedLead.full_name}</h3>
                  <div className="text-zinc-500 text-xs font-mono mt-0.5">ID: {selectedLead.id}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-b border-white/5 py-5 my-5 text-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Building className="h-4 w-4 text-blue-400" />
                    <span className="font-semibold text-white">{selectedLead.company_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Mail className="h-4 w-4 text-blue-400" />
                    <a href={`mailto:${selectedLead.email}`} className="hover:text-blue-400 transition-colors">{selectedLead.email}</a>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Phone className="h-4 w-4 text-blue-400" />
                    <a href={`tel:${selectedLead.phone_number}`} className="hover:text-blue-400 transition-colors">{selectedLead.phone_number}</a>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Calendar className="h-4 w-4 text-blue-400" />
                    <span>{new Date(selectedLead.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs uppercase font-extrabold text-zinc-500 tracking-wider block mb-2">
                  Demo Requirements / Custom Message
                </span>
                <div className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-5 text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed max-h-[200px] overflow-y-auto">
                  {selectedLead.message}
                </div>
              </div>

              <div className="mt-8 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Status:</span>
                  <select
                    value={selectedLead.status}
                    onChange={(e) => updateLeadStatus(selectedLead.id, e.target.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer focus:outline-none transition-colors ${getStatusBadge(selectedLead.status)}`}
                  >
                    <option value="New" className="bg-[#0b0b0f] text-zinc-200">New</option>
                    <option value="Contacted" className="bg-[#0b0b0f] text-zinc-200">Contacted</option>
                    <option value="Closed" className="bg-[#0b0b0f] text-zinc-200">Closed</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    deleteLead(selectedLead.id);
                    setSelectedLead(null);
                  }}
                  className="px-4 py-2 border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
