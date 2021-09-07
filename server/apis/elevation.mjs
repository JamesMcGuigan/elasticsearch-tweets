#!/usr/bin/env node

// DOCS: https://developers.google.com/maps/documentation/elevation/overview
// curl -G "https://maps.googleapis.com/maps/api/elevation/json?key="$elevation_API_KEY --data-urlencode "locations=39.7391536,-104.9847034"
// {
//     "results" : [
//     {
//         "elevation" : 1608.637939453125,
//         "location" : {
//             "lat" : 39.7391536,
//             "lng" : -104.9847034
//         },
//         "resolution" : 4.771975994110107
//     }
// ],
//     "status" : "OK"
// }

import jetpack from "fs-jetpack";
import axios from "axios";
import dotenv from "dotenv-override-true";
import _ from "lodash";
import {encodeASCII} from "../libs/encodeASCII.mjs";

dotenv.config();

export async function elevation(coords) {
    coords = encodeASCII(coords);  // BUGFIX: Invalid request. One of the input parameters contains a non-UTF-8 string.
    if( coords in elevation.cache ) { return elevation.cache[coords]; }
    try {
        // curl -G "https://maps.googleapis.com/maps/api/elevation/json?key=$GEOCODE_API_KEY" --data-urlencode "location=$COORDS"
        let response = await axios.get('https://maps.googleapis.com/maps/api/elevation/json', {
            params: {
                key:       process.env.GEOCODE_API_KEY,
                locations: coords,
            },
            responseType: 'json'
        });
        const output = _.get(response, 'data.results[0]', null);
        elevation.cache[coords] = output;
        return output.elevation;
    } catch(exception) {
        console.error("elevation()", exception);
        return null;
    }
}

// This creates a filesystem cache around the function, and auto-persists it to disk on node beforeExit
elevation.cacheFilename = './cache/elevation.json';
try   { elevation.cache = JSON.parse(jetpack.read(elevation.cacheFilename)); }
catch { elevation.cache = {};                                                }
process.on('beforeExit', () => {
    // DOCS: https://nodejs.org/api/process.html#process_event_beforeexit
    let output = _(elevation.cache)
        .keys()
        .sort()
        .mapKeys(encodeASCII)
        .map(key => `${JSON.stringify(key)}: ${JSON.stringify(elevation.cache[key])}`)
        .join(",\n")
    ;
    output = `{\n${output}\n}`;
    jetpack.write(elevation.cacheFilename, output);
});


// // test()
// (async function () {
//     let COORDS = "39.7391536,-104.9847034";
//     await elevation(COORDS);
// })();
