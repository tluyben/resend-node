const { Resend } = require('./dist');
const fs = require('fs');

const file = process.argv[2];

if (!file) {
  console.error('Please provide a file to read');
  process.exit(1);
}

const content = fs.readFileSync(file, 'utf-8');
const data = JSON.parse(content);

const resend = new Resend(data.user);

// send the email;
resend.emails.send(data.email).then((yes, no) => {
  if (no) {
    console.error(no);
  } else {
    console.log('Email sent ', yes);
  }
});

// cleanup
if (data.email.attachments && data.email.attachments.length > 0) {
  data.email.attachments.forEach((attachment) => {
    fs.unlinkSync(attachment.filepath);
  });
}

fs.unlinkSync(file);
