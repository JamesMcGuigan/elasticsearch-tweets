# Kaggle Tweets with ElasticSearch
- https://www.kaggle.com/c/nlp-getting-started/

# ElasticSearch with Bonzai
- Host: https://bonsai.io/
- ElasticSearch: https://app.bonsai.io/clusters/kaggle-tweets-7601590568
- Kibana: https://kaggle-tweets-7601590568.k4a.bonsaisearch.net/app/kibana 
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


## Search Query
```   
curl -s -H "Content-Type: application/json" -X GET $DATABASE_URL/twitter/_search \
-d '{ "size": 1, "query": { "match": { "target": 1 } } }' | json_pp 
```
```
curl -s -H "Content-Type: application/json" -X GET $DATABASE_URL/twitter/_search \
> -d '{ "size": 1, "query": { "match": { "target": 1 } } }' | json_pp 
{
   "_shards" : {
      "failed" : 0,
      "skipped" : 0,
      "successful" : 1,
      "total" : 1
   },
   "hits" : {
      "hits" : [
         {
            "_id" : "1",
            "_index" : "twitter",
            "_score" : 1,
            "_source" : {
               "id" : "1",
               "keyword" : "",
               "location" : "",
               "target" : "1",
               "text" : "Our Deeds are the Reason of this #earthquake May ALLAH Forgive us all"
            },
            "_type" : "_doc"
         }
      ],
      "max_score" : 1,
      "total" : {
         "relation" : "eq",
         "value" : 3271
      }
   },
   "timed_out" : false,
   "took" : 1
}
```

## Aggregation Query
```
curl -s -H "Content-Type: application/json" -X GET $DATABASE_URL/twitter/_search \
-d '{ "size": 0, "aggs": { "location": { "terms": { "size": 20, "field": "location" } } } }' | 
json_pp | grep "key" | awk '{ print $3 }' | tr '\n' ' '
```
```
"usa" "new" "the" "ca" "york" "london" "united" "canada" "in" "of" "uk" "city" "california" "ny" "san" "england" "washington" "australia" "los" "states" 
```
