import * as React from 'react';
import TweetHeatMap from "../components/TweetHeatMap/TweetHeatMap.jsx";
import './index.less';


export default function HomePage() {
    return (
        <div className="HomePage">
            <TweetHeatMap></TweetHeatMap>
        </div>
    );
}
