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

export function getMarkerIcon(category, grade) {
    const L = window.L;
    if (!L) return null;

    if (grade === 'S') {
        let gradeClass = `grade-s-star`;
        return L.divIcon({
            className: `custom-pin premium-pin ${gradeClass} flex items-center justify-center`,
            html: `<i class="fa-solid fa-star drop-shadow-sm" style="font-size: 42px; color: #FFD700; text-shadow: 0 0 5px rgba(255, 215, 0, 0.5), -1px -1px 0 rgba(255, 255, 255, 0.9) inset, 1px 1px 2px rgba(255, 255, 255, 0.8);"></i>`,
            iconSize: [42, 42],
            iconAnchor: [21, 21],
            popupAnchor: [0, -20]
        });
    }

    let color = '#888';
    if (category === 'testride') color = '#72bf44';
    if (category === 'onecare') color = '#3a86ff';

    return L.divIcon({
        className: 'custom-pin',
        html: `<i class="fa-solid fa-location-dot" style="color:${color}; font-size:30px; drop-shadow: 0 4px 6px rgba(0,0,0,0.3);"></i>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -32]
    });
}

export function getPopupHTML(store) {
    const isPremium = store.grade === 'S';
    const isOneCare = store.oneCare === 'O';
    
    // Normalize brands
    const rawBrands = (store.brand || store.brands || '').split(',').map(b => b.trim()).filter(Boolean);
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
    const storeBranch = store.branch ? `<p class="text-xs font-semibold text-gray-600 mt-0.5">${escapeHTML(store.branch)}</p>` : '';
    const storeAddress = store.address || '';
    const storePhone = store.phone || '';
    
    const userLat = window.userLocation ? window.userLocation.lat : '';
    const userLng = window.userLocation ? window.userLocation.lng : '';
    
    return `
        <div class="p-2 min-w-[200px]">
            <div class="flex flex-col mb-1.5">
                <h4 class="text-sm font-bold text-gray-900 leading-tight">${escapeHTML(storeName)}</h4>
                ${storeBranch}
            </div>
            <div class="mb-2">${badges}</div>
            <p class="text-xs text-gray-600 leading-tight mb-2 flex items-start gap-1">
                <i class="fa-solid fa-location-dot mt-0.5 text-gray-400"></i>
                <span class="flex-1">${escapeHTML(storeAddress)}</span>
            </p>
            <div class="mb-2">${brandTags}</div>
            <div class="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                ${storePhone ? `<a href="tel:${storePhone}" class="flex-1 text-center bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold py-2 rounded transition-colors" style="text-decoration:none;"><i class="fa-solid fa-phone"></i> 전화</a>` : ''}
                <a href="https://map.naver.com/index.nhn?slng=${userLng}&slat=${userLat}&stext=&elng=${store.lng}&elat=${store.lat}&pathType=0&showMap=true&etext=${escapeHTML(storeName)}&menu=route" target="_blank" class="flex-1 text-center bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold py-2 rounded transition-colors" style="text-decoration:none;"><i class="fa-solid fa-route"></i> 길찾기</a>
            </div>
        </div>
    `;
}
