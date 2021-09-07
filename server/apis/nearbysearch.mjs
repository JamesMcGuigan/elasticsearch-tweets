#!/usr/bin/env node

// DOCS: https://developers.google.com/maps/documentation/places/web-service/overview
//
// COORDS=39.7391536,-104.9847034
// curl -L -X GET "https://maps.googleapis.com/maps/api/place/nearbysearch/json?radius=100&key=$GEOCODE_API_KEY&location=$COORDS"
// {
//     "results" : [
//     {
//         "geometry" : {
//             "location" : {
//                 "lat" : 39.7256599,
//                     "lng" : -104.9862355
//             },
//             "viewport" : {
//                 "northeast" : {
//                     "lat" : 39.76038107325997,
//                         "lng" : -104.94063401457
//                 },
//                 "southwest" : {
//                     "lat" : 39.69665019391796,
//                         "lng" : -105.018136900545
//                 }
//             }
//         },
//         "icon" : "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/geocode-71.png",
//         "icon_background_color" : "#7B9EB0",
//         "icon_mask_base_uri" : "https://maps.gstatic.com/mapfiles/place_api/icons/v2/generic_pinlet",
//         "name" : "Central",
//         "photos" : [
//             {
//                 "height" : 4032,
//                 "html_attributions" : [
//                     "\u003ca href=\"https://maps.google.com/maps/contrib/113881584177423156913\"\u003eLindsey Lowery\u003c/a\u003e"
//                 ],
//                 "photo_reference" : "Aap_uED7YFZK8gfnvkbPs-WrBpyoAfvdKIzx0BIc3D2avtrXCXQBNQpra8y2ViSxeOLPTsW8sKR-37YD7OymmpnSPZJndhuo61ctkQVk25gYK_DnrICtdO0fCOT1skjauGcIdVd9F8VqQaa_RK-HKUuiQatnxF-qQETgPtcpCY_b9aSSG2s_",
//                 "width" : 3024
//             }
//         ],
//         "place_id" : "ChIJ8UxaWjZ_bIcRslJSzsQj-sI",
//         "reference" : "ChIJ8UxaWjZ_bIcRslJSzsQj-sI",
//         "scope" : "GOOGLE",
//         "types" : [ "neighborhood", "political" ],
//         "vicinity" : "Denver"
//     }
// ],
//     "status" : "OK"
// }


import axios from "axios";
import dotenv from "dotenv-override-true";
import jetpack from "fs-jetpack";
import _ from "lodash";
import {encodeASCII} from "../libs/encodeASCII.mjs";
import Promise from "bluebird";
import {placephoto} from "./placephoto.mjs";

dotenv.config()

export async function nearbysearch(coords, radius= 100, force= false) {
    coords = encodeASCII(coords);  // BUGFIX: Invalid request. One of the input parameters contains a non-UTF-8 string.
    if( !force && coords in nearbysearch.cache ) { return nearbysearch.cache[coords] }
    try {
        // COORDS=39.7391536,-104.9847034
        // curl -L -X GET "https://maps.googleapis.com/maps/api/place/nearbysearch/json?radius=100&key=$GEOCODE_API_KEY&location=$COORDS"
        let response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
            params: {
                key:      process.env.GEOCODE_API_KEY,
                radius:   radius,
                location: coords
            },
            responseType: 'json',
        })
        const output = _.get(response, 'data.results[0]', null);
        await nearbysearch_extend_placephoto(output, coords);
        nearbysearch.cache[coords] = output
        return output
    } catch(exception) {
        console.error("nearbysearch()", exception);
        return null
    }
}

export async function nearbysearch_extend_placephoto(output, coords) {
    if( output.photos ) {
        output.photos = await Promise.map(output.photos, async (output_photo, index) => {
            // NOTE: photo_reference is dynamically generated on each API call to nearbysearch() and is not a unique cache key
            let cache_id = `${coords}.${output.place_id}.${index}`;
            output_photo.photo_file = await placephoto(output_photo.photo_reference, cache_id);
            return output_photo;
        })
    }
    return output;
}


// This creates a filesystem cache around the function, and auto-persists it to disk on node beforeExit
nearbysearch.cacheFilename = './cache/nearbysearch.json';
try   { nearbysearch.cache = JSON.parse(jetpack.read(nearbysearch.cacheFilename)); }
catch { nearbysearch.cache = {};                                                   }
process.on('beforeExit', () => {
    // DOCS: https://nodejs.org/api/process.html#process_event_beforeexit
    let output = _(nearbysearch.cache)
        .keys()
        .sort()
        .mapKeys(encodeASCII)
        .map(key => `${JSON.stringify(key)}: ${JSON.stringify(nearbysearch.cache[key])}`)
        .join(",\n")
    ;
    output = `{\n${output}\n}`
    jetpack.write(nearbysearch.cacheFilename, output)
});

// // test()
// (async function () {
//     let COORDS = "39.7391536,-104.9847034";
//     await nearbysearch(COORDS, 100, true);
// })();
