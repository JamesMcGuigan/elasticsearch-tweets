import dotenv from "dotenv-override-true";

dotenv.config();

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
