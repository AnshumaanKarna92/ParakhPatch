# Predictive Maintenance AI Dashboard

An advanced, real-time predictive maintenance system that leverages streaming machine learning pipelines to ingest live hardware data, predict potential failures, calculating equipment risk, and intelligently alert operators through an AI Assistant.

## Overview

This project provides a full-stack solution for monitoring industrial machinery. By processing live telemetry data (such as temperature, vibration, and RPM) through a streaming data engine, the system accurately detects anomalies and predicts maintenance needs before critical failures occur.

The robust backend is built with FastAPI and integrates with a Pathway streaming pipeline to handle continuous data ingestion. Machine learning models determine dynamic risk percentages, and a React-based frontend dashboard gives operators a comprehensive, real-time view of all hardware units.

## Key Features

*   **Real-time Data Processing**: Ingests and processes live sensor data with millisecond latency using the Pathway streaming engine.
*   **Predictive Analytics**: Deploys machine learning models to detect anomalies and forecast potential equipment failures.
*   **Dynamic Risk Assessment**: Calculates contextual risk percentages based on adaptive algorithms rather than static thresholding.
*   **Interactive AI Assistant**: An integrated LLM-powered assistant allows operators to query system states and receive contextual insights.
*   **Live Monitoring Dashboard**: A React frontend featuring real-time charts (temperature, vibration) and holistic machine status overviews.
*   **Production-Ready Deployment**: Fully containerized architecture using Docker, supporting fast deployment to cloud environments.

## Architecture Architecture

The application is structured into the following core components:

*   **Frontend**: React, visualizing charts and telemetry data.
*   **Backend serving**: FastAPI, managing API endpoints and acting as the bridge to the data.
*   **Streaming Engine**: Pathway (`pathway_llm.py`), enabling live continuous data processing and LLM intelligence.
*   **Machine Learning**: Scikit-Learn based models (`ml_model.py`) for live risk inference.
*   **Database**: MongoDB, for persistent storage of telemetry history and alerts.
*   **Orchestration**: Docker and Docker Compose for seamless multi-container deployment.

## Prerequisites

Before running the application, ensure you have the following installed:

*   Docker (and Docker Desktop for Windows)
*   Docker Compose
*   Node.js (for local frontend development)
*   Python 3.10+ (for local backend development)

## Getting Started

### Environment Configuration

1.  Clone the repository:
    ```bash
    git clone https://github.com/AnshumaanKarna92/ParakhPatch.git
    cd ParakhPatch
    ```

2.  Create a `.env` file in the root directory and populate it with your required API keys and configuration strings:
    ```env
    MONGO_URI=your_mongodb_connection_string
    GROQ_API_KEY=your_groq_api_key
    COHERE_API_KEY=your_cohere_api_key
    ```

### Running with Docker (Recommended)

To spin up the entire application stack including the frontend, backend, pipeline, and database (if self-hosted):

```bash
docker-compose up --build
```

The system will be accessible at:
*   Frontend Dashboard: `http://localhost:3000` (or the configured frontend port)
*   Backend API Docs: `http://localhost:8000/docs`

### Running Locally without Docker

#### Backend
```bash
# Install dependencies
pip install -r requirements.txt

# Start the ingestion pipeline
python ingestion.py

# In a separate terminal, start the main API
uvicorn api:app --host 0.0.0.0 --port 8000
```

#### Frontend
```bash
cd dashboard
npm install
npm run dev
```

## Repository Structure

```text
/
├── dashboard/               # React frontend application
├── api.py                   # FastAPI application entrypoint
├── pipeline.py              # Real-time data routing pipeline
├── ml_model.py              # Machine learning and anomaly detection logic
├── pathway_llm.py           # Pathway streaming and LLM integration
├── ingestion.py             # Hardware data ingestion script
├── requirements.txt         # Python dependencies
├── Dockerfile               # Production Dockerfile (PaaS ready)
├── Dockerfile.backend       # Development backend Dockerfile
└── docker-compose.yml       # Docker Compose orchestration
```
