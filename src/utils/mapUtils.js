export function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    if (window.DOMPurify) {
        return window.DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    }
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

export function getStoreLatLng(store) {
    let lat = null;
    let lng = null;

    if (store.lat && store.lng) {
        lat = parseFloat(store.lat);
        lng = parseFloat(store.lng);
    }
    else if (store.coord || store.coordinates) {
        const coordStr = store.coord || store.coordinates;
        if (typeof coordStr === 'string' && coordStr.includes(',')) {
            const parts = coordStr.split(',');
            if (parts.length === 2) {
                lat = parseFloat(parts[0].trim());
                lng = parseFloat(parts[1].trim());
            }
        }
    }

    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
    }
    return null;
}

export function getMarkerIcon(category, grade, isSelected = false) {
    const L = window.L;
    if (!L) return null;

    const selectedClass = isSelected ? 'ring-4 ring-blue-500 rounded-full bg-white scale-110 z-50' : '';
    const selectedStyle = isSelected ? 'filter: drop-shadow(0 0 8px rgba(59,130,246,0.8));' : '';

    if (grade === 'S') {
        let gradeClass = `grade-s-star`;
        return L.divIcon({
            className: `custom-pin premium-pin ${gradeClass} flex items-center justify-center ${selectedClass}`,
            html: `<i class="fa-solid fa-star drop-shadow-sm" style="font-size: 42px; color: #FFD700; text-shadow: 0 0 5px rgba(255, 215, 0, 0.5), -1px -1px 0 rgba(255, 255, 255, 0.9) inset, 1px 1px 2px rgba(255, 255, 255, 0.8); ${selectedStyle}"></i>`,
            iconSize: isSelected ? [48, 48] : [42, 42],
            iconAnchor: isSelected ? [24, 24] : [21, 21],
            popupAnchor: [0, -20]
        });
    }

    let color = '#888';
    if (category === 'testride') color = '#72bf44';
    if (category === 'onecare') color = '#3a86ff';

    return L.divIcon({
        className: `custom-pin ${selectedClass}`,
        html: `<i class="fa-solid fa-location-dot" style="color:${color}; font-size:30px; drop-shadow: 0 4px 6px rgba(0,0,0,0.3); ${selectedStyle}"></i>`,
        iconSize: isSelected ? [36, 36] : [30, 30],
        iconAnchor: isSelected ? [18, 36] : [15, 30],
        popupAnchor: [0, -32]
    });
}

export function openNaverNavi(lat, lng, name) {
    let url = `https://map.naver.com/index.nhn?elat=${lat}&elng=${lng}&etext=${encodeURIComponent(name)}&menu=route`;
    
    const go = (uLat, uLng) => {
        if (uLat && uLng) {
            url += `&slat=${uLat}&slng=${uLng}&stext=${encodeURIComponent('내위치')}`;
        }
        window.open(url, '_blank');
    };

    if (window.userLocation) {
        go(window.userLocation.lat, window.userLocation.lng);
    } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => go(pos.coords.latitude, pos.coords.longitude),
            () => go()
        );
    } else {
        go();
    }
}

export function getBrandsFromStore(store) {
    if (!store) return [];
    if (store.brands) {
        return store.brands.split(',').map(b => b.trim()).filter(Boolean);
    }
    if (store.brand) {
        return store.brand.split(',').map(b => b.trim()).filter(Boolean);
    }
    return [];
}

export function getDisplayBrands(store) {
    const rawBrands = getBrandsFromStore(store);
    let displayBrands = [];
    rawBrands.forEach(b => {
        if (!displayBrands.includes(b)) {
            displayBrands.push(b);
        }
    });
    return displayBrands;
}

export function getBrandBadgeClass(brand) {
    let bgClass = "bg-gray-100 text-gray-600";
    if (brand === '퀄리스포츠') {
        bgClass = "bg-[#2f6286] text-white shadow-sm";
    } else if (brand === '엑스트론') {
        bgClass = "bg-[#231f20] text-white shadow-sm";
    } else if (brand === '퀄리바이크') {
        bgClass = "bg-[#72bf44] text-white shadow-sm";
    } else if (brand === '케어엑스' || brand === '케이엑스') {
        bgClass = "bg-[#ff3b30] text-white shadow-sm";
    }
    return bgClass;
}

export function getPopupHTML(store) {
    const isPremium = store.grade === 'S';
    const isOneCare = store.oneCare === 'O';
    
    // Normalize brands
    const rawBrands = getBrandsFromStore(store);
    let displayBrands = [];
    if (rawBrands.includes('퀄리스포츠') || rawBrands.includes('엑스트론')) {
        displayBrands.push('퀄리스포츠&엑스트론');
    }
    rawBrands.forEach(b => {
        if (b !== '퀄리스포츠' && b !== '엑스트론' && !displayBrands.includes(b)) {
            displayBrands.push(b);
        }
    });

    let badges = '';
    if (isPremium) badges += `<span class="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded mr-1"><i class="fa-solid fa-star text-[9px]"></i> 우수</span>`;
    if (isOneCare) badges += `<span class="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded mr-1"><i class="fa-solid fa-screwdriver-wrench text-[9px]"></i> 원케어</span>`;
    
    let brandTags = '';
    displayBrands.forEach(brand => {
        let bgClass = "bg-gray-100 text-gray-600";
        if (brand === '퀄리스포츠&엑스트론') {
            bgClass = "bg-gradient-to-br from-[#2f6286] to-[#231f20] text-white border border-white/20 shadow-sm";
        } else if (brand === '퀄리바이크') {
            bgClass = "bg-[#72bf44] text-white shadow-sm";
        } else if (brand === '케어엑스' || brand === '케이엑스') {
            bgClass = "bg-[#ff3b30] text-white shadow-sm";
        }
        brandTags += `<span class="inline-block ${bgClass} text-[10px] px-1.5 py-0.5 rounded mr-1 mb-1 font-bold">${brand}</span>`;
    });

    const storeName = store.name || '';
    const storeBranch = store.branch ? `<p class="text-[11px] font-semibold text-gray-500 mt-1">${escapeHTML(store.branch)}</p>` : '';
    const storeAddress = store.address || '';
    const storePhone = store.phone || '';
    
    const userLat = window.userLocation ? window.userLocation.lat : '';
    const userLng = window.userLocation ? window.userLocation.lng : '';
    
    // 네이버 길찾기 연동 (출발지 텍스트 포함)
    let naverUrl = `https://map.naver.com/index.nhn?elng=${store.lng}&elat=${store.lat}&pathType=0&showMap=true&etext=${escapeHTML(storeName)}&menu=route`;
    if (userLat && userLng) {
        naverUrl += `&slng=${userLng}&slat=${userLat}&stext=내위치`;
    }
    
    return `
        <div class="p-3 min-w-[220px] rounded-lg border-t-4 border-t-[#2f6286] bg-white shadow-xl">
            <div class="flex flex-col mb-2">
                <h4 class="text-[15px] font-extrabold text-gray-900 leading-tight">${escapeHTML(storeName)}</h4>
                ${storeBranch}
            </div>
            <div class="mb-2.5 flex flex-wrap gap-1">${badges}</div>
            
            <div class="bg-gray-50 rounded p-2 mb-3">
                <p class="text-xs text-gray-700 leading-tight mb-1.5 flex items-start gap-1.5">
                    <i class="fa-solid fa-location-dot mt-0.5 text-blue-500 w-3 text-center"></i>
                    <span class="flex-1">${escapeHTML(storeAddress)}</span>
                </p>
                <p class="text-xs text-gray-700 leading-tight flex items-start gap-1.5">
                    <i class="fa-regular fa-calendar-xmark mt-0.5 text-blue-500 w-3 text-center"></i>
                    <span class="flex-1">휴무: ${escapeHTML(store.closed || '없음')}</span>
                </p>
            </div>
            
            <div class="mb-3 flex flex-wrap gap-1">${brandTags}</div>
            
            <div class="flex gap-2 mt-2">
                ${storePhone ? `<a href="tel:${storePhone}" class="flex-1 flex justify-center items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold py-2 rounded-md transition-colors shadow-sm" style="text-decoration:none;"><i class="fa-solid fa-phone"></i> 전화</a>` : ''}
                <a href="${naverUrl}" target="_blank" class="flex-1 flex justify-center items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-md transition-colors shadow-sm" style="text-decoration:none;"><i class="fa-solid fa-route"></i> 길찾기</a>
            </div>
        </div>
    `;
}
