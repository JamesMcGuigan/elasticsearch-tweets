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
            error:   false,
            search: {
                text:    '',
                keyword: '',
                disaster: true
            },
            data: {
                keywords: [],
            }
        }
    }

    componentDidMount() {
        this.onSearchUpdate()
    }
    componentDidUpdate(prevProps, prevState, snapshot) {
        if( !_.isEqual(this.state.search, prevState.search) ) {
            this.onSearchUpdate()
        }
    }
    onSearchUpdate() {
        let query = {
            "bool": {
                "must": [
                    { "exists":  { "field": "geocode" } }
                ],
                "must_not": [],
            }
        }

        // NOTE: React returns strings for <option> values, so passing primatives such as null, undefined doesn't work
        switch(this.state.search.disaster) {
            case 'All':             break;
            case 'Disaster':        query.bool.must.push({ "match": { "target": 1 } }); break;
            case 'False Positive':  query.bool.must.push({ "match": { "target": 0 } }); break;
            case 'Unknown':         query.bool.must_not.push({ "exists": { "field": "target" } }); break;
        }
        if( this.state.search.text ) {
            query.bool.must.push({ simple_query_string: { query: this.state.search.text } })
        }

        // Don't include keyword in aggregationTerms()
        ElasticsearchService.aggregationTerms("keyword", _.cloneDeep(query))
            .then(keywords => { this.setState({ data: { ...this.state.data, keywords: keywords } }) })
        ;

        // Extend .search() with keyword terms
        if( this.state.search.keyword ) {
            query.bool.must.push({ match: { keyword: { query: this.state.search.keyword } }})
        }
        ElasticsearchService.search({ size: 1000, query: query })
            .then(tweets => { this.setState({ loading: false, tweets: tweets }) })
            .catch(error => { this.setState({ loading: false, error:  error   }) })

    }

    renderTweetTitle(tweet) {
        let lat = tweet.geocode.geometry.location.lat.toFixed(2)
        let lng = tweet.geocode.geometry.location.lng.toFixed(2)
        lat = (lat > 0) ? `${lat}N` : `${-lat}S`;
        lng = (lng > 0) ? `${lng}E` : `${-lng}W`;
        return _([
            tweet.text,
            tweet.location && `@${tweet.location}\n(${lat}, ${lng})` || '',
            tweet.keyword  && `Keyword: ${tweet.keyword}` || '',
        ]).filter().join('\n\n');
    }
    renderSearchBar() {
        return (
            <form className='searchBar'>
                <label htmlFor='text'>Search:</label>
                <input type='text'
                       name='text'
                       value={this.state.search.text}
                       onChange={( event ) => this.setState({ search: { ...this.state.search, text: event.target.value }})}
                />
                <label htmlFor='keyword'>Keyword:</label>
                <select
                    name='keyword'
                    value={this.state.search.keyword}
                    onChange={( event ) => this.setState({ search: { ...this.state.search, keyword: event.target.value }})}
                >
                    <option key='' value=''>All</option>)
                    { this.state.data.keywords.map(keyword =>
                        <option key={keyword} value={keyword}>{keyword}</option>)
                    }
                </select>
                <label htmlFor='disaster'>Disaster:</label>
                <select
                    name='disaster'
                    value={this.state.search.disaster}
                    onChange={( event ) => this.setState({ search: { ...this.state.search, disaster: event.target.value }})}
                >
                    <option>All</option>
                    <option>Disaster</option>
                    <option>False Positive</option>
                    <option>Unknown</option>
                </select>
            </form>
        )
    }

    render() {
        return (
            <div className='TweetHeatMap'>
                <div className='loading'>
                    <RingLoader color='#36d7b7' loading={this.state.loading}/>
                </div>
                {this.renderSearchBar()}
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
export default TweetHeatMap
