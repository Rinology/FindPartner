import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import ListPanel from './components/ListPanel';
import StoreDetail from './components/StoreDetail';
import MapPanel from './components/MapPanel';
import MobileStoreModal from './components/MobileStoreModal';
import { useStoreContext } from './StoreContext';

export default function Layout() {
    const { isMobile, selectedStore } = useStoreContext();

    return (
        <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-gray-50 text-slate-800 select-none font-sans">
            <Header />
            
            <div className="flex flex-1 relative min-h-0">
                {/* Desktop: Sidebar on the left */}
                {!isMobile && <ListPanel />}
                
                {/* Map occupies remaining space */}
                <MapPanel />
                
                {/* Mobile: Bottom sheet over the map */}
                {isMobile && <ListPanel />}
            </div>

            {/* Mobile: Full Screen Modal when store is selected */}
            {isMobile && selectedStore && <MobileStoreModal />}

        </div>
    );
}

