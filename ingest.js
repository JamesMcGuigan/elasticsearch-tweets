#!/usr/bin/env node
require('dotenv').config()
const fs         = require('fs')
const neatCsv    = require('neat-csv');
const client     = require('./client.js')

// DOCS: https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html
// DOCS: https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/bulk_examples.html
async function ingest_file(filename) {
    try {
        const text = fs.readFileSync(filename).toString()
        const csv  = await neatCsv(text, { columns: true, skip_empty_lines: true })
        const body = csv.flatMap(row => [{ index: { _index: process.env.INDEX, '_id': row.id } }, row])
        const { body: bulkResponse } = await client.bulk({ refresh: true, body })
        console.log(`${filename.padEnd(20)} ingested ${csv.length} documents in ${bulkResponse.took}ms`)
    } catch (error) {
        console.error(error)
    }
}

async function log_index_count(index=process.env.INDEX) {
    const {body: count} = await client.count({index: process.env.INDEX})
    console.log(`${count.count} documents in ${process.env.DATABASE}/${index}`)
}

if (typeof module !== 'undefined' && !module.parent) {
    (async function() {
        const filenames = ["./input/test.csv", "./input/train.csv"]
        await log_index_count(process.env.INDEX)
        await Promise.all( filenames.map(ingest_file) )
        await log_index_count(process.env.INDEX)
    })()
}
