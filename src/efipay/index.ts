import * as fs from 'fs';
import * as path from 'path';

// Função para criar um arquivo .p12 a partir do conteúdo base64
function createP12FileIfNotExists(filePath: string, envVar: string) {
  if (!fs.existsSync(filePath)) {
    const base64Content = process.env[envVar];
    if (base64Content) {
      // Decodifica o conteúdo base64 para Buffer
      const buffer = Buffer.from(base64Content, 'base64');
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, buffer);
      console.log(`Arquivo .p12 criado: ${filePath}`);
    } else {
      console.error(`Variável de ambiente ${envVar} não definida para ${filePath}`);
    }
  } else {
    console.log(`Arquivo .p12 já existe: ${filePath}`);
  }
}

// Função para criar um arquivo a partir de uma cadeia de caracteres (texto puro)
function createTextFileIfNotExists(filePath: string, envVar: string) {
  if (!fs.existsSync(filePath)) {
    const content = process.env[envVar];
    if (content) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content);
      console.log(`Arquivo criado: ${filePath}`);
    } else {
      console.error(`Variável de ambiente ${envVar} não definida para ${filePath}`);
    }
  } else {
    console.log(`Arquivo já existe: ${filePath}`);
  }
}

const certsDir = path.resolve(__dirname, './certs');
const certificatePath = path.join(certsDir, 'dietaInteligente.p12');
const certificateChainPath = path.join(certsDir, 'certificate-chain-prod.crt');

// Cria o arquivo do certificado (.p12) a partir da variável CERTIFICATE_P12 (base64)
createP12FileIfNotExists(certificatePath, 'CERTIFICATE_P12');

// Cria o arquivo da cadeia de certificados a partir da variável CERTIFICATE_CHAIN (texto puro)
createTextFileIfNotExists(certificateChainPath, 'CERTIFICATE_CHAIN');

// Exibe o status dos arquivos criados
if (fs.existsSync(certificatePath)) {
  console.log('Certificado encontrado:', certificatePath);
} else {
  console.error('Certificado não encontrado:', certificatePath);
}

if (fs.existsSync(certificateChainPath)) {
  console.log('Cadeia de certificados encontrada:', certificateChainPath);
} else {
  console.error('Cadeia de certificados não encontrada:', certificateChainPath);
}

// Configura as opções para o EfiPay utilizando o caminho do certificado criado.
// Caso o SDK permita utilizar também a cadeia de certificados, você pode adicioná-la nas opções.
const options = {
  sandbox: false,
  client_id: 'Client_Id_0fb623acf3c3decd0cf59f6d97fedb63bc04c212',
  client_secret: 'Client_Secret_dab06a07069c1ee504061eccbcb8623b6049b2d2',
  certificate: certificatePath,
  // Se o SDK suportar, você pode incluir:
  // certificateChain: certificateChainPath,
};

const EfiPay = require('sdk-node-apis-efi');
const efipay = new EfiPay(options);

export { efipay };
