# Security Policy

## Supported Versions

| Version | Supported     |
|---------|---------------|
| main    | ✅            |
| dev/*   | ⚠️ In progress |

## Reporting a Vulnerability

If you discover a security vulnerability, please do **not** open a public issue.

Email: yeahaur@gmail.com

You will receive a response within 48 hours. Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

## Security Measures

This project implements a full DevSecOps pipeline with the following controls:

### 1. Dependency Scanning (SCA)
- `npm audit` runs on every push/PR
- Fails build on **High or Critical** vulnerabilities
- Workflow: `.github/workflows/sca.yml`

### 2. Static Application Security Testing (SAST)
- ESLint with `eslint-plugin-security` scans for insecure code patterns
- Detects: unsafe regex, object injection, eval usage, path traversal risks
- Workflow: `.github/workflows/sast.yml`

### 3. Container Image Scanning
- Trivy scans the Docker image for OS and library CVEs
- Fails build on **Critical** vulnerabilities
- Workflow: `.github/workflows/trivy.yml`

### 4. Dynamic Application Security Testing (DAST)
- OWASP ZAP baseline scan runs against the live containerized app
- Fails build on **Medium or higher** findings
- Workflow: `.github/workflows/dast.yml`

## Security Pipeline Overview
Push / PR
│
├── npm audit (SCA) → blocks High/Critical deps
├── ESLint Security (SAST) → blocks insecure code patterns
├── Trivy (Container Scan) → blocks Critical CVEs in image
└── OWASP ZAP (DAST) → blocks Medium+ runtime findings
All workflows are defined in `.github/workflows/`.
