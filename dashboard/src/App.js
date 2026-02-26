import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, Tooltip, ResponsiveContainer, YAxis } from 'recharts';
import SkyBackground from './components/SkyBackground';
import GlassCard from './components/GlassCard';
import StatCard from './components/StatCard';
import AlertBanner from './components/AlertBanner';
import EnergyPanel from './components/EnergyPanel';
import HistoricalTrend from './components/HistoricalTrend';
import './chatbot.css';

// Synthetic data generator for demo when hardware is not connected
function generateSyntheticMachine(t) {
  const base = { machine_id: 'M01', source: 'SYNTHETIC' };
  const temp = 68 + 12 * Math.sin(t / 15) + (Math.random() - 0.5) * 4;
  const vibration = 0.35 + 0.18 * Math.abs(Math.sin(t / 8)) + (Math.random() - 0.5) * 0.06;
  const humidity = 44 + 8 * Math.cos(t / 20) + (Math.random() - 0.5) * 2;
  const rssi = -58 + Math.round((Math.random() - 0.5) * 10);
  // Risk rises with temp+vibration stress
  const risk = Math.min(0.95, Math.max(0.02, (temp - 60) / 60 + vibration / 1.5 - 0.1 + (Math.random() - 0.5) * 0.05));
  return {
    ...base,
    temperature: parseFloat(temp.toFixed(1)),
    avg_temp: parseFloat(temp.toFixed(1)),
    vibration: parseFloat(vibration.toFixed(3)),
    avg_vibration: parseFloat(vibration.toFixed(3)),
    humidity: parseFloat(humidity.toFixed(1)),
    avg_humidity: parseFloat(humidity.toFixed(1)),
    signal_strength: rssi,
    avg_rssi: rssi,
    failure_risk: parseFloat(risk.toFixed(3)),
    timestamp: new Date().toISOString(),
    message: risk > 0.8 ? `🔴 CRITICAL: Risk ${(risk * 100).toFixed(0)}%!` :
      risk > 0.4 ? `⚠️ WARNING: Risk ${(risk * 100).toFixed(0)}%.` :
        `✅ OPTIMAL (Risk ${(risk * 100).toFixed(0)}%).`
  };
}

function App() {
  const [showHomepage, setShowHomepage] = useState(true);
  const [machines, setMachines] = useState([]);
  const [history, setHistory] = useState({});
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [showAI, setShowAI] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [energySavings, setEnergySavings] = useState(0);
  const [isSynthetic, setIsSynthetic] = useState(false);
  const [apiOnline, setApiOnline] = useState(true);
  const syntheticTick = useRef(0);

  const processData = (data, synthetic) => {
    setMachines(data);
    setIsSynthetic(synthetic);
    setHistory(prev => {
      const newHistory = { ...prev };
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      data.forEach(m => {
        const prevArr = newHistory[m.machine_id] ? [...newHistory[m.machine_id]] : [];
        prevArr.push({
          time: timestamp,
          temperature: parseFloat(m.temperature || m.avg_temp || 0).toFixed(1),
          vibration: parseFloat(m.vibration || m.avg_vibration || 0).toFixed(3),
          humidity: parseFloat(m.humidity || m.avg_humidity || 0).toFixed(1),
          rssi: parseInt(m.signal_strength || m.avg_rssi || 0),
          risk: (parseFloat(m.failure_risk) * 100).toFixed(0)
        });
        if (prevArr.length > 50) prevArr.shift();
        newHistory[m.machine_id] = prevArr;
      });
      return newHistory;
    });
    const newAlerts = data.filter(m => m.failure_risk > 0.4).map(m => ({
      id: m.machine_id, msg: m.message, risk: m.failure_risk
    }));
    setAlerts(newAlerts);
    const healthyCount = data.filter(m => m.failure_risk <= 0.4).length;
    setEnergySavings(healthyCount * 125.5);
  };

  useEffect(() => {
    if (showHomepage) return;
    const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";

    const interval = setInterval(() => {
      fetch(`${apiUrl}/machines`)
        .then(res => { setApiOnline(true); return res.json(); })
        .then(data => {
          if (data && data.length > 0) {
            processData(data, false);
          } else {
            // No real data — use synthetic
            syntheticTick.current += 1;
            processData([generateSyntheticMachine(syntheticTick.current)], true);
          }
        })
        .catch(() => {
          // API unreachable — use synthetic
          setApiOnline(false);
          syntheticTick.current += 1;
          processData([generateSyntheticMachine(syntheticTick.current)], true);
        });
    }, 2000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHomepage]);

  // Aggregate stats
  const avgTemp = machines.length > 0
    ? (machines.reduce((s, m) => s + parseFloat(m.temperature || m.avg_temp || 0), 0) / machines.length).toFixed(1)
    : '0';

  const optimalRange = machines.filter(m => m.failure_risk < 0.3).length;
  const criticalAlerts = alerts.length;

  // Custom Tooltip  
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass glass-border p-4 rounded-2xl shadow-float">
          <p className="text-xs text-slate-600 font-semibold mb-2">{payload[0]?.payload?.time || 'N/A'}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm font-medium" style={{ color: entry.stroke || entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const askAI = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { type: 'user', text: userMsg }]);
    setLoadingChat(true);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/insights/rag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMsg })
      });
      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      setChatHistory(prev => [...prev, { type: 'ai', text: data.answer || 'No response from AI' }]);
    } catch (err) {
      console.error('AI Error:', err);
      setChatHistory(prev => [...prev, { type: 'ai', text: '⚠️ AI connection failed. Please ensure API is running.' }]);
    }
    setLoadingChat(false);
  };

  if (showHomepage) {
    // Lazy load homepage only if needed
    try {
      const Homepage = require('./Homepage').default;
      return <Homepage onEnter={() => setShowHomepage(false)} />;
    } catch (e) {
      return <button onClick={() => setShowHomepage(false)}>Enter Dashboard</button>
    }
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <SkyBackground />

      <div className="relative z-10 max-w-[1600px] mx-auto px-20 py-16">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.button
            onClick={() => setShowHomepage(true)}
            whileHover={{ x: -5, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="glass glass-border px-6 py-3 rounded-full font-display font-semibold text-sm text-sky-600 shadow-float hover:shadow-float-hover transition-all flex items-center gap-2"
          >
            <span>Home</span>
          </motion.button>

          <div className="text-center flex-1">
            <h1 className="text-7xl font-display font-semibold mb-4 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Live Hardware Stream
            </h1>
            <p className="text-xl text-slate-600 font-medium">Real-Time Anomaly Detection (Isolation Forest)</p>
          </div>

          <div className="w-32"></div>
        </motion.div>

        {/* Demo mode banner */}
        {isSynthetic && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 px-6 py-3 rounded-2xl flex items-center gap-3 text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(234,88,12,0.1))', border: '1px solid rgba(249,115,22,0.3)', color: '#ea580c' }}
          >
            <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            Machine Not Connected — Displaying Synthetic Demo Data. Live hardware stream will update automatically when available.
          </motion.div>
        )}

        {/* Alert Banner */}
        {alerts.length > 0 && (
          <AlertBanner
            message={`${alerts.length} machine${alerts.length > 1 ? 's' : ''} showing critical risk. Check hardware.`}
            delay={0.2}
          />
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard label="Active Units" value={machines.length} status="success" delay={0.3} />
          <StatCard label="Avg Temp" value={avgTemp} unit="°C" status="info" delay={0.35} />
          <StatCard label="Optimal Units" value={optimalRange} delay={0.4} />
          <StatCard label="Critical Risks" value={criticalAlerts} status="danger" delay={0.45} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Machine Cards */}
          <div className="lg:col-span-2 space-y-8">
            {machines.map((machine, i) => (
              <GlassCard
                key={machine.machine_id}
                delay={0.5 + i * 0.1}
                className="p-8 cursor-pointer transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <motion.h3 className="text-2xl font-display font-semibold text-slate-900">
                      Machine {machine.machine_id}
                    </motion.h3>
                    <div className="text-xs text-slate-500 mt-1">
                      Source: {machine.source || "UNKNOWN"} <span className="mx-1">•</span>
                      {new Date(machine.timestamp).toLocaleTimeString()}
                    </div>

                    <motion.div
                      className="text-sm font-bold mt-2"
                      style={{ color: machine.failure_risk > 0.4 ? '#ef4444' : machine.failure_risk > 0.25 ? '#f59e0b' : '#10b981' }}
                    >
                      Risk Score: {(machine.failure_risk * 100).toFixed(1)}%
                    </motion.div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-400 uppercase">Signal</div>
                    <div className={`text-lg font-mono ${parseInt(machine.signal_strength || -100) > -60 ? 'text-green-600' : 'text-amber-500'}`}>
                      {machine.signal_strength || machine.avg_rssi || "N/A"} dBm
                    </div>
                  </div>
                </div>

                {/* Charts */}
                {history[machine.machine_id] && (
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    {/* Temperature */}
                    <div className="h-32">
                      <div className="text-xs uppercase tracking-wider text-slate-600 font-semibold mb-1">Temperature</div>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history[machine.machine_id]} margin={{ left: 0, right: 0 }}>
                          <YAxis hide domain={['auto', 'auto']} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="temperature" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.1} strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Vibration */}
                    <div className="h-32">
                      <div className="text-xs uppercase tracking-wider text-slate-600 font-semibold mb-1">Vibration</div>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history[machine.machine_id]} margin={{ left: 0, right: 0 }}>
                          <YAxis hide domain={['auto', 'auto']} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="vibration" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-slate-600 font-semibold mb-1">Temp</div>
                    <div className="text-2xl font-display font-medium text-slate-900">
                      {parseFloat(machine.temperature || machine.avg_temp || 0).toFixed(1)}°C
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-slate-600 font-semibold mb-1">Vibration</div>
                    <div className="text-2xl font-display font-medium text-slate-900">
                      {parseFloat(machine.vibration || machine.avg_vibration || 0).toFixed(3)}g
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-slate-600 font-semibold mb-1">Humidity</div>
                    <div className="text-2xl font-display font-medium text-slate-900">
                      {parseFloat(machine.humidity || machine.avg_humidity || 0).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}

            {machines.length === 0 && (
              <GlassCard className="p-12 text-center text-slate-500">
                <div className="animate-spin w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full mx-auto mb-4" />
                <h3 className="text-xl font-semibold">Connecting to hardware stream...</h3>
                <p className="mt-2 text-sm">Will switch to synthetic demo data shortly.</p>
              </GlassCard>
            )}

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <GlassCard className="p-6">
              <h3 className="text-xs uppercase tracking-wider text-slate-600 font-bold mb-6">Pipeline Status</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span>Data Mode</span>
                  <span className={`font-bold text-xs ${isSynthetic ? 'text-orange-500' : 'text-emerald-500'}`}>
                    {isSynthetic ? 'SYNTHETIC' : 'LIVE'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span>ML Model</span> <span className="text-emerald-500 font-bold">ONLINE</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span>API</span>
                  <span className={`font-bold text-xs ${apiOnline ? 'text-emerald-500' : 'text-red-400'}`}>
                    {apiOnline ? 'CONNECTED' : 'OFFLINE'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span>Hardware</span>
                  <span className={`font-bold text-xs ${isSynthetic ? 'text-red-400' : 'text-emerald-500'}`}>
                    {isSynthetic ? 'NOT CONNECTED' : 'LIVE'}
                  </span>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6 flex-1">
              <h3 className="text-xs uppercase tracking-wider text-slate-600 font-bold mb-4">Live Trends</h3>
              <HistoricalTrend machines={machines} history={history} />
            </GlassCard>

            <EnergyPanel value={energySavings} delay={0.8} />
          </div>
        </div>
      </div>

      {/* AI Button */}
      {!showAI && (
        <button onClick={() => setShowAI(true)} className="fixed bottom-8 right-8 bg-sky-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-50">
          💬
        </button>
      )}

      {/* Chatbot Modal - Simplified */}
      {showAI && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md h-[500px] flex flex-col overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-sky-50">
              <h3 className="font-bold">AI Assistant</h3>
              <button onClick={() => setShowAI(false)}>✕</button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {chatHistory.map((m, i) => (
                <div key={i} className={`p-3 rounded-lg max-w-[80%] ${m.type === 'user' ? 'bg-sky-100 ml-auto' : 'bg-slate-100'}`}>
                  {m.text}
                </div>
              ))}
              {loadingChat && <div className="text-slate-400 text-sm italic">Thinking...</div>}
            </div>
            <div className="p-4 border-t flex gap-2">
              <input
                className="flex-1 border rounded px-3 py-2"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && askAI()}
                placeholder="Ask about M01 status..."
              />
              <button onClick={askAI} className="bg-sky-500 text-white px-4 py-2 rounded">Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;