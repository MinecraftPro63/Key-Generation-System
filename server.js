const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

// Normalize IP function to handle IPv6 localhost (::1)
const normalizeIp = (ip) => {
    return ip === '::1' ? '127.0.0.1' : ip;
};

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Middleware for serving static files in the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json());

const keysFilePath = path.join(__dirname, 'validKeys.json');
const totalKeysFilePath = path.join(__dirname, 'totalKeys.json');

// Middleware to get and normalize client IP
app.use((req, res, next) => {
    const rawIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
    req.clientIp = normalizeIp(rawIp);
    console.log('Client IP:', req.clientIp); // Debug log for IP address
    next();
});

// Endpoint to save a new key tied to the user's IP
app.post('/save-key', (req, res) => {
    const { key, expiration } = req.body;
    const clientIp = req.clientIp;

    // Read existing keys from the file
    fs.readFile(keysFilePath, (err, data) => {
        if (err) return res.status(500).json({ message: 'Error reading keys file' });

        const keys = JSON.parse(data || '{}');

        // If a key already exists for this IP, replace it with the new key
        if (keys[clientIp]) {
            // Overwrite the existing key
            keys[clientIp] = { key, expiration };
            res.status(200).json({ message: 'Key updated successfully', key });
        } else {
            // If no key exists, generate a new one for this IP
            keys[clientIp] = { key, expiration };
            res.status(200).json({ message: 'Key generated successfully', key });
        }

        // Save the updated keys back to the file
        fs.writeFile(keysFilePath, JSON.stringify(keys, null, 2), (writeErr) => {
            if (writeErr) return res.status(500).json({ message: 'Error saving key' });

            incrementTotalKeys();
        });
    });
});

// Endpoint to get the key for a specific IP
app.get('/get-key', (req, res) => {
    const clientIp = req.clientIp;

    // Read the existing keys from the file
    fs.readFile(keysFilePath, (err, data) => {
        if (err) return res.status(500).json({ message: 'Error reading keys file' });

        const keys = JSON.parse(data || '{}');

        // Check if the IP has a key
        if (keys[clientIp]) {
            res.status(200).json({ key: keys[clientIp].key });
        } else {
            res.status(404).json({ message: 'No key found for this IP.' });
        }
    });
});


// Endpoint to get the total keys count
app.get('/get-total-keys', (req, res) => {
    fs.readFile(totalKeysFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading total keys file:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        const totalKeys = JSON.parse(data || '{}');
        res.status(200).json({ totalKeys: totalKeys.count || 0 });
    });
});

// Increment total keys
function incrementTotalKeys() {
    fs.readFile(totalKeysFilePath, 'utf8', (err, data) => {
        const totalKeys = err ? { count: 0 } : JSON.parse(data || '{}');
        totalKeys.count = (totalKeys.count || 0) + 1;

        fs.writeFile(totalKeysFilePath, JSON.stringify(totalKeys, null, 2), (writeErr) => {
            if (writeErr) console.error('Error updating total keys:', writeErr);
        });
    });
}
