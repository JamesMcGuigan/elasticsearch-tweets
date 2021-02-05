#!/usr/bin/env node
// Spec: Query ElasticSearch, iterate over each row with a location, check filesystem cache,
//       query Google Geolocation API, Update ElasticSearch with new data, save cache to disk
//
// Geocode Pricing: https://developers.google.com/maps/documentation/geocoding/usage-and-billing
//                  12262 rows * $0.005 = $61.30 | within $200/month Google API allowance

import Promise from 'bluebird';
import {sleep} from './actions/sleep.mjs';
import {bulkUpdate} from "./actions/bulkUpdate.mjs";
import {geocode} from "./actions/geocode.mjs";
import {scanAndScroll, scanAndScrollField} from "./actions/scanAndScroll.mjs";

async function geocodeByLocation() {
    return await scanAndScrollField("location", async ( locations ) => {
        locations = await Promise.mapSeries(locations, async ( document ) => ( {
            ...document,
            geocode: await geocode(document.location)
        } ));
        locations = locations.filter(row => row.geocode)

        return bulkUpdate(locations)  // Using bulk update syntax
        // return clientUpdates(locations)  // Using looped single request update syntax
    })
}
async function geocodeByText() {
    return await scanAndScroll({
        size: 1000,
        body: {
            query: {
                "bool": {
                    "must":     [{ "regexp": { "text": "[^\s]"    } }],
                    "must_not": [{ "exists": { "field": "geocode" } }],
                }
            }
        }
    }, async ( locations ) => {
        locations = await Promise.mapSeries(locations, async ( document ) => ( {
            ...document,
            geocode: await geocode(document.text)
        } ));
        locations = locations.filter(row => row.geocode)
        return bulkUpdate(locations)  // Using bulk update syntax
        // return clientUpdates(locations)  // Using looped single request update syntax
    })
}

async function main() {
    await geocodeByLocation()
    await sleep(1000)
    await geocodeByText()
}
main();

