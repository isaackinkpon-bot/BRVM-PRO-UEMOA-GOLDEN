const { FedaPay, Transaction } = require('fedapay');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Méthode non autorisée.' }) };
  }

  const transactionId = event.queryStringParameters.id;
  if (!transactionId) {
    return { statusCode: 400, body: JSON.stringify({ success: false, error: 'ID de transaction manquant.' }) };
  }

  try {
    FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY);
    FedaPay.setEnvironment(process.env.FEDAPAY_ENV || 'sandbox');

    // Récupération statut réel via API
    const transaction = await Transaction.retrieve(transactionId);

    // Statuts officiels FedaPay: approved, pending, declined, canceled, refunded
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        status: transaction.status, // Ex: "approved"
        amount: transaction.amount,
        description: transaction.description
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Impossible de vérifier la transaction.' })
    };
  }
};
