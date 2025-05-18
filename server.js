const webpush = require('web-push');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Public & Private VAPID key (harus sama seperti yang di frontend)
const vapidKeys = {
  publicKey: 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk',
  privateKey: 'rdP99FcqQ1sTWAozg1kbxt_ycVROsP9LuLfxLL2Dd4I',
};

// Set VAPID detail
webpush.setVapidDetails(
  'mailto:you@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

app.use(bodyParser.json());

// Simpan sementara subscription client
let clientSubscription = null;

// Endpoint untuk menerima subscription dari frontend
app.post('/subscribe', (req, res) => {
  clientSubscription = req.body;
  res.status(201).json({ message: 'Subscription received' });
});

// Endpoint untuk kirim notifikasi
app.post('/send-notification', async (req, res) => {
  const { title, message } = req.body;

  const payload = JSON.stringify({
    title: title || 'Halo!',
    message: message || 'Ini adalah push notification dari server 🎉',
  });

  try {
    await webpush.sendNotification(clientSubscription, payload);
    res.status(200).json({ message: 'Notifikasi terkirim' });
  } catch (err) {
    console.error('Gagal kirim notifikasi:', err);
    res.status(500).json({ error: 'Gagal mengirim notifikasi' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});