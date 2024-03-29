#!/usr/bin/env node

import axios from "axios";
import _ from "lodash";
import jetpack from "fs-jetpack";
import {encodeASCII} from "../libs/encodeASCII.mjs";

export async function placephoto(photo_reference, cache_id, maxwidth=100) {
    // NOTE: photo_reference is dynamically generated by nearbysearch() and is not a unique cache key
    // if( cache_id && cache_id in placephoto.cache ) { return placephoto.cache[cache_id] }
    try {
        // PHOTO_ID=Aap_uED1WkFiMb7m0AmDI0hwzzvrPvtAbBjK3UzSWP6c2ZuxFx-kI6p7PKf8Rdos7v7qtXgxCjd8Sv72UcABZ7R_gvDY5vB_T_5BNn39FZdfCC9OqyvoF1pyIY7B2bv0A8Jf-h-xjNgVAeItOz-kAnIiC988St3obmC9cWYHRCF61eEI4QLf
        // curl -L -X GET "https://maps.googleapis.com/maps/api/place/photo?maxwidth=100&photo_reference=$PHOTO_ID&key=$GEOCODE_API_KEY" --output "./cache/photos/$PHOTO_ID.jpg"
        let response = await axios.get('https://maps.googleapis.com/maps/api/place/photo', {
            params: {
                key:             process.env.GEOCODE_API_KEY,
                maxwidth:        maxwidth,
                photo_reference: photo_reference
            },
            responseType: 'arraybuffer',
        });
        let filename = `./cache/photos/${maxwidth}px/${cache_id}.jpg`;
        jetpack.writeAsync(filename, response.data);
        placephoto.cache[cache_id] = filename
        return filename
    } catch(exception) {
        console.error("placephoto()", exception);
        return null
    }
}


// This creates a filesystem cache around the function, and auto-persists it to disk on node beforeExit
placephoto.cacheFilename = './cache/placephoto.json';
try   { placephoto.cache = JSON.parse(jetpack.read(placephoto.cacheFilename)); }
catch { placephoto.cache = {};                                                 }
process.on('beforeExit', () => {
    // DOCS: https://nodejs.org/api/process.html#process_event_beforeexit
    let output = _(placephoto.cache)
        .keys()
        .sort()
        .mapKeys(encodeASCII)
        .map(key => `${JSON.stringify(key)}: ${JSON.stringify(placephoto.cache[key])}`)
        .join(",\n")
    ;
    output = `{\n${output}\n}`
    jetpack.write(placephoto.cacheFilename, output)
});


// // test()
// (async function () {
//     let PHOTO_ID = "Aap_uED1WkFiMb7m0AmDI0hwzzvrPvtAbBjK3UzSWP6c2ZuxFx-kI6p7PKf8Rdos7v7qtXgxCjd8Sv72UcABZ7R_gvDY5vB_T_5BNn39FZdfCC9OqyvoF1pyIY7B2bv0A8Jf-h-xjNgVAeItOz-kAnIiC988St3obmC9cWYHRCF61eEI4QLf";
//     await placephoto(PHOTO_ID);
// })();
