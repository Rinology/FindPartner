import React, { useRef, useEffect } from 'react';
import { useStoreContext } from '../StoreContext';
import StoreCard from './StoreCard';
import ControlArea from './ControlArea';
import StoreDetail from './StoreDetail';
import BrandInfo from './BrandInfo';

export default function ListPanel() {
    const { 
        filteredData, loading, error, 
        isMobile, 
        selectedStore,
        searchQuery, selectedBrands, selectedRegion, isPremiumOnly, isOneCareOnly, isLocationActive, isShowAllActive,
        isBottomSheetExpanded, setIsBottomSheetExpanded 
    } = useStoreContext();
    
    const panelRef = useRef(null);
    const startY = useRef(0);
    const currentY = useRef(0);

    // Mobile drag logic
    useEffect(() => {
        if (!isMobile) return;
        const panel = panelRef.current;
        if (!panel) return;

        const handleTouchStart = (e) => {
            if (e.target.closest('.list-content-scroll')) {
                const scrollEl = e.target.closest('.list-content-scroll');
                if (scrollEl.scrollTop > 0) return; // let native scroll happen
            }
            startY.current = e.touches[0].clientY;
            currentY.current = startY.current;
            panel.style.transition = 'none';
        };

        const handleTouchMove = (e) => {
            if (e.target.closest('.list-content-scroll')) {
                const scrollEl = e.target.closest('.list-content-scroll');
                if (scrollEl.scrollTop > 0) return;
                if (e.touches[0].clientY < startY.current) return;
            }
            currentY.current = e.touches[0].clientY;
            const deltaY = currentY.current - startY.current;
            if (deltaY > 0) {
                // Dragging down (closing)
                panel.style.transform = `translateY(${deltaY}px)`;
            }
        };

        const handleTouchEnd = () => {
            panel.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
            panel.style.transform = '';
            const deltaY = currentY.current - startY.current;
            if (deltaY > 100) {
                setIsBottomSheetExpanded(false);
            } else if (deltaY < -50) {
                setIsBottomSheetExpanded(true);
            }
        };

        panel.addEventListener('touchstart', handleTouchStart, { passive: true });
        panel.addEventListener('touchmove', handleTouchMove, { passive: true });
        panel.addEventListener('touchend', handleTouchEnd);

        return () => {
            panel.removeEventListener('touchstart', handleTouchStart);
            panel.removeEventListener('touchmove', handleTouchMove);
            panel.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isMobile, setIsBottomSheetExpanded]);

    const hasFilters = searchQuery !== "" || selectedBrands.length > 0 || selectedRegion !== 'all' || isPremiumOnly || isOneCareOnly;
    const showList = hasFilters || isLocationActive || isShowAllActive;

    if (!isMobile) {
        // Desktop View: Left Sidebar
        return (
            <aside className="w-96 flex flex-col bg-white shadow-xl z-[1000] shrink-0 h-full border-r border-gray-200">
                {selectedStore ? (
                    <StoreDetail />
                ) : (
                    <>
                        <ControlArea />
                        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4 list-content-scroll relative z-[999]">
                            {loading && <div className="text-center py-10 text-gray-500"><i className="fa-solid fa-spinner fa-spin fa-2x mb-4"></i><br/>데이터를 불러오는 중입니다...</div>}
                            {error && <div className="text-center py-10 text-red-500">데이터 로드 실패</div>}
                            
                            {!loading && !error && showList && filteredData.length === 0 && <div className="text-center py-10 text-gray-500">조건에 맞는 대리점이 없습니다.</div>}
                            
                            {!loading && !error && showList && filteredData.map((store, i) => (
                                <StoreCard key={i} store={store} />
                            ))}

                            {!loading && !error && !showList && (
                                <BrandInfo />
                            )}
                        </div>
                    </>
                )}
            </aside>
        );
    }

    // Mobile View: Bottom Sheet
    return (
        <aside 
            ref={panelRef}
            className={`absolute bottom-0 left-0 right-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.15)] rounded-t-3xl z-[2000] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] h-[65vh] ${isBottomSheetExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-3.5rem)]'}`}
        >
            <div className="w-full h-8 flex items-center justify-center shrink-0 cursor-grab active:cursor-grabbing" onClick={() => setIsBottomSheetExpanded(!isBottomSheetExpanded)}>
                <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
            </div>
            
            <div className={`flex-1 flex flex-col overflow-hidden transition-opacity duration-300 ${isBottomSheetExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4 list-content-scroll">
                    {loading && <div className="text-center py-10 text-gray-500"><i className="fa-solid fa-spinner fa-spin fa-2x mb-4"></i><br/>데이터를 불러오는 중입니다...</div>}
                    {error && <div className="text-center py-10 text-red-500">데이터 로드 실패</div>}
                    {!loading && !error && showList && filteredData.length === 0 && <div className="text-center py-10 text-gray-500">조건에 맞는 대리점이 없습니다.</div>}
                    {!loading && !error && showList && filteredData.map((store, i) => (
                        <StoreCard key={i} store={store} />
                    ))}
                    {!loading && !error && !showList && (
                        <BrandInfo />
                    )}
                </div>
            </div>
        </aside>
    );
}

