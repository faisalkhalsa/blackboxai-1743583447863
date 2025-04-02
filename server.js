require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const archiver = require('archiver');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Mock data generator
function generateMockImages(query, count = 8) {
    const results = [];
    for (let i = 0; i < count; i++) {
        results.push({
            id: `img-${i + 1}`,
            title: `${query} image ${i + 1}`,
            description: `A beautiful ${query} scene`,
            thumbnail: `https://picsum.photos/400/300?random=${Date.now() + i}`,
            fullSize: `https://picsum.photos/1920/1080?random=${Date.now() + i}`
        });
    }
    return results;
}

app.get('/api/search', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ error: 'Query parameter is required' });
        }

        // Generate mock results
        const results = generateMockImages(query);
        res.json({ results });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Failed to search images' });
    }
});

app.post('/api/download', async (req, res) => {
    try {
        const { images } = req.body;
        if (!images || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({ error: 'No images selected for download' });
        }

        // Create zip archive
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        // Set response headers
        res.attachment('images.zip');
        archive.pipe(res);

        // Download and add each image to the archive
        for (const image of images) {
            try {
                const response = await axios({
                    url: image.fullSize,
                    method: 'GET',
                    responseType: 'stream'
                });

                archive.append(response.data, { name: `${image.id}.jpg` });
            } catch (error) {
                console.error(`Failed to download image ${image.id}:`, error);
            }
        }

        archive.finalize();
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to download images' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});