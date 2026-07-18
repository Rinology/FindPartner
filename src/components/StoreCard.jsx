import React from 'react';
import { useStoreContext } from '../StoreContext';
import { getStoreLatLng } from '../utils/mapUtils';

export default function StoreCard({ store }) {
    const { setSelectedStore, isMobile, setIsBottomSheetExpanded } = useStoreContext();

    const handleClick = () => {
        setSelectedStore(store);
        const pos = getStoreLatLng(store);
        if (pos && window.L) {
            const map = window.L.Map._instances ? Object.values(window.L.Map._instances)[0] : null;
            if (map) {
                const zoomLvl = isMobile ? 17 : 16;
                let newPoint = map.project(pos, zoomLvl);
                if (isMobile) {
                    const mapHeight = map.getSize().y;
                    newPoint = newPoint.add([0, -mapHeight * 0.25]);
                    setIsBottomSheetExpanded(true);
                } else {
                    newPoint = newPoint.add([0, 130]);
                }
                map.setView(map.unproject(newPoint, zoomLvl), zoomLvl, { animate: true, duration: 0.5 });
            }
        }
    };

    const isPremium = store.grade === 'S';
    const isOneCare = store.oneCare === 'O';

    // Normalize brands
    const rawBrands = (store.brand || store.brands || '').split(',').map(b => b.trim()).filter(Boolean);
    let displayBrands = [];
    if (rawBrands.includes('퀄리스포츠') || rawBrands.includes('엑스트론')) {
        displayBrands.push('퀄리스포츠&엑스트론');
    }
    rawBrands.forEach(b => {
        if (b !== '퀄리스포츠' && b !== '엑스트론' && !displayBrands.includes(b)) {
            displayBrands.push(b);
        }
    });

    return (
        <div 
            onClick={handleClick}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {store.name}
                    </h3>
                    {store.branch && (
                        <p className="text-sm font-semibold text-gray-600 mt-0.5">{store.branch}</p>
                    )}
                </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-3 flex items-start gap-2">
                <i className="fa-solid fa-location-dot mt-1 text-gray-400"></i>
                <span>{store.address}</span>
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
                {displayBrands.map((brand, i) => {
                    let bgClass = "bg-gray-100 text-gray-600";
                    if (brand === '퀄리스포츠&엑스트론') {
                        bgClass = "bg-gradient-to-br from-[#2f6286] to-[#231f20] text-white border border-white/20 shadow-sm";
                    } else if (brand === '퀄리바이크') {
                        bgClass = "bg-[#72bf44] text-white shadow-sm";
                    } else if (brand === '케어엑스' || brand === '케이엑스') {
                        bgClass = "bg-[#ff3b30] text-white shadow-sm";
                    }
                    return (
                        <span key={i} className={`px-2.5 py-1 text-[11px] font-bold rounded-md ${bgClass}`}>
                            {brand}
                        </span>
                    );
                })}
            </div>

            {/* Badges (Premium, OneCare) moved to bottom before buttons */}
            {(isPremium || isOneCare) && (
                <div className="flex gap-2 mb-3">
                    {isPremium && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-amber-100 text-amber-700">
                            <i className="fa-solid fa-star text-[10px]"></i> 우수협력점
                        </span>
                    )}
                    {isOneCare && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">
                            <i className="fa-solid fa-screwdriver-wrench text-[10px]"></i> 원케어
                        </span>
                    )}
                </div>
            )}

            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
                {store.phone && (
                    <a href={`tel:${store.phone}`} onClick={(e) => e.stopPropagation()} className="flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold transition-colors">
                        <i className="fa-solid fa-phone"></i> 전화
                    </a>
                )}
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        const uLat = window.userLocation ? window.userLocation.lat : '';
                        const uLng = window.userLocation ? window.userLocation.lng : '';
                        window.open(`https://map.naver.com/index.nhn?slng=${uLng}&slat=${uLat}&stext=&elng=${store.lng}&elat=${store.lat}&pathType=0&showMap=true&etext=${store.name}&menu=route`, '_blank');
                    }} 
                    className="flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold transition-colors"
                >
                    <i className="fa-solid fa-route"></i> 길찾기
                </button>
            </div>
        </div>
    );
}

