import React, { useState } from 'react';
import { useStoreContext } from '../StoreContext';

export default function ControlArea() {
    const {
        searchQuery, setSearchQuery,
        selectedBrands, setSelectedBrands,
        isPremiumOnly, setIsPremiumOnly,
        isOneCareOnly, setIsOneCareOnly,
        isMobile
    } = useStoreContext();

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const toggleBrand = (brand) => {
        if (selectedBrands.includes(brand)) {
            setSelectedBrands(selectedBrands.filter(b => b !== brand));
        } else {
            setSelectedBrands([...selectedBrands, brand]);
        }
    };

    return (
        <div className="flex flex-col gap-3 p-4 bg-white border-b border-gray-200 shrink-0">
            {/* Search Input */}
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="지역명 또는 매장명 입력" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-100 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                />
                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-gray-400"></i>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-2 items-center">
                {/* Brand Dropdown (Simplified as a popover) */}
                <div className="relative">
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors border ${selectedBrands.length > 0 ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                        <i className="fa-solid fa-bicycle"></i>
                        <span>{selectedBrands.length > 0 ? `브랜드 (${selectedBrands.length})` : '브랜드 검색'}</span>
                        <i className={`fa-solid fa-chevron-down text-xs transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
                    </button>
                    
                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                            <button 
                                onClick={() => setSelectedBrands([])}
                                className="w-full text-left px-4 py-2 text-xs text-red-500 font-medium hover:bg-red-50 border-b border-gray-50"
                            >
                                선택 해제
                            </button>
                            {['퀄리스포츠&엑스트론', '퀄리바이크', '케어엑스'].map(brand => (
                                <label key={brand} className="flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedBrands.includes(brand)}
                                        onChange={() => toggleBrand(brand)}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">{brand}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Premium Filter */}
                <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold cursor-pointer transition-colors border ${isPremiumOnly ? 'border-amber-500 bg-amber-50 text-amber-600' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}>
                    <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={isPremiumOnly}
                        onChange={(e) => setIsPremiumOnly(e.target.checked)}
                    />
                    <i className="fa-solid fa-star"></i>
                    <span>우수협력점</span>
                </label>

                {/* OneCare Filter */}
                <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold cursor-pointer transition-colors border ${isOneCareOnly ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}>
                    <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={isOneCareOnly}
                        onChange={(e) => setIsOneCareOnly(e.target.checked)}
                    />
                    <i className="fa-solid fa-screwdriver-wrench"></i>
                    <span>원케어</span>
                </label>
            </div>
        </div>
    );
}

