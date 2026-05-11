import React from 'react';
import { QuizData, UserResponse, Question } from '../types';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, BarChart } from 'lucide-react';

interface ResultsViewProps {
  quizData: QuizData;
  userResponses: UserResponse[];
  onRetry: () => void;
  onHome: () => void;
  isLoadingFeedback: boolean;
}

const ResultsView: React.FC<ResultsViewProps> = ({ quizData, userResponses, onRetry, onHome, isLoadingFeedback }) => {
  const correctCount = userResponses.filter(r => r.isCorrect).length;
  const totalCount = quizData.questions.length;
  const percentage = Math.round((correctCount / totalCount) * 100);

  const getQuestionById = (id: string): Question | undefined => quizData.questions.find(q => q.id === id);

  return (
    <div className="max-w-3xl mx-auto pb-12">
      {/* Score Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="bg-slate-900 p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
          <p className="text-slate-300 mb-6">Here is how you performed on "{quizData.quiz_title}"</p>
          
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 border-indigo-500 bg-slate-800 shadow-xl">
            <div className="text-center">
              <span className="block text-3xl font-bold text-white">{percentage}%</span>
              <span className="block text-xs text-slate-400 uppercase tracking-wide">Score</span>
            </div>
          </div>
          <div className="mt-4 text-slate-300 font-medium">
            {correctCount} out of {totalCount} correct
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-800 px-2">Detailed Feedback</h3>
        
        {isLoadingFeedback && (
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-700 animate-pulse">
                <span>Generating linguistic feedback for your answers...</span>
            </div>
        )}

        {userResponses.map((response) => {
          const question = getQuestionById(response.questionId);
          if (!question) return null;

          return (
            <div 
              key={response.questionId} 
              className={`rounded-xl border p-6 bg-white shadow-sm ${response.isCorrect ? 'border-green-200' : 'border-red-200'}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {response.isCorrect ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900 text-lg mb-2">{question.prompt}</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="block text-xs text-slate-500 uppercase mb-1">Your Answer</span>
                      <span className={`font-medium ${response.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                        {response.userAnswer || '(No answer provided)'}
                      </span>
                    </div>
                    {!response.isCorrect && (
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                         <span className="block text-xs text-slate-500 uppercase mb-1">Correct Answer</span>
                         <span className="font-medium text-slate-900">{question.correct_answer}</span>
                      </div>
                    )}
                  </div>

                  {/* Transcript Reference */}
                  {question.transcript_reference && (
                     <div className="mt-2 text-xs text-slate-500 italic border-l-2 border-slate-200 pl-3">
                        Reference: "{question.transcript_reference}"
                     </div>
                  )}

                  {/* AI Feedback */}
                  {response.feedback && !response.isCorrect && (
                    <div className="mt-4 flex items-start gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                        <AlertCircle className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                        <div className="text-sm text-indigo-800">
                            <span className="font-semibold block mb-1">AI Feedback:</span>
                            {response.feedback}
                        </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 flex justify-center space-x-4">
        <button 
            onClick={onHome}
            className="flex items-center px-6 py-3 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium transition-colors"
        >
            <BarChart className="w-5 h-5 mr-2" />
            Dashboard
        </button>
        <button 
            onClick={onRetry}
            className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-lg shadow-indigo-200"
        >
            <RefreshCw className="w-5 h-5 mr-2" />
            Try Another Quiz
        </button>
      </div>
    </div>
  );
};

export default ResultsView;
