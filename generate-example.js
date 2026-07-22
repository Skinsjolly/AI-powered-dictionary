// Netlify Function: generate-example
// Proxies requests to Google Gemini so the API key stays server-side only.
// Set GEMINI_API_KEY as an environment variable in Netlify (Site settings →
// Environment variables) — never commit the key itself to this file.

const GEMINI_MODEL = 'gemini-2.5-flash';

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GEMINI_API_KEY is not configured on the server.' }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body.' }) };
  }

  const { word, partOfSpeech, definition } = payload;
  if (!word || typeof word !== 'string') {
    return { statusCode: 400, body: JSON.stringify({ error: 'A "word" field is required.' }) };
  }

  const prompt = `Write ONE natural, appropriate, everyday English example sentence that correctly uses the word "${word}"${partOfSpeech ? ` as a ${partOfSpeech}` : ''}. ${definition ? `The word means: "${definition}".` : ''} Respond with ONLY the sentence, no quotation marks, no preamble, no explanation.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 100 },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: data?.error?.message || 'Gemini request failed.' }),
      };
    }

    const sentence = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentence }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error contacting Gemini.' }),
    };
  }
};
