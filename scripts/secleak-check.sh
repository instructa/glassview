#!/usr/bin/env bash
set -euo pipefail

echo "=== Security Check ==="

errors=0

if command -v betterleaks >/dev/null 2>&1; then
  echo "Running betterleaks..."
  args=(git --no-banner --redact=100)
  if [ -f .betterleaks.toml ]; then
    args+=(--config .betterleaks.toml)
  elif [ -f .gitleaks.toml ]; then
    args+=(--config .gitleaks.toml)
  fi
  args+=(.)
  if betterleaks "${args[@]}"; then
    echo "betterleaks: OK"
  else
    echo "betterleaks: FAIL"
    errors=$((errors + 1))
  fi
else
  echo "betterleaks not installed, skipping"
fi

if command -v trivy >/dev/null 2>&1; then
  echo "Running trivy secret/misconfig scan..."
  if trivy fs --scanners secret,misconfig --exit-code 1 --quiet .; then
    echo "trivy secret/misconfig scan: OK"
  else
    echo "trivy secret/misconfig scan: FAIL"
    errors=$((errors + 1))
  fi

  echo "Running trivy vulnerability scan (HIGH/CRITICAL)..."
  if trivy fs --scanners vuln --severity HIGH,CRITICAL --ignore-unfixed --exit-code 1 --quiet .; then
    echo "trivy vulnerability scan: OK"
  else
    echo "trivy vulnerability scan: FAIL"
    errors=$((errors + 1))
  fi
else
  echo "trivy not installed, skipping"
fi

if [ "$errors" -eq 0 ]; then
  echo "All security checks passed"
  exit 0
fi

echo "$errors security check(s) failed"
exit 1
