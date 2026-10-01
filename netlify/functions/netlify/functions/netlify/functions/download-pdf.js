const fs = require('fs');
const path = require('path');
const { FedaPay, Transaction } = require('fedapay');

const PRODUCT_FILES = {
  manuel: "manuel.pdf",
  niveau1: "niveau1.pdf",
  niveau2: "niveau2.pdf",
  niveau3: "niveau3.pdf"
};

exports.handler = async (event) => {
  const transactionId = event.queryStringParameters.id;
  const productId = event.queryStringParameters.product;

  if (!transactionId || !productId || !PRODUCT_FILES[productId]) {
    return { statusCode: 400, body: "Requête invalide." };
  }

  try {
    FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY);
    FedaPay.setEnvironment(process.env.FEDAPAY_ENV || 'sandbox');

    const transaction = await Transaction.retrieve(transactionId);

    // Vérification du statut officiel
    if (transaction.status !== 'approved') {
      return { statusCode: 403, body: "Accès refusé : Le paiement n'a pas été confirmé." };
    }

    const fileName = PRODUCT_FILES[productId];
    const filePath = path.resolve(__dirname, '../../private_files', fileName);

    if (!fs.existsSync(filePath)) {
      return { statusCode: 404, body: "Fichier non trouvé sur le serveur." };
    }

    const fileBuffer = fs.readFileSync(filePath);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`
      },
      body: fileBuffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    return { statusCode: 500, body: "Erreur de serveur." };
  }
};
