import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { fetchStoreData } from './api';

const StoreContext = createContext();

export function StoreProvider({ children }) {
    const [allData, setAllData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [isPremiumOnly, setIsPremiumOnly] = useState(false);
    const [isOneCareOnly, setIsOneCareOnly] = useState(false);
    const [selectedRegion, setSelectedRegion] = useState('all');

    // User Location & Selection
    const [userLocation, setUserLocation] = useState(null);
    const [selectedStore, setSelectedStore] = useState(null);

    // Responsive / Layout State
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
    const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 900);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetchStoreData()
            .then(data => {
                setAllData(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    const filteredData = useMemo(() => {
        return allData.filter(store => {
            // Region Filter
            if (selectedRegion !== 'all' && store.Region !== selectedRegion) return false;
            
            // Search Query Filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchName = store.StoreName && store.StoreName.toLowerCase().includes(query);
                const matchAddr = store.Address && store.Address.toLowerCase().includes(query);
                if (!matchName && !matchAddr) return false;
            }

            // Brand Filter
            if (selectedBrands.length > 0) {
                if (!store.Brands) return false;
                const storeBrands = store.Brands.split(',').map(b => b.trim());
                const hasMatch = selectedBrands.some(brand => storeBrands.includes(brand));
                if (!hasMatch) return false;
            }

            // Premium Filter
            if (isPremiumOnly && store.Grade !== 'S') return false;

            // OneCare Filter
            if (isOneCareOnly && store.OneCare !== 'TRUE') return false;

            return true;
        });
    }, [allData, selectedRegion, searchQuery, selectedBrands, isPremiumOnly, isOneCareOnly]);

    const value = {
        allData, filteredData, loading, error,
        searchQuery, setSearchQuery,
        selectedBrands, setSelectedBrands,
        isPremiumOnly, setIsPremiumOnly,
        isOneCareOnly, setIsOneCareOnly,
        selectedRegion, setSelectedRegion,
        userLocation, setUserLocation,
        selectedStore, setSelectedStore,
        isMobile,
        isBottomSheetExpanded, setIsBottomSheetExpanded
    };

    return (
        <StoreContext.Provider value={value}>
            {children}
        </StoreContext.Provider>
    );
}

export function useStoreContext() {
    return useContext(StoreContext);
}

