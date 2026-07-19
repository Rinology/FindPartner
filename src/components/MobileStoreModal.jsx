import React, { useEffect, useRef } from 'react';
import { useStoreContext } from '../StoreContext';
import { getStoreLatLng, openNaverNavi, formatBranchName, getDisplayBrands, getBrandBadgeClass } from '../utils/mapUtils';

export default function MobileStoreModal() {
    const { selectedStore, setSelectedStore } = useStoreContext();
    const mapRef = useRef(null);
    const mapInstance = useRef(null);

    // Initialize mini-map
    useEffect(() => {
        if (!selectedStore || !mapRef.current || !window.L) return;
        
        if (mapInstance.current) {
            mapInstance.current.remove();
        }

        const pos = getStoreLatLng(selectedStore);
        if (!pos) return;
        const { lat, lng } = pos;
        const L = window.L;

        const map = L.map(mapRef.current, {
            center: [lat, lng],
            zoom: 15,
            zoomControl: false,
            attributionControl: false,
            dragging: false,
            touchZoom: false,
            scrollWheelZoom: false,
            doubleClickZoom: false
        });
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        }).addTo(map);

        // Simple Red Pin for minimap
        const icon = L.divIcon({
            className: 'custom-minimap-pin',
            html: `<i class="fa-solid fa-location-dot" style="color:#ef4444; font-size:32px; filter: drop-shadow(0 4px 4px rgba(0,0,0,0.3));"></i>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32]
        });

        L.marker([lat, lng], { icon }).addTo(map);
        mapInstance.current = map;

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [selectedStore]);

    if (!selectedStore) return null;

    const handleClose = () => {
        setSelectedStore(null);
    };

    const handleNavi = () => {
        openNaverNavi(selectedStore);
    };

    const handleViewMap = () => {
        window.open(`https://map.naver.com/v5/search/${encodeURIComponent(selectedStore.name)}`, '_blank');
    };

    const formattedBranch = formatBranchName(selectedStore.branch);
    const displayBrands = getDisplayBrands(selectedStore);
    const isPremium = selectedStore.grade === 'S';
    const isOneCare = selectedStore.oneCare === 'O';
    const todayStr = ['일','월','화','수','목','금','토'][new Date().getDay()];
    const isClosedToday = selectedStore.closed && selectedStore.closed.includes(todayStr);

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                {/* Header with Close */}
                <div className="relative w-full h-40 shrink-0 bg-gray-100">
                    <div ref={mapRef} className="w-full h-full z-0"></div>
                    <button 
                        onClick={handleClose}
                        className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-gray-700 shadow-sm border border-white"
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                    <div className="absolute bottom-2 left-0 right-0 text-center z-10 pointer-events-none">
                        <span className="bg-white/80 backdrop-blur-sm text-gray-600 text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                            <i className="fa-solid fa-hand-pointer mr-1"></i> 지도를 누르면 네이버 지도로 이동합니다
                        </span>
                    </div>
                    {/* Clickable overlay to open Naver Map */}
                    <div onClick={handleViewMap} className="absolute inset-0 z-[5] cursor-pointer"></div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            {isPremium && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[11px] font-extrabold rounded-md">
                                    우수협력점
                                </span>
                            )}
                            {isOneCare && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[11px] font-extrabold rounded-md">
                                    원케어
                                </span>
                            )}
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 leading-tight mb-1">{selectedStore.name}</h2>
                        {formattedBranch && <p className="text-sm font-semibold text-gray-500">{formattedBranch}</p>}
                    </div>

                    <div className="space-y-3 mb-5">
                        <p className="text-sm text-gray-600 flex items-start gap-2">
                            <i className="fa-solid fa-location-dot mt-1 text-gray-400 w-3 text-center"></i>
                            <span>{selectedStore.address}</span>
                        </p>
                        
                        <div className={`text-sm flex items-start gap-2 ${isClosedToday ? 'text-red-600 font-bold bg-red-50 p-1.5 rounded-lg border border-red-100 inline-flex' : 'text-gray-600'}`}>
                            <i className={`fa-regular fa-calendar-xmark mt-1 w-3 text-center ${isClosedToday ? 'text-red-500' : 'text-gray-400'}`}></i>
                            <span>휴무: {selectedStore.closed || '없음'}</span>
                        </div>
                    </div>

                    {displayBrands.length > 0 && (
                        <div className="mb-6">
                            <p className="text-sm font-bold text-gray-800 mb-2">취급 브랜드</p>
                            <div className="flex flex-wrap gap-2">
                                {displayBrands.map((brand, i) => (
                                    <span key={i} className={`px-2.5 py-1 text-[11px] font-bold rounded-md border ${getBrandBadgeClass(brand)}`}>
                                        {brand}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        {selectedStore.phone && (
                            <a 
                                href={`tel:${selectedStore.phone}`}
                                className="flex-1 flex justify-center items-center gap-2 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-bold rounded-xl transition-colors"
                            >
                                <i className="fa-solid fa-phone"></i> 전화
                            </a>
                        )}
                        <button 
                            onClick={handleNavi}
                            className="flex-1 flex justify-center items-center gap-2 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-bold rounded-xl transition-colors"
                        >
                            <i className="fa-solid fa-route"></i> 길찾기
                        </button>
                    </div>

                    <div className="mt-4 text-center">
                        <p className="text-[11px] text-gray-500 mt-3 font-medium bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                            <i className="fa-solid fa-circle-info mr-1 text-gray-400"></i> 시승 가능 여부는 해당 매장에 직접 문의해 주시기 바랍니다.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
