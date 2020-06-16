import _ from "lodash";
import client from "../client.mjs";

export async function scanAndScroll(params, callback) {
    let output = [];
    try {
        let response = await client.search({
            index:  process.env.INDEX,
            // type:   "esIndexType",
            scroll: "2m",  // Specify how long a consistent view of the index should be maintained for scrolled search
            size:   1000,  // Number of hits to return (default: 10)
            ...params,
        });

        while( response.body['hits']['total'].value > output.length ) {
            let sources = response.body['hits']['hits'].map(document => document._source)
            output      = [ ...output, ...sources ];
            if( _.isFunction(callback) ) {
                callback(sources)
            }

            response = await client.scroll({
                scrollId: response.body['_scroll_id'],
                scroll:   '10s'
            })
        }
    } catch (error) {
        console.log(`ERROR: scanAndScroll() - ${error}`)
    }
    return output;
}

export async function scanAndScrollField(fieldname, callback) {
    return await scanAndScroll({
        // https://stackoverflow.com/questions/14745210/create-elasticsearch-curl-query-for-not-null-and-not-empty
        _source: ['id', fieldname],
        body: {
            query: {
                //// Regexp is potentially slow
                "bool": {
                    "must": [
                        { "exists": { "field": fieldname   } },
                        { "regexp": { [fieldname]: "[^\s]" } }
                    ]
                }

                //// Doesn't work for type=text fields
                //// BUGFIX: schema.json5 | { "type": "text", fielddata: true, "fields": { "keyword": { "type":  "keyword" } } },
                // "bool": {
                //     "must":     { "exists": { "field": field           } },
                //     "must_not": { "term":   { [`${field}.keyword`]: "" } },
                // },

                //// Using Lucine syntax
                // query_string: {
                //     default_field: '*.*',
                //     query:         'location: ?*',
                // },
            }
        }
    }, callback);
}
