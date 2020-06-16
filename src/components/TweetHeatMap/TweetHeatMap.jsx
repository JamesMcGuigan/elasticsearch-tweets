// DOCS: https://react-google-maps-api-docs.netlify.app/#introduction

import { GoogleMap, LoadScript } from '@react-google-maps/api';
import React from 'react'
import ElasticsearchService from "../../services/ElasticsearchService.js";
import './TweetHeatMap.less';

function TweetHeatMap() {
    const tweets = ElasticsearchService.fetchGeocodeTweets()
    console.log(tweets)
    return (
        <div className='TweetHeatMap'>
            <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_MAPS_API_KEY} >
                <div className='GoogleMap'>
                    <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={{ lat: 20, lng: 0 }}
                        zoom={2}
                    >
                        { /* Child components, such as markers, info windows, etc. */ }
                        <></>
                    </GoogleMap>
                </div>
            </LoadScript>
        </div>
    )
}
export default React.memo(TweetHeatMap)
