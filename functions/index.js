// functions/index.js
const functions = require("firebase-functions");
const fetch = require("node-fetch"); // in package.json
exports.generate = functions.https.onRequest(async (req, res) => {
  // allow only POST
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  try {
    const body = req.body || {};
    const name = body.name || '';
    const desc = body.desc || '';
    // simple prompt for Gemini
    const prompt = `You are a helpful assistant. Create a clear, short description for a lost/found report.
Name: ${name}
Extra info: ${desc}
Output should be 2-3 short sentences, useful for search and volunteers.`;

    // GEMINI_KEY stored as functions config or env var
    const GEMINI_KEY = process.env.GEMINI_KEY || functions.config().generative?.key;
    if (!GEMINI_KEY) return res.status(500).send('Server misconfigured: missing GEMINI_KEY');

    // NOTE: replace the URL below with the correct Generative API endpoint if your project uses a different one.
    const url = "https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generate";

    const payload = {
      prompt: { text: prompt },
      temperature: 0.2,
      maxOutputTokens: 300
    };

    const apiRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GEMINI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!apiRes.ok) {
      const txt = await apiRes.text();
      console.error('Gen API returned', apiRes.status, txt);
      return res.status(502).send('AI API error: ' + (txt || apiRes.statusText));
    }

    const json = await apiRes.json();
    // Response shape differs by API version. Try to extract text safely:
    let text = '';
    if (json?.candidates?.[0]?.content) text = json.candidates[0].content;
    if (!text && json?.output?.[0]?.content) text = json.output[0].content;
    if (!text && json?.outputs?.[0]?.content) text = json.outputs[0].content;
    if (!text && json?.result?.content) text = json.result.content;
    if (!text && typeof json?.completion === 'string') text = json.completion;
    text = (text || '').trim();
    if (!text) {
      // fall back to raw JSON
      return res.status(200).json({ description: (desc || name).slice(0,400) });
    }
    // return the generated description
    return res.json({ description: text });

  } catch (err) {
    console.error(err);
    return res.status(500).send('Server error: ' + err.message);
  }
});

