# ElasticSearch Features

## Lex / Yacc 
* Custom lexical grammars for parsing search bar input and translating it into an ElasticSearch json search query
* https://github.com/JamesMcGuigan/python2-timeseries-datapipeline/blob/master/src/lexer/SCLLexer.py
* Jison - https://github.com/zaach/jison 

## ElasticSearch Data Types

* https://www.elastic.co/guide/en/elasticsearch/reference/7.8/mapping-types.html
    * String / Numeric Types / Date / Boolean / Binary / Range / Object / Nested / Array
    * Shape - for arbitrary cartesian geometries
    * Geo-point - for lat/lon points
    * Geo-shape - for complex shapes like polygons
    * shape - arbitrary cartesian geometries.
    * ip - for IPv4 and IPv6 addresses
    * completion - to provide auto-complete suggestions
    * annotated-text - index text containing special markup (typically used for identifying named entities)
    * Search-as-you-type - A text-like field optimized for queries to implement as-you-type completion
    * rank_feature(s) - a "pagerank" field to boost hits at query time
    * percolator - Stored queries
    * alias - have multiple names for the same field 
    * copy_to - store multiple fields under the same name
        * https://www.elastic.co/guide/en/elasticsearch/reference/current/copy-to.html 


## ElasticSearch Text Analysis

* Concepts
    * analyser = 0+ character filters -> exactly 1 tokeniser -> 0+ token filters
    * analysers are run at both index and query time (usually kept the same but can be set separately)
        * https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis.html
        * https://www.elastic.co/guide/en/elasticsearch/reference/current/analyzer-anatomy.html

* Character Filters 
    * HTML Strip Character / Dictionary Mappings / Regular Expressions
    * https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-charfilters.html

* Analyser
    * https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-analyzers.html
        * The standard analyzer divides text into terms on word boundaries, as defined by the Unicode Text Segmentation algorithm. It removes most punctuation, lowercases terms, and supports removing stop words.
    * Custom Analysers - https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-custom-analyzer.html
    * Regular Expressions - https://www.elastic.co/guide/en/elasticsearch/reference/7.8/analysis-pattern-analyzer.html 
    * Foreign Languages - https://www.elastic.co/guide/en/elasticsearch/reference/7.8/analysis-lang-analyzer.html#french-analyzer 

* Tokenizers
    * https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-tokenizers.html
    * Autocomplete = Edge n-gram tokenizer
        * https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-edgengram-tokenizer.html 
    * UAX URL Email Tokenizer
        * enable if users want to search for email addresses
        * https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-uaxurlemail-tokenizer.html

 
* Token filter
    * Phrase Queries
        * Shingle - https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-shingle-tokenfilter.html 

    * Stemming with Hunspell Dictionary
        * https://www.elastic.co/guide/en/elasticsearch/reference/current/stemming.html
        * https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-hunspell-tokenfilter.html

    * Lemmatizers (new)
        * stemming but based on word meaning
        * And if you really want the dimension reduction and recall improvement of a stemmer in your information retrieval pipeline, you should probably also use a lemmatizer right before the stemmer.
        * Requires elastic search plugin
            * https://github.com/vhyza/elasticsearch-analysis-lemmagen
            * https://github.com/vhyza/lemmagen-lexicons

    * Synonyms with WordNet
        * https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-synonym-tokenfilter.html
        * https://docs.bonsai.io/article/113-using-wordnet-with-bonsai 
        * synonym_graph - https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-synonym-graph-tokenfilter.html
        * Multiplexer - https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-multiplexer-tokenfilter.html
        * Light stemmer -> synonyms -> full stemmer 
https://discuss.elastic.co/t/synonym-analysis-before-or-after-stemmer/134347/3

    * Similarity Scoring
        * similarity mapping - https://www.elastic.co/guide/en/elasticsearch/reference/current/similarity.html
        * Minhash - https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-minhash-tokenfilter.html
        * Vector - https://www.elastic.co/blog/text-similarity-search-with-vectors-in-elasticsearch
        * more_like_this / similarity query - https://rebeccabilbro.github.io/intro-doc-similarity-with-elasticsearch/
        * Term Suggester Queries
            * https://learning.oreilly.com/library/view/advanced-elasticsearch-70/9781789957754/dec60c60-a990-4113-a54d-991ab3271ef0.xhtml
            * https://www.elastic.co/guide/en/elasticsearch/reference/7.7/search-suggesters.html#term-suggester
        * Did you mean API - https://stackoverflow.com/questions/40260655/does-google-allow-businesses-to-use-did-you-mean-feature-as-an-api-i-would-l 

    * Phonetic token filter - catch potentual typos and misspellings 
        * https://www.elastic.co/guide/en/elasticsearch/plugins/7.8/analysis-phonetic-token-filter.html
        * https://qbox.io/blog/improving-search-experience-by-using-email-tokenizers-ngram-and-phonetic-concepts-1 
        * Fuzzy queries (slow) via Levenshtein edit distance - https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-fuzzy-query.html


## ElasticSearch Searching

* Queries
    * Full Text Queries - https://www.elastic.co/guide/en/elasticsearch/reference/current/full-text-queries.html 
    * Geo Queries - https://www.elastic.co/guide/en/elasticsearch/reference/current/geo-queries.html 
    * Distance / More Like This / Rank / Script - https://www.elastic.co/guide/en/elasticsearch/reference/current/specialized-queries.html
    * Scoring by distance 
        * https://discuss.elastic.co/t/scoring-by-distance/75141
        * https://www.elastic.co/guide/en/elasticsearch/guide/current/decay-functions.html
        * https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-function-score-query.html
    * Highlighting results within text - https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-body.html#request-body-search-highlighting

* Custom Relevance Scoring
    * Relevance / Query / Filter Context - https://www.elastic.co/guide/en/elasticsearch/reference/current/query-filter-context.html
    * rank_feature(s) field/query - https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-rank-feature-query.html 
    * rescore query - https://www.elastic.co/guide/en/elasticsearch/reference/7.5/search-request-body.html#request-body-search-rescore
    * query term boosting - https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-boost.html 

* Aggregations 
    * Cardinality - https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-metrics-cardinality-aggregation.html
    * Stats - https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-metrics-extendedstats-aggregation.html 
    * Adjacency Matrix - https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-adjacency-matrix-aggregation.html 
    * Diversified Sampler - https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-diversified-sampler-aggregation.html 
    * Significant Terms Aggregation - https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-significantterms-aggregation.html

    * Geo Bounds Aggregation - https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-metrics-geobounds-aggregation.html 
    * Geo Centroid Aggregation - https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-metrics-geocentroid-aggregation.html 
    * Geo Distance Aggregation - https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-geodistance-aggregation.html 
    * GeoHash Grid Aggregation - https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-geohashgrid-aggregation.html 
    * GeoTile Grid Aggregation - https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-geotilegrid-aggregation.html 


## ElasticSearch Debugging
* _analyze - https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-analyze.html 
* _validate - https://www.elastic.co/guide/en/elasticsearch/reference/current/search-validate.htm
* _explain - https://www.elastic.co/guide/en/elasticsearch/reference/current/search-explain.html
* profiling - https://www.elastic.co/guide/en/elasticsearch/reference/current/search-profile.htmll


## ElasticSearch Languages

* Moustache Templating 
    * Write common/complex elasticsearch queries as Moustache templates
    * Frontend query syntax is then simplified to: template_id + [ key=value pairs ]
        * https://www.elastic.co/guide/en/elasticsearch/reference/current/search-template.html 
    * Simple searches can also be done using URL ?q=field:value
        * https://learning.oreilly.com/library/view/advanced-elasticsearch-70/9781789957754/38eecf75-ad1b-4c2f-a563-6c9c038759d7.xhtml

* Painless Java Scripting
    * Run Java-like code inside ElasticSearch to rewrite data faster without needing data IO or reingest
    * Changes should be duplicated inside parser logic for consistency with next reingest
    * https://www.elastic.co/guide/en/elasticsearch/painless/7.8/painless-guide.html

* SQL (X-Pack)
    * A new alterative query syntax based on SQL
    * https://www.elastic.co/guide/en/elasticsearch/reference/current/xpack-sql.html

* Spark and Hadoop
    * https://www.elastic.co/guide/en/elasticsearch/hadoop/current/spark.html


ElasticSearch Pipeline

* Example Code
    * https://github.com/JamesMcGuigan/elasticsearch-tweets

* Logstash
    * Simplified ingestion data pipelines with input/output plugins for common data sources
    * Alterative is to write custom data pipeline in Bash/Javascript/Python
    * https://www.elastic.co/guide/en/logstash/7.8/input-plugins.html
    * https://www.elastic.co/guide/en/logstash/7.8/output-plugins.html

* Dynamic / Strict Index Mappings
    * dynamic=strict will throw an exception on ingest if you add fields to your data that are not in your mapping
    * https://www.elastic.co/guide/en/elasticsearch/reference/current/dynamic-field-mapping.html

* Index Aliases
    * Updating schemas for existing data requires reindexing. 
    * This can be done with zero downtime using versioned indexes with an alias.
        * Create _index_v1 and alias to index. 
        * Schema update script creates _index_v2 and initiates reindex from _index_v1
        * Upon success, public alias is switched and _index_v1 deleted
        * https://www.coenterprise.com/blog/how-to-perform-an-elasticsearch-index-migration-using-aliases/
    * Schema versioning
        * Diffing source schema json with _mapping is unreliable due to dynamic mappings 
        * Reliable method is to create SHA hash of filesystem sorted json schema and add to index _meta
        * Reingest script can compare SHA hashes and decide if reindexing is required
        * https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-meta-field.html

* Machine Learning (X-Pack)
    * Use with Kibana Data Visualiser  
        * https://www.elastic.co/blog/machine-learning-data-visualizer-and-modules
    * Time Series Data 
        * Anomaly Explorer + Forecasting 
        * Geographic / Time / Information Content Anomalies
        * https://www.elastic.co/guide/en/machine-learning/current/xpack-ml.html
    * DataFrame / Tabular Data
        * Outlier Detection / Regression / Classification
        * https://www.elastic.co/guide/en/machine-learning/current/ml-dfa-overview.html
    * Example: 
        * https://learning.oreilly.com/library/view/advanced-elasticsearch-70/9781789957754/3a5ccf30-d333-4b8f-9256-b31fddd25fe1.xhtml 

