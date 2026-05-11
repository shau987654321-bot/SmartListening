import React, { useState, useEffect } from 'react';
import FileUpload from './FileUpload';
import { QuizData, QuizAttempt, Difficulty, Question, QuestionType } from '../types';
import { storageService } from '../services/storageService';
import { generateQuizFromMedia } from '../services/geminiService';
import { Loader2, Plus, LayoutList, Trash2, Users, Copy, Check, Calendar, Clock, XCircle } from 'lucide-react';

const TeacherDashboard: React.FC = () => {
  const [view, setView] = useState<'create' | 'list' | 'reports'>('list');
  const [quizzes, setQuizzes] = useState<QuizData[]>([]);
  const [allAttempts, setAllAttempts] = useState<QuizAttempt[]>([]);
  
  // Shared Quiz Settings
  const [language, setLanguage] = useState<string>('English');
  const [difficulty, setDifficulty] = useState<Difficulty>('Intermediate');
  const [replayLimit, setReplayLimit] = useState<number>(2); 
  const [timeLimit, setTimeLimit] = useState<number>(10); // Default 10 mins
  const [publishMode, setPublishMode] = useState<'now' | 'later'>('now');
  const [scheduleDate, setScheduleDate] = useState('');

  // AI Generation State
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [generatedQuiz, setGeneratedQuiz] = useState<QuizData | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setQuizzes(await storageService.getQuizzes());
    setAllAttempts(await storageService.getAttempts());
  };

  // --- AI Handlers ---

  const handleAIFileSelect = async (file: File) => {
    setLoading(true);
    setLoadingMessage(`Processing media for ${difficulty} level...`);
    
    const steps = ['Uploading media...', 'Transcribing audio...', 'Analyzing language...', 'Creating questions...'];
    let stepIdx = 0;
    const interval = setInterval(() => {
        if(stepIdx < steps.length) {
            setLoadingMessage(steps[stepIdx]);
            stepIdx++;
        }
    }, 2000);

    try {
      const quiz = await generateQuizFromMedia(file, difficulty, replayLimit, questionCount, timeLimit, language);
      clearInterval(interval);
      setGeneratedQuiz(quiz);
      setPublishMode('now');
      setScheduleDate('');
    } catch (error) {
      clearInterval(interval);
      console.error(error);
      alert('Error generating quiz. Please try again. Note: Large files may exceed browser storage limits.');
    } finally {
      setLoading(false);
    }
  };

  const discardQuiz = () => {
      if(window.confirm('Are you sure you want to discard this quiz?')) {
          setGeneratedQuiz(null);
      }
  };

  const saveAIQuiz = async () => {
    if (generatedQuiz) {
      if (publishMode === 'later' && !scheduleDate) {
          alert('Please select a date and time to publish the quiz.');
          return;
      }
      try {
          const finalQuiz = {
              ...generatedQuiz,
              publishedAt: publishMode === 'now' ? new Date().toISOString() : new Date(scheduleDate).toISOString()
          };
          await storageService.saveQuiz(finalQuiz);
          await loadData();
          setGeneratedQuiz(null);
          setView('list');
          alert(publishMode === 'now' ? 'Quiz published successfully!' : 'Quiz scheduled successfully!');
      } catch (e: any) {
          console.error("Save error:", e);
          if (e?.name === 'QuotaExceededError' || e?.message?.includes('quota') || e?.message?.includes('storage')) {
             alert('Failed to save quiz: Device storage limit reached. Please delete old quizzes or try clearing your browser cache/storage.');
          } else {
             alert('Failed to save quiz. Error: ' + (e?.message || 'Unknown error.'));
          }
      }
    }
  };

  const deleteQuiz = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete the quiz "${title}"? This action cannot be undone.`)) {
      await storageService.deleteQuiz(id);
      setQuizzes(prev => prev.filter(q => q.id !== id));
    }
  };

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isScheduled = (quiz: QuizData) => {
      return new Date(quiz.publishedAt) > new Date();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Teacher Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage content and view student progress</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${view === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            My Quizzes
          </button>
          <button
            onClick={() => setView('reports')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${view === 'reports' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Student Reports
          </button>
          <button
            onClick={() => { setView('create'); setGeneratedQuiz(null); }}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Quiz
          </button>
        </div>
      </div>

      {view === 'create' && (
        <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
           
           {loading && (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
              <p className="text-lg font-medium text-slate-700">{loadingMessage}</p>
            </div>
           )}

           {/* AI Mode Form */}
           {!generatedQuiz && !loading && (
            <div className="max-w-xl mx-auto space-y-8 animate-fade-in">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-800">Generate with AI</h2>
                <p className="text-slate-500 mt-2">Upload media and let AI create the questions.</p>
              </div>

              <div className="space-y-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Language</label>
                        <select 
                            value={language} 
                            onChange={(e) => setLanguage(e.target.value)} 
                            className="w-full p-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="English">English</option>
                            <option value="Chinese">Chinese</option>
                            <option value="Bahasa Melayu">Bahasa Melayu</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Difficulty</label>
                    <div className="flex flex-wrap gap-2">
                        {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                            <button
                                key={level}
                                onClick={() => setDifficulty(level as Difficulty)}
                                className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium border-2 transition-all ${
                                    difficulty === level 
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300'
                                }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Questions</label>
                         <select value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} className="w-full p-2 border rounded-md">
                            {[3, 5, 8, 10, 12].map(c => <option key={c} value={c}>{c}</option>)}
                         </select>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Time Limit (mins)</label>
                         <div className="relative">
                            <input 
                                type="number" 
                                min="0" 
                                max="120"
                                value={timeLimit} 
                                onChange={(e) => setTimeLimit(Number(e.target.value))}
                                className="w-full p-2 border border-slate-300 rounded-md pr-12"
                            />
                            <span className="absolute right-3 top-2 text-sm text-slate-400">min</span>
                         </div>
                         <p className="text-xs text-slate-400 mt-1">0 to 120 minutes (0 = Unlimited)</p>
                    </div>
                </div>

                <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Replay Limit</label>
                     <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 5, 0].map((limit) => (
                            <button
                                key={limit}
                                onClick={() => setReplayLimit(limit)}
                                className={`py-1 px-2 rounded text-sm font-medium border ${
                                    replayLimit === limit 
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                                    : 'border-slate-200 bg-white'
                                }`}
                            >
                                {limit === 0 ? '∞' : limit}
                            </button>
                        ))}
                     </div>
                </div>
              </div>

              <FileUpload onFileSelect={handleAIFileSelect} />
            </div>
           )}

           {/* Quiz Review UI (For AI Generated Mode) */}
           {generatedQuiz && (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-6 flex flex-col items-start gap-4">
                <div className="w-full flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-emerald-800 text-lg">Quiz Generated Successfully!</h3>
                        <p className="text-emerald-600 text-sm">Review the questions below and set publication options.</p>
                    </div>
                    <button 
                        onClick={discardQuiz}
                        className="text-emerald-600 hover:text-red-600 text-sm font-medium flex items-center transition-colors"
                        title="Discard this quiz"
                    >
                        <XCircle className="w-4 h-4 mr-1" /> Discard
                    </button>
                </div>
                
                <div className="w-full flex flex-col lg:flex-row gap-4 items-center justify-between border-t border-emerald-200 pt-4 mt-2">
                    <div className="flex flex-col sm:flex-row gap-3 items-center w-full lg:w-auto">
                        <div className="flex bg-white rounded-lg p-1 border border-emerald-200">
                            <button
                                onClick={() => setPublishMode('now')}
                                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                                    publishMode === 'now' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:bg-slate-50'
                                }`}
                            >
                                Publish Now
                            </button>
                            <button
                                onClick={() => setPublishMode('later')}
                                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                                    publishMode === 'later' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500 hover:bg-slate-50'
                                }`}
                            >
                                Schedule
                            </button>
                        </div>
                        
                        {publishMode === 'later' && (
                            <input 
                                type="datetime-local"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                min={new Date().toISOString().slice(0, 16)}
                                className="px-3 py-2 border border-emerald-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        )}
                    </div>

                    <button
                        onClick={saveAIQuiz}
                        className="w-full lg:w-auto px-8 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold shadow-sm transition-colors whitespace-nowrap"
                    >
                        {publishMode === 'now' ? 'Publish Quiz' : 'Save Schedule'}
                    </button>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 mb-1">{generatedQuiz.quiz_title}</h2>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-xs font-bold uppercase">{generatedQuiz.difficulty}</span>
                            <span>•</span>
                            <span>{generatedQuiz.language}</span>
                            <span>•</span>
                            <span>{generatedQuiz.questions.length} Questions</span>
                        </div>
                    </div>
                 </div>
                 
                 <div className="space-y-4">
                    {generatedQuiz.questions.map((q, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200">
                            <div className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                <div>
                                    <p className="font-medium text-slate-800">{q.prompt}</p>
                                    <p className="text-xs text-slate-400 mt-1 uppercase">{q.type}</p>
                                    <p className="text-sm text-slate-600 mt-2"><span className="font-medium text-slate-500">Answer:</span> {q.correct_answer}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                 </div>
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'list' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {quizzes.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-white rounded-xl border border-dashed border-slate-300">
                    <LayoutList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No quizzes yet</h3>
                    <p className="text-slate-500">Create your first quiz to get started.</p>
                </div>
            ) : (
                quizzes.map(quiz => {
                    const scheduled = isScheduled(quiz);
                    return (
                        <div key={quiz.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex gap-2">
                                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded uppercase">{quiz.language}</span>
                                    {scheduled ? (
                                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded uppercase flex items-center">
                                            <Clock className="w-3 h-3 mr-1" /> Scheduled
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded uppercase flex items-center">
                                            <Check className="w-3 h-3 mr-1" /> Live
                                        </span>
                                    )}
                                </div>
                                <button 
                                    onClick={(e) => { 
                                        e.preventDefault();
                                        e.stopPropagation(); 
                                        deleteQuiz(quiz.id, quiz.quiz_title); 
                                    }}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors relative z-10"
                                    title="Delete Quiz"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2 truncate">{quiz.quiz_title}</h3>
                            <p className="text-sm text-slate-500 mb-4 flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {scheduled 
                                    ? `Available: ${new Date(quiz.publishedAt).toLocaleDateString()} ${new Date(quiz.publishedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                                    : `Published: ${new Date(quiz.createdDate).toLocaleDateString()}`
                                }
                            </p>
                            
                            <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between group">
                                <div>
                                    <span className="text-xs text-slate-400 uppercase font-bold block">Class Code</span>
                                    <span className="text-lg font-mono font-bold text-slate-800 tracking-wider">{quiz.accessCode}</span>
                                </div>
                                <button 
                                    onClick={() => copyToClipboard(quiz.accessCode, quiz.id)}
                                    className="p-2 hover:bg-white rounded-md text-slate-400 hover:text-indigo-600 transition-colors"
                                    title="Copy Code"
                                >
                                    {copiedId === quiz.id ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                                </button>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center text-sm text-slate-500">
                                    <Users className="w-4 h-4 mr-2" />
                                    {allAttempts.filter(a => a.quizId === quiz.id).length} Attempts
                                </div>
                                <div className="flex flex-col items-end text-xs text-slate-400">
                                    <span>Replay Limit: {quiz.replayLimit === 0 || quiz.replayLimit === undefined ? '∞' : quiz.replayLimit}</span>
                                    <span>Time: {quiz.timeLimit ? `${quiz.timeLimit}m` : '∞'}</span>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      )}

      {view === 'reports' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Recent Student Attempts</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-900 font-semibold">
                        <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">Student</th>
                            <th className="p-4">Quiz Title</th>
                            <th className="p-4">Level</th>
                            <th className="p-4">Score</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {allAttempts.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-400">No student attempts recorded yet.</td>
                            </tr>
                        ) : (
                            allAttempts.map(attempt => (
                                <tr key={attempt.id} className="hover:bg-slate-50">
                                    <td className="p-4">{new Date(attempt.date).toLocaleDateString()}</td>
                                    <td className="p-4 font-medium text-slate-900">{attempt.studentName}</td>
                                    <td className="p-4">
                                        <div>{attempt.quizTitle}</div>
                                        <div className="text-xs text-slate-400 mt-0.5">{attempt.language}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600 font-medium">{attempt.difficulty || 'N/A'}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                                            (attempt.score / attempt.totalQuestions) >= 0.8 ? 'bg-green-100 text-green-700' :
                                            (attempt.score / attempt.totalQuestions) >= 0.5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {Math.round((attempt.score / attempt.totalQuestions) * 100)}%
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;