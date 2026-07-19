import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { fetchStoreData } from './api';
import { calculateDistance, getStoreLatLng } from './utils/mapUtils';

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
    const [isLocationActive, setIsLocationActiveState] = useState(false);
    const [isShowAllActive, setIsShowAllActive] = useState(false);
    const [isClustered, setIsClustered] = useState(true);

    const setIsLocationActive = (val) => {
        setIsLocationActiveState(val);
        window.isLocationActive = val;
    };

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
                    window.userLocation = loc;
                    setIsLocationActive(true); // 권한이 허용되면 토글도 즉시 켜지도록 연동
                },
                (error) => {
                    console.warn("Location permission denied or error.");
                }
            );
        }
    }, []);

    useEffect(() => {
        const cacheKey = 'findpartner_data_cache';
        const cacheTimeKey = 'findpartner_data_cache_time';
        const cachedData = sessionStorage.getItem(cacheKey);
        const cacheTime = sessionStorage.getItem(cacheTimeKey);
        const now = new Date().getTime();
        
        if (cachedData && cacheTime && now - parseInt(cacheTime, 10) < 30 * 60 * 1000) {
            try {
                setAllData(JSON.parse(cachedData));
                setLoading(false);
                return;
            } catch (e) {
                console.error("Cache parsing error", e);
            }
        }

        fetchStoreData()
            .then(data => {
                setAllData(data);
                sessionStorage.setItem(cacheKey, JSON.stringify(data));
                sessionStorage.setItem(cacheTimeKey, now.toString());
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
                const hasMatch = selectedBrands.some(brand => storeBrands.includes(brand));
                if (!hasMatch) return false;
            }

            // Premium Filter
            if (isPremiumOnly && store.grade !== 'S') return false;

            // OneCare Filter
            if (isOneCareOnly && store.oneCare !== 'O') return false;

            return true;
        }).sort((a, b) => {
            // 위치 기반 검색 활성화 시, 거리순 정렬 우선
            if (isLocationActive && userLocation) {
                const posA = getStoreLatLng(a);
                const posB = getStoreLatLng(b);
                if (posA && posB) {
                    const distA = calculateDistance(userLocation.lat, userLocation.lng, posA.lat, posA.lng);
                    const distB = calculateDistance(userLocation.lat, userLocation.lng, posB.lat, posB.lng);
                    // 거리순 정렬 후 S등급 여부는 고려하지 않음 (가까운게 최고)
                    return distA - distB;
                }
            }

            // S grade stores always come first
            if (a.grade === 'S' && b.grade !== 'S') return -1;
            if (a.grade !== 'S' && b.grade === 'S') return 1;
            return 0;
        });
    }, [allData, selectedRegion, searchQuery, selectedBrands, isPremiumOnly, isOneCareOnly, isLocationActive, userLocation]);

    const resetFilters = () => {
        setSearchQuery("");
        setSelectedRegion("all");
        setSelectedBrands([]);
        setIsPremiumOnly(false);
        setIsOneCareOnly(false);
        setSelectedStore(null);
        setIsLocationActive(false);
        setIsShowAllActive(false);
    };

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
        isBottomSheetExpanded, setIsBottomSheetExpanded,
        resetFilters,
        isLocationActive, setIsLocationActive,
        isShowAllActive, setIsShowAllActive,
        isClustered, setIsClustered
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

