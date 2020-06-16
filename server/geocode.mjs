#!/usr/bin/env node
// Spec: Query ElasticSearch, iterate over each row with a location, check filesystem cache,
//       query Google Geolocation API, Update ElasticSearch with new data, save cache to disk

import axios from 'axios';
import Promise from 'bluebird';
import dotenv from 'dotenv';
import jetpack from "fs-jetpack";
import _ from 'lodash';
import { performance } from 'perf_hooks';
import client from './client.mjs';


dotenv.config()

async function scanAndScroll(params, callback) {
    let output = [];
    try {
        let response = await client.search({
            index:  process.env.INDEX,
            // type:   "esIndexType",
            scroll: "2m",  // Specify how long a consistent view of the index should be maintained for scrolled search
            size:   100,   // Number of hits to return (default: 10)
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

async function scanAndScrollField(fieldname, callback) {
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



// Remove not ASCII chars and decode URL elements
export function encodeASCII(address) {
    try {
        address = String(address).replace(/[^\x00-\x7F]/g,"").trim();
        address = decodeURIComponent(address);  // May throw exception
    } catch(e) {
        return address
    }
    return address;
}
async function geocode(address) {
    address = encodeASCII(address);  // BUGFIX: Invalid request. One of the input parameters contains a non-UTF-8 string.
    if( address in geocode.cache ) { return geocode.cache[address] }
    try {
        // curl -G "https://maps.googleapis.com/maps/api/geocode/json?key=$GOOGLE_API_KEY" --data-urlencode "address=$LOCATION"
        let response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
                key:     process.env.GOOGLE_API_KEY,
                address: address
            },
            responseType: 'json',
        })
        const output = _.get(response, 'data.results[0]', null)
        geocode.cache[address] = output
        return output
    } catch(exception) {
        console.error("geocode()", exception);
        return null
    }
}
// This creates a filesystem cache around the function, and auto-persists it to disk on node beforeExit
geocode.cacheFilename = './cache/geocode.json';
try   { geocode.cache = JSON.parse(jetpack.read(geocode.cacheFilename)); }
catch { geocode.cache = {};                                              }
process.on('beforeExit', () => {
    // DOCS: https://nodejs.org/api/process.html#process_event_beforeexit
    let output = _(geocode.cache)
        .keys()
        .sort()
        .mapKeys(encodeASCII)
        .map(key => `${JSON.stringify(key)}: ${JSON.stringify(geocode.cache[key])}`)
        .join(",\n")
    ;
    output = `{\n${output}\n}`
    jetpack.write(geocode.cacheFilename, output)
});


async function bulkUpdate(documents) {
    if( documents.length === 0 ) { return }

    const bulkParams = {
        refresh: true,
        index:   process.env.INDEX,
        body:    documents.flatMap(row => [
            { update: { '_id': row.id, _type: "doc" } },
            { doc: _.omit(row, 'id') }
        ])
    }
    try {
        const { body: bulkResponse } = await client.bulk(bulkParams)
        console.log(`geocode: updated ${_.get(bulkResponse, 'items.length')} documents in ${bulkResponse.took}ms for ${process.env.DATABASE}/${process.env.INDEX}`)
    } catch(exception) {
        console.error("bulkUpdate() - body", bulkParams);
        console.error("bulkUpdate() - exception", exception);
    }
}


async function clientUpdate(document) {
    try {
        return await client.update({
            index: process.env.INDEX,
            id:    document.id,
            body: {
                doc: document
            }
        });
    } catch(exception) {
        console.error("clientUpdate()", exception);
        return null
    }
}
// noinspection JSUnusedLocalSymbols
async function clientUpdates(documents) {
    try {
        let startTime = performance.now()
        let responses = await Promise.mapSeries(documents, clientUpdate)  // BUGFIX: mapSeries to prevent overloading ElasticSearch
        let successes = responses.filter(response => _.get(response, 'body.result') === 'updated').length;
        let timeTaken = performance.now() - startTime;
        console.log(`updated ${successes}/${documents.length} documents in ${timeTaken.toFixed(0)}ms for ${process.env.DATABASE}/${process.env.INDEX}`)
        return successes
    } catch(exception) {
        console.error("clientUpdates()", exception);
        return null
    }
}


async function main() {
    await scanAndScrollField("location", async (locations) => {
        locations = await Promise.mapSeries(locations, async (document) => ({
            ...document,
            geocode: await geocode(document.location)
        }));
        locations = locations.filter(row => row.geocode)

        return bulkUpdate(locations)        // Using bulk update syntax
        // return clientUpdates(locations)  // Using looped single request update syntax
    })
}
main();

