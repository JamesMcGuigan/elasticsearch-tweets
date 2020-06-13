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

## Create Index and Reingest
TODO: create index aliases and reindex with new mapping
```
bash ./schema.sh     
node ./ingest.js
```  
``` 
{"acknowledged":true}
{"acknowledged":true,"shards_acknowledged":true,"index":"twitter"}
green open twitter m3TajAbIRzCn3devhk-kcg 1 1 0 0 460b 230b

0 documents in kaggle-tweets-7601590568.eu-west-1.bonsaisearch.net:443/twitter
./input/test.csv     ingested 3263 documents in 387ms
./input/train.csv    ingested 7613 documents in 879ms
10876 documents in kaggle-tweets-7601590568.eu-west-1.bonsaisearch.net:443/twitter
```
