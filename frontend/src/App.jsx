import React, { useState, useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { 
  Activity, Shield, TrendingUp, AlertTriangle, 
  BarChart3, LayoutDashboard, Settings, List, 
  Search, Bell, Cpu, ArrowUpRight, ArrowDownRight,
  History, PieChart, Zap, Globe, Lock, Info,
  ChevronDown, Maximize2, RefreshCw, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Componente de Gráfico Profissional (TradingView Style)
const TradingChart = ({ data, symbol }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#64748b',
        fontSize: 10,
        fontFamily: 'JetBrains Mono, Inter, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.5)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.5)' },
      },
      crosshair: {
        mode: 0,
        vertLine: { labelBackgroundColor: '#0f172a' },
        horzLine: { labelBackgroundColor: '#0f172a' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#1e293b',
      },
      rightPriceScale: {
        borderColor: '#1e293b',
      }
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
    });

    candlestickSeries.setData(data);
    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  return (
    <div className="relative w-full h-full bg-[#020617] rounded-xl border border-slate-800/50 overflow-hidden shadow-2xl">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/50">
        <span className="text-sm font-black text-white tracking-tighter">{symbol}</span>
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">LIVE</span>
      </div>
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
};

// Componente de Card de Status Mini
const StatusCard = ({ label, value, trend, icon: Icon, colorClass }) => (
  <div className="bg-slate-900/40 border border-slate-800/50 p-4 rounded-xl backdrop-blur-sm flex flex-col gap-1">
    <div className="flex justify-between items-start">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      <Icon size={14} className={colorClass || "text-slate-400"} />
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-lg font-black text-white">{value}</span>
      {trend && (
        <span className={`text-[10px] font-bold ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trend >= 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
  </div>
);

function App() {
  const [status, setStatus] = useState({ connected: false, symbol: 'AAPL', price: 0, change: 0, db_online: false });
  const [chartData, setChartData] = useState([]);
  const [signals, setSignals] = useState([]);
  const [insights, setInsights] = useState([]);
  const [pnl, setPnl] = useState(0);
  const [orderQty, setOrderQty] = useState(100);
  const [notif, setNotif] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statusRes, chartRes, signalsRes, insightsRes, pnlRes] = await Promise.all([
        fetch('/api/status').then(r => r.json()),
        fetch('/api/chart').then(r => r.json()),
        fetch('/api/signals').then(r => r.json()),
        fetch('/api/ai-insights').then(r => r.json()),
        fetch('/api/pnl').then(r => r.json())
      ]);

      setStatus(statusRes);
      setChartData(chartRes);
      setSignals(signalsRes);
      setInsights(insightsRes.insights || []);
      setPnl(pnlRes.pnl);
      setLoading(false);
    } catch (error) {
      console.error("Erro ao sincronizar dados:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleOrder = async (side) => {
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: status.symbol,
          price: status.price,
          qty: orderQty,
          signal: side
        })
      });
      const data = await res.json();
      setNotif({ type: 'success', msg: `${side} ORDER EXECUTED: ${data.message}` });
      setTimeout(() => setNotif(null), 4000);
      fetchData();
    } catch (e) {
      setNotif({ type: 'error', msg: "CRITICAL: ORDER EXECUTION FAILED" });
      setTimeout(() => setNotif(null), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-blue-500/30">
      <AnimatePresence>
        {notif && (
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`fixed top-6 right-6 z-[100] p-4 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border-l-4 ${
              notif.type === 'success' ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200' : 'bg-rose-950/90 border-rose-500 text-rose-200'
            } backdrop-blur-xl flex items-center gap-3 min-w-[300px]`}
          >
            {notif.type === 'success' ? <Zap size={18} /> : <AlertTriangle size={18} />}
            <span className="text-xs font-black tracking-tight uppercase">{notif.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar Minimalista (Bloomberg Style) */}
        <aside className="w-16 flex flex-col items-center py-6 border-r border-slate-800/60 bg-[#020617] z-50 shrink-0">
          <div className="mb-10 p-2 bg-blue-600 rounded-lg shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            <Cpu size={24} className="text-white" />
          </div>
          <nav className="flex flex-col gap-6">
            {[LayoutDashboard, BarChart3, List, History, PieChart, Globe].map((Icon, i) => (
              <button key={i} className={`p-2 rounded-lg transition-all group relative ${i === 0 ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-white'}`}>
                <Icon size={20} />
                <div className="absolute left-14 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {Icon.name}
                </div>
              </button>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-4">
            <button className="text-slate-500 hover:text-white p-2"><Lock size={20} /></button>
            <button className="text-slate-500 hover:text-white p-2"><Settings size={20} /></button>
          </div>
        </aside>

        {/* Workspace Principal */}
        <main className="flex-1 flex flex-col h-full bg-[#050b18] relative overflow-hidden">
          {/* Header Superior Denso */}
          <header className="h-14 bg-[#020617]/80 backdrop-blur-md border-b border-slate-800/60 flex items-center justify-between px-6 z-10">
            <div className="flex items-center gap-8">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-blue-500 tracking-[0.2em] uppercase leading-none mb-1">TERMINAL</span>
                <span className="text-sm font-black text-white tracking-tighter uppercase leading-none">QUANTUM-CORE <span className="text-slate-600">v2.4</span></span>
              </div>
              
              <div className="h-8 w-[1px] bg-slate-800"></div>
              
              <div className="flex gap-6">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-500 uppercase">System Status</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${status.db_online ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                    <span className="text-[10px] font-bold text-slate-300">DB: {status.db_online ? 'SYNCED' : 'OFFLINE'}</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Gateway</span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-bold text-slate-300">TWS: PORT 7497</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg items-center gap-2 group focus-within:border-blue-500 transition-all">
                <Search size={14} className="text-slate-500" />
                <input type="text" placeholder="CMD+K Search Symbol..." className="bg-transparent border-none outline-none text-[11px] w-48 font-bold text-slate-200 placeholder:text-slate-600" />
              </div>
              <div className="relative">
                <Bell size={18} className="text-slate-400 hover:text-white cursor-pointer" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-rose-500 rounded-full border-2 border-[#020617]"></span>
              </div>
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-700 flex items-center justify-center text-[10px] font-black text-white">ADMIN</div>
            </div>
          </header>

          {/* Área de Widgets Grid */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 scrollbar-hide">
            
            {/* Top Stat Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatusCard 
                label="Portfolio Value" 
                value="$142,910.42" 
                trend={2.4} 
                icon={PieChart} 
                colorClass="text-blue-400"
              />
              <StatusCard 
                label="Daily Unrealized PnL" 
                value={`$${(pnl * 1429).toFixed(2)}`} 
                trend={(pnl * 100).toFixed(1)} 
                icon={TrendingUp} 
                colorClass={pnl >= 0 ? "text-emerald-400" : "text-rose-400"}
              />
              <StatusCard 
                label="Active Exposure" 
                value={`${status.symbol} · ${orderQty}`} 
                icon={Layers} 
                colorClass="text-amber-400"
              />
              <StatusCard 
                label="Market Sentiment" 
                value="NEUTRAL / BULL" 
                icon={Shield} 
                colorClass="text-purple-400"
              />
            </div>

            {/* Main Section: Chart & Order Panel */}
            <div className="grid grid-cols-12 gap-6">
              
              {/* Left Column: Chart & Strategy */}
              <div className="col-span-12 lg:col-span-9 space-y-6">
                <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-4 shadow-2xl backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-white tracking-tight">{status.symbol}</h2>
                        <span className="text-[10px] text-slate-500 font-bold bg-slate-800 px-2 py-0.5 rounded tracking-tighter">NASDAQ</span>
                      </div>
                      <div className="h-4 w-[1px] bg-slate-800"></div>
                      <div className="flex flex-col">
                        <span className={`text-lg font-mono font-black ${status.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ${status.price.toFixed(2)}
                        </span>
                        <span className={`text-[10px] font-bold flex items-center gap-0.5 ${status.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {status.change >= 0 ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                          {status.change.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                        {['1M', '5M', '15M', '1H', 'D'].map(t => (
                          <button key={t} className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${t === '5M' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{t}</button>
                        ))}
                      </div>
                      <button className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white"><Maximize2 size={16}/></button>
                      <button className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white" onClick={fetchData}><RefreshCw size={16}/></button>
                    </div>
                  </div>

                  <div className="h-[420px] w-full">
                    {loading ? (
                      <div className="w-full h-full bg-slate-950/50 rounded-xl animate-pulse flex items-center justify-center border border-slate-800/50">
                        <div className="flex flex-col items-center gap-2">
                           <RefreshCw className="animate-spin text-blue-500" size={32} />
                           <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase">Initializing Core Engine...</span>
                        </div>
                      </div>
                    ) : (
                      <TradingChart data={chartData} symbol={status.symbol} />
                    )}
                  </div>
                </div>

                {/* AI & Market Analysis Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-[#0f172a] border border-blue-500/20 rounded-2xl p-5 relative overflow-hidden group shadow-xl">
                      <div className="absolute top-0 right-0 p-4 text-blue-500/10 group-hover:text-blue-500/20 transition-colors">
                        <Cpu size={120} />
                      </div>
                      <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-ping"></div>
                        Neural Insights Engine
                      </h3>
                      <div className="space-y-3">
                         {insights.length > 0 ? insights.slice(0, 3).map((text, i) => (
                           <div key={i} className="flex gap-3 items-start">
                              <div className="mt-1.5 h-1 w-1 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></div>
                              <p className="text-[11px] leading-relaxed text-slate-300 font-medium italic">"{text}"</p>
                           </div>
                         )) : (
                           <p className="text-[10px] text-slate-600 italic">No neural data processed for this tick.</p>
                         )}
                      </div>
                      <button className="mt-6 text-[10px] font-black text-blue-500 uppercase tracking-tighter flex items-center gap-1 hover:gap-2 transition-all">
                        View Complete Analysis <ArrowUpRight size={14} />
                      </button>
                   </div>

                   <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-5 backdrop-blur-sm">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <Globe size={14} className="text-slate-500" />
                        Market Depth Metrics
                      </h3>
                      <div className="space-y-4">
                        {[
                          { label: 'RSI (14)', val: '64.2', status: 'NEUTRAL' },
                          { label: 'MACD', val: '0.42', status: 'BULLISH' },
                          { label: 'ADX', val: '24.1', status: 'WEAK TREND' }
                        ].map((m, i) => (
                          <div key={i} className="flex items-center justify-between">
                             <span className="text-[11px] font-bold text-slate-500">{m.label}</span>
                             <div className="flex items-center gap-4">
                                <span className="text-[11px] font-black text-white font-mono">{m.val}</span>
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${m.status.includes('BULL') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                  {m.status}
                                </span>
                             </div>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
              </div>

              {/* Right Column: Order Entry & Watchlist */}
              <div className="col-span-12 lg:col-span-3 space-y-6">
                {/* Order Entry Card */}
                <div className="bg-[#020617] border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl -mr-10 -mt-10 rounded-full"></div>
                  <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                    Order Entry
                    <Info size={14} className="text-slate-600" />
                  </h3>
                  
                  <div className="space-y-5">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Execution Quantity</label>
                       <div className="relative group">
                          <input 
                            type="number" 
                            value={orderQty} 
                            onChange={(e) => setOrderQty(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm font-black text-white outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all" 
                          />
                          <span className="absolute right-3 top-3 text-[10px] font-black text-slate-600 group-focus-within:text-blue-500">SHARES</span>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Order Type</label>
                          <select className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-[10px] font-black text-white outline-none cursor-pointer">
                             <option>MARKET</option>
                             <option>LIMIT</option>
                             <option>STOP-LIMIT</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">TIF</label>
                          <select className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-[10px] font-black text-white outline-none cursor-pointer">
                             <option>DAY</option>
                             <option>GTC</option>
                          </select>
                       </div>
                    </div>

                    <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800/50 space-y-2">
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-500">Buying Power</span>
                          <span className="text-[10px] font-black text-white">$14,291.00</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-500">Margin Est.</span>
                          <span className="text-[10px] font-black text-amber-500">$7,145.50</span>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 pt-2">
                      <button 
                        onClick={() => handleOrder('BUY')}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl shadow-[0_10px_20px_-5px_rgba(16,185,129,0.4)] transition-all active:scale-95 text-xs flex items-center justify-center gap-2 group"
                      >
                        <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        PLACE BUY ORDER
                      </button>
                      <button 
                        onClick={() => handleOrder('SELL')}
                        className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-4 rounded-xl shadow-[0_10px_20px_-5px_rgba(244,63,94,0.4)] transition-all active:scale-95 text-xs flex items-center justify-center gap-2 group"
                      >
                        <ArrowDownRight size={16} className="group-hover:-translate-x-0.5 group-hover:translate-y-0.5 transition-transform" />
                        PLACE SELL ORDER
                      </button>
                    </div>
                  </div>
                </div>

                {/* Account Summary Mini */}
                <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-5 backdrop-blur-sm">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                    Risk Assessment
                    <Shield size={14} className="text-emerald-500" />
                  </h3>
                  <div className="space-y-4">
                     <div>
                        <div className="flex justify-between text-[10px] font-bold mb-1.5">
                           <span className="text-slate-500 uppercase">Margin Usage</span>
                           <span className="text-white">42%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                           <div className="h-full bg-blue-500 w-[42%]" />
                        </div>
                     </div>
                     <div className="pt-2">
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-2 text-center underline underline-offset-4 decoration-slate-800">Operational Log</span>
                        <div className="text-[9px] font-mono text-slate-500 space-y-1">
                           <p className="flex justify-between"><span>[14:22:01]</span> <span className="text-emerald-500/80 underline decoration-dotted">DB CONNECTED</span></p>
                           <p className="flex justify-between"><span>[14:22:05]</span> <span className="text-blue-500/80">API TICK FETCHED</span></p>
                           <p className="flex justify-between"><span>[14:22:12]</span> <span className="text-slate-400">WAITING SIGNAL...</span></p>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Activity Log */}
            <section className="bg-slate-950/50 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
               <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
                  <div className="flex gap-8">
                    {['Activity Monitor', 'Open Orders', 'Alert History'].map((tab, i) => (
                      <button key={tab} className={`text-[10px] font-black uppercase tracking-widest pb-1 transition-all ${i === 0 ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div className="text-[9px] font-black text-slate-600 font-mono flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></div>
                    REAL-TIME SYNC ACTIVE: {new Date().toLocaleTimeString()}
                  </div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-[#020617] text-[10px] text-slate-500 uppercase tracking-widest">
                        <tr>
                           <th className="px-6 py-4 font-black">Timestamp</th>
                           <th className="px-6 py-4 font-black">Instrument</th>
                           <th className="px-6 py-4 font-black">Type</th>
                           <th className="px-6 py-4 font-black text-center">Qty</th>
                           <th className="px-6 py-4 font-black">Price</th>
                           <th className="px-6 py-4 font-black">Execution Status</th>
                           <th className="px-6 py-4 font-black text-right">Details</th>
                        </tr>
                     </thead>
                     <tbody className="text-[11px] font-mono border-t border-slate-900">
                        {signals.map((sig, i) => (
                          <motion.tr 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={i} 
                            className="border-b border-slate-900/50 hover:bg-slate-800/20 transition-colors group"
                          >
                             <td className="px-6 py-3.5 text-slate-500">{sig.timestamp.split(' ')[1]}</td>
                             <td className="px-6 py-3.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-white">{sig.symbol}</span>
                                  <span className="text-[9px] bg-slate-800 px-1 rounded text-slate-500">EQ</span>
                                </div>
                             </td>
                             <td className="px-6 py-3.5">
                                <span className={`px-2 py-0.5 rounded-md font-black text-[9px] tracking-tighter ${sig.signal === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                  {sig.signal}
                                </span>
                             </td>
                             <td className="px-6 py-3.5 text-center font-bold text-slate-300">{orderQty}</td>
                             <td className="px-6 py-3.5 text-slate-300 font-bold">${sig.price.toFixed(2)}</td>
                             <td className="px-6 py-3.5">
                                <div className="flex items-center gap-2">
                                   <div className={`h-1.5 w-1.5 rounded-full ${sig.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'}`}></div>
                                   <span className="text-[10px] font-black text-slate-400 uppercase">{sig.status}</span>
                                </div>
                             </td>
                             <td className="px-6 py-3.5 text-right">
                                <button className="text-[10px] font-black text-slate-600 hover:text-blue-500 transition-colors bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">INSPECT</button>
                             </td>
                          </motion.tr>
                        ))}
                        {signals.length === 0 && (
                          <tr>
                             <td colSpan="7" className="px-6 py-12 text-center">
                                <div className="flex flex-col items-center gap-2 opacity-20">
                                   <Activity size={48} className="text-slate-400" />
                                   <span className="text-xs font-black tracking-widest text-slate-500 uppercase">No execution data available in current memory buffer</span>
                                </div>
                             </td>
                          </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </section>
          </div>
          
          {/* Barra de Status Inferior (Bloomberg Style) */}
          <footer className="h-7 bg-blue-600 text-white flex items-center px-4 justify-between shrink-0 z-10 shadow-[0_-4px_20px_rgba(37,99,235,0.2)]">
             <div className="flex items-center gap-6 text-[10px] font-black tracking-tighter">
                <div className="flex items-center gap-1.5">
                   <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
                   <span>LIVE MARKET CONNECTED</span>
                </div>
                <div className="h-3 w-[1px] bg-blue-400/50"></div>
                <div className="flex gap-4 uppercase">
                   <span className="flex items-center gap-1"><Globe size={10}/> NASDAQ: OPEN</span>
                   <span className="flex items-center gap-1"><Globe size={10}/> NYSE: OPEN</span>
                   <span className="text-blue-100">VOL: 24.1M</span>
                </div>
             </div>
             <div className="flex items-center gap-4 text-[10px] font-black tracking-widest">
                <span className="text-blue-100 italic">PRO_QUANT_TERMINAL_V2</span>
                <div className="h-3 w-[1px] bg-blue-400/50"></div>
                <span>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</span>
             </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default App;
