/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Increase body limits for base64 audio recordings
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Helper to instantiate server-side GoogleGenAI client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// -------------------------------------------------------------
// 1. Audio Transcription API: uses model 'gemini-3.5-transcribe'
// -------------------------------------------------------------
app.post('/api/gemini/transcribe', async (req, res) => {
  try {
    const { audioData, mimeType = 'audio/webm' } = req.body;
    if (!audioData) {
      return res.status(400).json({ error: 'Missing audioData payload' });
    }

    const ai = getGeminiClient();

    const audioPart = {
      inlineData: {
        mimeType,
        data: audioData,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          audioPart,
          {
            text: 'Transcribe this voice audio accurately into clean text. Output ONLY the verbatim transcribed speech without quotes or commentary.',
          },
        ],
      },
    });

    const transcribedText = response.text?.trim() || '';
    return res.json({ text: transcribedText });
  } catch (error: any) {
    console.error('Audio transcription error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to transcribe audio stream',
    });
  }
});

// ---------------------------------------------------------------------
// 2. Chat & Search Grounding API: uses model 'gemini-3.5-flash' with googleSearch
// ---------------------------------------------------------------------
app.post('/api/gemini/query', async (req, res) => {
  try {
    const { prompt, logsSummary, useSearch = true } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt query' });
    }

    const ai = getGeminiClient();

    const systemPrompt =
      'You are Tether VoC, an AI Customer Feedback Co-Pilot for Quick Commerce. ' +
      'You analyze customer feedback voices, dark store thermal chains, delivery SLAs, and packaging defects with zero hallucination. ' +
      'When relevant, use Google Search data to benchmark against quick commerce standards (e.g., FDA cold chain regulations, ambient staging limits, industry CSAT baselines). ' +
      'Always provide structured, executive-grade analysis citing specific evidence.';

    const contents = logsSummary
      ? `${systemPrompt}\n\nCURRENT INGESTED DATASET SUMMARY:\n${logsSummary}\n\nUSER INQUIRY:\n${prompt}`
      : `${systemPrompt}\n\nUSER INQUIRY:\n${prompt}`;

    const config: any = {};
    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents,
      config,
    });

    const reply = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const searchQueries = response.candidates?.[0]?.groundingMetadata?.webSearchQueries;

    const sources =
      groundingChunks?.map((chunk: any) => chunk.web).filter(Boolean) || [];

    return res.json({
      reply,
      sources,
      searchQueries,
    });
  } catch (error: any) {
    console.error('Gemini query error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to process inquiry with Gemini',
    });
  }
});

// -------------------------------------------------------------
// Start Express and integrate Vite middlewares in development
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Tether VoC server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
