import Document, { Head, Main, NextScript } from 'next/document';
import React from 'react';

// DOCS: https://nextjs.org/docs/advanced-features/custom-document
export default class MyDocument extends Document {
    render() {
        return (
            <html>
                <Head>
                    <meta name="viewport" content="initial-scale=1.0, width=device-width" key="viewport"/>
                    <title>ElasticSearch Visualization of Kaggle Disaster Tweets</title>
                </Head>
                <body>
                    <Main/>
                    <NextScript/>
                </body>
            </html>
        );
    }
}
