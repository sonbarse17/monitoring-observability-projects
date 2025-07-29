const express = require('express');
const client = require('prom-client');

const app = express();
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

// Structured logging function
const log = (level, message, meta = {}) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    service: 'demo-app',
    ...meta
  }));
};

// Custom metric
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'status']
});

app.get('/', (req, res) => {
  log('info', 'Request received', {
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent')
  });
  
  httpRequestCounter.inc({ method: req.method, status: '200' });
  res.send('Hello from demo app!');
  
  log('info', 'Response sent', {
    method: req.method,
    path: req.path,
    status: 200
  });
});

app.get('/metrics', async (req, res) => {
  log('debug', 'Metrics endpoint accessed');
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  log('info', 'Server started', { port: PORT });
});