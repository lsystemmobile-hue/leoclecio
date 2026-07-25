// Vercel Serverless Function - api/submit.js
const https = require('https');

module.exports = function handler(req, res) {
  // CORS Headers for production robustness
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, whatsapp, email, instagram, business, colors, goal, notes } = req.body;

  const apiKey = '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';
  
  // Format HTML content for the email
  const htmlContent = `
    <h2>Nova solicitação (Site Express 7h)</h2>
    <hr/>
    <p><strong>Nome:</strong> ${name}</p>
    <p><strong>WhatsApp:</strong> ${whatsapp}</p>
    <p><strong>E-mail:</strong> ${email}</p>
    <p><strong>Instagram:</strong> ${instagram || 'Não informado'}</p>
    <p><strong>Empresa/Segmento:</strong> ${business}</p>
    <p><strong>Cores de Preferência:</strong> ${colors}</p>
    <p><strong>Objetivo do Site:</strong> ${goal}</p>
    <p><strong>Observações/Preferências:</strong> ${notes}</p>
  `;

  const postData = JSON.stringify({
    sender: {
      name: "Formulário Site Express",
      email: "leoclecio@outlook.com"
    },
    to: [
      {
        email: "leoclecio@outlook.com",
        name: "Leoclecio"
      }
    ],
    replyTo: {
      email: email,
      name: name
    },
    subject: `Nova Solicitação de Site Express - ${name}`,
    htmlContent: htmlContent
  });

  const options = {
    hostname: 'api.brevo.com',
    port: 443,
    path: '/v3/smtp/email',
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(postData)
    }
  };

  const request = https.request(options, (apiRes) => {
    let data = '';
    apiRes.on('data', (chunk) => {
      data += chunk;
    });

    apiRes.on('end', () => {
      res.status(apiRes.statusCode).send(data);
    });
  });

  request.on('error', (e) => {
    res.status(500).json({ error: e.message });
  });

  request.write(postData);
  request.end();
};
