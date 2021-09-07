#!/usr/bin/env node
// Spec: Query ElasticSearch, iterate over each row with a location, check filesystem cache,
//       query Google Geolocation API, Update ElasticSearch with new data, save cache to disk
//
// Geocode Pricing: https://developers.google.com/maps/documentation/geocoding/usage-and-billing
//                  12262 rows * $0.005 = $61.30 | within $200/month Google API allowance

import Promise from 'bluebird';
import {sleep} from './actions/sleep.mjs';
import {bulkUpdate} from "./actions/bulkUpdate.mjs";
import {geocode} from "./apis/geocode.mjs";
import {scanAndScroll, scanAndScrollTextField} from "./actions/scanAndScroll.mjs";
import {elevation} from "./apis/elevation.mjs";
import {nearbysearch} from "./apis/nearbysearch.mjs";

// client.enableLogging();

async function geocodeByLocation() {
    // First-choice lookup is on "location" field

    return scanAndScrollTextField("location", async (locations ) => {
        locations = await Promise.mapSeries(locations, async ( document ) => ( {
            ...document,
            geocode: await geocode(document.location)
        } ));
        locations = locations.filter(row => row.geocode);

        return bulkUpdate(locations);  // Using bulk update syntax
        // return clientUpdates(locations)  // Using looped single request update syntax
    })
}
async function geocodeByText() {
    // If the "location" field failed to match, then then try the "text" field but exclude existing "geocode" matches

    return scanAndScroll({
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
        locations = locations.filter(row => row.geocode);
        return bulkUpdate(locations);  // Using bulk update syntax
        // return clientUpdates(locations)  // Using looped single request update syntax
    })
}


async function elevationByGeocode() {
    return scanAndScroll({
        _source: [ "id", "geocode", "elevation" ],
        size: 1000,
        body: {
            query: {
                "bool": {
                    "must":     [{ "exists": { "field": "geocode"   } }],
                    "must_not": [{ "exists": { "field": "elevation" } }],
                }
            }
        }
    }, async ( documents ) => {
        documents = await Promise.mapSeries(documents, async ( document ) => {
            let location   = document.geocode?.geometry?.location;
            let coords     = `${location?.lat},${location?.lng}`;
            let elevation_ = await elevation(coords);
            return {
                ...document,
                elevation: elevation_,
            }
        })
        documents = documents.filter(row => row.elevation);
        return bulkUpdate(documents);  // Using bulk update syntax
    })
}

async function photosByGeocode() {
    return scanAndScroll({
        _source: [ "id", "geocode", "photos" ],
        size: 1000,
        body: {
            query: {
                "bool": {
                    "must":     [{ "exists": { "field": "geocode" } }],
                    "must_not": [{ "exists": { "field": "photos"  } }],
                }
            }
        }
    }, async ( documents ) => {
        documents = await Promise.mapSeries(documents, async ( document ) => {
            let location   = document.geocode?.geometry?.location;
            let coords     = `${location?.lat},${location?.lng}`;
            let nearbysearch_ = await nearbysearch(coords);
            return {
                ...document,
                photos: nearbysearch_?.photos,
            }
        })
        documents = documents.filter(row => row.photos);
        return bulkUpdate(documents);  // Using bulk update syntax
    })
}


async function main() {
    await geocodeByLocation();
    await sleep(1000);
    await geocodeByText();
    await sleep(1000);
    await elevationByGeocode();
    await photosByGeocode();
}
main();
