import Promise from "bluebird";
import _ from "lodash";
import { performance } from "perf_hooks";
import client from "../client.mjs";

export async function bulkUpdate(documents) {
    if( documents.length === 0 ) { return }

    const bulkParams = {
        refresh: true,
        index:   process.env.INDEX,
        body:    documents.flatMap(row => [
            { update: { '_id': row.id } },
            { doc: _.omit(row, 'id') }
        ])
    }
    try {
        const { body: bulkResponse } = await client.bulk(bulkParams)
        console.log(`geocode: updated ${_.get(bulkResponse, 'items.length')} documents in ${bulkResponse.took}ms for ${process.env.ELASTICSEARCH}/${process.env.INDEX}`)
    } catch(exception) {
        console.error("bulkUpdate() - body", bulkParams);
        console.error("bulkUpdate() - exception", exception);
    }
}


export async function clientUpdate(document) {
    try {
        return await client.update({
            index: process.env.INDEX,
            id:    document.id,
            body: {
                doc: document
            }
        });
    } catch(exception) {
        console.error("clientUpdate()", exception);
        return null
    }
}

// noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols
export async function clientUpdates(documents) {
    try {
        let startTime = performance.now()
        let responses = await Promise.mapSeries(documents, clientUpdate)  // BUGFIX: mapSeries to prevent overloading ElasticSearch
        let successes = responses.filter(response => _.get(response, 'body.result') === 'updated').length;
        let timeTaken = performance.now() - startTime;
        console.log(`updated ${successes}/${documents.length} documents in ${timeTaken.toFixed(0)}ms for ${process.env.ELASTICSEARCH}/${process.env.INDEX}`)
        return successes
    } catch(exception) {
        console.error("clientUpdates()", exception);
        return null
    }
}
