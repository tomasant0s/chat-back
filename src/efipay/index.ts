import * as fs from 'fs';
import * as path from 'path';

const certificatePath = path.resolve(__dirname, './certs/dietaInteligente.p12');
if (fs.existsSync(certificatePath)) {
  console.log('Certificado encontrado:', certificatePath);
} else {
  console.error('Certificado não encontrado:', certificatePath);
}

const certificateChainPath = path.resolve(__dirname, './certs/certificate-chain-prod.crt');
if (fs.existsSync(certificateChainPath)) {
  console.log('Certificado encontrado:', certificateChainPath);
} else {
  console.error('Certificado não encontrado:', certificateChainPath);
}

const options = {
  sandbox: false,
  client_id: 'Client_Id_0fb623acf3c3decd0cf59f6d97fedb63bc04c212',
  client_secret: 'Client_Secret_dab06a07069c1ee504061eccbcb8623b6049b2d2',
  certificate: certificatePath,
};

const EfiPay = require('sdk-node-apis-efi');
const efipay = new EfiPay(options);

export { efipay };
