import React, {PureComponent} from 'react';
import {StaticMap, _MapContext as MapContext, NavigationControl} from 'react-map-gl';
import autobind from 'react-autobind';
import '@luma.gl/debug';

import DeckGL from '@deck.gl/react';
import {COORDINATE_SYSTEM, View, WebMercatorViewport} from '@deck.gl/core';

import LayerInfo from './components/layer-info';

/* eslint-disable no-process-env */
const MapboxAccessToken =
  process.env.MapboxAccessToken || // eslint-disable-line
  'Set MapboxAccessToken environment variable or put your token here.';

const NAVIGATION_CONTROL_STYLES = {
  margin: 10,
  position: 'absolute',
  zIndex: 1
};

const VIEW_LABEL_STYLES = {
  zIndex: 10,
  padding: 5,
  margin: 20,
  fontSize: 12,
  backgroundColor: '#282727',
  color: '#FFFFFF'
};

const VIEW_STATES = [
  {
    longitude: -122.4250578732143,
    latitude: 37.75334361844128,
    zoom: 11.5
  },
  {
    longitude: -152.25806733130415,
    latitude: 37.752000000003775,
    zoom: 1.5
  }
];

const ZOOM_VALUES = [1.5, 11.5];

const ViewportLabel = props => (
  <div style={{position: 'absolute'}}>
    <div style={{...VIEW_LABEL_STYLES, display: ''}}>{props.children}</div>
  </div>
);

export default class Map extends PureComponent {
  constructor(props) {
    super(props);
    autobind(this);

    this.state = {
      mapViewState: Object.assign(
        {
          // latitude: 37.752,
          // longitude: -122.427,
          // zoom: 1.5,
          longitude: -122.4250578732143,
          latitude: 37.75334361844128,
          zoom: 11.5,
          pitch: 0,
          bearing: 0
        },
        VIEW_STATES[0]
      ),
      orbitViewState: {
        target: [0, 0, 0],
        zoom: 3,
        rotationX: -30,
        rotationOrbit: 30,
        orbitAxis: 'Y'
      },
      hoveredItem: null,
      clickedItem: null,
      queriedItems: null,

      enableDepthPickOnClick: false,
      _index: 0
    };

    this.deckRef = React.createRef();
  }

  pickObjects(opts) {
    if (this.deckRef.current) {
      const infos = this.deckRef.current.pickObjects(opts);
      console.log(infos); // eslint-disable-line
      this.setState({queriedItems: infos});
    }
  }

  pickMultipleObjects(opts) {
    if (this.deckRef.current) {
      const infos = this.deckRef.current.pickMultipleObjects(opts);
      console.log(infos); // eslint-disable-line
      this.setState({queriedItems: infos});
    }
  }

  fitbounds(opts) {
    // const {x, y, width, height} = opts;
    const {mapViewState} = this.state;
    const bounds = [[-122.38, 37.73], [-122.0, 37.78]];
    const bounds2 = [[-122.11, 37.71], [-122.07, 37.8]];
    const width = (mapViewState.height * (-122.0 - -122.38)) / (37.78 - 37.73);
    const viewport = new WebMercatorViewport(Object.assign({}, mapViewState)); //, {width}));
    const newViewport = viewport.fitBounds(bounds);
    const newViewState = {
      ...newViewport,
      transitionDuration: 500
    };
    this.setState({mapViewState: newViewState});
  }

  toggleZoom() {
    let {_index = 1} = this.state;
    _index = (_index + 1) % 2;
    const mapViewState = Object.assign({}, this.state.mapViewState, VIEW_STATES[_index]);
    this.setState({mapViewState, _index});
  }
  _onViewStateChange({viewState, viewId}) {
    if (viewId === 'infovis') {
      this.setState({orbitViewState: viewState});
      return;
    }
    if (viewState.pitch > 60) {
      viewState.pitch = 60;
    }
    this.setState({mapViewState: viewState});
  }

  _onHover(info) {
    this.setState({hoveredItem: info});
  }

  _onClick(info) {
    if (this.state.enableDepthPickOnClick && info) {
      this._multiDepthPick(info.x, info.y);
    } else {
      console.log('onClick', info); // eslint-disable-line
      this.setState({clickedItem: info});
    }
  }

  // Only show infovis layers in infovis mode and vice versa
  _layerFilter({layer}) {
    const {settings} = this.props;
    const isIdentity = layer.props.coordinateSystem === COORDINATE_SYSTEM.IDENTITY;
    return settings.infovis ? isIdentity : !isIdentity;
  }

  render() {
    const {orbitViewState, mapViewState, hoveredItem, clickedItem, queriedItems} = this.state;
    const {
      layers,
      views,
      effects,
      settings: {infovis, pickingRadius, drawPickingColors, useDevicePixels}
    } = this.props;

    return (
      <div style={{backgroundColor: '#eeeeee'}}>
        <DeckGL
          ref={this.deckRef}
          id="default-deckgl-overlay"
          layers={layers}
          layerFilter={this._layerFilter}
          views={views}
          viewState={infovis ? orbitViewState : mapViewState}
          onViewStateChange={this._onViewStateChange}
          effects={effects}
          pickingRadius={pickingRadius}
          onHover={this._onHover}
          onClick={this._onClick}
          useDevicePixels={useDevicePixels}
          debug={true}
          drawPickingColors={drawPickingColors}
          ContextProvider={MapContext.Provider}
        >
          <View id="basemap">
            <StaticMap
              key="map"
              mapStyle="mapbox://styles/mapbox/light-v9"
              mapboxApiAccessToken={MapboxAccessToken || 'no_token'}
            />
            <ViewportLabel key="label">Map View</ViewportLabel>
          </View>

          <View id="first-person">
            <ViewportLabel>First Person View</ViewportLabel>
          </View>

          <View id="infovis">
            <ViewportLabel>Orbit View (PlotLayer only, No Navigation)</ViewportLabel>
          </View>

          <div style={NAVIGATION_CONTROL_STYLES}>
            <NavigationControl />
          </div>

          <LayerInfo hovered={hoveredItem} clicked={clickedItem} queried={queriedItems} />
        </DeckGL>
      </div>
    );
  }
}
