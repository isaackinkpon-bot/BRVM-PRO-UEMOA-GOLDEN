const { FedaPay, Transaction } = require('fedapay');

const PRODUCTS = {
  manuel: { name: "Manuel de présentation BRVM PRO GOLDEN", price: 100 },
  niveau1: { name: "BRVM PRO GOLDEN - Niveau 1", price: 1000 },
  niveau2: { name: "BRVM PRO GOLDEN - Niveau 2", price: 2500 },
  niveau3: { name: "BRVM PRO GOLDEN - Niveau 3", price: 5000 }
};

exports.handler = async (event, context) => {
  // 1. Vérification méthode HTTP
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Méthode non autorisée.' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { product: productId, customer } = body;

    // 2. Vérification existence produit
    if (!productId || !PRODUCTS[productId]) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Produit invalide ou inexistant.' }) };
    }

    const selectedProduct = PRODUCTS[productId];
    const apiKey = process.env.FEDAPAY_SECRET_KEY;
    const environment = process.env.FEDAPAY_ENV || 'sandbox'; // 'sandbox' ou 'live'

    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ success: false, error: 'Configuration serveur incomplète.' }) };
    }

    // 3. Initialisation SDK FedaPay
    FedaPay.setApiKey(apiKey);
    FedaPay.setEnvironment(environment);

    const siteUrl = process.env.URL || 'http://localhost:8888';

    // 4. Création de la transaction
    const transactionData = {
      description: `Achat ${selectedProduct.name}`,
      amount: selectedProduct.price,
      currency: { iso: 'XOF' },
      callback_url: `${siteUrl}/payment-success.html`
    };

    // Client optionnel
    if (customer && (customer.email || customer.phone)) {
      transactionData.customer = {
        firstname: customer.firstname || '',
        lastname: customer.lastname || '',
        email: customer.email || '',
        phone_number: customer.phone ? { number: customer.phone } : undefined
      };
    }

    const transaction = await Transaction.create(transactionData);
    
    // 5. Génération du token / lien de paiement
    const tokenObject = await transaction.generateToken();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        transactionId: transaction.id,
        paymentUrl: tokenObject.url
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message || 'Erreur lors de la création de la transaction.' })
    };
  }
};
