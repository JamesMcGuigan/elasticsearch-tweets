#!/usr/bin/env bash
cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"
set -x

source .env
curl -X DELETE https://$USERNAME:$PASSWORD@$DATABASE/$INDEX
curl -X PUT    https://$USERNAME:$PASSWORD@$DATABASE/$INDEX/ --data $(json5 ./schema.json5) -H "Content-Type: application/json"
