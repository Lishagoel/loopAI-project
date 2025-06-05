# Data Ingestion API System

A RESTful API system for handling data ingestion requests with priority-based processing and rate limiting.

## Features

- Asynchronous batch processing
- Priority-based queue management (HIGH, MEDIUM, LOW)
- Rate limiting (3 IDs per 5 seconds)
- Status tracking for ingestion requests
- Comprehensive test suite

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
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

## Design Decisions

1. **In-memory Storage**: Using Map objects for storing ingestion and batch data. In a production environment, this would be replaced with a persistent database.

2. **Priority Queue**: Implemented using a sorted array based on priority weight and timestamp.

3. **Rate Limiting**: Enforced through a 5-second delay between batch processing.

4. **Batch Processing**: IDs are processed in batches of 3, with each batch taking 5 seconds to complete.

5. **Status Tracking**: Three states for both batches and overall ingestion: yet_to_start, triggered, and completed.

## Error Handling

The API includes validation for:
- Invalid IDs array
- Invalid priority values
- Non-existent ingestion IDs

## Testing

The test suite covers:
- Basic API functionality
- Priority processing
- Rate limiting
- Batch processing
- Status transitions
- Error cases

## Deployment

The application can be deployed to any Node.js hosting platform (e.g., Heroku, Railway, etc.). Make sure to set the PORT environment variable if needed. 