export async function sendEmail({ to, subject, text }) {
  console.log(`Email mock -> ${to}: ${subject} - ${text}`);
  return {
    provider: 'mock',
    delivered: true
  };
}

