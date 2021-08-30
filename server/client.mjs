#!/usr/bin/env node
import elasticsearch from '@elastic/elasticsearch'
import dotenv from 'dotenv-override-true'

dotenv.config()


const client = new elasticsearch.Client({
    node: `https://${process.env.USERNAME}:${process.env.PASSWORD}@${process.env.ELASTICSEARCH}`,
    auth: {
        username: process.env.USERNAME,
        password: process.env.PASSWORD,
    }
})

client.enableLogging = function() {
    client.on('request', (error, request) => {
        if( error ) {
            console.error(JSON.stringify(error,null,4))
        } else {
            console.info(request.meta.request.params.method, request.meta.request.params.path, request.meta.request.params.body || '')
        }
    });
    client.on('response', (error, result) => {
        if( error ) {
            console.error(JSON.stringify(error,null,4))
        } else {
            console.info(JSON.stringify(result.body,null,4), '\n')
        }
    });
}


export default client;
