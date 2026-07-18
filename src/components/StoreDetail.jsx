import React from 'react';
import { useStoreContext } from '../StoreContext';
import { getDisplayBrands, getBrandBadgeClass } from '../utils/mapUtils';

export default function StoreDetail() {
    const { selectedStore, setSelectedStore } = useStoreContext();

    if (!selectedStore) return null;

    const handleClose = () => {
        setSelectedStore(null);
    };

    const brands = getDisplayBrands(selectedStore);

    return (
        <div className="flex flex-col h-full bg-white animate-in slide-in-from-left-4 duration-300">
            {/* Header / Actions */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
                <button 
                    onClick={handleClose}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600"
                    title="뒤로 가기"
                >
                    <i className="fa-solid fa-arrow-left text-lg"></i>
                </button>
                <div className="font-bold text-gray-900">대리점 정보</div>
                <button 
                    onClick={handleClose}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-600"
                    title="닫기"
                >
                    <i className="fa-solid fa-xmark text-lg"></i>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 list-content-scroll">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        {selectedStore.grade === 'S' && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[11px] font-extrabold rounded-md">우수협력점</span>}
                        {selectedStore.oneCare === 'O' && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[11px] font-extrabold rounded-md">원케어</span>}
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 leading-tight mb-1">{selectedStore.name}</h2>
                    {selectedStore.branch && (
                        <p className="text-sm font-semibold text-gray-500">{selectedStore.branch}</p>
                    )}
                </div>

                {/* Brands */}
                {brands.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 mb-2">취급 브랜드</h3>
                        <div className="flex flex-wrap gap-2">
                            {brands.map((brand, i) => (
                                <span key={i} className={`px-3 py-1 rounded-md text-xs font-bold border ${getBrandBadgeClass(brand)}`}>
                                    {brand}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Info Card */}
                <div className="bg-gray-50 rounded-2xl p-5 space-y-4 border border-gray-100">
                    <div className="flex items-start gap-3">
                        <i className="fa-solid fa-location-dot mt-1 text-gray-400 w-4 text-center"></i>
                        <div>
                            <p className="text-sm font-medium text-gray-800 mb-0.5">주소</p>
                            <p className="text-sm text-gray-600 leading-relaxed">{selectedStore.address}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                        <i className="fa-regular fa-calendar-xmark mt-1 text-gray-400 w-4 text-center"></i>
                        <div>
                            <p className="text-sm font-medium text-gray-800 mb-0.5">휴무일</p>
                            <p className="text-sm text-gray-600">{selectedStore.closed || '없음'}</p>
                        </div>
                    </div>

                    {selectedStore.phone && (
                        <div className="flex items-start gap-3">
                            <i className="fa-solid fa-phone mt-1 text-gray-400 w-4 text-center"></i>
                            <div>
                                <p className="text-sm font-medium text-gray-800 mb-0.5">연락처</p>
                                <p className="text-sm text-gray-600">{selectedStore.phone}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Services */}
                {(selectedStore.category === 'service' || selectedStore.category === 'testride') && (
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 mb-2">제공 서비스</h3>
                        <div className="flex gap-2">
                            <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md border border-gray-200">
                                <i className="fa-solid fa-wrench mr-1"></i> 서비스 가능
                            </span>
                            {selectedStore.category === 'testride' && (
                                <span className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-md border border-green-200">
                                    <i className="fa-solid fa-person-biking mr-1"></i> 시승 가능
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Fixed Actions */}
            <div className="p-4 bg-white border-t border-gray-100 flex gap-3 shrink-0">
                {selectedStore.phone && (
                    <a 
                        href={`tel:${selectedStore.phone}`} 
                        className="flex-1 flex justify-center items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3.5 rounded-xl transition-colors"
                    >
                        <i className="fa-solid fa-phone"></i> 전화하기
                    </a>
                )}
                <button 
                    onClick={() => {
                        if (window.openNaverNavi) {
                            window.openNaverNavi(selectedStore.lat, selectedStore.lng, selectedStore.name);
                        }
                    }}
                    className="flex-1 flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md shadow-blue-200"
                >
                    <i className="fa-solid fa-route"></i> 네이버 길찾기
                </button>
            </div>
        </div>
    );
}
