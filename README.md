Data Ingestion API System

A RESTful API system for handling data ingestion requests with priority-based processing, batch handling, and rate limiting.
Prerequisites

    Node.js v14 or higher

    npm v6 or higher

Installation

    Clone the repository:
   git clone https://github.com/Lishagoel/loopAI-project.git
   cd loopAI-project


Install dependencies:

    npm install

Running the Application

    Development mode:

npm run dev

Production mode:

    npm start

By default, the server runs on port 5000. To use a different port, set the PORT environment variable before starting the app, for example:

PORT=8080 npm start

API Endpoints
POST /ingest

Submit a new data ingestion request.

    Request Body:

{
    "ids": [1, 2, 3, 4, 5],
    "priority": "HIGH"
}

Response:

    {
        "ingestion_id": "uuid-string"
    }

GET /status/:ingestion_id

Check the status of a submitted ingestion request by its ingestion_id.

    Response:

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

Running Tests

Execute the test suite with:

npm test
