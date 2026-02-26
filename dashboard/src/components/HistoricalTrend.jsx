import React from 'react';
import { motion } from 'framer-motion';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass glass-border p-4 rounded-xl shadow-float">
                <p className="text-xs text-slate-600 font-semibold mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 mb-1">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm font-medium text-slate-700">
                            {entry.name}: <span style={{ color: entry.color }} className="font-semibold">{entry.value}</span>
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const CustomLegend = ({ payload }) => {
    return (
        <div className="flex justify-center gap-6 mt-4 flex-wrap">
            {payload.map((entry, index) => (
                <motion.div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full glass glass-border"
                    whileHover={{ scale: 1.05, y: -2 }}
                >
                    <div
                        className="w-2.5 h-2.5 rounded-full shadow-lg"
                        style={{ backgroundColor: entry.color, boxShadow: `0 0 10px ${entry.color}40` }}
                    />
                    <span className="text-xs font-semibold text-slate-700">{entry.value}</span>
                </motion.div>
            ))}
        </div>
    );
};

export default function HistoricalTrend({ machines, history }) {
    // Prepare data for multi-metric visualization
    const prepareChartData = () => {
        if (!history || Object.keys(history).length === 0) return [];

        // Get the first machine's history as the base timeline
        const baseHistory = Object.values(history)[0] || [];

        return baseHistory.map((entry, idx) => {
            const dataPoint = { time: entry.time };

            // Add data for each machine
            machines.forEach((machine) => {
                const machineHistory = history[machine.machine_id];
                if (machineHistory && machineHistory[idx]) {
                    dataPoint[`temp_${machine.machine_id}`] = parseFloat(machineHistory[idx].temperature);
                    dataPoint[`risk_${machine.machine_id}`] = parseFloat(machineHistory[idx].risk);
                }
            });

            return dataPoint;
        });
    };

    const chartData = prepareChartData();

    const colors = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full"
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xs uppercase tracking-wider text-slate-600 font-bold mb-1">
                        Multi-Metric Analysis
                    </h3>
                    <p className="text-sm text-slate-500">Temperature & Risk Correlation</p>
                </div>
                <div className="flex gap-2">
                    <motion.div
                        className="px-3 py-1.5 rounded-full glass glass-border text-xs font-semibold text-emerald-600"
                        animate={{ opacity: [1, 0.7, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        Live
                    </motion.div>
                </div>
            </div>

            <div className="h-80">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                            <defs>
                                {machines.map((machine, idx) => (
                                    <linearGradient
                                        key={`gradient-${machine.machine_id}`}
                                        id={`colorRisk${machine.machine_id}`}
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop offset="5%" stopColor={colors[idx % colors.length]} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={colors[idx % colors.length]} stopOpacity={0.05} />
                                    </linearGradient>
                                ))}
                            </defs>

                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#e2e8f0"
                                vertical={false}
                            />

                            <XAxis
                                dataKey="time"
                                stroke="#94a3b8"
                                style={{ fontSize: '11px', fontWeight: 500 }}
                                tickLine={false}
                                interval="preserveStartEnd"
                            />

                            <YAxis
                                yAxisId="left"
                                stroke="#94a3b8"
                                style={{ fontSize: '11px', fontWeight: 500 }}
                                tickLine={false}
                                label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft', style: { fontSize: '11px', fill: '#64748b' } }}
                            />

                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke="#94a3b8"
                                style={{ fontSize: '11px', fontWeight: 500 }}
                                tickLine={false}
                                label={{ value: 'Risk (%)', angle: 90, position: 'insideRight', style: { fontSize: '11px', fill: '#64748b' } }}
                            />

                            <Tooltip content={<CustomTooltip />} />
                            <Legend content={<CustomLegend />} />

                            {/* Risk areas (background) */}
                            {machines.map((machine, idx) => (
                                <Area
                                    key={`risk-${machine.machine_id}`}
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey={`risk_${machine.machine_id}`}
                                    fill={`url(#colorRisk${machine.machine_id})`}
                                    stroke="none"
                                    name={`Unit ${machine.machine_id} Risk`}
                                    animationDuration={1000}
                                />
                            ))}

                            {/* Temperature lines (foreground) */}
                            {machines.map((machine, idx) => (
                                <Line
                                    key={`temp-${machine.machine_id}`}
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey={`temp_${machine.machine_id}`}
                                    stroke={colors[idx % colors.length]}
                                    strokeWidth={2.5}
                                    dot={false}
                                    name={`Unit ${machine.machine_id} Temp`}
                                    animationDuration={1000}
                                />
                            ))}
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                            <motion.div
                                className="w-16 h-16 mx-auto mb-4 rounded-full glass glass-border flex items-center justify-center"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                                <svg className="w-8 h-8 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </motion.div>
                            <p className="text-sm text-slate-600 font-medium">Collecting data...</p>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
