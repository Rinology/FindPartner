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

    return (
        <div 
            onClick={handleClick}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2 items-center flex-wrap">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {store.name}
                    </h3>
                    {isPremium && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-600">
                            <i className="fa-solid fa-star text-[10px]"></i> 우수협력점
                        </span>
                    )}
                    {isOneCare && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-600">
                            <i className="fa-solid fa-screwdriver-wrench text-[10px]"></i> 원케어
                        </span>
                    )}
                </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-3 flex items-start gap-2">
                <i className="fa-solid fa-location-dot mt-1 text-gray-400"></i>
                <span>{store.address}</span>
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
                {(store.brand || store.brands) && (store.brand || store.brands).split(',').map((brand, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                        {brand.trim()}
                    </span>
                ))}
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
                {store.phone && (
                    <a href={`tel:${store.phone}`} onClick={(e) => e.stopPropagation()} className="flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold transition-colors">
                        <i className="fa-solid fa-phone"></i> 전화
                    </a>
                )}
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://map.naver.com/index.nhn?slng=&slat=&stext=&elng=${store.lng}&elat=${store.lat}&pathType=0&showMap=true&etext=${store.name}&menu=route`, '_blank');
                    }} 
                    className="flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold transition-colors"
                >
                    <i className="fa-solid fa-route"></i> 길찾기
                </button>
            </div>
        </div>
    );
}

