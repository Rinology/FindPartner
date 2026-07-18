import React, { useEffect, useRef } from 'react';
import { useStoreContext } from '../StoreContext';
import { escapeHTML, getMarkerIcon, getStoreLatLng } from '../utils/mapUtils';
import { CONFIG } from '../config';

export default function MapPanel() {
    const { filteredData, setSelectedStore, setIsBottomSheetExpanded, isMobile } = useStoreContext();
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markerClusterGroup = useRef(null);
    const markersRef = useRef([]);

    useEffect(() => {
        if (!mapInstance.current && window.L) {
            // Initialize map
            const L = window.L;
            // Tighten boundaries specifically to South Korea
            const southWest = L.latLng(33.0, 125.0);
            const northEast = L.latLng(38.6, 130.0);
            const bounds = L.latLngBounds(southWest, northEast);

            const map = L.map(mapRef.current, {
                center: [36.0, 127.5],
                zoom: 7,
                minZoom: 7,
                maxBounds: bounds,
                maxBoundsViscosity: 1.0,
                attributionControl: false,
                zoomControl: false
            });
            mapInstance.current = map;

            // Base maps
            L.tileLayer(CONFIG.MAP.LIGHT_TILE, {
                attribution: CONFIG.MAP.ATTRIBUTION.OSM,
                maxZoom: 19
            }).addTo(map);

            // Zoom control
            L.control.zoom({ position: 'bottomright' }).addTo(map);

            // Cluster Group
            markerClusterGroup.current = L.markerClusterGroup({
                chunkedLoading: true,
                maxClusterRadius: 60,
                spiderfyOnMaxZoom: true,
                showCoverageOnHover: false,
                zoomToBoundsOnClick: true,
                iconCreateFunction: function (cluster) {
                    var childCount = cluster.getChildCount();
                    var c = ' marker-cluster-';
                    if (childCount < 10) c += 'small';
                    else if (childCount < 30) c += 'medium';
                    else c += 'large';
                    return new L.DivIcon({
                        html: '<div><span>' + childCount + '</span></div>',
                        className: 'marker-cluster' + c,
                        iconSize: new L.Point(40, 40)
                    });
                }
            });
            map.addLayer(markerClusterGroup.current);
        }
    }, []);

    // Update markers when filteredData changes
    useEffect(() => {
        if (!mapInstance.current || !markerClusterGroup.current || !window.L) return;
        const L = window.L;
        const map = mapInstance.current;
        const clusterGroup = markerClusterGroup.current;

        clusterGroup.clearLayers();
        markersRef.current.forEach(m => map.removeLayer(m));
        markersRef.current = [];

        const newMarkers = [];

        filteredData.forEach(store => {
            const pos = getStoreLatLng(store);
            if (pos) {
                const grade = store.Grade;
                const customIcon = getMarkerIcon(store.Category, grade);
                const marker = L.marker([pos.lat, pos.lng], { icon: customIcon });

                marker.on('click', () => {
                    setSelectedStore(store);
                    if (isMobile) {
                        setIsBottomSheetExpanded(true);
                    }
                    const zoomLvl = isMobile ? 17 : 16;
                    let newPoint = map.project(pos, zoomLvl);
                    if (isMobile) {
                        const mapHeight = map.getSize().y;
                        newPoint = newPoint.add([0, -mapHeight * 0.25]);
                    } else {
                        newPoint = newPoint.add([0, 130]);
                    }
                    map.setView(map.unproject(newPoint, zoomLvl), zoomLvl, { animate: true, duration: 0.5 });
                });

                newMarkers.push(marker);
            }
        });

        clusterGroup.addLayers(newMarkers);
        markersRef.current = newMarkers;

    }, [filteredData, isMobile, setSelectedStore, setIsBottomSheetExpanded]);

    return (
        <div className="absolute inset-0 z-0">
            <div ref={mapRef} className="w-full h-full z-0" style={{ touchAction: 'none' }}></div>
            
            {/* Map Controls */}
            {!isMobile && (
                <div className="absolute left-6 top-6 z-[1000] flex flex-col gap-3">
                    <button className="w-12 h-12 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition-colors">
                        <i className="fa-solid fa-layer-group"></i>
                    </button>
                    <button className="w-12 h-12 bg-white text-gray-900 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors">
                        <i className="fa-solid fa-location-crosshairs text-blue-600"></i>
                    </button>
                </div>
            )}
        </div>
    );
}

