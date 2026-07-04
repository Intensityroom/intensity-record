exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try { body = JSON.parse(event.body); } catch(e) {
    return { statusCode: 400, body: JSON.stringify({ success: false }) };
  }

  const { prenom, email, telephone } = body;
  if (!prenom || !email) {
    return { statusCode: 400, body: JSON.stringify({ success: false }) };
  }

  const now = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Brussels' });
  const apiKey = process.env.RESEND_API_KEY;

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: ['d.depaduwa@gmail.com'],
        subject: `🔔 Demande d'accès Intensity Record — ${prenom}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px">
            <h2 style="color:#5C7A22">🔔 Nouvelle demande d'accès</h2>
            <p>Une personne souhaite accéder à l'app :</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <tr style="background:#f5f5f5"><td style="padding:10px;font-weight:bold">Prénom</td><td style="padding:10px">${prenom}</td></tr>
              <tr><td style="padding:10px;font-weight:bold">Email</td><td style="padding:10px">${email}</td></tr>
              <tr style="background:#f5f5f5"><td style="padding:10px;font-weight:bold">WhatsApp</td><td style="padding:10px">${telephone || 'Non renseigné'}</td></tr>
              <tr><td style="padding:10px;font-weight:bold">Date</td><td style="padding:10px">${now}</td></tr>
            </table>
            <p>Vérifie si <strong>${prenom}</strong> est bien cliente Intensity Record avant de créer son compte Firebase.</p>
          </div>
        `
      })
    });

    const result = await resendResponse.json();
    console.log('Resend result:', JSON.stringify(result));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error('Erreur:', error.message);
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  }
};
