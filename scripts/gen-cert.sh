#!/usr/bin/env bash
set -euo pipefail

HOST=${1:-localhost}
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CERT_DIR="$ROOT_DIR/front/certs"
SHARED_DIR="$ROOT_DIR/certs"
mkdir -p "$CERT_DIR" "$SHARED_DIR"

SAN="DNS:${HOST}"
if [[ "$HOST" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  SAN="$SAN,IP:${HOST}"
fi

openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout "$CERT_DIR/dev.key" \
  -out "$CERT_DIR/dev.crt" \
  -days 365 \
  -subj "/CN=${HOST}" \
  -addext "subjectAltName=${SAN}"

cp "$CERT_DIR/dev.key" "$SHARED_DIR/dev.key"
cp "$CERT_DIR/dev.crt" "$SHARED_DIR/dev.crt"

echo "Generated certs in $CERT_DIR for host: $HOST"
