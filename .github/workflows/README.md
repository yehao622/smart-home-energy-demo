# GitHub Actions — Security Workflows

| Workflow               | File       | Trigger  | Blocks on                     |
|------------------------|------------|----------|-------------------------------|
| Dependency Audit (SCA) | `sca.yml`  | push, PR | High/Critical npm vulns       |
| Static Analysis (SAST) | `sast.yml` | push, PR | ESLint security violations    |
| Container Scan         | `trivy.yml`| push, PR | Critical CVEs in Docker image |
| DAST                   | `dast.yml` | push, PR | Medium+ ZAP findings          |

## Local Testing

Run ZAP locally:
```bash
docker compose up -d
docker run --rm \
  -v $(pwd)/zap-reports:/zap/wrk:rw \
  --network host \
  zaproxy/zap-stable:latest \
  zap-baseline.py -t http://localhost:8080 -r zap-report.html -I
```

Run Trivy locally:
```bash
docker build -t smart-home-backend:latest ./backend
trivy image smart-home-backend:latest
```
