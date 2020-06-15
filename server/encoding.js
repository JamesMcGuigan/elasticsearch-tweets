// noinspection JSUnusedGlobalSymbols
export function encode_utf8(s) {
    return unescape(encodeURIComponent(s));
}

// noinspection JSUnusedGlobalSymbols
export function decode_utf8(s) {
    return decodeURIComponent(escape(s));
}

// Remove not ASCII chars and decode URL elements
export function encodeASCII(address) {
    address = address.replace(/[^\x00-\x7F]/g,"");
    address = decodeURIComponent(address);
    return address;
}
