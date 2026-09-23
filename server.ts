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

// ---------------------------------------------------------------------
// 3. Multi-Turn Chat API with System Persona Roles & Multi-Model Support
// Models supported:
//   - gemini-3.1-pro-preview (for particularly complex tasks)
//   - gemini-3.5-flash (for general tasks)
//   - gemini-3.1-flash-lite (for tasks that should happen fast)
// ---------------------------------------------------------------------
const ROLE_SYSTEM_INSTRUCTIONS: Record<string, string> = {
  operations_lead:
    'You are the Senior Quick-Commerce Operations Lead co-pilot for Tether VoC. ' +
    'Your domain is dark store operations, cold chain integrity, ambient staging dwell time, picker/packer bagging errors, and dispatch logistics. ' +
    'You analyze customer complaints through an operational lens, identifying facility-level root causes and recommending actionable store remediation playbooks. ' +
    'Always be structured, evidence-oriented, and reference specific dark store telemetry when available.',
  product_manager:
    'You are the Fulfillment & Customer Experience Product Manager co-pilot for Tether VoC. ' +
    'Your domain is customer friction, checkout bugs, 504 timeouts, support chatbot refund friction, and customer lifetime value (LTV) retention. ' +
    'You analyze customer complaints through a product and technical lens, distinguishing between software defects and operational issues, and providing feature and policy recommendations.',
  executive_vp:
    'You are the Executive Vice President & Chief Operating Officer co-pilot for Tether VoC. ' +
    'Your domain is high-level executive decision-making, revenue hemorrhage mitigation, cross-facility performance benchmarking, and strategic resource allocation. ' +
    'You provide concise, executive-grade briefings with quantified impact and strategic imperatives.',
};

app.post('/api/gemini/chat', async (req, res) => {
  try {
    const {
      message,
      history = [],
      model = 'gemini-3.5-flash',
      role = 'operations_lead',
      customSystemInstruction,
      contextData,
      useSearch = false,
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing message parameter' });
    }

    const ai = getGeminiClient();

    // Model selection validation
    const allowedModels = ['gemini-3.1-pro-preview', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'];
    let selectedModel = allowedModels.includes(model) ? model : 'gemini-3.5-flash';

    // Base system instruction from role or custom
    const baseInstruction =
      customSystemInstruction || ROLE_SYSTEM_INSTRUCTIONS[role] || ROLE_SYSTEM_INSTRUCTIONS.operations_lead;

    const fullSystemInstruction = contextData
      ? `${baseInstruction}\n\nCURRENT INGESTED DATASET SNAPSHOT:\n${contextData}\n\nMaintain conversation context across all previous turns.`
      : `${baseInstruction}\n\nMaintain conversation context across all previous turns.`;

    // Construct multi-turn contents array
    const contents: any[] = [];

    if (Array.isArray(history) && history.length > 0) {
      for (const turn of history) {
        if (turn && turn.text && typeof turn.text === 'string') {
          const roleNormalized =
            turn.role === 'assistant' || turn.role === 'model' ? 'model' : 'user';
          contents.push({
            role: roleNormalized,
            parts: [{ text: turn.text }],
          });
        }
      }
    }

    // Append the latest user message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const config: any = {
      systemInstruction: fullSystemInstruction,
    };

    if (useSearch && selectedModel === 'gemini-3.5-flash') {
      config.tools = [{ googleSearch: {} }];
    }

    let response: any;
    let actualModelUsed = selectedModel;

    try {
      response = await ai.models.generateContent({
        model: selectedModel,
        contents,
        config,
      });
    } catch (modelErr: any) {
      // Graceful fallback from pro-preview to flash if paid billing is not active
      if (selectedModel === 'gemini-3.1-pro-preview') {
        console.warn('Fallback from gemini-3.1-pro-preview to gemini-3.5-flash:', modelErr?.message);
        actualModelUsed = 'gemini-3.5-flash';
        response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents,
          config,
        });
      } else {
        throw modelErr;
      }
    }

    const reply = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const searchQueries = response.candidates?.[0]?.groundingMetadata?.webSearchQueries;
    const sources =
      groundingChunks?.map((chunk: any) => chunk.web).filter(Boolean) || [];

    return res.json({
      reply,
      modelUsed: actualModelUsed,
      roleUsed: role,
      sources,
      searchQueries,
    });
  } catch (error: any) {
    console.error('Gemini chat multi-turn error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate multi-turn response with Gemini',
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
