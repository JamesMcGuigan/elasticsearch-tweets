import * as React from 'react';
import GithubCorner from "../components/GithubCorner/GithubCorner.jsx";
import './_app.less';

// DOCS: https://nextjs.org/docs/advanced-features/custom-app
const App = ({ Component, pageProps }) => {
    return (
        <>
            <GithubCorner/>
            <header>
                <h1>
                    ElasticSearch Visualization of &nbsp;
                    <a href='https://www.kaggle.com/c/nlp-getting-started/data?select=train.csv' target='_source'>
                        Kaggle Disaster Tweets
                    </a>
                </h1>
            </header>
            <main>
                <Component {...pageProps} />
            </main>
        </>
    );
};

export default App;
