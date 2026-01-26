#!/bin/bash
# ============================================================
# DuckDNS: Atualização Automática de IP Dinâmico
# Execute com cron: */10 * * * * /opt/atc-gestao/scripts/duckdns-update.sh
# ============================================================

TOKEN="seu-token-aqui"
DOMAIN="seu-app.duckdns.org"
LOG_FILE="/opt/atc-gestao/logs/duckdns.log"

# Detectar IP público
IP=$(curl -s --connect-timeout 5 --max-time 10 ifconfig.me 2>/dev/null || echo "FAILED")

if [[ "$IP" == "FAILED" || -z "$IP" ]]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERRO: Não conseguiu detectar IP público" >> "$LOG_FILE"
  exit 1
fi

# Atualizar no DuckDNS
RESPONSE=$(curl -s --connect-timeout 5 --max-time 10 \
  "https://www.duckdns.org/update?domains=${DOMAIN%.*}&token=${TOKEN}&ip=${IP}")

echo "[$(date '+%Y-%m-%d %H:%M:%S')] IP: $IP | Response: $RESPONSE" >> "$LOG_FILE"

if [[ "$RESPONSE" == *"OK"* ]]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✓ DuckDNS atualizado com sucesso" >> "$LOG_FILE"
  exit 0
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ Falha na atualização (token inválido?)" >> "$LOG_FILE"
  exit 1
fi
