import * as React from 'react';
import packageJSON from '../../package.json';
import GithubCorner from "../components/GithubCorner/GithubCorner.jsx";
import './_app.less';

// DOCS: https://nextjs.org/docs/advanced-features/custom-app
const App = ({ Component, pageProps }) => {
    return (
        <>
            <GithubCorner/>
            <header>
                <h1>{packageJSON.description}</h1>
            </header>
            <main>
                <Component {...pageProps} />
            </main>
        </>
    );
};

export default App;
