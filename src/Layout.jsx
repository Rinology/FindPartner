import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import ListPanel from './components/ListPanel';
import StoreDetail from './components/StoreDetail';
import MapPanel from './components/MapPanel';
import MobileFAB from './components/MobileFAB';
import MobileStoreModal from './components/MobileStoreModal';
import { useStoreContext } from './StoreContext';

export default function Layout() {
    const { isMobile, selectedStore } = useStoreContext();

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden bg-gray-50 text-slate-800 select-none font-sans">
            <Header />
            
            <div className="flex flex-1 relative min-h-0">
                {/* Desktop: Sidebar on the left */}
                {!isMobile && <ListPanel />}
                
                {/* Desktop: Detail Panel sliding in next to ListPanel */}
                {!isMobile && selectedStore && (
                    <aside className="w-[360px] bg-white shadow-xl z-[900] shrink-0 h-full border-r border-gray-200 animate-slide-in-left absolute left-96 top-0 bottom-0 overflow-y-auto">
                        <StoreDetail />
                    </aside>
                )}
                
                {/* Map occupies remaining space */}
                <MapPanel />
                
                {/* Mobile: Bottom sheet over the map */}
                {isMobile && <ListPanel />}
            </div>

            {/* Mobile: Full Screen Modal when store is selected */}
            {isMobile && selectedStore && <MobileStoreModal />}

            {isMobile && !selectedStore && <MobileFAB />}
        </div>
    );
}

