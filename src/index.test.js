const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

// Import the app
const app = require('./index');

describe('Data Ingestion API Tests', () => {
    let ingestionId;

    // Test POST /ingest
    describe('POST /ingest', () => {
        it('should create a new ingestion request with valid data', async () => {
            const response = await request(app)
                .post('/ingest')
                .send({
                    ids: [1, 2, 3, 4, 5],
                    priority: 'HIGH'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('ingestion_id');
            ingestionId = response.body.ingestion_id;
        });

        it('should return 400 for invalid ids array', async () => {
            const response = await request(app)
                .post('/ingest')
                .send({
                    ids: [],
                    priority: 'HIGH'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        it('should return 400 for invalid priority', async () => {
            const response = await request(app)
                .post('/ingest')
                .send({
                    ids: [1, 2, 3],
                    priority: 'INVALID'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    });

    // Test GET /status/:ingestion_id
    describe('GET /status/:ingestion_id', () => {
        it('should return status for valid ingestion_id', async () => {
            const response = await request(app)
                .get(`/status/${ingestionId}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('ingestion_id', ingestionId);
            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('batches');
            expect(Array.isArray(response.body.batches)).toBe(true);
        });

        it('should return 404 for invalid ingestion_id', async () => {
            const response = await request(app)
                .get(`/status/${uuidv4()}`);

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error');
        });
    });

    // Test priority processing
    describe('Priority Processing', () => {
        it('should process HIGH priority before MEDIUM priority', async () => {
            // Create MEDIUM priority request
            const mediumResponse = await request(app)
                .post('/ingest')
                .send({
                    ids: [1, 2, 3],
                    priority: 'MEDIUM'
                });
            const mediumId = mediumResponse.body.ingestion_id;

            // Create HIGH priority request
            const highResponse = await request(app)
                .post('/ingest')
                .send({
                    ids: [4, 5, 6],
                    priority: 'HIGH'
                });
            const highId = highResponse.body.ingestion_id;

            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check status of both requests
            const highStatus = await request(app).get(`/status/${highId}`);
            const mediumStatus = await request(app).get(`/status/${mediumId}`);

            // HIGH priority should be processed first
            expect(highStatus.body.status).not.toBe('yet_to_start');
            expect(mediumStatus.body.status).toBe('yet_to_start');
        });
    });

    // Test rate limiting
    describe('Rate Limiting', () => {
        it('should respect rate limit of 3 IDs per 5 seconds', async () => {
            const response = await request(app)
                .post('/ingest')
                .send({
                    ids: [1, 2, 3, 4, 5, 6],
                    priority: 'HIGH'
                });
            const id = response.body.ingestion_id;

            // Check status immediately
            const initialStatus = await request(app).get(`/status/${id}`);
            expect(initialStatus.body.batches.length).toBe(2);

            // Wait for 5 seconds
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Check status after 5 seconds
            const finalStatus = await request(app).get(`/status/${id}`);
            expect(finalStatus.body.batches[0].status).toBe('completed');
        });
    });

    // Test batch processing
    describe('Batch Processing', () => {
        it('should process IDs in batches of 3', async () => {
            const response = await request(app)
                .post('/ingest')
                .send({
                    ids: [1, 2, 3, 4, 5],
                    priority: 'HIGH'
                });
            const id = response.body.ingestion_id;

            const status = await request(app).get(`/status/${id}`);
            expect(status.body.batches.length).toBe(2);
            expect(status.body.batches[0].ids.length).toBe(3);
            expect(status.body.batches[1].ids.length).toBe(2);
        });
    });

    // Test status transitions
    describe('Status Transitions', () => {
        it('should transition through all statuses correctly', async () => {
            const response = await request(app)
                .post('/ingest')
                .send({
                    ids: [1, 2, 3],
                    priority: 'HIGH'
                });
            const id = response.body.ingestion_id;

            // Initial status should be yet_to_start
            const initialStatus = await request(app).get(`/status/${id}`);
            expect(initialStatus.body.status).toBe('yet_to_start');

            // Wait for processing to start
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Status should be triggered
            const triggeredStatus = await request(app).get(`/status/${id}`);
            expect(triggeredStatus.body.status).toBe('triggered');

            // Wait for processing to complete
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Status should be completed
            const completedStatus = await request(app).get(`/status/${id}`);
            expect(completedStatus.body.status).toBe('completed');
        });
    });
}); 