const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage
const ingestionStore = new Map();
const batchStore = new Map();
const processingQueue = [];

// Priority enum
const Priority = {
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW'
};

// Helper function to get priority weight
const getPriorityWeight = (priority) => {
    switch (priority) {
        case Priority.HIGH: return 3;
        case Priority.MEDIUM: return 2;
        case Priority.LOW: return 1;
        default: return 0;
    }
};

// Helper function to process a batch
const processBatch = async (batch) => {
    batch.status = 'triggered';
    batchStore.set(batch.batch_id, batch);

    // Simulate external API call
    await new Promise(resolve => setTimeout(resolve, 5000));

    batch.status = 'completed';
    batchStore.set(batch.batch_id, batch);

    // Update ingestion status
    const ingestion = ingestionStore.get(batch.ingestion_id);
    if (ingestion) {
        const allBatches = ingestion.batches;
        const allCompleted = allBatches.every(b => 
            batchStore.get(b.batch_id)?.status === 'completed'
        );
        ingestion.status = allCompleted ? 'completed' : 'triggered';
        ingestionStore.set(batch.ingestion_id, ingestion);
    }
};

// Process queue
const processQueue = async () => {
    while (true) {
        if (processingQueue.length > 0) {
            const batch = processingQueue.shift();
            await processBatch(batch);
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
};

// Start queue processor
processQueue();

// Routes
app.post('/ingest', (req, res) => {
    const { ids, priority } = req.body;

    // Validation
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Invalid ids array' });
    }
    if (!priority || !Object.values(Priority).includes(priority)) {
        return res.status(400).json({ error: 'Invalid priority' });
    }

    const ingestion_id = uuidv4();
    const batches = [];
    const timestamp = Date.now();

    // Create batches of 3
    for (let i = 0; i < ids.length; i += 3) {
        const batch_ids = ids.slice(i, i + 3);
        const batch = {
            batch_id: i/3 + 1,
            ingestion_id,
            ids: batch_ids,
            status: 'yet_to_start',
            priority,
            timestamp
        };
        batches.push(batch);
        batchStore.set(batch.batch_id, batch);
        processingQueue.push(batch);
    }

    // Sort queue by priority and timestamp
    processingQueue.sort((a, b) => {
        const priorityDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
        if (priorityDiff !== 0) return priorityDiff;
        return a.timestamp - b.timestamp;
    });

    const ingestion = {
        ingestion_id,
        status: 'yet_to_start',
        batches: batches.map(b => ({ 
            batch_id: b.batch_id, 
            ids: b.ids, 
            status: b.status 
        }))
    };

    ingestionStore.set(ingestion_id, ingestion);
    res.json({ ingestion_id });
});

app.get('/status/:ingestion_id', (req, res) => {
    const { ingestion_id } = req.params;
    const ingestion = ingestionStore.get(ingestion_id);

    if (!ingestion) {
        return res.status(404).json({ error: 'Ingestion not found' });
    }

    // Update batch statuses
    ingestion.batches = ingestion.batches.map(batch => ({
        batch_id: batch.batch_id,
        ids: batch.ids,
        status: batchStore.get(batch.batch_id)?.status || 'yet_to_start'
    }));

    // Update overall status
    const allYetToStart = ingestion.batches.every(b => b.status === 'yet_to_start');
    const allCompleted = ingestion.batches.every(b => b.status === 'completed');
    
    ingestion.status = allYetToStart ? 'yet_to_start' : 
                      allCompleted ? 'completed' : 'triggered';

    res.json(ingestion);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

module.exports = app; 