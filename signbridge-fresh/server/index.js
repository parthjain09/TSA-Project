// Minimal Express server for OpenAI proxy (CommonJS)
const express = require('express');
const multer = require('multer');
const dotenv = require('dotenv');
const cors = require('cors');
const { OpenAI } = require('openai');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Test endpoint
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, message: 'Server is running!' });
});

// POST /api/translate-sign
app.post('/api/translate-sign', upload.single('file'), async (req, res) => {
  try {
    const fileBuffer = req.file.buffer;
    const base64 = fileBuffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64}`;

    // Multimodal GPT-4o API call
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Describe the sign language gesture in this image as plain text.' },
            { type: 'image_url', image_url: { url: dataUrl } }
          ]
        }
      ]
    });

    const text = response.choices?.[0]?.message?.content || JSON.stringify(response);
    res.json({ ok: true, text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message || err });
  }
});

// POST /api/generate-sign
app.post('/api/generate-sign', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ ok: false, error: 'text required' });

    // OpenAI image generation
    const imageResp = await client.images.generate({
      model: 'dall-e-3',
      prompt: `A clear photo-style illustration of a person performing the sign for: '${text}'. Neutral background, high detail.`,
      n: 1,
      size: '512x512',
      response_format: 'b64_json'
    });

    const b64 = imageResp.data?.[0]?.b64_json;
    if (!b64) return res.status(500).json({ ok: false, error: 'no image returned' });

    const dataUrl = `data:image/png;base64,${b64}`;
    res.json({ ok: true, image: dataUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message || err });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
