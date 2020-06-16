// DOCS: https://react-google-maps-api-docs.netlify.app/#introduction
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import React from 'react'
import RingLoader from "react-spinners/RingLoader";
import ElasticsearchService from "../../services/ElasticsearchService.js";
import './TweetHeatMap.less';


class TweetHeatMap extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            tweets:  [],
            loading: true,
            error:   false
        }
    }
    componentDidMount() {
        ElasticsearchService.fetchGeocodeTweets()
            .then(tweets => {
                this.setState({ loading: false, tweets: tweets })
            })
            .catch(error => {
                this.setState({ loading: false, error: error })
            })
        ;
    }
    renderTweetTitle(tweet) {
        let lat = tweet.geocode.geometry.location.lat.toFixed(2)
        let lng = tweet.geocode.geometry.location.lng.toFixed(2)
        lat = (lat > 0) ? `${lat}N` : `${-lat}S`;
        lng = (lng > 0) ? `${lng}E` : `${-lng}W`;
        return `${tweet.text}\n\n@${tweet.location}\n(${lat}, ${lng})`;
    }

    render() {
        console.log("TweetHeatMap.jsx:31:render", "this.state",this.state.tweets);

        return (
            <div className='TweetHeatMap'>
                <div className='loading'>
                    <RingLoader color='#36d7b7' loading={this.state.loading}></RingLoader>
                </div>
                <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_MAPS_API_KEY} >
                    <div className='GoogleMap'>
                        <GoogleMap
                            mapContainerStyle={{ width: '100%', height: '100%' }}
                            center={{ lat: 20, lng: 0 }}
                            zoom={2}
                        >
                        {
                            this.state.tweets
                                .filter(tweet => tweet.geocode)
                                .map(tweet =>
                                    <Marker
                                        key={tweet.id}
                                        title={this.renderTweetTitle(tweet)}
                                        position={{
                                            lat: tweet.geocode.geometry.location.lat,
                                            lng: tweet.geocode.geometry.location.lng
                                        }}
                                    />
                                )
                        }
                        </GoogleMap>
                    </div>
                </LoadScript>
            </div>
        )
    }

}
//
// const TweetHeatMap = () => {
//     // DOCS: https://docs.react-async.com/getting-started/usage
//     const { tweets, error, isPending } = useAsync({ promiseFn: async () => await ElasticsearchService.fetchGeocodeTweets() })
//     if( isPending ) return "Loading..."
//     if( error ) return `Something went wrong: ${error.message}`
//     if( tweets )
//         console.log("TweetHeatMap.jsx:14:TweetHeatMap", "tweets", tweets);
//         return (
//             <div className='TweetHeatMap'>
//                 <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_MAPS_API_KEY} >
//                     <div className='GoogleMap'>
//                         <GoogleMap
//                             mapContainerStyle={{ width: '100%', height: '100%' }}
//                             center={{ lat: 20, lng: 0 }}
//                             zoom={2}
//                         >
//                             <Marker position={{ lat: -34.397, lng: 150.644 }} />
//                             { /* Child components, such as markers, info windows, etc. */ }
//                             <></>
//                         </GoogleMap>
//                     </div>
//                 </LoadScript>
//             </div>
//         )
//     return null
// }
export default TweetHeatMap
// export default React.memo(TweetHeatMap)
