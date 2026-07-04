exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try { body = JSON.parse(event.body); } catch(e) {
    return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Invalid JSON' }) };
  }

  const { prenom, email, telephone } = body;
  if (!prenom || !email) {
    return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Prénom et email requis' }) };
  }

  const now = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Brussels' });

  try {
    // Envoyer email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer re_YCmN11in_GjP57uwfCCNG6qhW1QtiPhDA',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Intensity Record <onboarding@resend.dev>',
        to: 'd.depaduwa@gmail.com',
        subject: `🔔 Demande d'accès — ${prenom}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px">
            <h2 style="color:#5C7A22">🔔 Nouvelle demande d'accès Intensity Record</h2>
            <p>Une nouvelle personne souhaite accéder à l'application :</p>
            <table style="width:100%;border-collapse:collapse;margin:20px 0">
              <tr style="background:#f5f5f5">
                <td style="padding:10px;font-weight:bold">Prénom</td>
                <td style="padding:10px">${prenom}</td>
              </tr>
              <tr>
                <td style="padding:10px;font-weight:bold">Email</td>
                <td style="padding:10px">${email}</td>
              </tr>
              <tr style="background:#f5f5f5">
                <td style="padding:10px;font-weight:bold">WhatsApp</td>
                <td style="padding:10px">${telephone || 'Non renseigné'}</td>
              </tr>
              <tr>
                <td style="padding:10px;font-weight:bold">Date</td>
                <td style="padding:10px">${now}</td>
              </tr>
            </table>
            <p style="color:#666">Vérifie si <strong>${prenom}</strong> est bien cliente Intensity Record avant de créer son compte.</p>
            <p style="color:#666">Si oui, crée son compte sur <a href="https://console.firebase.google.com">Firebase Console</a> et envoie-lui ses identifiants par WhatsApp.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
            <p style="font-size:12px;color:#999">Intensity Record — Système de gestion des accès</p>
          </div>
        `
      })
    });

    if (!resendResponse.ok) {
      const err = await resendResponse.text();
      throw new Error('Resend error: ' + err);
    }

    console.log(`Email envoyé pour: ${prenom} (${email}) - ${now}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error('Erreur:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
