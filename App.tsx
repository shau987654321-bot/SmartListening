import React, { useState } from 'react';
import RoleSelection from './components/RoleSelection';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import { Role } from './types';
import { Brain, LogOut } from 'lucide-react';

const App: React.FC = () => {
  const [role, setRole] = useState<Role | null>(null);

  const handleRoleSelect = (selectedRole: Role) => {
    setRole(selectedRole);
  };

  const handleLogout = () => {
    setRole(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setRole(null)}>
            <div className="bg-indigo-600 p-2 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              SmartListening
            </span>
          </div>
          
          {role && (
            <div className="flex items-center space-x-4">
                <span className="text-sm font-medium px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                    {role === 'TEACHER' ? 'Teacher Mode' : 'Student Mode'}
                </span>
                <button 
                  onClick={handleLogout}
                  className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Exit
                </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {!role && <RoleSelection onSelectRole={handleRoleSelect} />}
        {role === 'TEACHER' && <TeacherDashboard />}
        {role === 'STUDENT' && <StudentDashboard />}
      </main>
    </div>
  );
};

export default App;