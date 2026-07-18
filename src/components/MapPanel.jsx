import React, { useEffect, useRef } from 'react';
import { useStoreContext } from '../StoreContext';
import { escapeHTML, getMarkerIcon, getStoreLatLng, getPopupHTML } from '../utils/mapUtils';
import { CONFIG } from '../config';

export default function MapPanel() {
    const { filteredData, selectedStore, setSelectedStore, isBottomSheetExpanded, setIsBottomSheetExpanded, isMobile, userLocation, setUserLocation, selectedBrands, setSelectedBrands, isPremiumOnly, setIsPremiumOnly, isOneCareOnly, setIsOneCareOnly, selectedRegion } = useStoreContext();
    const [isClustered, setIsClustered] = React.useState(true);
    const [isBrandDropdownOpen, setIsBrandDropdownOpen] = React.useState(false);

    const toggleBrand = (brand) => {
        if (selectedBrands.includes(brand)) {
            setSelectedBrands(selectedBrands.filter(b => b !== brand));
        } else {
            setSelectedBrands([...selectedBrands, brand]);
        }
    };
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

            // Map events
            map.on('click', () => {
                setIsBrandDropdownOpen(false);
            });

            // Map controls are managed via React UI, no native zoom control needed
            
            // Cluster Group
            markerClusterGroup.current = L.markerClusterGroup({
                chunkedLoading: true,
                maxClusterRadius: 60,
                spiderfyOnMaxZoom: true,
                showCoverageOnHover: false,
                zoomToBoundsOnClick: true,
                iconCreateFunction: function (cluster) {
                    var childCount = cluster.getChildCount();
                    return new L.DivIcon({
                        html: `<div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                  <span class="text-white font-bold text-xs">${childCount}</span>
                               </div>`,
                        className: 'custom-cluster-icon',
                        iconSize: new L.Point(40, 40)
                    });
                }
            });
            map.addLayer(markerClusterGroup.current);
        }
    }, []);

    // Handle Region Focus
    useEffect(() => {
        if (!mapInstance.current || !filteredData || filteredData.length === 0) return;
        if (selectedRegion !== 'all') {
            const bounds = [];
            filteredData.forEach(store => {
                const pos = getStoreLatLng(store);
                if (pos) bounds.push([pos.lat, pos.lng]);
            });
            if (bounds.length > 0) {
                mapInstance.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 13, animate: true, duration: 1.0 });
            }
        }
    }, [selectedRegion]);
    
    // Auto-close Brand Dropdown when ListPanel is used
    useEffect(() => {
        if (selectedStore || isBottomSheetExpanded) {
            setIsBrandDropdownOpen(false);
        }
    }, [selectedStore, isBottomSheetExpanded]);

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
                const isSelected = selectedStore && selectedStore.name === store.name;
                const customIcon = getMarkerIcon(store.category, grade, isSelected);
                const marker = L.marker([pos.lat, pos.lng], { icon: customIcon });
                marker.storeData = store;
                
                // Tooltip
                if (!isMobile) {
                    marker.bindTooltip(store.name, { direction: 'top', offset: [0, -25], className: 'font-bold text-xs shadow-sm rounded' });
                }

                marker.on('click', () => {
                    setSelectedStore(store);
                    setIsBrandDropdownOpen(false);
                    const zoomLvl = isMobile ? 17 : 16;
                    map.setView(pos, zoomLvl, { animate: true, duration: 0.5 });
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

    // Focus marker when selectedStore changes
    useEffect(() => {
        if (!mapInstance.current || !selectedStore) return;

        // Remove active-pin class from all markers
        document.querySelectorAll('.custom-pin').forEach(el => {
            el.classList.remove('active-pin', 'animate-pulse-scale');
            el.style.zIndex = "";
        });

        const storeMarker = markersRef.current.find(m => m.storeData === selectedStore);
        if (storeMarker) {
            // Add active-pin class to selected marker
            if (storeMarker.getElement()) {
                const iconEl = storeMarker.getElement();
                iconEl.classList.add('active-pin', 'animate-pulse-scale');
                iconEl.style.zIndex = 9999;
            }

            if (!isMobile) {
                // Focus and slightly offset
                const pos = getStoreLatLng(selectedStore);
                if (pos) {
                    const currentZoom = mapInstance.current.getZoom();
                    const targetZoom = currentZoom < 14 ? 14 : currentZoom;
                    
                    // Add an offset so the marker isn't hidden behind the new detail panel
                    // Detail panel is ~360px wide on the left (next to the 384px list panel)
                    // The center of the visible map is offset to the right.
                    mapInstance.current.flyTo(
                        [pos.lat, pos.lng], 
                        targetZoom, 
                        { animate: true, duration: 1.0, easeLinearity: 0.25 }
                    );
                }
            }
        }
    }, [selectedStore, isMobile]);

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
        <div className="flex-1 relative w-full h-full z-0">
            <div ref={mapRef} className="w-full h-full z-0" style={{ touchAction: 'none' }}></div>
            
            <div className={`absolute left-4 top-4 z-[1000] flex flex-wrap gap-2 transition-opacity duration-300 ${selectedStore ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                {/* Brand Filter */}
                <div className="relative">
                    <button 
                        onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                        className={`flex items-center gap-1.5 px-3 py-2 bg-white rounded-full text-sm font-extrabold shadow-md transition-all ${selectedBrands.length > 0 ? 'text-blue-700 border-2 border-blue-500' : 'text-gray-800 border border-gray-200 hover:bg-gray-50'}`}
                    >
                        <i className="fa-solid fa-bicycle"></i>
                        <span className="whitespace-nowrap">{selectedBrands.length > 0 ? `브랜드 (${selectedBrands.length})` : '브랜드'}</span>
                        <i className={`fa-solid fa-chevron-down text-[10px] transition-transform ${isBrandDropdownOpen ? 'rotate-180' : ''}`}></i>
                    </button>
                    {isBrandDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                            <button 
                                onClick={() => setSelectedBrands([])}
                                className="w-full text-left px-4 py-2 text-xs text-red-500 font-medium hover:bg-red-50 border-b border-gray-50"
                            >
                                선택 해제
                            </button>
                            {['퀄리스포츠', '엑스트론', '퀄리바이크', '케어엑스'].map(brand => (
                                <label key={brand} className="flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedBrands.includes(brand)}
                                        onChange={() => toggleBrand(brand)}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                    />
                                    <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">{brand}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Premium Filter */}
                <button 
                    onClick={() => setIsPremiumOnly(!isPremiumOnly)}
                    className={`flex items-center gap-1.5 px-3 py-2 bg-white rounded-full text-sm font-extrabold shadow-md transition-all ${isPremiumOnly ? 'text-amber-600 border-2 border-amber-500' : 'text-gray-800 border border-gray-200 hover:bg-gray-50'}`}
                >
                    <i className="fa-solid fa-star"></i>
                    <span>우수협력점</span>
                </button>

                {/* OneCare Filter */}
                <button 
                    onClick={() => setIsOneCareOnly(!isOneCareOnly)}
                    className={`flex items-center gap-1.5 px-3 py-2 bg-white rounded-full text-sm font-extrabold shadow-md transition-all ${isOneCareOnly ? 'text-blue-700 border-2 border-blue-500' : 'text-gray-800 border border-gray-200 hover:bg-gray-50'}`}
                >
                    <i className="fa-solid fa-screwdriver-wrench"></i>
                    <span>원케어</span>
                </button>
            </div>

            {/* Map Controls (Zoom, Location, Cluster) */}
            <div className={`absolute z-[1000] flex flex-col gap-2 transition-transform duration-300 ${isMobile ? 'top-4 right-4' : 'bottom-6 right-4'} ${isMobile && selectedStore ? '-translate-y-20 opacity-0 pointer-events-none' : ''}`}>
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col">
                    <button onClick={() => mapInstance.current?.zoomIn()} className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-50 border-b border-gray-100" title="확대">
                        <i className="fa-solid fa-plus"></i>
                    </button>
                    <button onClick={() => mapInstance.current?.zoomOut()} className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-50" title="축소">
                        <i className="fa-solid fa-minus"></i>
                    </button>
                </div>
                
                <button 
                    onClick={() => setIsClustered(!isClustered)}
                    className={`w-10 h-10 rounded-xl shadow-lg border flex items-center justify-center transition-colors ${isClustered ? 'bg-blue-600 border-blue-700 text-white' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                    title={isClustered ? "핀 풀어보기" : "핀 묶어보기"}
                >
                    <i className="fa-solid fa-layer-group"></i>
                </button>

                <button 
                    onClick={handleMyLocation}
                    className="w-10 h-10 bg-white rounded-xl shadow-lg border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors"
                    title="내 위치 찾기"
                >
                    <i className="fa-solid fa-crosshairs"></i>
                </button>
            </div>
        </div>
    );
}
