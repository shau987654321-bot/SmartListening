import { GoogleGenAI, Type } from "@google/genai";
import { QuizData, UserResponse, Question, Difficulty } from "../types";

const GEMINI_API_KEY = import.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Helper to convert file to Base64 for Gemini (without data prefix)
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper to get full Data URL for storage/playback
export const fileToDataURL = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const generateAccessCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateQuizFromMedia = async (
    file: File, 
    difficulty: Difficulty, 
    replayLimit: number,
    questionCount: number,
    timeLimit: number,
    targetLanguage: string
): Promise<QuizData> => {
  const model = 'gemini-flash-latest'; // Using Flash for speed and multimodal capabilities

  let mediaPart: any;
  if (file.size > 19 * 1024 * 1024) {
      console.log("File is > 19MB, using Resumable Upload to Gemini File API...");
      
      // Step 1: Initialize Resumable Upload
      const initUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_API_KEY}`;
      const initRes = await fetch(initUrl, {
          method: 'POST',
          headers: {
              'X-Goog-Upload-Protocol': 'resumable',
              'X-Goog-Upload-Command': 'start',
              'X-Goog-Upload-Header-Content-Length': file.size.toString(),
              'X-Goog-Upload-Header-Content-Type': file.type,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ file: { displayName: file.name } })
      });
      
      if (!initRes.ok) {
          throw new Error(`Failed to initialize upload: ${initRes.statusText}`);
      }
      
      const uploadUrl = initRes.headers.get("x-goog-upload-url");
      if (!uploadUrl) {
          throw new Error("Missing upload URL from Gemini API.");
      }

      // Step 2: Upload actual bytes
      const uploadRes = await fetch(uploadUrl, {
         method: 'POST',
         headers: {
            'X-Goog-Upload-Command': 'upload, finalize',
            'X-Goog-Upload-Offset': '0',
            'Content-Type': 'application/octet-stream'
         },
         body: file
      });

      const data = await uploadRes.json();
      if (!uploadRes.ok) {
          throw new Error(`Failed to upload file bytes: ${data.error?.message || uploadRes.statusText}`);
      }
      
      mediaPart = {
          fileData: {
              fileUri: data.file.uri,
              mimeType: data.file.mimeType
          }
      };
      
      console.log("File uploaded successfully to uri:", data.file.uri);
  } else {
      mediaPart = await fileToGenerativePart(file);
  }

  // NOTE: fileToDataURL creates a base64 string which is large for 100MB files.
  // It may cause browser memory issues, but IndexedDB theoretically supports it.
  const mediaDataUrl = await fileToDataURL(file);

  const prompt = `
    You are an expert language teacher for English, Chinese (Mandarin), and Bahasa Melayu.
    Analyze the provided audio/video file.
    
    Target Audience Level: ${difficulty}
    Target Quiz Language: ${targetLanguage}
    
    1. Transcribe the audio content accurately.
    2. Generate a listening comprehension quiz with EXACTLY ${questionCount} questions suitable for a ${difficulty} level learner. The questions, options, and correct answer MUST be in ${targetLanguage}.
       - Beginner: Simple vocabulary, slow recall, basic facts.
       - Intermediate: Inference, synonyms, main ideas.
       - Advanced: Nuance, tone, implied meaning, complex vocabulary.
    3. Questions must test comprehension, inference, and detail retention.
    4. Use a mix of "Multiple Choice", "True/False", "Fill-in-the-Blank", and "Short Answer".
    5. For "Multiple Choice", provide 3-4 options. For "True/False", YOU MUST PROVIDE EXACTLY 2 options in the \`options\` array representing True and False translated into ${targetLanguage} (e.g., ["正确", "错误"] or ["Benar", "Salah"] or ["True", "False"]).
    6. Provide the "correct_answer" for grading (it MUST exactly match one of the \`options\` if applicable).
    7. Provide a "transcript_reference" (excerpt) that supports the answer.

    Return the result in valid JSON format matching this schema:
    {
      "quiz_title": "A descriptive title",
      "language": "${targetLanguage}",
      "transcript": "Full transcription of the audio...",
      "questions": [
        {
          "id": "1",
          "type": "Multiple Choice",
          "prompt": "Question text...",
          "options": ["Option A", "Option B", "Option C"],
          "correct_answer": "Option B",
          "transcript_reference": "Relevant sentence from transcript"
        },
        {
          "id": "2",
          "type": "True/False",
          "prompt": "Another question text...",
          "options": ["True equivalent", "False equivalent"],
          "correct_answer": "True equivalent",
          "transcript_reference": "Relevant sentence from transcript"
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [mediaPart, { text: prompt }]
      },
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    const parsed = JSON.parse(text);
    const now = new Date().toISOString();
    
    // Enrich with client-side metadata
    return {
        ...parsed,
        id: crypto.randomUUID(),
        accessCode: generateAccessCode(),
        createdDate: now,
        publishedAt: now, // Default to now, can be changed before saving
        difficulty: difficulty,
        mediaData: mediaDataUrl,
        mediaType: file.type,
        replayLimit: replayLimit,
        timeLimit: timeLimit
    } as QuizData;

  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
};

/**
 * Intelligent grading using NLP/LLM logic to compare student answer vs reference.
 * Returns both the boolean result and the feedback.
 */
export const evaluateAnswerWithAI = async (
    question: Question, 
    userAnswer: string, 
    language: string,
    context?: string
): Promise<{ isCorrect: boolean; feedback: string }> => {
    // If exact match, skip AI cost (but allow case-insensitivity)
    if (userAnswer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase()) {
        return { isCorrect: true, feedback: "Excellent! Exact match." };
    }

    // For Multiple Choice / True False, we stick to strict checking
    if (question.type === 'Multiple Choice' || question.type === 'True/False') {
        const isCorrect = userAnswer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();
        return { 
            isCorrect, 
            feedback: isCorrect ? "Correct!" : `Incorrect. The right answer was ${question.correct_answer}.` 
        };
    }

    // AI Grading for Open Ended questions
    const model = 'gemini-flash-latest';
    const prompt = `
        You are a strict but fair language teacher grading a quiz in ${language}.
        
        Question: "${question.prompt}"
        Reference Answer: "${question.correct_answer}"
        Student Answer: "${userAnswer}"
        ${context ? `Reference Context (Transcript/Source Text): "${context.substring(0, 5000)}..."` : ''}

        Task:
        1. Determine if the Student Answer implies the same meaning as the Reference Answer. 
        2. If a Reference Context is provided, ensure the student's answer is factually supported by it.
        3. Allow for minor typos, synonyms, or different phrasing if the core meaning is correct.
        4. Provide short constructive feedback (max 1 sentence).

        Return JSON:
        {
            "isCorrect": boolean,
            "feedback": "string"
        }
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        
        const result = JSON.parse(response.text || '{}');
        return {
            isCorrect: result.isCorrect ?? false,
            feedback: result.feedback || "Feedback unavailable."
        };

    } catch (error) {
        console.error("AI Evaluation failed", error);
        // Fallback to strict comparison
        const strictMatch = userAnswer.toLowerCase().includes(question.correct_answer.toLowerCase());
        return {
            isCorrect: strictMatch,
            feedback: strictMatch ? "Correct (Offline check)" : "Unable to verify with AI, marking based on strict keyword match."
        };
    }
};

// Deprecated: Kept for backward compatibility if needed, but evaluateAnswerWithAI is preferred
export const generateFeedback = async (question: Question, userAnswer: string, language: string): Promise<string> => {
  const result = await evaluateAnswerWithAI(question, userAnswer, language);
  return result.feedback;
};
