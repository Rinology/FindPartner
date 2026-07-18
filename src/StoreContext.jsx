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

    // Get user location on initial load
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
                    setUserLocation(loc);
                    window.userLocation = loc; // Globally accessible for non-react utils
                },
                (error) => {
                    console.warn("Location permission denied or error.");
                }
            );
        }
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
            if (selectedRegion !== 'all') {
                if (!store.address || !store.address.includes(selectedRegion)) return false;
            }
            
            // Search Query Filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchName = store.name && store.name.toLowerCase().includes(query);
                const matchAddr = store.address && store.address.toLowerCase().includes(query);
                if (!matchName && !matchAddr) return false;
            }

            // Brand Filter
            if (selectedBrands.length > 0) {
                if (!(store.brand || store.brands)) return false;
                const storeBrands = (store.brand || store.brands).split(',').map(b => b.trim());
                const hasMatch = selectedBrands.some(brand => {
                    if (brand === '퀄리스포츠&엑스트론') {
                        return storeBrands.includes('퀄리스포츠') || storeBrands.includes('엑스트론');
                    }
                    return storeBrands.includes(brand);
                });
                if (!hasMatch) return false;
            }

            // Premium Filter
            if (isPremiumOnly && store.grade !== 'S') return false;

            // OneCare Filter
            if (isOneCareOnly && store.oneCare !== 'O') return false;

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

