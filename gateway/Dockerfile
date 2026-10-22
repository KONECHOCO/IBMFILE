# Plexa DB Gateway + web client.
# Build from the repository root:  docker build -f gateway/Dockerfile -t plexa-gateway .
FROM node:20-slim AS web
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM python:3.12-slim
# Java runtime for the IBM i JT400 JDBC driver
RUN apt-get update && apt-get install -y --no-install-recommends openjdk-17-jre-headless \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /opt/plexa/gateway
COPY gateway/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY gateway/ .
COPY --from=web /app/dist /opt/plexa/dist
ENV PLEXA_HOST=0.0.0.0 PLEXA_PORT=8787 PLEXA_DATA_DIR=/data PLEXA_WEB_DIST=/opt/plexa/dist
VOLUME /data
EXPOSE 8787
CMD ["python", "run.py"]
