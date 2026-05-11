import React, { useState, useRef, useEffect } from 'react';
import { QuizData } from '../types';
import { CheckCircle2, Type, Play, Lock, Timer } from 'lucide-react';

interface QuizDisplayProps {
  quizData: QuizData;
  studentName: string;
  onSubmit: (answers: Record<string, string>) => void;
}

const QuizDisplay: React.FC<QuizDisplayProps> = ({ quizData, studentName, onSubmit }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  // Replay logic
  const limit = quizData.replayLimit ?? 0; // 0 means unlimited
  const storageKey = `linguaListen_plays_${studentName}_${quizData.id}`;

  const [playsUsed, setPlaysUsed] = useState(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(storageKey);
        return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const audioRef = useRef<HTMLAudioElement | HTMLVideoElement>(null);

  // Timer logic
  const timeLimitMinutes = quizData.timeLimit ?? 0;
  const [timeLeft, setTimeLeft] = useState<number | null>(timeLimitMinutes > 0 ? timeLimitMinutes * 60 : null);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const timerId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
            clearInterval(timerId);
            handleAutoSubmit();
            return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  const handleAutoSubmit = () => {
     if (!hasSubmittedRef.current) {
        hasSubmittedRef.current = true;
        // Need to submit current answers
        onSubmit(answers);
     }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    if (!hasSubmittedRef.current) {
        hasSubmittedRef.current = true;
        onSubmit(answers);
    }
  };

  const handleMediaEnded = () => {
      setIsPlaying(false);
      // Increment plays used when media finishes
      if (limit > 0) {
          const newCount = playsUsed + 1;
          setPlaysUsed(newCount);
          localStorage.setItem(storageKey, newCount.toString());
          setShowPlayer(false); // Hide player to force user to click "Play" again (which checks limit)
      }
  };

  const startPlayback = () => {
      if (limit > 0 && playsUsed >= limit) return;
      setShowPlayer(true);
      setTimeout(() => {
          if(audioRef.current) {
              audioRef.current.play().then(() => {
                  setIsPlaying(true);
              }).catch(e => console.error("Playback failed", e));
          }
      }, 100);
  };

  const isUnlimited = limit === 0;
  const attemptsLeft = limit - playsUsed;
  const canPlay = isUnlimited || attemptsLeft > 0;

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Sticky Header with Timer */}
      {timeLeft !== null && (
          <div className="sticky top-4 z-20 flex justify-end">
             <div className={`
                 flex items-center space-x-2 px-4 py-2 rounded-full shadow-lg font-mono font-bold text-lg
                 ${timeLeft < 60 ? 'bg-red-100 text-red-600 border border-red-200 animate-pulse' : 'bg-white text-slate-800 border border-slate-200'}
             `}>
                 <Timer className="w-5 h-5" />
                 <span>{formatTime(timeLeft)}</span>
             </div>
          </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="mb-6">
          <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold tracking-wide mb-2 uppercase">
            {quizData.language}
          </span>
          <h2 className="text-2xl font-bold text-slate-900">{quizData.quiz_title}</h2>
          <p className="text-slate-500 text-sm mt-1">{quizData.questions.length} Questions</p>
        </div>

        {/* Media Player Section */}
        <div className="bg-slate-900 rounded-xl overflow-hidden relative min-h-[120px] flex items-center justify-center">
            {showPlayer ? (
                <div className="w-full p-4">
                     {quizData.mediaType?.startsWith('video') ? (
                        <video 
                            ref={audioRef as React.RefObject<HTMLVideoElement>}
                            src={quizData.mediaData}
                            controls
                            className="w-full rounded"
                            onEnded={handleMediaEnded}
                            controlsList={limit > 0 ? "nodownload" : ""}
                        />
                     ) : (
                        <audio 
                            ref={audioRef as React.RefObject<HTMLAudioElement>}
                            src={quizData.mediaData}
                            controls
                            className="w-full"
                            onEnded={handleMediaEnded}
                            controlsList={limit > 0 ? "nodownload" : ""}
                        />
                     )}
                     {!isUnlimited && (
                         <div className="text-center mt-2 text-xs text-slate-400">
                             Playing... (Do not reload page)
                         </div>
                     )}
                </div>
            ) : (
                <div className="text-center p-6 w-full">
                    {canPlay ? (
                        <div className="space-y-3">
                            <button 
                                onClick={startPlayback}
                                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105 transition-all shadow-lg shadow-indigo-900/50"
                            >
                                <Play className="w-8 h-8 ml-1" />
                            </button>
                            <div>
                                <h3 className="text-white font-medium">Click to Start Audio</h3>
                                {!isUnlimited && (
                                    <p className="text-indigo-200 text-sm mt-1">
                                        {attemptsLeft} {attemptsLeft === 1 ? 'play' : 'plays'} remaining
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3 opacity-75">
                             <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-700 text-slate-400">
                                <Lock className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-slate-300 font-medium">Playback Limit Reached</h3>
                                <p className="text-slate-500 text-sm mt-1">You can no longer listen to the audio.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>

      <div className="space-y-6">
        {quizData.questions.map((q, index) => (
          <div key={q.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 transition-all hover:shadow-md">
            <div className="flex items-start space-x-3 mb-4">
              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-sm">
                {index + 1}
              </span>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-slate-900">{q.prompt}</h3>
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{q.type}</span>
              </div>
            </div>

            <div className="pl-11">
              {q.type === 'Multiple Choice' || q.type === 'True/False' ? (
                <div className="space-y-3">
                  {(q.options && q.options.length > 0 ? q.options : (q.type === 'True/False' ? ['True', 'False'] : [])).map((option) => (
                    <label
                      key={option}
                      className={`
                        flex items-center p-3 rounded-lg border cursor-pointer transition-all
                        ${answers[q.id] === option 
                          ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' 
                          : 'border-slate-200 hover:bg-slate-50'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={option}
                        checked={answers[q.id] === option}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center flex-shrink-0 ${answers[q.id] === option ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'}`}>
                        {answers[q.id] === option && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className={`${answers[q.id] === option ? 'text-indigo-900 font-medium' : 'text-slate-700'}`}>
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Type className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Type your answer here..."
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:placeholder-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-shadow"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSubmit}
          disabled={Object.keys(answers).length === 0}
          className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-200"
        >
          Submit Quiz
        </button>
      </div>
    </div>
  );
};

export default QuizDisplay;