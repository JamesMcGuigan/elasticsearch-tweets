#!/usr/bin/env node
require('dotenv').config()
const { Client } = require('@elastic/elasticsearch')


const client = new Client({
    node: `https://${process.env.USERNAME}:${process.env.PASSWORD}@${process.env.DATABASE}`,
    auth: {
        username: process.env.USERNAME,
        password: process.env.PASSWORD,
    }
})

module.exports = client
