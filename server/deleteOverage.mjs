// Bonsai Has a 10,000 document limit, so trim all extraneous entries
import client from "./client.mjs";
import {geocode} from "./apis/geocode.mjs";
import {sleep} from "./actions/sleep.mjs";
import yargs from "yargs";

async function getIndexSize() {
    return client.cat.indices({
        index: process.env.INDEX,
        format: 'json'
    })
    .then(response => Number(response.body[0]['docs.count']))
}

// Bonsai Has a 10,000 document limit, so trim all extraneous entries
async function deleteOverage(limit= 10_000) {
    let startCount, endCount, toDelete;
    for( let filterStage of [ 0, 1, 2 ] ) {
        startCount = endCount = await getIndexSize()
        toDelete   = startCount - limit
        if( toDelete > 0 ) {
            let response = await client.deleteByQuery({
                index: process.env.INDEX,
                size: toDelete,  // will be replaced by maxDocs:
                body: {
                    "query": {
                        "bool": {
                            "must_not": filterStage <= 0 ? [
                                { "exists": { "field": "target"  } },
                                { "exists": { "field": "geocode" } },
                            ] : [],
                            "must": filterStage <= 1 ? [
                                { "regexp": { "text": "[^\\s]"   } }
                            ] : [],
                        }
                    }
                }
            })
            .catch(error => { console.error('deleteOverage', error) })
            await sleep(1000)
            endCount = await getIndexSize()
        }
    }

    let deletedCount = startCount - endCount
    console.log(`deleteOverage() deleted ${deletedCount} documents from ${startCount} leaving ${endCount}`)

    console.assert( endCount === limit )
    return endCount
}


function parseArgv() {
    const argv = yargs
        .count('verbose')
            .default('verbose', 0)
            .alias('v', 'verbose')
        .describe('limit', 'maximum number of documents to keep')
            .default('limit', 10_000)
            .alias('n', 'limit')
        .argv;
    return argv;
}

async function main() {
    let argv = parseArgv()
    if( argv.verbose ) {
        client.enableLogging();
    }
    await deleteOverage(argv.limit)
}
main();
