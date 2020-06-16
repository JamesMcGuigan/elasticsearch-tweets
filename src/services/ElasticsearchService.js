import axios from 'axios';
import _ from 'lodash';

export default class ElasticsearchService {

    //// BUG: ElasticSearch client doesn't work (easily) inside browser
    // static client = new elasticsearch.Client({
    //     node: `https://${process.env.USERNAME}:${process.env.PASSWORD}@${process.env.DATABASE}`,
    //     auth: {
    //         username: process.env.USERNAME,
    //         password: process.env.PASSWORD,
    //     }
    // })

    //// WORKAROUND: use HTTP interface via Axios
    //// TODO: create serverside proxy to avoid exposing username and password to browser
    static url =`https://${process.env.NEXT_PUBLIC_DATABASE}/${process.env.NEXT_PUBLIC_INDEX}`

    static async get(endpoint, source) {
        try {
            // DOCS: https://stackoverflow.com/questions/45291983/sending-requests-to-elasticsearch-with-axios
            return await axios.get(this.url+'/'+endpoint, {
                params: {
                    // source: JSON.stringify(query),
                    source: source,
                    source_content_type: 'application/json'
                },
                responseType: 'json',
                auth: {
                    username: process.env.NEXT_PUBLIC_USERNAME,
                    password: process.env.NEXT_PUBLIC_PASSWORD,
                }
            })
        } catch(exception) {
            console.error('get()', endpoint, source, exception);
            return {};
        }
    }
    static async search(query) {
        let response = await this.get('_search', query)
        return _.get(response, 'data.hits.hits', []).map(hit => _.get(hit,'_source'));
    }
    static async aggregationBuckets(keyword, query={}, size=100) {
        const result = await this.get('_search',{
            "size": 0,
            "query": query,
            "aggs": {
                [keyword]: {
                    "terms": {
                        "size":  size,
                        "field": keyword
                    }
                }
            }
        })
        return _.get(result,`data.aggregations.${keyword}.buckets`)
    }
    static async aggregationTerms(keyword, query={}, size=100) {
        let buckets = await this.aggregationBuckets(keyword, query, size)
        return _(buckets)
            .map(bucket => _.get(bucket,'key'))
            .filter()
            .sort()
            .value()
        ;
    }

}
