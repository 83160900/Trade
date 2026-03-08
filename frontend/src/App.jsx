import React, { useState, useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { 
  Activity, Shield, TrendingUp, AlertTriangle, 
  BarChart3, LayoutDashboard, Settings, List, 
  Search, Bell, Cpu, ArrowUpRight, ArrowDownRight,
  History, PieChart
} from 'lucide-react';
import { motion } from 'framer-motion';

const ChartComponent = ({ data }) => {
  const chartContainerRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 350,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    candlestickSeries.setData(data);
    chart.timeScale().fitContent();

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
};

function App() {
  const [status, setStatus] = useState({ connected: false, symbol: 'AAPL', price: 0, change: 0, db_online: false });
  const [chartData, setChartData] = useState([]);
  const [signals, setSignals] = useState([]);
  const [insights, setInsights] = useState([]);
  const [pnl, setPnl] = useState(0);

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
      setInsights(insightsRes.insights);
      setPnl(pnlRes.pnl);
    } catch (error) {
      console.error("Erro ao sincronizar dados:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Atualiza a cada 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-200 font-sans flex overflow-hidden">
      {/* Sidebar Estilo Bloomberg/TWS */}
      <aside className="w-16 flex flex-col items-center py-6 border-r border-slate-800 bg-[#0a0f16] z-10">
        <div className="mb-10 text-blue-500">
          <Cpu size={32} weight="fill" />
        </div>
        <nav className="flex flex-col gap-8">
          <LayoutDashboard size={24} className="text-blue-500 cursor-pointer" />
          <BarChart3 size={24} className="text-slate-500 hover:text-slate-300 cursor-pointer" />
          <List size={24} className="text-slate-500 hover:text-slate-300 cursor-pointer" />
          <History size={24} className="text-slate-500 hover:text-slate-300 cursor-pointer" />
          <PieChart size={24} className="text-slate-500 hover:text-slate-300 cursor-pointer" />
        </nav>
        <div className="mt-auto">
          <Settings size={24} className="text-slate-500 hover:text-slate-300 cursor-pointer" />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-14 bg-[#0a0f16] border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-6">
            <h1 className="text-sm font-bold tracking-widest text-slate-400 uppercase">TWS Mirror <span className="text-blue-500 italic">PRO</span></h1>
            <div className="h-4 w-[1px] bg-slate-700"></div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">DATABASE:</span>
              <div className={`h-2 w-2 rounded-full ${status.db_online ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`}></div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">TWS:</span>
              <span className="text-emerald-500 font-bold">CONNECTED (7497)</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-[#1a212c] px-3 py-1 rounded border border-slate-700 flex items-center gap-2">
              <Search size={14} className="text-slate-500" />
              <input type="text" placeholder="Symbol Search..." className="bg-transparent border-none outline-none text-xs w-32" />
            </div>
            <Bell size={18} className="text-slate-500" />
            <div className="flex items-center gap-2 ml-2">
              <div className="text-right">
                <p className="text-[10px] text-slate-500 leading-none">Account</p>
                <p className="text-xs font-bold leading-none">DU674281</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 border border-slate-700"></div>
            </div>
          </div>
        </header>

        {/* Dashboard Grid Layout */}
        <div className="p-4 grid grid-cols-12 gap-4 auto-rows-max">
          
          {/* Ticker Banner */}
          <section className="col-span-12 lg:col-span-9 bg-[#0d121b] border border-slate-800 rounded-lg p-4 flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-6">
              <div>
                <h2 className="text-2xl font-black text-white">{status.symbol}</h2>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">NASDAQ · Interactive Brokers</p>
              </div>
              <div className="h-10 w-[1px] bg-slate-800"></div>
              <div>
                <p className={`text-2xl font-mono font-bold ${status.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ${status.price.toFixed(2)}
                </p>
                <div className="flex items-center gap-1 font-bold text-xs">
                  {status.change >= 0 ? <ArrowUpRight size={14} className="text-emerald-400" /> : <ArrowDownRight size={14} className="text-red-400" />}
                  <span className={status.change >= 0 ? 'text-emerald-400' : 'text-red-400'}>{status.change.toFixed(2)}%</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
               <div className="text-right border-r border-slate-800 pr-4">
                  <p className="text-[10px] text-slate-500 uppercase">Daily PnL</p>
                  <p className={`text-lg font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{(pnl * 100).toFixed(2)}%</p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase">Max Risk</p>
                  <p className="text-lg font-bold text-amber-500">1.0%</p>
               </div>
            </div>
          </section>

          {/* IA Insights Panel */}
          <section className="col-span-12 lg:col-span-3 bg-[#0d121b] border border-slate-800 rounded-lg p-4 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <Cpu size={80} />
            </div>
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <div className="h-1 w-1 bg-blue-400 animate-pulse rounded-full"></div>
              AI Analytical Engine
            </h3>
            <div className="space-y-3 relative z-10">
              {insights.map((insight, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={idx} 
                  className="text-[11px] leading-relaxed text-slate-300 border-l border-blue-500/50 pl-2 py-1 bg-blue-500/5"
                >
                  {insight}
                </motion.div>
              ))}
            </div>
          </section>

          {/* Main Chart */}
          <section className="col-span-12 lg:col-span-9 bg-[#0d121b] border border-slate-800 rounded-lg p-4 shadow-xl min-h-[450px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="flex bg-[#1a212c] rounded p-0.5 border border-slate-700">
                  {['1M', '5M', '15M', '1H', '1D'].map(t => (
                    <button key={t} className={`px-2 py-1 text-[10px] rounded ${t === '5M' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-700'}`}>{t}</button>
                  ))}
                </div>
                <div className="h-4 w-[1px] bg-slate-700"></div>
                <div className="flex items-center gap-2 text-[10px] font-bold">
                   <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                   <span className="text-slate-300 uppercase tracking-tighter">Breakout Strategy Active</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                Vol: 4.2M · VWAP: {status.price.toFixed(2)}
              </div>
            </div>
            <div className="h-[380px] w-full">
              <ChartComponent data={chartData} />
            </div>
          </section>

          {/* Order Entry */}
          <section className="col-span-12 lg:col-span-3 bg-[#0d121b] border border-slate-800 rounded-lg p-4 shadow-xl flex flex-col">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Order Entry</h3>
            <div className="space-y-4">
              <div>
                 <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Quantity</label>
                 <input type="number" defaultValue={100} className="w-full bg-[#1a212c] border border-slate-700 rounded p-2 text-sm font-bold text-white outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                 <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Order Type</label>
                    <select className="w-full bg-[#1a212c] border border-slate-700 rounded p-2 text-[10px] font-bold text-white outline-none">
                       <option>LIMIT</option>
                       <option>MARKET</option>
                       <option>STOP</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Price</label>
                    <input type="number" step="0.01" value={status.price.toFixed(2)} className="w-full bg-[#1a212c] border border-slate-700 rounded p-2 text-sm font-bold text-white outline-none" />
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-md shadow-[0_4px_12px_rgba(16,185,129,0.3)] transition-all active:scale-95 text-sm">BUY</button>
                <button className="bg-red-600 hover:bg-red-500 text-white font-black py-3 rounded-md shadow-[0_4px_12px_rgba(239,68,68,0.3)] transition-all active:scale-95 text-sm">SELL</button>
              </div>
              
              <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded">
                <div className="flex justify-between text-[10px] mb-1">
                   <span className="text-slate-500">Est. Total</span>
                   <span className="text-white font-bold">${(status.price * 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                   <span className="text-slate-500">Buying Power</span>
                   <span className="text-emerald-400 font-bold">$42,910.00</span>
                </div>
              </div>
            </div>
          </section>

          {/* Activity Monitor / Signals Table */}
          <section className="col-span-12 bg-[#0d121b] border border-slate-800 rounded-lg p-0 shadow-xl overflow-hidden">
             <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-[#111827]">
                <div className="flex gap-4">
                   <button className="text-xs font-bold text-blue-500 border-b-2 border-blue-500 pb-2">TRADE LOG</button>
                   <button className="text-xs font-bold text-slate-500 pb-2 hover:text-slate-300">OPEN ORDERS</button>
                   <button className="text-xs font-bold text-slate-500 pb-2 hover:text-slate-300">ALERTS</button>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">LAST UPDATE: {new Date().toLocaleTimeString()}</div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-[#0a0f16] text-[10px] text-slate-500 uppercase tracking-tighter">
                      <tr>
                         <th className="px-4 py-2 font-black">Time</th>
                         <th className="px-4 py-2 font-black">Symbol</th>
                         <th className="px-4 py-2 font-black">Signal</th>
                         <th className="px-4 py-2 font-black">Price</th>
                         <th className="px-4 py-2 font-black">Status</th>
                         <th className="px-4 py-2 font-black text-right">Action</th>
                      </tr>
                   </thead>
                   <tbody className="text-[11px] font-mono">
                      {signals.map((sig, i) => (
                        <tr key={i} className="border-t border-slate-800/50 hover:bg-slate-800/20">
                           <td className="px-4 py-2 text-slate-500">{sig.timestamp.split(' ')[1]}</td>
                           <td className="px-4 py-2 font-bold text-slate-200">{sig.symbol}</td>
                           <td className={`px-4 py-2 font-black ${sig.signal === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>{sig.signal}</td>
                           <td className="px-4 py-2 text-slate-300">${sig.price.toFixed(2)}</td>
                           <td className="px-4 py-2">
                              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[9px] font-bold">
                                {sig.status}
                              </span>
                           </td>
                           <td className="px-4 py-2 text-right">
                              <button className="text-blue-500 hover:underline">Details</button>
                           </td>
                        </tr>
                      ))}
                      {signals.length === 0 && (
                        <tr>
                           <td colSpan="6" className="px-4 py-8 text-center text-slate-600 italic">No activity recorded for this session.</td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </section>

        </div>
        
        {/* Market Status Bar Footer */}
        <footer className="h-6 bg-blue-600 text-white flex items-center px-4 justify-between shrink-0">
           <div className="flex items-center gap-4 text-[9px] font-bold">
              <span>NYSE: OPEN</span>
              <span>NASDAQ: OPEN</span>
              <span>FOREX: OPEN</span>
           </div>
           <div className="flex items-center gap-4 text-[9px] font-bold">
              <span className="animate-pulse">● LIVE STREAMING ON</span>
              <span>v2.4.0 PRO</span>
           </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
