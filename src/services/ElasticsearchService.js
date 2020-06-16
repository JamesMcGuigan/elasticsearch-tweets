import axios from 'axios';
import _ from 'lodash';
import memoize from 'memoizee-decorator';

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

    static async search(query) {
        try {
            // DOCS: https://stackoverflow.com/questions/45291983/sending-requests-to-elasticsearch-with-axios
            let response = await axios.get(this.url+'/_search', {
                params: {
                    source: JSON.stringify(query),
                    source_content_type: 'application/json'
                },
                responseType: 'json',
                auth: {
                    username: process.env.NEXT_PUBLIC_USERNAME,
                    password: process.env.NEXT_PUBLIC_PASSWORD,
                }
            })
            return _.get(response, 'data.hits.hits', []).map(hit => _.get(hit,'_source'));
        } catch(exception) {
            console.error('search()', exception, query);
            return [];
        }
    }

    @memoize
    static async fetchGeocodeTweets() {
        return this.search({
            "size": 100,
            "query": {
                "bool": {
                    "must": [
                        { "match":   { "target": 1        } },
                        { "exists":  { "field": "geocode" } }
                    ]
                }
            }
        })
    }
}
