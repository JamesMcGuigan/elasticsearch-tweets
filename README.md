# Kaggle Tweets with ElasticSearch
- https://www.kaggle.com/c/nlp-getting-started/

# ElasticSearch with Bonzai
- https://bonsai.io/
- https://app.bonsai.io/clusters/kaggle-tweets-7601590568
```    
source ./.env
curl -X GET "$DATABASE_URL"
```
```
{
  "name" : "ip-172-31-46-132",
  "cluster_name" : "elasticsearch",
  "cluster_uuid" : "9-66PY3iSj-gXGcLGUFe4A",
  "version" : { "number" : "7.2.0", "build_flavor" : "oss", "build_type" : "tar", "build_hash" : "508c38a", "build_date" : "2019-06-20T15:54:18.811730Z", "build_snapshot" : false, "lucene_version" : "8.0.0", "minimum_wire_compatibility_version" : "6.8.0", "minimum_index_compatibility_version" : "6.0.0-beta1" },
  "tagline" : "You Know, for Search"
}
``` 

## Recreate Index
TODO: create index aliases and reindex with new mapping
```
INDEX='twitter'
curl -X DELETE "$DATABASE_URL/$INDEX"       
curl -X PUT    "$DATABASE_URL/$INDEX" --data $(json5 ./schema.json5) -H "Content-Type: application/json"
curl -X GET    "$DATABASE_URL/_cat/indices"
```
```
{"acknowledged":true}
{"acknowledged":true,"shards_acknowledged":true,"index":"twitter"}
green open twitter k_FDoQRxSM-z_K7J6ZqkBg 1 1 0 0 460b 230b
```
