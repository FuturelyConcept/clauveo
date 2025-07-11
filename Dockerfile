# Dockerfile for Claude CLI environment
FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install Claude CLI
RUN npm install -g @anthropic-ai/claude-code

# Create working directory
WORKDIR /app

# Copy project files
COPY . .

# Expose port for any web services
EXPOSE 3000

# Default command
CMD ["bash"]