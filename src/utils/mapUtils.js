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
    let badges = '';
    if (isPremium) badges += `<span class="inline-block bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded mr-1"><i class="fa-solid fa-star text-[9px]"></i> 우수</span>`;
    if (isOneCare) badges += `<span class="inline-block bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded mr-1"><i class="fa-solid fa-screwdriver-wrench text-[9px]"></i> 원케어</span>`;
    let brandTags = '';
    if (store.brand || store.brands) {
        brandTags = (store.brand || store.brands).split(',').map(b => `<span class="inline-block bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded mr-1 mb-1">${b.trim()}</span>`).join('');
    }
    const storeName = store.name || '';
    const storeAddress = store.address || '';
    const storePhone = store.phone || '';
    const escapeHTML = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `
        <div class="p-1 min-w-[180px]">
            <div class="mb-1">${badges}</div>
            <h4 class="text-sm font-bold text-gray-900 mb-1">${escapeHTML(storeName)}</h4>
            <p class="text-xs text-gray-600 leading-tight mb-2">${escapeHTML(storeAddress)}</p>
            <div class="mb-2">${brandTags}</div>
            <div class="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                ${storePhone ? `<a href="tel:${storePhone}" class="flex-1 text-center bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold py-1.5 rounded transition-colors" style="text-decoration:none;"><i class="fa-solid fa-phone"></i> 전화</a>` : ''}
                <a href="https://map.naver.com/index.nhn?slng=&slat=&stext=&elng=${store.lng}&elat=${store.lat}&pathType=0&showMap=true&etext=${escapeHTML(storeName)}&menu=route" target="_blank" class="flex-1 text-center bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold py-1.5 rounded transition-colors" style="text-decoration:none;"><i class="fa-solid fa-route"></i> 길찾기</a>
            </div>
        </div>
    `;
}
