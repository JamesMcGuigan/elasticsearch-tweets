#!/usr/bin/env node
import dotenv from 'dotenv'
import elasticsearch from '@elastic/elasticsearch'

dotenv.config()


const client = new elasticsearch.Client({
    node: `https://${process.env.USERNAME}:${process.env.PASSWORD}@${process.env.DATABASE}`,
    auth: {
        username: process.env.USERNAME,
        password: process.env.PASSWORD,
    }
})

export default client
