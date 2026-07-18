import React, { useState } from 'react';
import { useStoreContext } from '../StoreContext';

export default function ControlArea() {
    const { searchQuery, setSearchQuery, selectedRegion, setSelectedRegion, resetFilters, selectedBrands, setSelectedBrands, isPremiumOnly, isOneCareOnly, isLocationActive, isShowAllActive, setIsShowAllActive } = useStoreContext();

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const hasFilters = searchQuery !== "" || selectedBrands.length > 0 || selectedRegion !== 'all' || isPremiumOnly || isOneCareOnly || isLocationActive;

    const handleHomeClick = () => {
        if (!hasFilters) {
            setIsShowAllActive(!isShowAllActive);
        } else {
            resetFilters();
        }
    };

    const toggleBrand = (brand) => {
        if (selectedBrands.includes(brand)) {
            setSelectedBrands(selectedBrands.filter(b => b !== brand));
        } else {
            setSelectedBrands([...selectedBrands, brand]);
        }
    };

    const REGIONS = ['서울', '경기', '인천', '강원', '충북', '충남', '대전', '세종', '경북', '경남', '대구', '울산', '부산', '전북', '전남', '광주', '제주'];

    return (
        <div className="bg-white p-4 shrink-0 shadow-sm border-b border-gray-100 flex flex-col gap-3 relative z-50">
            {/* Top row: Home Button + Region Selector + Search Bar */}
            <div className="flex gap-2 w-full">
                {/* Home Button */}
                <button
                    onClick={handleHomeClick}
                    className="w-[42px] shrink-0 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl flex items-center justify-center hover:bg-gray-100 hover:text-blue-600 transition-colors shadow-sm"
                    title={!hasFilters && !isShowAllActive ? "전체 목록 보기" : "초기화 (홈)"}
                >
                    {!hasFilters && !isShowAllActive ? (
                        <i className="fa-solid fa-list"></i>
                    ) : (
                        <i className="fa-solid fa-house"></i>
                    )}
                </button>

                {/* Region Dropdown */}
                <div className="relative flex-shrink-0 w-28">
                    <select
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        className={`appearance-none w-full flex items-center px-3 py-2.5 pr-8 rounded-lg text-sm font-semibold transition-colors border outline-none ${selectedRegion !== 'all' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                    >
                        <option value="all">전국</option>
                        {REGIONS.map(r => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                    <i className="fa-solid fa-chevron-down text-[10px] absolute right-3 top-[50%] -translate-y-[50%] pointer-events-none text-gray-500"></i>
                </div>

                {/* Search Input */}
                <div className="relative flex-1">
                    <input 
                        type="text" 
                        placeholder="매장명/주소 검색" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-50 rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-400 text-gray-800"
                    />
                    <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-[11px] text-gray-400"></i>
                </div>
            </div>
        </div>
    );
}

