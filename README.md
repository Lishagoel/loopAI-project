# Data Ingestion API System

A RESTful API system for handling data ingestion requests with priority-based processing and rate limiting.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/ku28/data-ingestion-api
cd data-ingestion-api
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on port 5000 by default. You can change this by setting the PORT environment variable.

## API Endpoints

### POST /ingest

Submit a new data ingestion request.

Request body:
```json
{
    "ids": [1, 2, 3, 4, 5],
    "priority": "HIGH"
}
```

Response:
```json
{
    "ingestion_id": "uuid-string"
}
```

### GET /status/:ingestion_id

Check the status of an ingestion request.

Response:
```json
{
    "ingestion_id": "uuid-string",
    "status": "triggered",
    "batches": [
        {
            "batch_id": "uuid-string",
            "ids": [1, 2, 3],
            "status": "completed"
        },
        {
            "batch_id": "uuid-string",
            "ids": [4, 5],
            "status": "triggered"
        }
    ]
}
```

## Running Tests

```bash
npm test
```