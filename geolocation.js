#!/usr/bin/env node
import client from './client.js';
import dotenv from 'dotenv';
import jetpack from "fs-jetpack";

// Query ElasticSearch, iterate over each row with a location, check filesystem cache, query Google Geolocation API
// Update ElasticSearch with new data, save cache to disk

dotenv.config()

async function scanAndScroll(query) {
    let output = [];
    try {
        let response = await client.search({
            index:  process.env.INDEX,
            // type:   "esIndexType",
            scroll: "2m",  // Specify how long a consistent view of the index should be maintained for scrolled search
            size:   100,   // Number of hits to return (default: 10)
            body:   query
        });
        // console.log("geolocation.js:23:scanAndScroll", body['hits']);

        while( response.body['hits']['total'].value > output.length ) {
            output = [
                ...output,
                ...response.body['hits']['hits'].map(document => document._source)
            ]
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


// main()
(async function() {
    const cacheFilename = './data/geolocation.json'
    const cache = await jetpack.readAsync(cacheFilename).then(JSON.parse).catch(() => ({}))
    const locations = await scanAndScroll({
        "query": {
            "exists": { "field": "location" }  // Query is matching empty string
        }
    });
    console.log(locations)
})()
