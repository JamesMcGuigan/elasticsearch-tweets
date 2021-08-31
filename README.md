# Kaggle Tweets with ElasticSearch
- Visualization: https://tweets.elasticsearch.jamesmcguigan.com

## ElasticSearch Writeups
- [ElasticSearch Features](ELASTICSEARCH_FEATURES.md)
- [ElasticSearch Queries](ELASTICSEARCH_QUERIES.md)
- [ElasticSearch Upgrade Process](ELASTICSEARCH_UPGRADE.md)

## ElasticSearch Schemas
- [server/schema.json5](server/schema.json5) - Simple schema used by Web Visualization 
- [server/schema_features.json5](server/schema_features.json5) - Example schema showing advanced analyser configuration

## Javascript Code Examples
- [server/client.mjs](server/client.mjs) - Create ElasticSearch Javascript Client  
- [server/actions/bulkUpdate.mjs](server/actions/bulkUpdate.mjs) - Bulk Update
- [server/actions/scanAndScroll.mjs](server/actions/scanAndScroll.mjs) - Scan And Scroll 
- [server/actions/geocode.mjs](server/actions/geocode.mjs) - Google Geocode API 
- [server/SchemaUpdate.mjs](server/SchemaUpdate.mjs) - Schema Update Script
- [src/services/ElasticsearchService.js](src/services/ElasticsearchService.js) - Wrapper Functions for Common Queries 
- [src/components/TweetHeatMap/TweetHeatMap.jsx](src/components/TweetHeatMap/TweetHeatMap.jsx) - ElasticSearch Queries in React  

## ElasticSearch Hosting with Bonsai
- Host: https://bonsai.io/
- ElasticSearch: https://app.bonsai.io/clusters/kaggle-tweets-3926018095
- Kibana: https://kaggle-tweets-3926018095.k4a.bonsaisearch.net/app/kibana
- Dataset: https://www.kaggle.com/c/nlp-getting-started/ 

## .env
.env secrets are not committed to github  
```
cp ./.env.template       ./.env 
cp ./.env.local.template ./.env.local 
vim ./.env ./.env.local
```
cat .env
``` 
USERNAME=
PASSWORD=
ELASTICSEARCH=kaggle-tweets-7601590568.eu-west-1.bonsaisearch.net:443
INDEX=twitter
ELASTICSEARCH_URL=https://$USERNAME:$PASSWORD@$ELASTICSEARCH
SCHEMA=server/schema.json5
GEOCODE_API_KEY=
MAPS_API_KEY=
```
cat .env.local
```
NEXT_PUBLIC_USERNAME=
NEXT_PUBLIC_PASSWORD=
NEXT_PUBLIC_ELASTICSEARCH=kaggle-tweets-7601590568.eu-west-1.bonsaisearch.net:443
NEXT_PUBLIC_ELASTICSEARCH_URL=https://${NEXT_PUBLIC_USERNAME}:${NEXT_PUBLIC_PASSWORD}@kaggle-tweets-7601590568.eu-west-1.bonsaisearch.net:443
NEXT_PUBLIC_INDEX=twitter
NEXT_PUBLIC_MAPS_API_KEY=
```

## Create Index and Reingest
```
nvm use --lts
bash ./server/schema.sh     
node --experimental-modules ./server/ingest.mjs
node --experimental-modules ./server/geocode.mjs 
node --experimental-modules ./server/deleteOverage.mjs 
```  
``` 
{"acknowledged":true}
{"acknowledged":true,"shards_acknowledged":true,"index":"twitter"}
green open twitter   Qews-7jyTPGhTCb45z3eyA 1 1 0 0   460b   230b
green open .kibana_1 XsYy7txoR8Oa178heSj9OA 1 1 8 0 97.6kb 35.4kb

ingest: 0 documents in kaggle-tweets-7601590568.eu-west-1.bonsaisearch.net:443/twitter
ingest: ./input/test.csv     into 3263 documents in 421ms
ingest: ./input/train.csv    into 7613 documents in 990ms
ingest: 10876 documents in kaggle-tweets-7601590568.eu-west-1.bonsaisearch.net:443/twitter
geocode: updated 198 documents in 192ms for kaggle-tweets-7601590568.eu-west-1.bonsaisearch.net:443/twitter
geocode: updated 164 documents in 124ms for kaggle-tweets-7601590568.eu-west-1.bonsaisearch.net:443/twitter
geocode: updated 228 documents in 161ms for kaggle-tweets-7601590568.eu-west-1.bonsaisearch.net:443/twitter
geocode: updated 170 documents in 117ms for kaggle-tweets-7601590568.eu-west-1.bonsaisearch.net:443/twitter
geocode: updated 112 documents in 86ms for kaggle-tweets-7601590568.eu-west-1.bonsaisearch.net:443/twitter
geocode: updated 104 documents in 105ms for kaggle-tweets-7601590568.eu-west-1.bonsaisearch.net:443/twitter
```


## Update Schema and Reindex
With .env file
```
node --experimental-modules ./server/SchemaUpdate.mjs
```           

Without .env file (or to override)
```
node --experimental-modules ./server/SchemaUpdate.mjs \
--schema ./server/schema.json5 \
--alias twitter \
--elasticsearch https://kaggle-tweets-7601590568.eu-west-1.bonsaisearch.net:443 \
--username username \
--password password
```
