import React, { useState, useEffect } from 'react';
import { QuizData, QuizAttempt, UserResponse } from '../types';
import { storageService } from '../services/storageService';
import { evaluateAnswerWithAI } from '../services/geminiService';
import QuizDisplay from './QuizDisplay';
import ResultsView from './ResultsView';
import HistoryChart from './HistoryChart';
import { PlayCircle, Award, User, Search, KeyRound, Loader2 } from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const [view, setView] = useState<'join' | 'quiz' | 'results' | 'grading'>('join');
  const [studentName, setStudentName] = useState(''); // Confirmed name (logged in)
  const [nameInput, setNameInput] = useState(''); // Form input state
  const [joinCode, setJoinCode] = useState('');
  const [activeQuiz, setActiveQuiz] = useState<QuizData | null>(null);
  const [userResponses, setUserResponses] = useState<UserResponse[]>([]);
  const [myAttempts, setMyAttempts] = useState<QuizAttempt[]>([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    // Check for saved name
    const savedName = localStorage.getItem('linguaListen_studentName');
    if (savedName) {
        setStudentName(savedName);
        setNameInput(savedName);
    }
  }, []);

  useEffect(() => {
    if (studentName) {
        storageService.getStudentAttempts(studentName).then(setMyAttempts);
    }
  }, [studentName]);

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
        const cleanName = nameInput.trim();
        localStorage.setItem('linguaListen_studentName', cleanName);
        setStudentName(cleanName);
        setMyAttempts(await storageService.getStudentAttempts(cleanName));
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('linguaListen_studentName'); 
    setStudentName('');
    setNameInput('');
  };

  const handleJoinQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');

    if (joinCode.length !== 6) {
        setJoinError('Please enter a valid 6-digit code.');
        return;
    }

    const allQuizzes = await storageService.getQuizzes();
    const quiz = allQuizzes.find(q => q.accessCode === joinCode);

    if (quiz) {
        const now = new Date();
        const publishDate = new Date(quiz.publishedAt);
        
        if (now < publishDate) {
            setJoinError(`This quiz is scheduled to open on ${publishDate.toLocaleDateString()} at ${publishDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`);
            return;
        }

        setActiveQuiz(quiz);
        setView('quiz');
        setJoinCode('');
    } else {
        setJoinError('Quiz not found. Please check the code.');
    }
  };

  const handleQuizSubmit = async (answers: Record<string, string>) => {
    if (!activeQuiz) return;
    
    // Switch to grading view (loading state)
    setView('grading');
    setIsLoadingFeedback(true);

    const evaluatedResponses: UserResponse[] = [];
    let correctCount = 0;

    try {
        // Process questions in parallel for speed, but AI limits might require batching if too many.
        // For standard quizzes (5-10 questions), parallel is fine.
        const promises = activeQuiz.questions.map(async (q) => {
            const userAnswer = answers[q.id] || '';
            
            // Intelligent Grading
            const evaluation = await evaluateAnswerWithAI(
                q, 
                userAnswer, 
                activeQuiz.language,
                activeQuiz.transcript // Pass transcript as context
            );
            
            return {
                questionId: q.id,
                userAnswer,
                isCorrect: evaluation.isCorrect,
                feedback: evaluation.feedback
            } as UserResponse;
        });

        const results = await Promise.all(promises);
        
        results.forEach(r => {
            if (r.isCorrect) correctCount++;
            evaluatedResponses.push(r);
        });

        setUserResponses(evaluatedResponses);

        // Save attempt
        const newAttempt: QuizAttempt = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            quizId: activeQuiz.id,
            quizTitle: activeQuiz.quiz_title,
            studentName: studentName,
            score: correctCount,
            totalQuestions: activeQuiz.questions.length,
            language: activeQuiz.language,
            difficulty: activeQuiz.difficulty
        };
        
        await storageService.saveAttempt(newAttempt);
        setMyAttempts(prev => [newAttempt, ...prev]);
        
        setView('results');

    } catch (e) {
        console.error("Error during grading:", e);
        // Fallback or error state could be handled here
        setView('join'); // Temporarily exit if critical failure
        alert("An error occurred while grading. Please check your internet connection and try again.");
    } finally {
        setIsLoadingFeedback(false);
    }
  };

  if (!studentName) {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center max-w-md mx-auto px-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 w-full text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <User className="w-8 h-8 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Student Profile</h2>
                <p className="text-slate-500 mb-6">Enter your name to track your progress and take quizzes.</p>
                <form onSubmit={handleNameSubmit} className="space-y-4">
                    <input 
                        type="text" 
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Your Name (e.g. Ali, Sarah)"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        required
                    />
                    <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                        Continue
                    </button>
                </form>
            </div>
        </div>
    );
  }

  if (view === 'grading') {
      return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 animate-fade-in">
              <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
              <div className="text-center">
                  <h3 className="text-xl font-bold text-slate-800">Grading in progress...</h3>
                  <p className="text-slate-500 mt-2">AI is analyzing your answers against the reference.</p>
              </div>
          </div>
      );
  }

  if (view === 'quiz' && activeQuiz) {
    return (
        <div className="animate-fade-in">
            <button 
                onClick={() => setView('join')}
                className="mb-6 text-slate-500 hover:text-indigo-600 font-medium flex items-center"
            >
                ← Back to Dashboard
            </button>
            <QuizDisplay 
                quizData={activeQuiz} 
                studentName={studentName}
                onSubmit={handleQuizSubmit} 
            />
        </div>
    );
  }

  if (view === 'results' && activeQuiz) {
    return (
        <div className="animate-fade-in">
             <ResultsView 
              quizData={activeQuiz} 
              userResponses={userResponses} 
              onRetry={() => setView('join')}
              onHome={() => setView('join')}
              isLoadingFeedback={false} // Feedback is now pre-loaded
            />
        </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Welcome back, {studentName}!</h1>
                <p className="text-slate-500">You have completed {myAttempts.length} quizzes so far.</p>
            </div>
            <button onClick={handleSignOut} className="text-sm text-slate-400 hover:text-red-500">
                Sign Out
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <div className="bg-indigo-600 rounded-2xl p-8 text-white shadow-xl shadow-indigo-200">
                    <div className="flex items-center space-x-3 mb-4">
                        <KeyRound className="w-8 h-8 text-indigo-200" />
                        <h2 className="text-2xl font-bold">Join a Quiz</h2>
                    </div>
                    <p className="text-indigo-100 mb-6">Enter the 6-digit access code provided by your teacher to start a new listening comprehension quiz.</p>
                    
                    <form onSubmit={handleJoinQuiz} className="max-w-md">
                        <div className="relative">
                            <input 
                                type="text" 
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="Enter 6-digit code"
                                className="w-full pl-4 pr-32 py-4 rounded-xl text-slate-900 placeholder-slate-400 font-bold text-lg tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-400"
                            />
                            <button 
                                type="submit"
                                className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-800 hover:bg-indigo-900 text-white font-bold rounded-lg transition-colors"
                            >
                                JOIN
                            </button>
                        </div>
                        {joinError && (
                            <div className="mt-3 text-red-200 text-sm font-medium bg-red-500/20 py-1 px-3 rounded inline-block">
                                {joinError}
                            </div>
                        )}
                    </form>
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center">
                    <Award className="w-5 h-5 mr-2 text-amber-500" />
                    Your Progress
                </h2>
                <HistoryChart attempts={myAttempts} />
                
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50 font-medium text-sm text-slate-700 border-b border-slate-200">Recent Activity</div>
                    <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                        {myAttempts.map(attempt => (
                            <div key={attempt.id} className="p-4 hover:bg-slate-50">
                                <p className="font-medium text-sm text-slate-900 truncate">{attempt.quizTitle}</p>
                                <div className="flex justify-between mt-1 text-xs text-slate-500">
                                    <span>{new Date(attempt.date).toLocaleDateString()}</span>
                                    <span className={attempt.score/attempt.totalQuestions >= 0.5 ? 'text-emerald-600' : 'text-red-500'}>
                                        {attempt.score}/{attempt.totalQuestions}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {myAttempts.length === 0 && (
                            <div className="p-4 text-sm text-slate-400 text-center">No history yet.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default StudentDashboard;