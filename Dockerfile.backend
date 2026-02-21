# Use official Python 3.10 slim (Linux)
FROM python:3.10-slim-bullseye

# Set working directory
WORKDIR /app

# Install system dependencies (Pathway needs these)
RUN apt-get update --fix-missing && apt-get install -y --fix-missing \
    build-essential \
    curl \
    software-properties-common \
    git \
    dos2unix \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
# Ensure correct line endings before pip install
RUN dos2unix requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
# Copy application code
COPY . .

# Ensure entrypoint is executable and has linux line endings
RUN dos2unix entrypoint.sh && chmod +x entrypoint.sh

# Expose port (FastAPI default)
EXPOSE 8000

# Command to run all backend processes
CMD ["bash", "entrypoint.sh"]
