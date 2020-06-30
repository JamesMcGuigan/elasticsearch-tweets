#!/usr/bin/env node
import elasticsearch from '@elastic/elasticsearch'
import dotenv from 'dotenv'

dotenv.config()


const client = new elasticsearch.Client({
    node: `https://${process.env.USERNAME}:${process.env.PASSWORD}@${process.env.ELASTICSEARCH}`,
    auth: {
        username: process.env.USERNAME,
        password: process.env.PASSWORD,
    }
})

export default client
