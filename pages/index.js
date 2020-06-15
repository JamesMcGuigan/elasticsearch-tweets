import * as React from 'react';
import packageJSON from '../package.json';
import GithubCorner from "../react/GithubCorner/GithubCorner.jsx";
import './index.less';

const Home = () => {
    return (
        <>
            <GithubCorner/>
            <div style={{ maxWidth: "1000px", margin: "auto" }}>
                <h1>{packageJSON.description}</h1>
            </div>
        </>
    );
};

export default Home;
