import React, { useEffect, useRef } from 'react';
import { useStoreContext } from '../StoreContext';
import { escapeHTML, getMarkerIcon, getStoreLatLng, getPopupHTML } from '../utils/mapUtils';
import { CONFIG } from '../config';

export default function MapPanel() {
    const { filteredData, selectedStore, setSelectedStore, setIsBottomSheetExpanded, isMobile, userLocation, setUserLocation } = useStoreContext();
    const [isClustered, setIsClustered] = React.useState(true);
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
            L.control.zoom({ position: 'topleft' }).addTo(map);

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
                const grade = store.grade;
                const customIcon = getMarkerIcon(store.category, grade);
                const marker = L.marker([pos.lat, pos.lng], { icon: customIcon });
                marker.storeData = store;
                marker.bindPopup(getPopupHTML(store), { offset: [0, -10], className: 'custom-leaflet-popup' });
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
                
                if (!isClustered) {
                    marker.addTo(map);
                }
            }
        });

        if (isClustered) {
            clusterGroup.addLayers(newMarkers);
            if (!map.hasLayer(clusterGroup)) {
                map.addLayer(clusterGroup);
            }
        } else {
            if (map.hasLayer(clusterGroup)) {
                map.removeLayer(clusterGroup);
            }
        }
        
        markersRef.current = newMarkers;

    }, [filteredData, isMobile, isClustered, setSelectedStore, setIsBottomSheetExpanded]);

    // Open popup when selectedStore changes externally (e.g. from list)
    useEffect(() => {
        if (!mapInstance.current || !selectedStore) return;
        const targetMarker = markersRef.current.find(m => m.storeData === selectedStore);
        if (targetMarker) {
            if (isClustered && markerClusterGroup.current && mapInstance.current.hasLayer(markerClusterGroup.current)) {
                markerClusterGroup.current.zoomToShowLayer(targetMarker, () => targetMarker.openPopup());
            } else {
                targetMarker.openPopup();
                // Optionally center map if needed, but MapPanel usually already centers on click
            }
        }
    }, [selectedStore, isClustered]);

    const handleMyLocation = () => {
        if (!mapInstance.current) return;
        const map = mapInstance.current;
        if (userLocation) {
            map.flyTo([userLocation.lat, userLocation.lng], 15, { animate: true, duration: 1.0 });
        } else if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLocation(loc);
                window.userLocation = loc;
                map.flyTo([loc.lat, loc.lng], 15, { animate: true, duration: 1.0 });
            });
        }
    };

    return (
        <div className="absolute inset-0 z-0">
            <div ref={mapRef} className="w-full h-full z-0" style={{ touchAction: 'none' }}></div>
            
            {/* Map Controls (Positioned exactly below the Top-Left Zoom Controls) */}
            <div className="absolute left-[10px] top-[90px] z-[1000] flex flex-col gap-2">
                <button 
                    onClick={() => setIsClustered(!isClustered)}
                    title={isClustered ? "핀 풀어보기" : "핀 묶어보기"}
                    className={`w-[34px] h-[34px] rounded bg-white text-gray-700 shadow-[0_1px_5px_rgba(0,0,0,0.65)] flex items-center justify-center hover:bg-gray-50 transition-colors border-2 border-black/20 ${isClustered ? 'text-blue-600' : ''}`}
                >
                    <i className="fa-solid fa-layer-group text-[15px]"></i>
                </button>
                <button 
                    onClick={handleMyLocation}
                    title="내 위치 찾기"
                    className="w-[34px] h-[34px] rounded bg-white text-gray-700 shadow-[0_1px_5px_rgba(0,0,0,0.65)] flex items-center justify-center hover:bg-gray-50 transition-colors border-2 border-black/20"
                >
                    <i className="fa-solid fa-location-crosshairs text-[16px]"></i>
                </button>
            </div>
        </div>
    );
}
