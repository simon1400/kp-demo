import InfoOrder from '../../../mailTemplate/infoOrder';
const Recipient = require("mailersend").Recipient;
const EmailParams = require("mailersend").EmailParams;
const MailerSend = require("mailersend");

const mailersend = new MailerSend({
  api_key: process.env.MAILERSEND_TOKEN,
});

export default async function handler (req, res) {
  if(req.method === 'POST') {
    console.log('POST /SEND ORDER');

    const data = req.body

    try{
      const recipients = [
        new Recipient(data.email, "Recipient"),
        new Recipient('info@kralovska-pece.cz', "Owner"),
        new Recipient('lucie@kralovska-pece.cz ', "Lucie"),
        new Recipient('martina@kralovska-pece.cz', "Martina")
      ];
  
      const emailParams = new EmailParams()
          .setFrom("info@kralovska-pece.cz")
          .setFromName("Královská Peče")
          .setRecipients(recipients)
          .setSubject('Objednávka č.: ' + data.id)
          .setHtml(InfoOrder(data))
          .setText("Objednávka dokončena - Královská Peče");
  
      mailersend.send(emailParams);
  
      console.log('Email send')
      res.status(200).send('Email sent')
    }catch(err) {
      console.error('ERRORRR --- ', err)
      res.status(err.code).json(err.response.body);
    }
  }
}






