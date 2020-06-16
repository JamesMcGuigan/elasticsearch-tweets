import axios from "axios";
import dotenv from "dotenv";
import jetpack from "fs-jetpack";
import _ from "lodash";

dotenv.config()

// Remove not ASCII chars and decode URL elements
export function encodeASCII(address) {
    try {
        // NOTE: geocode() get better results without .trim()
        address = String(address).replace(/[^\x00-\x7F]/g,"");
        address = decodeURIComponent(address);  // May throw exception
    } catch(e) {
        return address
    }
    return address;
}

export async function geocode(address) {
    address = encodeASCII(address);  // BUGFIX: Invalid request. One of the input parameters contains a non-UTF-8 string.
    if( address in geocode.cache ) { return geocode.cache[address] }
    try {
        // curl -G "https://maps.googleapis.com/maps/api/geocode/json?key=$GOOGLE_API_KEY" --data-urlencode "address=$LOCATION"
        let response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
                key:     process.env.GEOCODE_API_KEY,
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
