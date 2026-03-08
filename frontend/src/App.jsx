import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Shield, TrendingUp, AlertTriangle } from 'lucide-react';

function App() {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState({ connected: false, symbol: 'AAPL', price: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/status');
        const result = await response.json();
        setStatus(result);
      } catch (error) {
        console.error("Erro ao buscar status:", error);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100 font-sans">
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            TWS Mirror Pro
          </h1>
          <p className="text-slate-400 text-sm">Painel de Trading Institucional</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 flex items-center gap-2">
            <Activity size={16} className="text-emerald-400" />
            <span className="text-sm font-medium">Status: Operacional</span>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card de Preço e Símbolo */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-400 font-medium">Símbolo Atual</span>
            <TrendingUp size={20} className="text-blue-400" />
          </div>
          <div className="text-3xl font-bold mb-1">{status.symbol}</div>
          <div className="text-emerald-400 font-mono text-xl">$ {status.price.toFixed(2)}</div>
        </div>

        {/* Card de Gestão de Risco */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-400 font-medium">Risco Diário</span>
            <Shield size={20} className="text-emerald-400" />
          </div>
          <div className="text-3xl font-bold mb-1">Max 1%</div>
          <div className="text-slate-400 text-sm">Stop Loss Protegido</div>
        </div>

        {/* Card de Alertas */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-400 font-medium">Sinal de Estratégia</span>
            <AlertTriangle size={20} className="text-amber-400" />
          </div>
          <div className="text-3xl font-bold mb-1 italic">Aguardando</div>
          <div className="text-slate-400 text-sm">Breakout Strategy 20p</div>
        </div>

        {/* Gráfico Principal */}
        <div className="lg:col-span-3 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl h-[400px]">
          <h3 className="text-lg font-semibold mb-6">Performance Intraday</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                itemStyle={{ color: '#34d399' }}
              />
              <Line type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </main>
    </div>
  );
}

export default App;
