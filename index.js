const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Corrected: createTransport instead of createTransporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'exesoftware010@gmail.com',
        pass: 'lmgz etkx gude udar' // This should be an App Password, not your Gmail password
    }
});

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Email endpoint
app.post('/send-email', async (req, res) => {
    try {
        const { subject, body } = req.body;

        const mailOptions = {
            from: 'exesoftware010@gmail.com',
            to: 'denzelbennie@outlook.com',
            subject: subject,
            text: body
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ success: false, message: 'Failed to send email' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access your application at: http://localhost:${PORT}`);
});