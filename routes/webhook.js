const express = require('express');
const router = express.Router();
const line = require('@line/bot-sdk');
const { handleEvent } = require('../services/lineService');

const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || 'DUMMY_TOKEN',
    channelSecret: process.env.LINE_CHANNEL_SECRET || 'DUMMY_SECRET'
};

// The LINE middleware requires raw body parsing.
// We apply the line.middleware here directly so it can parse request signatures before Express applies body parsing.
router.post('/', line.middleware(config), async (req, res) => {
    try {
        const events = req.body.events;
        // Process each event coming in concurrently
        const results = await Promise.all(
            events.map(async (event) => {
                return await handleEvent(event);
            })
        );
        res.status(200).json(results);
    } catch (err) {
        console.error('Webhook Error:', err);
        res.status(500).end();
    }
});

module.exports = router;
