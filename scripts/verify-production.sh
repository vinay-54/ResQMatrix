#!/bin/bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# IDMS — Production End-to-End Verification
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# Usage: bash scripts/verify-production.sh
#
# Override URLs with environment variables:
#   BACKEND=https://your-backend.onrender.com \
#   ML=https://your-ml.up.railway.app \
#   FRONTEND=https://your-app.vercel.app \
#   bash scripts/verify-production.sh

BACKEND="${BACKEND:-https://idms-backend.onrender.com}"
ML="${ML:-https://idms-ml-production.up.railway.app}"
FRONTEND="${FRONTEND:-https://idms.vercel.app}"

PASS=0
FAIL=0

check() {
  local label="$1"
  local expected="$2"
  local actual="$3"

  printf "  %-28s" "$label"
  if [ "$actual" = "$expected" ]; then
    echo "✅ $actual"
    PASS=$((PASS + 1))
  else
    echo "❌ Got $actual (expected $expected)"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  IDMS Production Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Backend:  $BACKEND"
echo "  ML:       $ML"
echo "  Frontend: $FRONTEND"
echo ""
echo "── Backend ──────────────────────────────────"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$BACKEND/health")
check "Health endpoint" "200" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BACKEND/api/sensors" \
  -H "Authorization: Bearer invalid")
check "Auth guard (sensors)" "401" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BACKEND/api/sos" \
  -H "Authorization: Bearer invalid")
check "Auth guard (SOS)" "401" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BACKEND/api/alerts" \
  -H "Authorization: Bearer invalid")
check "Auth guard (alerts)" "401" "$STATUS"

echo ""
echo "── ML Service ─────────────────────────────"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 "$ML/health")
check "Health endpoint" "200" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "$ML/predict/DSN-001?hours=6")
check "Prediction endpoint" "200" "$STATUS"

echo ""
echo "── Frontend ─────────────────────────────────"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$FRONTEND")
check "Main page" "200" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$FRONTEND/firebase-messaging-sw.js")
check "Service worker" "200" "$STATUS"

# Check if response contains key PWA markers
BODY=$(curl -s --max-time 10 "$FRONTEND" 2>/dev/null)
if echo "$BODY" | grep -qi "IDMS\|ResQMatrix\|disaster"; then
  printf "  %-28s" "HTML contains app name"
  echo "✅"
  PASS=$((PASS + 1))
else
  printf "  %-28s" "HTML contains app name"
  echo "❌"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Results: $PASS passed, $FAIL failed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
