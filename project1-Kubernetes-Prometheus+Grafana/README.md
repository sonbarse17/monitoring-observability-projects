# Kubernetes Monitoring Stack with Prometheus, Grafana & Loki

A complete monitoring solution for Kubernetes using Prometheus for metrics, Grafana for visualization, and Loki for log aggregation.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Installation Guide](#installation-guide)
  - [1. Install Prometheus](#1-install-prometheus)
  - [2. Install Grafana](#2-install-grafana)
  - [3. Install Loki](#3-install-loki)
  - [4. Deploy Demo Application](#4-deploy-demo-application)
- [Configuration](#configuration)
- [Connecting Components](#connecting-components)
- [Accessing Services](#accessing-services)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

- Kubernetes cluster (v1.20+)
- kubectl configured
- Helm 3.x installed
- At least 4GB RAM available in cluster
- StorageClass for persistent volumes

### Install Helm (if not installed)
```bash
# Windows (using Chocolatey)
choco install kubernetes-helm

# macOS (using Homebrew)
brew install helm

# Linux
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Applications  │───▶│   Prometheus    │───▶│    Grafana      │
│                 │    │   (Metrics)     │    │ (Visualization) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                                              ▲
         │              ┌─────────────────┐             │
         └─────────────▶│      Loki       │─────────────┘
                        │     (Logs)      │
                        └─────────────────┘
```

## 🚀 Installation Guide

### 1. Install Prometheus

#### Step 1.1: Add Prometheus Helm Repository
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
```

#### Step 1.2: Create Monitoring Namespace
```bash
kubectl create namespace monitoring
```

#### Step 1.3: Install Prometheus Stack
```bash
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --set prometheus.prometheusSpec.retention=30d \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=10Gi
```

#### Step 1.4: Verify Prometheus Installation
```bash
kubectl get pods -n monitoring
kubectl get svc -n monitoring
```

### 2. Install Grafana

Grafana is included in the kube-prometheus-stack, but you can also install it separately:

#### Option A: Using Grafana from Prometheus Stack (Recommended)
Grafana is already installed with the prometheus stack above.

#### Option B: Separate Grafana Installation
```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

helm install grafana grafana/grafana \
  --namespace monitoring \
  --set persistence.enabled=true \
  --set persistence.size=10Gi \
  --set adminPassword=admin123
```

### 3. Install Loki

#### Step 3.1: Add Grafana Helm Repository
```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
```

#### Step 3.2: Install Loki
```bash
helm install loki grafana/loki-stack \
  --namespace monitoring \
  --set loki.persistence.enabled=true \
  --set loki.persistence.size=10Gi \
  --set promtail.enabled=true
```

#### Step 3.3: Verify Loki Installation
```bash
kubectl get pods -n monitoring | grep loki
```

### 4. Deploy Demo Application

#### Step 4.1: Deploy the Demo App
```bash
kubectl apply -f demo-app.yml
```

#### Step 4.2: Deploy ServiceMonitor for Prometheus
```bash
kubectl apply -f Monitoring/serviceMonitor.yml
```

## ⚙️ Configuration

### Prometheus Configuration

The ServiceMonitor configuration in `Monitoring/serviceMonitor.yml`:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: demo-app-monitor
  namespace: monitoring
  labels:
    release: prometheus  # Important: Must match Prometheus Helm release
spec:
  selector:
    matchLabels:
      app: demo-app
  namespaceSelector:
    matchNames:
      - default
  endpoints:
    - port: http
      path: /metrics
      interval: 15s
```

### Grafana Data Sources

#### Add Prometheus Data Source
1. Access Grafana UI
2. Go to Configuration → Data Sources
3. Add Prometheus data source:
   - URL: `http://prometheus-kube-prometheus-prometheus.monitoring.svc.cluster.local:9090`
   - Access: Server (default)

#### Add Loki Data Source
1. In Grafana, go to Configuration → Data Sources
2. Add Loki data source:
   - URL: `http://loki.monitoring.svc.cluster.local:3100`
   - Access: Server (default)

## 🔗 Connecting Components

### 1. Connect Prometheus to Applications
- Applications expose `/metrics` endpoint
- ServiceMonitor resources tell Prometheus what to scrape
- Prometheus automatically discovers and scrapes targets

### 2. Connect Grafana to Prometheus
```bash
# Get Prometheus service URL
kubectl get svc -n monitoring | grep prometheus

# Use internal cluster URL in Grafana:
# http://prometheus-kube-prometheus-prometheus.monitoring.svc.cluster.local:9090
```

### 3. Connect Grafana to Loki
```bash
# Get Loki service URL
kubectl get svc -n monitoring | grep loki

# Use internal cluster URL in Grafana:
# http://loki.monitoring.svc.cluster.local:3100
```

### 4. Configure Log Collection
Promtail (installed with Loki) automatically collects logs from all pods and sends them to Loki.

## 🌐 Accessing Services

### Access Grafana
```bash
# Get Grafana admin password
kubectl get secret --namespace monitoring prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 --decode

# Port forward to access Grafana
kubectl port-forward --namespace monitoring svc/prometheus-grafana 3000:80

# Access: http://localhost:3000
# Username: admin
# Password: (from above command)
```

### Access Prometheus
```bash
# Port forward to access Prometheus
kubectl port-forward --namespace monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090

# Access: http://localhost:9090
```

### Access Demo Application
```bash
# Get external IP (if LoadBalancer)
kubectl get svc demo-app

# Or port forward
kubectl port-forward svc/demo-app 8080:80

# Access: http://localhost:8080
# Metrics: http://localhost:8080/metrics
```

## 📊 Sample Grafana Dashboards

### Import Pre-built Dashboards
1. **Kubernetes Cluster Monitoring**: Dashboard ID `7249`
2. **Node Exporter Full**: Dashboard ID `1860`
3. **Kubernetes Pod Monitoring**: Dashboard ID `6417`

### Custom Dashboard for Demo App
```json
{
  "dashboard": {
    "title": "Demo App Monitoring",
    "panels": [
      {
        "title": "HTTP Requests",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{status}}"
          }
        ]
      }
    ]
  }
}
```

## 🔍 Troubleshooting

### Common Issues

#### 1. ServiceMonitor Not Discovered
```bash
# Check if ServiceMonitor is created
kubectl get servicemonitor -n monitoring

# Check Prometheus targets
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
# Visit http://localhost:9090/targets
```

#### 2. Grafana Can't Connect to Prometheus
```bash
# Verify Prometheus service
kubectl get svc -n monitoring | grep prometheus

# Test connectivity from Grafana pod
kubectl exec -n monitoring deployment/prometheus-grafana -- nslookup prometheus-kube-prometheus-prometheus.monitoring.svc.cluster.local
```

#### 3. Loki Not Receiving Logs
```bash
# Check Promtail pods
kubectl get pods -n monitoring | grep promtail

# Check Promtail logs
kubectl logs -n monitoring daemonset/loki-promtail
```

#### 4. Demo App Metrics Not Available
```bash
# Check if demo app is running
kubectl get pods | grep demo-app

# Test metrics endpoint
kubectl port-forward svc/demo-app 8080:80
curl http://localhost:8080/metrics
```

### Useful Commands

```bash
# Check all monitoring resources
kubectl get all -n monitoring

# View Prometheus configuration
kubectl get prometheus -n monitoring -o yaml

# Check ServiceMonitor labels
kubectl get servicemonitor -n monitoring --show-labels

# View Grafana logs
kubectl logs -n monitoring deployment/prometheus-grafana

# Check persistent volumes
kubectl get pv,pvc -n monitoring
```

## 📝 Configuration Files

### Prometheus Values (prometheus-values.yaml)
```yaml
prometheus:
  prometheusSpec:
    serviceMonitorSelectorNilUsesHelmValues: false
    retention: 30d
    storageSpec:
      volumeClaimTemplate:
        spec:
          resources:
            requests:
              storage: 10Gi
```

### Loki Values (loki-values.yaml)
```yaml
loki:
  persistence:
    enabled: true
    size: 10Gi
promtail:
  enabled: true
```

## 🚀 Next Steps

1. **Set up Alerting**: Configure AlertManager rules
2. **Add More Dashboards**: Import community dashboards
3. **Configure Retention**: Set appropriate retention policies
4. **Security**: Enable authentication and RBAC
5. **Backup**: Set up backup for Grafana dashboards and Prometheus data

## 📚 Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/)
- [Kubernetes Monitoring Best Practices](https://kubernetes.io/docs/concepts/cluster-administration/monitoring/)

---

**Note**: This setup is for development/testing. For production, consider:
- High availability setup
- Proper resource limits
- Security configurations
- Backup strategies
- Network policies