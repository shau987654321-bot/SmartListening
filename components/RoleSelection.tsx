import React from 'react';
import { GraduationCap, School } from 'lucide-react';
import { Role } from '../types';

interface RoleSelectionProps {
  onSelectRole: (role: Role) => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelectRole }) => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Welcome to SmartListening</h1>
        <p className="text-lg text-slate-600">Please select your role to continue</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
        <button
          onClick={() => onSelectRole('TEACHER')}
          className="group relative bg-white p-8 rounded-2xl shadow-sm border-2 border-slate-200 hover:border-indigo-500 hover:shadow-xl transition-all duration-300 text-left"
        >
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <School className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Teacher</h2>
          <p className="text-slate-500">
            Upload audio/video content, generate AI quizzes with difficulty levels, and track student performance.
          </p>
        </button>

        <button
          onClick={() => onSelectRole('STUDENT')}
          className="group relative bg-white p-8 rounded-2xl shadow-sm border-2 border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all duration-300 text-left"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <GraduationCap className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Student</h2>
          <p className="text-slate-500">
            Join quizzes using a 6-digit code, test your listening skills, and get instant feedback.
          </p>
        </button>
      </div>
    </div>
  );
};

export default RoleSelection;