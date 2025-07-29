# Demo App for Kubernetes Monitoring

Simple Node.js Express app with Prometheus metrics and structured logging for Loki.

## Features

- **Prometheus Metrics**: `/metrics` endpoint with custom counters
- **Structured Logging**: JSON logs for Loki aggregation
- **Health Check**: Basic HTTP endpoints

## Endpoints

- `GET /` - Hello world response
- `GET /metrics` - Prometheus metrics

## Logs Format

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "Request received",
  "service": "demo-app",
  "method": "GET",
  "path": "/"
}
```

## Build & Deploy

```bash
# Build Docker image
docker build -t demo-app .

# Deploy to Kubernetes
kubectl apply -f ../demo-app.yml

# Check logs
kubectl logs -f deployment/demo-app
```

## Monitoring Integration

- **Prometheus**: Scrapes `/metrics` via ServiceMonitor
- **Loki**: Collects structured JSON logs via Promtail
- **Grafana**: Visualizes both metrics and logs