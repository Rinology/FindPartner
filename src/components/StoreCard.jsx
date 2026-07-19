import React from 'react';
import { useStoreContext } from '../StoreContext';
import { getStoreLatLng, getDisplayBrands, getBrandBadgeClass, openNaverNavi, formatBranchName } from '../utils/mapUtils';

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
    const displayBrands = getDisplayBrands(store);
    const formattedBranch = formatBranchName(store.branch);
    
    // Check if closed today
    const todayStr = ['일','월','화','수','목','금','토'][new Date().getDay()];
    const isClosedToday = store.closed && store.closed.includes(todayStr);

    return (
        <div 
            onClick={handleClick}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:ring-2 hover:ring-blue-500/50 hover:-translate-y-1 transition-all duration-200 group"
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                    <h3 className="text-lg font-extrabold text-gray-900 transition-colors">
                        {store.name}
                    </h3>
                    {formattedBranch && (
                        <p className="text-sm font-semibold text-gray-600 mt-0.5">{formattedBranch}</p>
                    )}
                </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-1 flex items-start gap-2">
                <i className="fa-solid fa-location-dot mt-1 text-gray-400 w-3 text-center"></i>
                <span>{store.address}</span>
            </p>

            <div className={`text-sm mb-3 flex items-start gap-2 ${isClosedToday ? 'text-red-600 font-bold bg-red-50 p-1.5 rounded-lg border border-red-100 inline-flex' : 'text-gray-600'}`}>
                <i className={`fa-regular fa-calendar-xmark mt-1 w-3 text-center ${isClosedToday ? 'text-red-500' : 'text-gray-400'}`}></i>
                <span>휴무: {store.closed || '없음'}</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                {displayBrands.map((brand, i) => (
                    <span key={i} title={`${brand} 취급 대리점`} className={`px-2.5 py-1 text-[11px] font-bold rounded-md cursor-help ${getBrandBadgeClass(brand)}`}>
                        {brand}
                    </span>
                ))}
            </div>

            {/* Badges (Premium, OneCare) moved to bottom before buttons */}
            {(isPremium || isOneCare) && (
                <div className="flex gap-2 mb-3">
                    {isPremium && (
                        <span title="본사가 인증한 최우수 서비스 매장" className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-amber-100 text-amber-700 cursor-help">
                            <i className="fa-solid fa-star text-[10px]"></i> 우수협력점
                        </span>
                    )}
                    {isOneCare && (
                        <span title="집에서 가까운 대리점에서 제품수령!" className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700 cursor-help">
                            <i className="fa-solid fa-screwdriver-wrench text-[10px]"></i> 원케어
                        </span>
                    )}
                </div>
            )}
            
            {store.category === 'testride' && (
                <div className="mb-3">
                    <p className="text-[11px] text-gray-500 font-medium bg-gray-50 p-2 rounded-md border border-gray-100 inline-block">
                        <i className="fa-solid fa-circle-info mr-1 text-gray-400"></i> 시승 가능 여부는 해당 매장에 문의해 주시기 바랍니다.
                    </p>
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
                        openNaverNavi(store);
                    }} 
                    className="flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold transition-colors"
                >
                    <i className="fa-solid fa-route"></i> 길찾기
                </button>
            </div>
        </div>
    );
}

