// Bonsai Has a 10,000 document limit, so trim all extraneous entries
import client from "./client.mjs";
import {geocode} from "./actions/geocode.mjs";
import {sleep} from "./actions/sleep.mjs";

async function getIndexSize() {
    return client.cat.indices({
        index: process.env.INDEX,
        format: 'json'
    })
    .then(response => Number(response.body[0]['docs.count']))
}

// Bonsai Has a 10,000 document limit, so trim all extraneous entries
async function deleteOverage(limit=10_000) {
    let startCount = await getIndexSize()

    let toDelete = startCount - limit
    let endCount = startCount
    if( toDelete > 0 ) {
        let response = await client.deleteByQuery({
            index: process.env.INDEX,
            size: toDelete,  // will be replaced by maxDocs:
            body: {
                "query": {
                    "bool": {
                        "must": [
                            { "regexp": { "text": "[^\\s]"   } }
                        ],
                        "must_not": [
                            { "exists": { "field": "geocode" } }
                        ],
                    }
                }
            }
        })
        .catch(error => { console.error('deleteOverage', error) })
        await sleep(1000)
        endCount = await getIndexSize()
    }

    let deletedCount = startCount - endCount
    console.log(`deleteOverage() deleted ${deletedCount} documents from ${startCount} leaving ${endCount}`)

    console.assert( endCount === limit )
    return endCount
}

async function main() {
    await deleteOverage()
}
main();
