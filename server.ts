import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // Shared Gemini client utility
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Gemini Owner Memo endpoint
  app.post('/api/gemini/generate-memo', async (req, res) => {
    try {
      const { computedData } = req.body;
      if (!computedData) {
        return res.status(400).json({ error: 'Missing computedData in request body' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({
          error: 'Gemini API key is not configured. Please add GEMINI_API_KEY in the Settings > Secrets panel.'
        });
      }

      // Hard rule from brief:
      // "The Gemini model must NEVER produce or estimate a number. When calling Gemini, send it only the
      //  computed results as JSON, with this system instruction: "You explain pricing results to a
      //  property owner. Use only the numbers in the JSON provided. Do not add, estimate, or round any
      //  number differently. If something is not in the JSON, say it is not in the data.""
      const systemInstruction =
        'You explain pricing results to a property owner. Use only the numbers in the JSON provided. ' +
        'Do not add, estimate, or round any number differently. If something is not in the JSON, say it is not in the data. ' +
        'Write in a clear, executive, high-trust tone suitable for a senior Washington, DC property management advisor advising a client. ' +
        'Structure the memo with concise sections: ' +
        '1. Executive Summary & Recommended Nightly Rate (reference the median price and 25th-75th percentile range). ' +
        '2. Annual Revenue Projections & DC 90-Night STR Cap Analysis (detail the live-in vs absent owner figures). ' +
        '3. Comp Set Context & Property Type Benchmark (explain how many comps were evaluated and whether condo or all types were matched). ' +
        '4. Amenity Uplift Opportunities (highlight the verified comp uplifts from the data). ' +
        '5. Regulatory & Compliance Next Steps (DC Short-Term Rental License, Primary Residence, Condo By-Laws).';

      const prompt = `Here is the strictly computed comp analysis data in JSON for the homeowner's property:\n\n${JSON.stringify(computedData, null, 2)}\n\nPlease compose a tailored, professional Owner Pricing & Revenue Advisory Memo based strictly on these verified numbers.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
        },
      });

      const memoText = response.text || 'Unable to generate memo text.';
      return res.json({ memo: memoText });
    } catch (err: any) {
      console.error('Error generating memo with Gemini:', err);
      return res.status(500).json({
        error: err?.message || 'Failed to generate memo. Please verify your GEMINI_API_KEY.'
      });
    }
  });

  // Google Maps API Key endpoint for client components
  app.get('/api/config/maps', (_req, res) => {
    const key = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
    res.json({ apiKey: key });
  });

  // Explicit static file serving for /data
  const publicDataDir = path.resolve(__dirname, 'public/data');
  const rootDataDir = path.resolve(__dirname, 'data');
  app.use('/data', express.static(publicDataDir));
  app.use('/data', express.static(rootDataDir));

  // Fallback endpoint to ensure /data/dc_listings_clean.csv is always directly fetchable
  app.get('/data/dc_listings_clean.csv', (_req, res) => {
    const candidate1 = path.join(publicDataDir, 'dc_listings_clean.csv');
    const candidate2 = path.join(rootDataDir, 'dc_listings_clean.csv');
    if (fs.existsSync(candidate1)) {
      return res.sendFile(candidate1);
    } else if (fs.existsSync(candidate2)) {
      return res.sendFile(candidate2);
    } else {
      return res.status(404).send('dc_listings_clean.csv not found');
    }
  });

  // Vite dev middleware vs production static
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DC Airbnb Pricing Advisor server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
