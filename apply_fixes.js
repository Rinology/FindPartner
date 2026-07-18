import fs from 'fs';

function replaceFile(path, replacer) {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');
    content = replacer(content);
    fs.writeFileSync(path, content, 'utf8');
}

// 1. Lowercase properties
const propFix = (c) => c
    .replace(/store\.StoreName/g, 'store.name')
    .replace(/store\.Address/g, 'store.address')
    .replace(/store\.Grade/g, 'store.grade')
    .replace(/store\.Region/g, 'store.region')
    .replace(/store\.OneCare/g, 'store.oneCare')
    .replace(/store\.Brands/g, '(store.brand || store.brands)')
    .replace(/store\.Category/g, 'store.category')
    .replace(/store\.Phone/g, 'store.phone');

const oneCareFix = (c) => c.replace(/store\.oneCare === 'TRUE'/g, "store.oneCare === 'O'").replace(/store\.oneCare !== 'TRUE'/g, "store.oneCare !== 'O'");

const filesToPropFix = [
    'src/StoreContext.jsx',
    'src/components/StoreCard.jsx',
    'src/components/ListPanel.jsx',
    'src/components/MapPanel.jsx',
    'src/components/ControlArea.jsx',
    'src/utils/mapUtils.js'
];
filesToPropFix.forEach(f => {
    if (fs.existsSync(f)) {
        replaceFile(f, c => oneCareFix(propFix(c)));
    }
});

// 2. ControlArea.jsx: Add REGIONS and Dropdown
replaceFile('src/components/ControlArea.jsx', c => {
    c = c.replace(
        /const \{\s*searchQuery([^}]+)\s*\} = useStoreContext\(\);/s,
        "const { searchQuery$1, selectedRegion, setSelectedRegion } = useStoreContext();"
    );
    c = c.replace(
        "    return (",
        "    const REGIONS = ['서울', '경기', '인천', '강원', '충북', '충남', '대전', '세종', '경북', '경남', '대구', '울산', '부산', '전북', '전남', '광주', '제주'];\n\n    return ("
    );
    c = c.replace(
        "                {/* Brand Dropdown (Simplified as a popover) */}",
        `                {/* Region Dropdown */}
                <div className="relative">
                    <select
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        className={\`appearance-none flex items-center gap-1.5 px-3 py-1.5 pr-8 rounded-full text-sm font-semibold transition-colors border outline-none \${selectedRegion !== 'all' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}\`}
                    >
                        <option value="all">전국 (시/도)</option>
                        {REGIONS.map(r => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                    <i className="fa-solid fa-chevron-down text-xs absolute right-3 top-[50%] -translate-y-[50%] pointer-events-none text-gray-500"></i>
                </div>

                {/* Brand Dropdown (Simplified as a popover) */}`
    );
    return c;
});

// 3. Header.jsx: Resize logo, move buttons
replaceFile('src/components/Header.jsx', c => {
    c = c.replace('h-10 md:h-12', 'h-7 w-auto');
    c = c.replace('h-8 md:h-10', 'h-7 w-auto');
    c = c.replace(
        /<div className="hidden md:flex items-center gap-3">\s*<a href="http:\/\/pf\.kakao\.com\/_xhxhRZxl\/chat"[^>]*>.*?<\/a>\s*<a href="https:\/\/xtroncare\.kr"[^>]*>.*?<\/a>\s*<\/div>/s,
        ""
    );
    c = c.replace(
        /<div className="flex flex-col">.*?<\/div>/s,
        (match) => match + `\n                    <div className="hidden md:flex items-center gap-2 ml-4">
                        <a href="http://pf.kakao.com/_xhxhRZxl/chat" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FEE500] hover:bg-[#F4DC00] text-[#000000] text-xs font-bold rounded-full transition-colors shadow-sm">
                            <i className="fa-brands fa-kakao text-sm"></i> 카카오톡 1:1 상담
                        </a>
                        <a href="https://xtroncare.kr" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full transition-colors shadow-sm">
                            <i className="fa-solid fa-file-signature text-sm"></i> 정품등록센터
                        </a>
                    </div>`
    );
    return c;
});

// 4. mapUtils.js: Add getPopupHTML, change star icon
replaceFile('src/utils/mapUtils.js', c => {
    c = c.replace(
        /className: `custom-pin grade-star-pin \$\{gradeClass\} flex items-center justify-center bg-amber-400 text-white rounded-full shadow-lg border-2 border-white`,[\s\S]*?popupAnchor: \[0, -20\]/,
        `className: \`custom-pin premium-pin \${gradeClass} flex items-center justify-center\`,
            html: \`<i class="fa-solid fa-star drop-shadow-sm" style="font-size: 42px; color: #FFD700; text-shadow: 0 0 5px rgba(255, 215, 0, 0.5), -1px -1px 0 rgba(255, 255, 255, 0.9) inset, 1px 1px 2px rgba(255, 255, 255, 0.8);"></i>\`,
            iconSize: [42, 42],
            iconAnchor: [21, 21],
            popupAnchor: [0, -20]`
    );
    c += `\n\nexport function getPopupHTML(store) {
    const isPremium = store.grade === 'S';
    const isOneCare = store.oneCare === 'O';
    let badges = '';
    if (isPremium) badges += \`<span class="inline-block bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded mr-1"><i class="fa-solid fa-star text-[9px]"></i> 우수</span>\`;
    if (isOneCare) badges += \`<span class="inline-block bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded mr-1"><i class="fa-solid fa-screwdriver-wrench text-[9px]"></i> 원케어</span>\`;
    let brandTags = '';
    if (store.brand || store.brands) {
        brandTags = (store.brand || store.brands).split(',').map(b => \`<span class="inline-block bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded mr-1 mb-1">\${b.trim()}</span>\`).join('');
    }
    const storeName = store.name || '';
    const storeAddress = store.address || '';
    const storePhone = store.phone || '';
    const escapeHTML = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return \`
        <div class="p-1 min-w-[180px]">
            <div class="mb-1">\${badges}</div>
            <h4 class="text-sm font-bold text-gray-900 mb-1">\${escapeHTML(storeName)}</h4>
            <p class="text-xs text-gray-600 leading-tight mb-2">\${escapeHTML(storeAddress)}</p>
            <div class="mb-2">\${brandTags}</div>
            <div class="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                \${storePhone ? \`<a href="tel:\${storePhone}" class="flex-1 text-center bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold py-1.5 rounded transition-colors" style="text-decoration:none;"><i class="fa-solid fa-phone"></i> 전화</a>\` : ''}
                <a href="https://map.naver.com/index.nhn?slng=&slat=&stext=&elng=\${store.lng}&elat=\${store.lat}&pathType=0&showMap=true&etext=\${escapeHTML(storeName)}&menu=route" target="_blank" class="flex-1 text-center bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold py-1.5 rounded transition-colors" style="text-decoration:none;"><i class="fa-solid fa-route"></i> 길찾기</a>
            </div>
        </div>
    \`;
}\n`;
    return c;
});

// 5. MapPanel.jsx: fix bounds, imports, selectedStore, controls, popup
replaceFile('src/components/MapPanel.jsx', c => {
    c = c.replace(
        "import { escapeHTML, getMarkerIcon, getStoreLatLng } from '../utils/mapUtils';",
        "import { escapeHTML, getMarkerIcon, getStoreLatLng, getPopupHTML } from '../utils/mapUtils';"
    );
    c = c.replace(
        "const { filteredData, setSelectedStore, setIsBottomSheetExpanded, isMobile } = useStoreContext();",
        "const { filteredData, selectedStore, setSelectedStore, setIsBottomSheetExpanded, isMobile } = useStoreContext();"
    );
    c = c.replace(
        "const southWest = L.latLng(32.0, 124.0);",
        "const southWest = L.latLng(33.1, 125.0);"
    );
    c = c.replace(
        "const northEast = L.latLng(40.0, 132.0);",
        "const northEast = L.latLng(38.6, 131.5);"
    );
    c = c.replace(
        "center: isMobile ? [36.0, 127.5] : [36.0, 127.5],",
        "center: isMobile ? [36.0, 127.5] : [36.0, 128.0],"
    );
    c = c.replace(
        "L.control.zoom({ position: isMobile ? 'bottomright' : 'bottomright' }).addTo(map);",
        "L.control.zoom({ position: 'topleft' }).addTo(map);"
    );
    c = c.replace(
        /const marker = L\.marker\(\[pos\.lat, pos\.lng\], \{ icon: customIcon \}\);\s*marker\.on\('click', \(\) => \{/s,
        `const marker = L.marker([pos.lat, pos.lng], { icon: customIcon });\n                marker.storeData = store;\n                marker.bindPopup(getPopupHTML(store), { offset: [0, -10], className: 'custom-leaflet-popup' });\n                marker.on('click', () => {`
    );
    c = c.replace(
        /    \}, \[filteredData, isMobile, setSelectedStore, setIsBottomSheetExpanded\]\);/s,
        `    }, [filteredData, isMobile, setSelectedStore, setIsBottomSheetExpanded]);

    // Open popup when selectedStore changes externally (e.g. from list)
    useEffect(() => {
        if (!mapInstance.current || !selectedStore) return;
        const targetMarker = markersRef.current.find(m => m.storeData === selectedStore);
        if (targetMarker) {
            if (markerClusterGroup.current) {
                markerClusterGroup.current.zoomToShowLayer(targetMarker, () => targetMarker.openPopup());
            } else {
                targetMarker.openPopup();
            }
        }
    }, [selectedStore]);`
    );
    c = c.replace(
        /<div className=\{\`absolute z-\[1000\] flex flex-col gap-3 \$\{isMobile \? 'right-4 bottom-32' : 'right-6 bottom-32'\}\`\}>/s,
        `<div className={\`absolute z-[1000] flex flex-col gap-3 \${isMobile ? 'right-4 bottom-24' : 'left-3 top-[92px]'}\`}>`
    );
    c = c.replace(
        "mapInstance.current.setView([36.0, 127.5], 7);",
        "mapInstance.current.setView(isMobile ? [36.0, 127.5] : [36.0, 128.0], 7);"
    );
    return c;
});
console.log("Done");
