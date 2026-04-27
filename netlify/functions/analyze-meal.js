// Netlify Function — Pont sécurisé entre l'app Intensity Record et l'API Claude
// Cette fonction sert pour : scan repas, chat coach, et chat avec photo

exports.handler = async (event) => {
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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Méthode non autorisée' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { model, max_tokens, system, messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Format invalide : messages manquant' })
      };
    }

    // Appel à l'API Claude avec la clé sécurisée
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: max_tokens || 600,
        system: system || undefined,
        messages: messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erreur API Anthropic:', data);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: 'Erreur API Claude',
          details: data
        })
      };
    }

    // Renvoyer la réponse au format que l'app attend
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Erreur fonction:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Erreur serveur',
        message: error.message
      })
    };
  }
};
