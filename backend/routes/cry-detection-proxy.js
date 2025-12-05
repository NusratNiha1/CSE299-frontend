import express from 'express';
import fetch from 'node-fetch';
import FormData from 'form-data';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const CRY_DETECTION_API_URL = 'https://julissa-unimpressive-felicia.ngrok-free.dev/predict';

router.post('/predict', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

      

        // Create form data for the external API
        const formData = new FormData();
        formData.append('audio', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        // Forward to the ngrok API
        const response = await fetch(CRY_DETECTION_API_URL, {
            method: 'POST',
            body: formData,
            headers: {
                ...formData.getHeaders(),
                'ngrok-skip-browser-warning': 'true'
            }
        });

        const responseText = await response.text();
        console.log('API Response Status:', response.status);
        console.log('API Response:', responseText);

        // Parse and return the response
        if (response.ok) {
            try {
                const data = JSON.parse(responseText);
                res.json(data);
            } catch (e) {
                res.status(500).json({ error: 'Invalid JSON response from API', raw: responseText });
            }
        } else {
            res.status(response.status).json({
                error: 'Cry detection API error',
                status: response.status,
                message: responseText
            });
        }
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({
            error: 'Failed to proxy request',
            message: error.message
        });
    }
});

export default router;
