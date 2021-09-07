# ElasticSearch Queries

## Javascript Code Examples
- [server/SchemaUpdate.mjs](server/SchemaUpdate.mjs) - Schema Update Script

- [server/client.mjs](server/client.mjs) - Create ElasticSearch Javascript Client  
- [server/actions/bulkUpdate.mjs](server/actions/bulkUpdate.mjs) - Bulk Update
- [server/actions/scanAndScroll.mjs](server/actions/scanAndScroll.mjs) - Scan And Scroll 
- [src/services/ElasticsearchService.js](src/services/ElasticsearchService.js) - Wrapper Functions for Common Queries 
- [src/components/TweetHeatMap/TweetHeatMap.jsx](src/components/TweetHeatMap/TweetHeatMap.jsx) - ElasticSearch Queries in React  

- [server/actions/geocode.mjs](server/apis/geocode.mjs) - Google Geocode API
- [server/actions/elevation.mjs](server/apis/elevation.mjs) - Google Elevation API
- [server/actions/nearbysearch.mjs](server/apis/nearbysearch.mjs) - Google Places Nearby Search API
- [server/actions/placephoto.mjs](server/apis/placephoto.mjs) - Google Places Photo API


## ElasticSearch Status
So that you know ElasticSearch is up 
```    
source ./.env
curl -X GET "$ELASTICSEARCH_URL"
```
```
{
  "name": "ip-172-31-46-132",
  "cluster_name": "elasticsearch",
  "cluster_uuid": "9-66PY3iSj-gXGcLGUFe4A",
  "version": { "number": "7.2.0", "build_flavor": "oss", "build_type": "tar", "build_hash": "508c38a", "build_date": "2019-06-20T15:54:18.811730Z", "build_snapshot": false, "lucene_version": "8.0.0", "minimum_wire_compatibility_version": "6.8.0", "minimum_index_compatibility_version": "6.0.0-beta1" },
  "tagline": "You Know, for Search"
}
``` 

## Query Response Format
```
{
   "_shards": {
      "failed": 0,
      "skipped": 0,
      "successful": 1,
      "total": 1
   },
   "hits": {
      "hits": [
         {
            "_id": "1",
            "_index": "twitter",
            "_score": 1,
            "_source": {
               "id": "1",
               "keyword": "",
               "location": "",
               "target": "1",
               "text": "Our Deeds are the Reason of this #earthquake May ALLAH Forgive us all"
            },
            "_type": "_doc"
         }
      ],
      "max_score": 1,
      "total": {
         "relation": "eq",
         "value": 3271
      }
   },
   "timed_out": false,
   "took": 1
}
```

## URL Queries

* Query Syntax: https://www.elastic.co/guide/en/elasticsearch/reference/current/search-search.html#search-search-api-example
* JSON Formatter Chrome Extension - https://chrome.google.com/webstore/detail/json-formatter/bcjindcccaagfpapjjmafapmmgkkhgoa/related?hl=en

Show first result + hits.total.value
```
curl "$ELASTICSEARCH_URL/twitter/_search?pretty&size=2"
```

Search for term in all fields
```
curl "$ELASTICSEARCH_URL/twitter/_search?pretty&q=cats"
```

Search for term in named field
```
curl "$ELASTICSEARCH_URL/twitter/_search?pretty&q=location:UK"
```

## Lucine Query Syntax

- https://logz.io/blog/elasticsearch-queries/
- https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html
```
curl -X GET "$ELASTICSEARCH_URL/twitter/_search?pretty" -H 'Content-Type: application/json' \
-d '{ "query": { "query_string": { "query": "text:cats^3  location:UK" } } }' 
```

## Term / Match Query
- https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-term-query.html
- https://www.elastic.co/guide/en/elasticsearch/reference/7.6/query-dsl-match-query.html

This searches for a value in a specific field.

The difference between a term query and a match query is:
- a term query is not analyzed will search for the exact terms present in inverted index. This means that depluralization, stemming, Americanization, and other preprocessing steps will not be applied to your search query.
- a match query will be preprocessed in the same way as the original dataset, which matches how the search bar will translate the user input (but without access to Lucine Query Syntax)   
  
```   
curl -s -H "Content-Type: application/json" -X GET $ELASTICSEARCH_URL/twitter/_search \
-d '{ "explain": true, "profile": true, "size": 1, "query": { "match": { "text": "cat" } } }' | json_pp 
```

```
curl -s -H "Content-Type: application/json" -X GET $ELASTICSEARCH_URL/twitter/_search \
-d '{ "explain": true, "profile": true, "query": { "match": { "text": "earthquake" } } }' | json_pp 
```

## Aggregation Query
- [Cardinality](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-metrics-cardinality-aggregation.html)
- [Stats](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-metrics-extendedstats-aggregation.html) 
- [Adjacency Matrix](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-adjacency-matrix-aggregation.html) 
- [Diversified Sampler](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-diversified-sampler-aggregation.html) 
- [Significant Terms Aggregation](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-significantterms-aggregation.html)
- [Geo Bounds Aggregation](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-metrics-geobounds-aggregation.html) 
- [Geo Centroid Aggregation](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-metrics-geocentroid-aggregation.html) 
- [Geo Distance Aggregation](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-geodistance-aggregation.html) 
- [GeoHash Grid Aggregation](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-geohashgrid-aggregation.html) 
- [GeoTile Grid Aggregation](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-geotilegrid-aggregation.html) 
```
curl -s -H "Content-Type: application/json" -X GET $ELASTICSEARCH_URL/twitter/_search \
-d '{ "size": 0, "aggs": { "location": { "terms": { "size": 20, "field": "location" } } } }' |  
json_pp | grep "key" | awk '{ print $3 }' | perl -p -e 's/^"|"$//g'
```
```
usa
new
the
ca
york
london
united
canada
in
of
uk
city
california
ny
san
england
washington
australia
los
states
```

### Term Vectors
- https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-termvectors.html

View the exact tokens stored in ElasticSearch for a given document.
- This requires doing a normal search first to locate the id of a given document

```
curl -s -H "Content-Type: application/json" -X GET $ELASTICSEARCH_URL/twitter/_termvectors/1?pretty -d '{ "fields": ["*"], "offsets": true, "payloads": true, "positions": true,"term_statistics": true, "field_statistics": true }' 
{
  "_index": "~twitter_v4",
  "_type": "_doc",
  "_id": "1",
  "_version": 1,
  "found": true,
  "took": 1,
  "term_vectors": {
    "keyword": {
      "field_statistics": { "sum_doc_freq": 11741, "doc_count": 11741, "sum_ttf": 11741 },
      "terms": {
        "": {"doc_freq": 92, "ttf": 92, "term_freq": 1, "tokens": [{"position": 0, "start_offset": 0, "end_offset": 0}]}
      }
    },
    "location.keyword": {
      "field_statistics": { "sum_doc_freq": 11741, "doc_count": 11741, "sum_ttf": 11741 },
      "terms": {
        "": {"doc_freq": 3865, "ttf": 3865, "term_freq": 1, "tokens": [{"position": 0, "start_offset": 0, "end_offset": 0}]}}
    },
    "text": {
      "field_statistics": { "sum_doc_freq": 181752, "doc_count": 11741, "sum_ttf": 193009 },
      "terms": {
        "all":        {"doc_freq":  378, "ttf":  396, "term_freq": 1, "tokens": [{"position": 12, "start_offset": 66, "end_offset": 69}]},
        "allah":      {"doc_freq":   12, "ttf":   12, "term_freq": 1, "tokens": [{"position":  9, "start_offset": 49, "end_offset": 54}]},
        "are":        {"doc_freq":  605, "ttf":  643, "term_freq": 1, "tokens": [{"position":  2, "start_offset": 10, "end_offset": 13}]},
        "deeds":      {"doc_freq":    2, "ttf":    2, "term_freq": 1, "tokens": [{"position":  1, "start_offset":  4, "end_offset":  9}]},
        "earthquake": {"doc_freq":   80, "ttf":   89, "term_freq": 1, "tokens": [{"position":  7, "start_offset": 34, "end_offset": 44}]},
        "forgive":    {"doc_freq":    4, "ttf":    4, "term_freq": 1, "tokens": [{"position": 10, "start_offset": 55, "end_offset": 62}]},
        "may":        {"doc_freq":  113, "ttf":  118, "term_freq": 1, "tokens": [{"position":  8, "start_offset": 45, "end_offset": 48}]},
        "of":         {"doc_freq": 2565, "ttf": 2850, "term_freq": 1, "tokens": [{"position":  5, "start_offset": 25, "end_offset": 27}]},
        "our":        {"doc_freq":  156, "ttf":  164, "term_freq": 1, "tokens": [{"position":  0, "start_offset":  0, "end_offset":  3}]},
        "reason":     {"doc_freq":   29, "ttf":   29, "term_freq": 1, "tokens": [{"position":  4, "start_offset": 18, "end_offset": 24}]},
        "the":        {"doc_freq": 3692, "ttf": 4953, "term_freq": 1, "tokens": [{"position":  3, "start_offset": 14, "end_offset": 17}]},
        "this":       {"doc_freq":  723, "ttf":  755, "term_freq": 1, "tokens": [{"position":  6, "start_offset": 28, "end_offset": 32}]},
        "us":         {"doc_freq":  174, "ttf":  183, "term_freq": 1, "tokens": [{"position": 11, "start_offset": 63, "end_offset": 65}]}
      }
    }
  }
}
```


## GoogleAPI - Geolocation
- https://developers.google.com/maps/documentation/geocoding/start
```
LOCATION="North Druid Hills, GA"
curl -G "https://maps.googleapis.com/maps/api/geocode/json?key=$GOOGLE_API_KEY" --data-urlencode "address=$LOCATION"  
```                                                                                                                   
```
{
   "results": [
      {
         "address_components": [
            { "long_name": "North Druid Hills", "short_name": "North Druid Hills", "types": [ "locality", "political" ] },
            { "long_name": "DeKalb County",     "short_name": "Dekalb County",     "types": [ "administrative_area_level_2", "political" ] },
            { "long_name": "Georgia",           "short_name": "GA",                "types": [ "administrative_area_level_1", "political" ] },
            { "long_name": "United States",     "short_name": "US",                "types": [ "country", "political" ] }
         ],
         "formatted_address": "North Druid Hills, GA, USA",
         "geometry": {
            "bounds": {
               "northeast": { "lat": 33.840573,  "lng": -84.30390589999999 },
               "southwest": { "lat": 33.7997699, "lng": -84.3485249 }
            },
            "location": { "lat": 33.816771, "lng": -84.3132574 },
            "location_type": "APPROXIMATE",
            "viewport": {
               "northeast": { "lat": 33.840573,  "lng": -84.30390589999999 },
               "southwest": { "lat": 33.7997699, "lng": -84.3485249 }
            }
         },
         "place_id": "ChIJlXu9ykAG9YgRiAFOs6TzMoA",
         "types": [ "locality", "political" ]
      }
   ],
   "status": "OK"
}
```
