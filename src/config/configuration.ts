export default () => ({
    port: parseInt(process.env.PORT || '8080', 10),
    database: {
      url: process.env.DATABASE_URL,
    },
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.SMTP_FROM,
    },
    efipay: {
      sandbox: process.env.EFIPAY_SANDBOX === 'true',
      client_id: process.env.EFIPAY_CLIENT_ID,
      client_secret: process.env.EFIPAY_CLIENT_SECRET,
      certificatePath: process.env.EFIPAY_CERTIFICATE_PATH,
    },
  });
  