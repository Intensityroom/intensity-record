exports.handler = async (event) => {
  // CORS pour que ton app puisse appeler la fonction
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Préflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Seul POST autorisé
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Méthode non autorisée' })
    };
  }

  try {
    const { image, programme } = JSON.parse(event.body);

    if (!image) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Image manquante' })
      };
    }

    // Le prompt envoyé à Claude
    const prompt = `Tu es Coach David, coach fitness premium d'Intensity Record. Tu analyses la photo du repas d'une cliente en programme perte de poids.

${programme ? `Son programme du jour : ${programme}` : ''}

Réponds UNIQUEMENT avec ce JSON exact, sans texte avant ni après :
{
  "aliments": ["aliment 1", "aliment 2"],
  "calories": 420,
  "proteines": 38,
  "glucides": 45,
  "lipides": 12,
  "conformite": "parfait",
  "message": "Un message court et motivant de Coach David, max 2 phrases, ton bienveillant mais direct"
}

Pour "conformite", utilise UNIQUEMENT : "parfait", "bon", "moyen", ou "ecart".
Sois réaliste sur les estimations. Si la photo n'est pas un repas, mets "conformite": "ecart" et explique dans le message.`;

    // Appel à l'API Claude
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: image
              }
            },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Erreur API Anthropic:', errText);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: 'Erreur analyse', details: errText })
      };
    }

    const data = await response.json();
    const claudeText = data.content[0].text.trim();

    // On parse le JSON renvoyé par Claude
    const cleanText = claudeText.replace(/```json\s*|\s*```/g, '').trim();
    const result = JSON.parse(cleanText);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Erreur fonction:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erreur serveur', message: error.message })
    };
  }
};
