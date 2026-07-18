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
            className: `custom-pin grade-star-pin ${gradeClass} flex items-center justify-center bg-amber-400 text-white rounded-full shadow-lg border-2 border-white`,
            html: `<i class="fa-solid fa-star text-lg drop-shadow-sm"></i>`,
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

