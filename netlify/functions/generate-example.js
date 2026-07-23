exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { word, partOfSpeech, definition } = JSON.parse(event.body);

        const apiKey = process.env.AI_API_KEY;
        if (!apiKey) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'API key not configured. Set AI_API_KEY in Netlify env vars.' })
            };
        }

        const prompt = `Generate a single, natural example sentence for the English word "${word}" (part of speech: ${partOfSpeech}).
Definition: ${definition}
Requirements:
- The sentence must be grammatically correct
- The sentence must use the word "${word}" naturally and correctly
- The sentence must be appropriate, respectful, and family-friendly
- Do not include any offensive, discriminatory, or inappropriate content
- Keep the sentence between 8-20 words
- Return ONLY the sentence, nothing else`;

        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 80
                }
            })
        });

        const responseText = await response.text();
        console.log('Gemini response status:', response.status);
        console.log('Gemini response body:', responseText.substring(0, 300));

        if (!response.ok) {
            throw new Error(`Gemini API ${response.status}: ${responseText.substring(0, 200)}`);
        }

        const data = JSON.parse(responseText);
        const example = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!example) {
            throw new Error('No example in Gemini response: ' + responseText.substring(0, 200));
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ example })
        };

    } catch (error) {
        console.error('Function error:', error.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to generate example: ' + error.message })
        };
    }
};
