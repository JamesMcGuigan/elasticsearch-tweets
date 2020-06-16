#!/usr/bin/env node
// Requires Node v14 or --experimental-modules cli flag
import dotenv from 'dotenv';
import fs from 'fs';
import _ from 'lodash';
import neatCsv from "neat-csv";
import client from './client.mjs';

dotenv.config()

function preprocessCsvRow(row) {
    return _(row)
        .mapValues((value) => String(value).trim())
        .mapValues((value) => { try { return decodeURIComponent(value) } catch(e) { return value } })
        .mapValues((value) => String(value).match(/^\d+$/) ? Number(value) : value )
        .value()
    ;
}

// DOCS: https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html
// DOCS: https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/bulk_examples.html
async function ingest_file(filename) {
    try {
        const text = fs.readFileSync(filename).toString()
        const csv  = ( await neatCsv(text, { columns: true, skip_empty_lines: true }) )
                     .map(preprocessCsvRow)
        const body = csv.flatMap(row => [{ index: { _index: process.env.INDEX, '_id': row.id } }, row])
        const { body: bulkResponse } = await client.bulk({ refresh: true, body })
        console.log(`ingest: ${filename.padEnd(20)} into ${csv.length} documents in ${bulkResponse.took}ms`)
    } catch (error) {
        console.error(error)
    }
}

async function log_index_count(index=process.env.INDEX) {
    const {body: count} = await client.count({index: process.env.INDEX})
    console.log(`ingest: ${count.count} documents in ${process.env.DATABASE}/${index}`)
}



// main()
(async function() {
    const filenames = ["./input/test.csv", "./input/train.csv"]
    await log_index_count(process.env.INDEX)
    await Promise.all( filenames.map(ingest_file) )
    await log_index_count(process.env.INDEX)
})()
