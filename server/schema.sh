#!/usr/bin/env bash
cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" || exit

source ../.env
curl -w "\n" -X DELETE "https://$USERNAME:$PASSWORD@$ELASTICSEARCH/$INDEX"
curl -w "\n" -X PUT    "https://$USERNAME:$PASSWORD@$ELASTICSEARCH/$INDEX" --data "$(json5 ./schema.json5)" -H "Content-Type: application/json"
curl -w "\n" -X GET    "https://$USERNAME:$PASSWORD@$ELASTICSEARCH/_cat/indices"
