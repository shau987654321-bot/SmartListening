import React from 'react';
import { QuizAttempt } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface HistoryChartProps {
  attempts: QuizAttempt[];
}

const HistoryChart: React.FC<HistoryChartProps> = ({ attempts }) => {
  if (attempts.length === 0) return null;

  // Process data for the chart - show last 5 attempts
  const data = attempts.slice(-5).map((attempt, index) => ({
    name: `Quiz ${index + 1}`,
    score: Math.round((attempt.score / attempt.totalQuestions) * 100),
    title: attempt.quizTitle,
    date: new Date(attempt.date).toLocaleDateString()
  }));

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 mb-6">Recent Performance</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#64748b' }} 
                axisLine={false} 
                tickLine={false} 
            />
            <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }} 
                axisLine={false} 
                tickLine={false} 
                domain={[0, 100]}
                unit="%"
            />
            <Tooltip 
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#4f46e5' : entry.score >= 50 ? '#818cf8' : '#cbd5e1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HistoryChart;
