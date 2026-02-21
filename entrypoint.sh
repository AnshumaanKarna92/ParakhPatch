#!/bin/bash
# Start the Pathway pipeline in the background
python pipeline.py &
PIPELINE_PID=$!

# Start the ingestion engine in the background
python ingestion.py &
INGESTION_PID=$!

# Start the FastAPI server using uvicorn
uvicorn api:app --host 0.0.0.0 --port 8000
