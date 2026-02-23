'use strict';

const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());

let newsFeed = [];

// Endpoint: Get trending news articles
app.get('/api/trending-news', (req, res) => {
    res.json(newsFeed);
});

// Endpoint: Add news article to feed
app.post('/api/news', (req, res) => {
    const article = req.body;
    newsFeed.push(article);
    res.status(201).json(article);
    // Broadcast the new article to all WebSocket clients
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(article));
        }
    });
});

// Endpoint: Update news article
app.put('/api/news/:id', (req, res) => {
    const { id } = req.params;
    const index = newsFeed.findIndex(article => article.id === id);
    if (index !== -1) {
        newsFeed[index] = {...newsFeed[index], ...req.body};
        res.json(newsFeed[index]);
    } else {
        res.status(404).json({error: 'Article not found'});
    }
});

// Endpoint: Delete news article
app.delete('/api/news/:id', (req, res) => {
    const { id } = req.params;
    newsFeed = newsFeed.filter(article => article.id !== id);
    res.status(204).send();
});

// WebSocket connection for real-time updates
wss.on('connection', (ws) => {
    console.log('New client connected');
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
