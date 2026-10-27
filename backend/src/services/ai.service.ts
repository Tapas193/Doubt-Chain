import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function askDoubtAssistant(input: {
  question: string;
  subject?: string;
  mode?: 'beginner' | 'step-by-step' | 'example' | 'hinglish' | 'debug';
}) {
  if (!ai) {
    throw new Error('GEMINI_API_KEY is missing in backend/.env');
  }

  const question = input.question.trim();

  if (!question) {
    throw new Error('Question cannot be empty');
  }

  const instructions = {
    beginner: 'Explain from the basics using simple language.',
    'step-by-step': 'Explain in numbered steps.',
    example: 'Explain with a practical example.',
    hinglish: 'Explain in simple Hinglish.',
    debug: 'Help debug the problem and explain the correction.'
  };

  const mode = input.mode ?? 'beginner';

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `
You are the AI learning assistant for Doubt-Chain.

Subject: ${input.subject || 'General'}
Mode: ${mode}
Instructions: ${instructions[mode]}

Explain accurately and clearly. If uncertain, say so.
Label your response as AI-generated.

Student question:
${question}
`
  });

  const answer = response.text?.trim();

  if (!answer) {
    throw new Error('Gemini returned an empty response');
  }

  return answer;
}