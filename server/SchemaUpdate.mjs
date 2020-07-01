#!/usr/bin/env node
import elasticsearch from '@elastic/elasticsearch';
import Promise from 'bluebird';
import dotenv from 'dotenv';
import jetpack from 'fs-jetpack';
import jsonKeysSort from 'json-keys-sort';
import json5 from 'json5';
import _ from 'lodash';
import sjcl from 'sjcl';
import yargs from 'yargs';

dotenv.config()

// Logic Flow:
// - Check if index exists
//   - if not:  upload to @${INDEX}_v1 and alias to ${INDEX}
//   - if true: check _meta for ${SHA} hash
//     - if unchanged: exit
//     - if different: upload to @${INDEX}_v2, wait for success, alias to ${INDEX}, delete _${INDEX}_v2



class SchemaUpdate {

    constructor(argv={}) {
        this.argv   = { ...this.parseArgv(), ...argv }
        this.alias  = this.argv.alias;  // NOTE: this may also be defined as --index or env.INDEX
        this.schema = json5.parse(jetpack.read(this.argv.schema))
    }
    async init() {
        this.client  = this.getClient(this.argv)
        await this.client.ping()
        this.indices = await this.getIndices();
        this.aliases = await this.getAliases();
        this.indicesAndAliases = [ ...this.indices, ...this.aliases ]
    }


    // Top Level Actions

    async run() {
        if( !this.client ) { await this.init(); }
        if( this.aliasExists() || this.aliasIsIndex() ) {
            if( await this.schemaNeedsUpdating() ) {
                return await this.uploadSchemaAnReindex();
            } else {
                return this.doNothing()
            }
        } else {
            return await this.uploadSchemaWithAlias()
        }
    }
    doNothing() { }
    async uploadSchemaWithAlias() {
        await this.uploadSchema()
        await this.updateAlias()
    }
    async uploadSchemaAnReindex() {
        await this.uploadSchema()
        await this.reindex()
        await this.updateAlias()
        await this.deleteOldIndices()
    }


    // Actions

    async uploadSchema() {
        // DOCS: https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-meta-field.html
        const index = this.getNextVersionedIndex();
        let schema  = _.cloneDeep(this.schema)
        _.set(schema, 'mappings._meta.sha256', this.schemaSha256())

        // DOCS: https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#_indices_create
        const response = await this.client.indices.create({
            index: index,
            body:  schema,
        })
        return response
    }

    async reindex() {
        let startCount = _(await this.client.count({ index: this.alias })).get('body.count')

        // DOCS: https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/master/reindex_examples.html
        let index    = this.getNextVersionedIndex()
        // noinspection JSUnusedLocalSymbols
        let response = await this.client.reindex({
            waitForCompletion: false,  // This causes timeouts on Bonasi
            refresh: true,
            timeout: "24h",  // set higher if required, also requires setting in: Client.requestTimeout
            scroll:  "24h",
            // slices:  "auto",
            body: {
                source: { index: this.alias, },
                dest:   { index: index },
            }
        });

        //// bonsai_exception - Forbidden action
        // const taskID = _.get(response, 'body.task')
        // try {
        //     const taskID = _.get(response, 'body.task')
        //     const task  = await this.client.tasks.get({task_id: taskID })
        //     console.log("SchemaUpdate.mjs:94:reindex", "response",response);
        // } catch(exception) {
        //     console.error('reindex() exception: ',exception)
        // }

        // WORKAROUND:
        // waitForCompletion causes timeouts, and Bonasi doesn't allow access to tasks
        // poll for the document count and wait for reindex to reach the number from the parent alias
        while( startCount > _(await this.client.count({ index: index })).get('body.count') ) {
            await new Promise(r => setTimeout(r, 10*1000));
        }
    }

    async deleteOldIndices() {
        // DOCS: https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#_indices_deletealias
        Promise.map( _.without(this.aliases, this.alias), (alias) => {
            // aliases will probably be empty
            // noinspection JSCheckFunctionSignatures
            this.client.indices.deleteAlias({
                name: alias
            })
        });
        // DOCS: https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#_indices_delete
        return this.client.indices.delete({
            index: this.indices,
            ignore_unavailable: true,
            expand_wildcards: 'none'
        });
    }

    async updateAlias() {
        if( this.aliasIsIndex() ) {
            await this.client.indices.delete({
                index: this.alias,
                expand_wildcards: 'none'
            })
        }
        const index = this.getNextVersionedIndex();
        return this.client.indices.putAlias({
            index: index,
            name:  this.alias,
        })
    }


    // Alias Resolution

    aliasIsIndex() { return this.indices.includes(this.alias); }
    aliasExists()  { return this.aliases.includes(this.alias); }

    // getExistingIndex() {
    //     if( this.aliasIsIndex() ) {
    //         return this.alias;
    //     } else {
    //         // DOCS: https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#_indices_getalias
    //         const response = client.indices.getAlias({
    //             name: this.alias,
    //             expand_wildcards: 'none',
    //         })
    //     }
    // }

    getIndexPrefix() {
        // BUGFIX: "Invalid index name [_twitter_v1], must not start with '_', '-', or '+'",
        return`~${this.alias}_v`
    }

    getAliasNumber() {
        const prefix = this.getIndexPrefix()
        const number = _(this.indicesAndAliases)
            .filter(alias => alias.startsWith(prefix)  )
            .map(alias    => alias.replace(prefix, '') )
            .map(Number)
            .filter(number => !Number.isNaN(number))
            .sortBy()
            .reverse()
            .first()
        ;
        return number || 0;
    }

    getNextVersionedIndex() {
        let number = this.getAliasNumber() + 1;
        const prefix = this.getIndexPrefix();
        return prefix + number
    }

    schemaSha256() {
        const sortedSchema = jsonKeysSort.sort(this.schema);
        const string       = JSON.stringify(sortedSchema);
        return sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(string));
    }

    async schemaNeedsUpdating() {
        // DOCS: https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#_indices_getmapping
        const response = await this.client.indices.getMapping({
            index: this.alias,
            expand_wildcards: 'none'
        })
        const indexSha256 = _(_(response.body).values().first()).get('mappings._meta.sha256')
        const filesystemSha256 = this.schemaSha256()
        return indexSha256 !== filesystemSha256
    }


    // Lookups

    getClient() {
        let clientConf = {
            node: `https://${this.argv.username}:${this.argv.password}@${this.argv.elasticsearch}`,
            requestTimeout: 24*60*60,  // BUGFIX: reindex timeout
        }
        if( this.argv.username && this.argv.password) {
            clientConf.auth = {
                username: this.argv.username,
                password: this.argv.password,
            }
        }
        const client = new elasticsearch.Client(clientConf);
        if( this.argv.verbose ) {
            client.on('request', (error, request) => {
                if( error ) {
                    console.error(JSON.stringify(error,null,4))
                } else {
                    console.info(request.meta.request.params.method, request.meta.request.params.path, request.meta.request.params.body || '')
                }
            })
            client.on('response', (error, result) => {
                if( error ) {
                    console.error(JSON.stringify(error,null,4))
                } else {
                    console.info(JSON.stringify(result.body,null,4), '\n')
                }
            });
        }
        return client;
    }

    async getIndices() {
        try {
            const prefix   = this.getIndexPrefix();
            const response = await this.client.cat.indices({ format: 'json', s: 'index', 'index': '*' })
            return response.body
                .map(row => row.index)
                .filter(index => !index.startsWith('.'))
                .filter(index => index === this.alias || index.startsWith(prefix) )
        } catch(e) {
            return []
        }
    }
    async getAliases() {
        try {
            const prefix   = this.getIndexPrefix();
            const response = await this.client.cat.aliases({ format: 'json', s: 'alias' })
            return response.body
                .map(row => row.alias)
                .filter(alias => !alias.startsWith('.'))
                .filter(alias => alias === this.alias || alias.startsWith(prefix) )
        } catch(e) {
            return []
        }
    }


    // Argv

    parseArgv() {
        const argv = yargs
            .usage('Usage: --schema [schema] --alias [str] --elasticsearch [str] --username [str] --password [str]')
            .describe('schema', 'path to schema mapping')
                .default('schema', process.env.SCHEMA)
                .alias('s', 'schema')
            .describe('alias', 'name of public-facing alias')
                .default('alias', process.env.INDEX)
                .alias('i', 'alias')
                .alias('a', 'alias')
                .alias('index', 'alias')
            .describe('elasticsearch', 'elasticsearch url (domain and port)')
                .default('elasticsearch', process.env.ELASTICSEARCH)
                .alias('e', 'elasticsearch')
            .describe('username', 'elasticsearch username')
                .default('username', process.env.USERNAME)
                .alias('u', 'username')
            .describe('password', 'elasticsearch password')
                .default('password', process.env.PASSWORD)
                .alias('p', 'password')
            .count('verbose')
                .default('verbose', 1)
                .alias('v', 'verbose')
            .argv;

        argv.elasticsearch = argv.elasticsearch || '';  // BUGFIX: linter
        if( !argv.alias         ) { throw Error(`SchemaUpdate: --alias not defined: ${argv}`); }
        if( !argv.elasticsearch ) { throw Error(`SchemaUpdate: --elasticsearch not defined: ${argv}`); }
        if( !argv.schema        ) { throw Error(`SchemaUpdate: --schema not defined: ${argv}`); }
        if( jetpack.exists(argv.schema) !== 'file' ) { throw Error(`SchemaUpdate: invalid schema file: ${argv.schema}`); }

        return argv;
    }

}



(async function() {
    const schemaUpdate = new SchemaUpdate()
    await schemaUpdate.run()
})()
