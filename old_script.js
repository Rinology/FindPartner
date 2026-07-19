// [蹂댁븞] ?ㅻ낫???⑥텞??諛⑹? (F12, ?뚯뒪蹂닿린, ??? ?몄뇙, 媛쒕컻?먮룄援???
document.addEventListener('keydown', function (e) {
    // F12
    if (e.keyCode === 123) { e.preventDefault(); return false; }
    // Ctrl+Shift+I (媛쒕컻???꾧뎄), Ctrl+Shift+J (肄섏넄), Ctrl+Shift+C (?붿냼 寃??
    if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
        e.preventDefault(); return false;
    }
    // Ctrl+U (?뚯뒪 蹂닿린)
    if (e.ctrlKey && e.keyCode === 85) { e.preventDefault(); return false; }
    // Ctrl+S (???
    if (e.ctrlKey && e.keyCode === 83) { e.preventDefault(); return false; }
    // Ctrl+P (?몄뇙)
    if (e.ctrlKey && e.keyCode === 80) { e.preventDefault(); return false; }
});

(function() { // [?좉퇋] IIFE ?쒖옉
const GAS_URL = CONFIG.GAS_URL;

// [?곹깭 愿由? 紐⑤뱢 ?대??먯꽌留??묎렐 媛?ν븳 吏??蹂?섎줈 罹≪뒓??const CONSTANTS = {
    ZOOM_DEFAULT: 7,
    ZOOM_FOCUS: 16,
    ZOOM_MOBILE_FOCUS: 17,
    POPUP_OFFSET_DESKTOP: [0, 130]
};

let map;
let markers = []; 
let markerClusterGroup;
let isClusteringEnabled = true;
let userLat = null;
let userLng = null;
let ALL_DATA = [];
let currentCategory = 'all';
let mobileMiniMap = null;
let _pendingPopupFn = null;
let _suppressMapClick = false;
let myLocationMarker = null;

// [蹂댁븞] XSS 諛⑹?瑜??꾪븳 HTML ?댁뒪耳?댄봽 ?⑥닔
function escapeHTML(str) {
    if (!str) return '';
    const charMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;'
    };
    return String(str).replace(/[&<>"'/]/g, s => charMap[s]);
}

document.addEventListener("DOMContentLoaded", function () {
    // [蹂댁븞] ?고겢由? ?쒕옒洹???諛⑹?
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('selectstart', e => e.preventDefault());
    document.addEventListener('dragstart', e => e.preventDefault());

    setupEventListeners();

    initMap();

    // [?좉퇋] reCAPTCHA ?숈쟻 濡쒕뱶 ??珥덇린 ?곗씠??濡쒕뱶
    if (CONFIG.RECAPTCHA_SITE_KEY && CONFIG.RECAPTCHA_SITE_KEY !== 'YOUR_RECAPTCHA_SITE_KEY') {
        const script = document.createElement('script');
        script.src = `https://www.google.com/recaptcha/api.js?render=${CONFIG.RECAPTCHA_SITE_KEY}`;
        script.onload = () => fetchData();
        script.onerror = () => fetchData(); // 濡쒕뱶 ?ㅽ뙣 ??臾댁떆?섍퀬 ?곗씠???붿껌 ?쒕룄
        document.head.appendChild(script);
    } else {
        fetchData();
    }

    requestInitialLocation(); // [?좉퇋] ?섏씠吏 吏꾩엯 ???꾩튂 沅뚰븳 ?붿껌
    handleResponsiveLayout(); // [?좉퇋] ?붾㈃ ?ш린???곕Ⅸ ?덉씠?꾩썐 泥섎━
    applyConfigLinks();      // [?좉퇋] ?ㅼ젙 ?뚯씪??留곹겕瑜?UI???곸슜

    const listEl = document.getElementById('listContent');
    listEl.addEventListener('scroll', () => {
        const btn = document.getElementById('topBtn');
        if (listEl.scrollTop > 300) btn.classList.add('show');
        else btn.classList.remove('show');
    });

    window.addEventListener('scroll', () => {
        if (window.innerWidth <= 900) {
            const btn = document.getElementById('topBtn');
            if (window.scrollY > 300) btn.classList.add('show');
            else btn.classList.remove('show');
        }
    });
    window.addEventListener('resize', handleResponsiveLayout);
});

function setupEventListeners() {
    // 1?? 寃?됱갹
    document.getElementById("searchInput")?.addEventListener("input", () => { toggleClearBtn(); filterData(); });
    document.getElementById("clearSearchBtn")?.addEventListener("click", clearSearch);
    document.getElementById("searchBtn")?.addEventListener("click", filterData);

    // 吏???쒖뼱 踰꾪듉
    document.getElementById("btnCluster")?.addEventListener("click", toggleClustering);
    document.getElementById("btnMyLocation")?.addEventListener("click", toggleMyLocation);
    document.getElementById("btnDarkMode")?.addEventListener("click", toggleDarkMode);

    // 2?? ?꾪꽣 踰꾪듉 (?대깽???꾩엫)
    const filterContainer = document.getElementById("filterButtonsContainer");
    if (filterContainer) {
        filterContainer.addEventListener("change", (e) => {
            if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
                updateFilter(e.target);
                filterData();
            }
        });
    }

    // ?좏깮 ?댁젣 諛????ㅽ겕濡?    document.getElementById("btnClearSelect")?.addEventListener("click", clearSelection);
    document.getElementById("btnScrollLeft")?.addEventListener("click", () => scrollTabs('left'));
    document.getElementById("btnScrollRight")?.addEventListener("click", () => scrollTabs('right'));

    // 3?? ???곸뿭 (?대깽???꾩엫)
    const catTabs = document.getElementById("categoryTabs");
    if (catTabs) {
        catTabs.addEventListener("click", (e) => {
            const btn = e.target.closest('.tab-btn');
            if (btn) {
                setCategory(btn.dataset.cat, btn);
            }
        });
    }

    // 湲고?
    document.getElementById("topBtn")?.addEventListener("click", scrollToListTop);
    document.getElementById("mobileModalOverlay")?.addEventListener("click", closeMobileModal);
    document.getElementById("mobileModalContainer")?.addEventListener("click", e => e.stopPropagation());
    document.getElementById("btnCloseModal")?.addEventListener("click", closeMobileModal);
}

// [?좉퇋] ?ㅼ젙 ?뚯씪??留곹겕瑜??ㅼ젣 ?⑤━癒쇳듃??諛붿씤??function applyConfigLinks() {
    const headerKakao = document.getElementById('headerKakaoBtn');
    const headerRegist = document.getElementById('headerRegistBtn');
    const fabKakao = document.getElementById('fabKakaoBtn');
    const fabRegist = document.getElementById('fabRegistBtn');

    if (headerKakao) headerKakao.href = CONFIG.EXTERNAL_SERVICES.KAKAO_CHANNEL || '#';
    if (headerRegist) headerRegist.href = CONFIG.EXTERNAL_SERVICES.REGIST_CENTER || '#';
    if (fabKakao) fabKakao.href = CONFIG.EXTERNAL_SERVICES.KAKAO_CHANNEL || '#';
    if (fabRegist) fabRegist.href = CONFIG.EXTERNAL_SERVICES.REGIST_CENTER || '#';
}

// [?좉퇋] 紐⑤컮??踰꾩쟾?먯꽌 而⑦듃濡??곸뿭???ㅻ뜑濡??대룞?쒗궎???ы꽭 湲곕뒫
function handleResponsiveLayout() {
    const controlArea = document.getElementById('controlArea');
    const mobilePortal = document.getElementById('mobileControlPortal');
    const aside = document.querySelector('.list-panel');
    const isMobile = window.innerWidth <= 900;

    if (isMobile) {
        if (controlArea.parentElement !== mobilePortal) {
            mobilePortal.appendChild(controlArea);
        }
    } else {
        if (controlArea.parentElement !== aside) {
            aside.insertBefore(controlArea, aside.firstChild);
        }
    }
}

function initMap() {
    // [蹂寃? ??쒕?援??곸뿭 ?쒗븳 (?낅룄 ?ы븿, ?쇰낯/遺곹븳 理쒖냼?? - OSM 蹂듦뎄 ?쒖뿉???좎?
    const southWest = L.latLng(32.9, 124.0);
    const northEast = L.latLng(38.9, 132.5);
    const bounds = L.latLngBounds(southWest, northEast);

    map = L.map('map', {
        center: [36.5, 127.5],
        zoom: 7,
        minZoom: 7,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0,
        attributionControl: false // [?좉퇋] ?ㅽ뵂?뚯뒪 吏??留덊겕 ??젣
    });

    // [蹂듦뎄] OpenStreetMap (OSM)
    // 湲곕낯 ???(Light)
    window.lightTile = L.tileLayer(CONFIG.MAP.LIGHT_TILE, {
        attribution: CONFIG.MAP.ATTRIBUTION.OSM,
        maxZoom: 19
    }).addTo(map);

    // ?ㅽ겕 紐⑤뱶?????(CartoDB Dark Matter)
    window.darkTile = L.tileLayer(CONFIG.MAP.DARK_TILE, {
        attribution: CONFIG.MAP.ATTRIBUTION.CARTO,
        maxZoom: 19
    });

    // 留덉빱 ?대윭?ㅽ꽣 洹몃９ 珥덇린??    markerClusterGroup = L.markerClusterGroup({
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true,
        removeOutsideVisibleBounds: true,
        iconCreateFunction: function (cluster) {
            return L.divIcon({
                html: '<div><span>' + cluster.getChildCount() + '</span></div>',
                className: 'marker-cluster-custom',
                iconSize: L.point(40, 40)
            });
        }
    });

    // 珥덇린 濡쒕뵫 ???대윭?ㅽ꽣留??쒖꽦???곹깭硫?異붽?
    if (isClusteringEnabled) {
        map.addLayer(markerClusterGroup);
    }

    // 吏??鍮?怨??대┃ ???좏깮 ?댁젣 (? ?대┃? _suppressMapClick ?뚮옒洹몃줈 援щ텇)
    map.on('click', function () {
        if (_suppressMapClick) return;
        clearSelection();
    });
}

function getStoreLatLng(store) {
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

function getMarkerIcon(category, grade) {
    // ?꾨━誘몄뾼 蹂??꾩씠肄?(湲곗〈 S?깃툒)
    if (grade === 'S') {
        let gradeClass = `grade-s-star`;
        return L.divIcon({
            className: `custom-pin grade-star-pin ${gradeClass}`,
            html: `<i class="fa-solid fa-star"></i>`,
            iconSize: [42, 42],
            iconAnchor: [21, 21],
            popupAnchor: [0, -20]
        });
    }
    /* [二쇱꽍泥섎━] A, B ?깃툒 ? 鍮꾪솢?깊솕
    else if (grade === 'A' || grade === 'B') {
        let gradeClass = `grade-${grade.toLowerCase()}-star`;
        ...
    }
    */

    // ?쇰컲 ?: 移댄뀒怨좊━??留욎떠 ?됱긽留?蹂寃?(?꾩씠肄섏? ?쇨????덇쾶 location-dot ?듭씪)
    let color = '#888'; // 湲곕낯 洹몃젅??(?깃툒怨?援щ텇?섍쾶 蹂寃?
    if (category === 'testride') color = '#72bf44'; // 洹몃┛
    if (category === 'onecare') color = '#3a86ff'; // ?쇱씠?몃툝猷?
    return L.divIcon({
        className: 'custom-pin',
        html: `<i class="fa-solid fa-location-dot" style="color:${color};"></i>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -32]
    });
}

function fetchData() {
    if (CONFIG.RECAPTCHA_SITE_KEY && CONFIG.RECAPTCHA_SITE_KEY !== 'YOUR_RECAPTCHA_SITE_KEY' && typeof grecaptcha !== 'undefined') {
        grecaptcha.ready(function() {
            grecaptcha.execute(CONFIG.RECAPTCHA_SITE_KEY, {action: 'fetch_data'}).then(function(token) {
                requestDataWithToken(token);
            }).catch(function(err) {
                console.error("reCAPTCHA execute Error:", err);
                requestDataWithToken(null);
            });
        });
    } else {
        requestDataWithToken(null);
    }
}

function requestDataWithToken(token) {
    const headers = {};
    if (token) {
        headers['X-Recaptcha-Token'] = token;
    }

    fetch(GAS_URL, { headers })
        .then(res => res.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            ALL_DATA = data;
            applyFilter();
        })
        .catch(err => {
            document.getElementById("listContent").innerHTML =
                '<div class="message-box" style="color:red;">?곗씠??濡쒕뱶 ?ㅽ뙣</div>';
        });
}

function updateMarkers(stores) {
    // 湲곗〈 留덉빱 諛??대윭?ㅽ꽣 ?쒓굅
    markerClusterGroup.clearLayers();
    // 媛쒕퀎 留덉빱 ?덉씠???쒓굅 (?대윭?ㅽ꽣 誘몄궗????
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    const bounds = [];

    stores.forEach((store) => {
        const pos = getStoreLatLng(store);

        if (pos) {
            const grade = store.grade; // 'S', 'A', 'B' ??            const isPremium = grade === 'S'; // 'S' ?깃툒? 湲곗〈泥섎읆 ?꾨━誘몄뾼 ???            const customIcon = getMarkerIcon(store.category, grade);
            const marker = L.marker([pos.lat, pos.lng], { icon: customIcon });

            let badgeHtml = '';
            if (grade === 'S') badgeHtml = '<span class="premium-badge badge-s"><i class="fa-solid fa-star" style="font-size:11px;"></i> ?곗닔?묐젰??/span><br>';
            /* [二쇱꽍泥섎━] A, B 諭껋? 鍮꾪솢?깊솕
            else if (grade === 'A') ...
            else if (grade === 'B') ...
            */

            // [?곸꽭 ?뺣낫 HTML ?앹꽦]
            let branchHtml = '';
            if (store.branch && String(store.branch).trim() !== '') {
                branchHtml = `<div class="map-popup-branch">?꾨━?ㅽ룷痢?${escapeHTML(store.branch)}</div>`;
            }

            // [蹂寃? ?뱀궗?댄듃(?곗뒪?ы깙)?먯꽌 ?뺣낫瑜?紐⑤몢 ?쒖떆?섍린 ?꾪빐 ?앹뾽 ?댁슜? ??긽 ?꾩껜 ?뺣낫瑜??ы븿?섎룄濡??앹꽦
            // 紐⑤컮?쇱뿉?쒕뒗 ?몄텧 ?쒖젏(focusMarker)?먯꽌 ?앹뾽???⑥? ?딄쾶 ?쒖뼱?섎?濡? ?곗씠?곕뒗 ??긽 ?꾩껜 諛붿씤?⑺빐?〓땲??
            let popupLinkBtn = '';

            // ?ㅼ씠踰?吏?꾨줈 蹂닿린 (?곸꽭 諛??泥?寃??
            let finalLink = '';
            if (store.link && String(store.link).trim() !== '' && store.link !== '#') {
                finalLink = escapeHTML(store.link);
            } else {
                finalLink = `${CONFIG.EXTERNAL_SERVICES.NAVER_SEARCH}${encodeURIComponent(store.name)}`;
            }

            popupLinkBtn += `
                <a href="${finalLink}" target="_blank" class="map-popup-btn">
                    ?ㅼ씠踰?吏?꾨줈 蹂닿린
                </a>
            `;

            // 湲몄갼湲?踰꾪듉 (?ㅼ씠踰? - ?대┃ ?쒖젏???숈쟻?쇰줈 ???꾩튂 ?뺤씤?섏뿬 ?곕룞
            popupLinkBtn += `
                <a href="#" onclick="openNaverNavi(${pos.lat}, ${pos.lng}, '${escapeHTML(store.name).replace(/'/g, "\\'")}'); return false;" class="btn-map-link">
                    <i class="fa-solid fa-location-arrow"></i> ?ㅼ씠踰?湲몄갼湲?                </a>
            `;

            // [?좉퇋] ?쒖듅 ?덈궡 臾멸뎄
            const testRideGuideHtml = `
                <div class="test-ride-guide">
                    <i class="fa-solid fa-circle-info"></i> ?쒖듅 媛???щ????대떦 留ㅼ옣??臾몄쓽??二쇱떆湲?諛붾엻?덈떎.
                </div>
            `;

            // ?꾨━誘몄뾼??寃쎌슦 ?꾩슜 ?대옒??遺李?            const headerClass = isPremium ? 'map-popup-header premium-popup-header' : 'map-popup-header';
            const titleClass = isPremium ? 'map-popup-title premium-popup-title' : 'map-popup-title';

            const popupContent = `
                <div class="map-popup-inner">
                    <div class="${headerClass}">
                        ${badgeHtml}
                        <h4 class="${titleClass}">${escapeHTML(store.name)}</h4>
                        ${branchHtml}
                    </div>
                    <div class="map-popup-body popup-mobile-hide">
                        <div class="map-popup-row">
                            <i class="fa-solid fa-location-dot" style="color:var(--quali-blue);"></i> 
                            <span>${escapeHTML(store.address)}</span>
                        </div>
                        <div class="map-popup-row">
                            <i class="fa-solid fa-phone" style="color:var(--quali-blue);"></i> 
                            <a href="tel:${escapeHTML(store.phone)}">${escapeHTML(store.phone) || '-'}</a>
                        </div>
                        <div class="map-popup-row">
                            <i class="fa-regular fa-calendar-xmark" style="color:var(--system-red);"></i> 
                            <span>?대Т: ${escapeHTML(store.closed) || '?놁쓬'}</span>
                        </div>
                    </div>
                    <div class="map-popup-buttons">
                        ${popupLinkBtn}
                    </div>
                    ${testRideGuideHtml}
                </div>
            `;

            // [媛쒖꽑] ?곗뒪?ы깙?먯꽌留??앹뾽 諛붿씤??(紐⑤컮?쇱? 諛뷀??쒗듃留??ъ슜)
            // [?좉퇋] ?곗뒪?ы깙?먯꽌 留덉슦???몃쾭 ???대쫫 ?댄똻 ?쒖떆
            const isMobile = window.innerWidth <= 900;
            if (!isMobile) {
                marker.bindPopup(popupContent, { minWidth: 260 });

                // ? ?붿옄???쇰컲 vs ?꾨━誘몄뾼)???곕씪 ?댄똻 ?믪씠 議곗젙
                const tooltipOffset = isPremium ? [0, -25] : [0, -15];
                marker.bindTooltip(escapeHTML(store.name), {
                    direction: 'top',
                    offset: tooltipOffset,
                    permanent: false,
                    sticky: true
                });
            }

            marker.on('click', () => {
                // 留덉빱 ?대┃??吏??click ?대깽?몃줈 ?꾪뙆?섏뼱 clearSelection???몄텧?섏? ?딅룄濡??듭젣
                _suppressMapClick = true;
                setTimeout(() => { _suppressMapClick = false; }, 100);

                const isMobile = window.innerWidth <= 900;
                highlightListItem(store.name, !isMobile);
                showSelectedStore(store.name);
                focusMarker(marker, pos, store);
            });

            store.markerRef = marker;
            markers.push(marker); // Keep reference

            // [?좉퇋] ?대윭?ㅽ꽣留??좉? ?곹깭???곕씪 異붽? 諛⑹떇 遺꾧린
            if (isClusteringEnabled) {
                markerClusterGroup.addLayer(marker);
            } else {
                marker.addTo(map);
            }

            bounds.push([pos.lat, pos.lng]);
        }
    });

    // ?대윭?ㅽ꽣留?誘몄궗???쒖뿉??markerClusterGroup Layer??map???덉뼱???????덉쑝??愿由ъ긽),
    // ?좉? ??isClusteringEnabled???곕씪 clearLayers ?뱀? removeLayer 泥섎━瑜??섎뒗 寃껋씠 源붾걫.
    // ?ш린?쒕뒗 applyFilter媛 ?꾩껜 ?ы샇異쒕릺誘濡? ?꾩そ 濡쒖쭅?쇰줈 異⑸텇.
    if (isClusteringEnabled) {
        if (!map.hasLayer(markerClusterGroup)) map.addLayer(markerClusterGroup);
    } else {
        if (map.hasLayer(markerClusterGroup)) map.removeLayer(markerClusterGroup);
    }

    if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
    }
}

// [?좉퇋 湲곕뒫] ?쒖꽦??? ?ㅽ????곸슜 (鍮④컙??媛뺤“)
function setActivePin(marker) {
    // 紐⑤뱺 留덉빱?먯꽌 active-pin ?대옒???쒓굅
    document.querySelectorAll('.custom-pin').forEach(el => {
        el.classList.remove('active-pin');
        el.style.zIndex = ""; // z-index 珥덇린??    });

    // ?꾩옱 留덉빱 ?꾩씠肄섏뿉 ?대옒??異붽?
    if (marker && marker.getElement()) {
        const iconEl = marker.getElement();
        iconEl.classList.add('active-pin');
        iconEl.style.zIndex = 9999;
    }
}

// [?좉퇋 湲곕뒫] 珥덇린 ?꾩튂 沅뚰븳 ?붿껌
function requestInitialLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLat = position.coords.latitude;
                userLng = position.coords.longitude;
                // console.log("Initial location acquired:", userLat, userLng);
            },
            (error) => {
                // console.warn("Location permission denied or error.");
            }
        );
    }
}

// [?좉퇋 湲곕뒫] ?ㅼ씠踰?湲몄갼湲??숈쟻 ?곕룞
function openNaverNavi(lat, lng, name) {
    // 湲곕낯 URL (?꾩갑吏)
    let url = `${CONFIG.EXTERNAL_SERVICES.NAVER_ROUTE}?elat=${lat}&elng=${lng}&etext=${name}&menu=route`;

    // ?꾩옱 ?쒖젏?????꾩튂媛 ?덉쑝硫?異쒕컻吏濡?異붽?
    // 留뚯빟 userLat媛 ?녿떎硫? ?ㅼ떆 ?쒕쾲 ?쒕룄?대낵 ?섎룄 ?덉쓬 (?ш린?쒕뒗 ??λ맂 媛??ъ슜)
    if (navigator.geolocation && (!userLat || !userLng)) {
        // ?꾩튂 ?뺣낫媛 ?놁쑝硫? 利됱떆 ?붿껌 ???대룞 ?쒕룄 (?쎄컙???쒕젅??諛쒖깮 媛?ν븯誘濡?諛붾줈 ?대룞?쒗궎?붽쾶 ?섏쓣?섎룄 ?덉쓬)
        // ?ш린?쒕뒗 ?ъ슜??寃쏀뿕??諛붾줈 ?꾩슦?붽쾶 ?レ?留? 沅뚰븳 泥댄겕瑜??꾪빐 getCurrentPosition????踰????섑뻾
        navigator.geolocation.getCurrentPosition((position) => {
            userLat = position.coords.latitude;
            userLng = position.coords.longitude;
            url += `&slat=${userLat}&slng=${userLng}&stext=?댁쐞移?;
            window.open(url, '_blank');
        }, () => {
            // 沅뚰븳 ?놁쑝硫??꾩갑吏留?            window.open(url, '_blank');
        });
    } else if (userLat && userLng) {
        url += `&slat=${userLat}&slng=${userLng}&stext=?댁쐞移?;
        window.open(url, '_blank');
    } else {
        window.open(url, '_blank');
    }
}

// [?좉퇋 湲곕뒫] ?대윭?ㅽ꽣留??좉?
function toggleClustering() {
    isClusteringEnabled = !isClusteringEnabled;
    const btn = document.getElementById('btnCluster'); // ID 蹂寃?
    if (isClusteringEnabled) {
        btn.classList.add('active');
        applyFilter();
    } else {
        btn.classList.remove('active');
        applyFilter();
    }
}

// [?좉퇋 湲곕뒫] ?ㅽ겕 紐⑤뱶 ?좉?
function toggleDarkMode() {
    const body = document.body;
    body.classList.toggle('dark-mode');
    const isDark = body.classList.contains('dark-mode');
    const btn = document.getElementById('btnDarkMode'); // ID 蹂寃?
    if (isDark) {
        btn.classList.add('active');
        if (map && window.darkTile) {
            map.removeLayer(window.lightTile);
            window.darkTile.addTo(map);
        }
    } else {
        btn.classList.remove('active');
        if (map && window.lightTile) {
            map.removeLayer(window.darkTile);
            window.lightTile.addTo(map);
        }
    }
}

// [?좉퇋 湲곕뒫] ???꾩튂 ?좉? (Toggle)
function toggleMyLocation() {
    const btn = document.getElementById('btnMyLocation');

    // ?대? 留덉빱媛 ?덈떎硫?-> ?꾧린 (?쒓굅)
    if (window.myLocationMarker) {
        map.removeLayer(window.myLocationMarker);
        window.myLocationMarker = null;
        btn.classList.remove('active');
        return;
    }

    // ?녿떎硫?-> 耳쒓린 (李얘린)
    if (!navigator.geolocation) {
        alert("??釉뚮씪?곗??먯꽌???꾩튂 ?쒕퉬?ㅻ? 吏?먰븯吏 ?딆뒿?덈떎.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            // [?낅뜲?댄듃] ?꾩뿭 蹂???숆린??            userLat = lat;
            userLng = lng;

            // 吏???대룞
            map.flyTo([lat, lng], 14, { duration: 1.5 });

            // [蹂寃? 而ㅼ뒪? ?붿옄??留덉빱 (?щ엺紐⑥뼇 + ?덉씠???뚯옣 ?④낵)
            const myLocIcon = L.divIcon({
                className: 'my-location-marker',
                html: `
                    <div class="my-location-icon-wrapper">
                        <i class="fa-solid fa-street-view"></i>
                        <div class="my-location-pulse"></div>
                    </div>
                `,
                iconSize: [90, 90],
                iconAnchor: [45, 45]
            });

            // [蹂寃? 而ㅼ뒪? ?앹뾽 ?곸슜 (X踰꾪듉 ?④?, ?ㅽ넗?대줈利?
            window.myLocationMarker = L.marker([lat, lng], { icon: myLocIcon }).addTo(map)
                .bindPopup('?꾩옱 ???꾩튂', {
                    className: 'custom-location-popup',
                    minWidth: 50,
                    closeButton: false, // CSS濡쒕룄 ?④꼈吏留?紐낆떆?곸쑝濡?false
                    autoClose: true,    // ?ㅻⅨ嫄??꾨Ⅴ硫??ロ옒
                    closeOnClick: true
                })
                .openPopup();

            // 踰꾪듉 ?쒖꽦??            btn.classList.add('active');
        },
        (error) => {
            alert("?꾩튂 ?뺣낫瑜?媛?몄삱 ???놁뒿?덈떎. 沅뚰븳???뺤씤?댁＜?몄슂.");
            btn.classList.remove('active');
        }
    );
}

function renderList(data) {
    const container = document.getElementById("listContent");
    container.innerHTML = "";

    if (!data || data.length === 0) {
        const msgBox = document.createElement("div");
        msgBox.className = "message-box";
        msgBox.textContent = "議곌굔??留욌뒗 留ㅼ옣???놁뒿?덈떎.";
        container.appendChild(msgBox);
        return;
    }

    data.forEach((store) => {
        const grade = store.grade;
        const isPremium = (grade === 'S');
        const pos = getStoreLatLng(store);

        let badgesHtml = '';
        /* [二쇱꽍泥섎━] 由ъ뒪?????쒖듅媛???쒖떆 ?쒓굅
        if (store.testRide === "O") {
            badgesHtml += `
            <span class="badge test-ride">
                <i class="fa-solid fa-motorcycle"></i> ?쒖듅媛??            </span>`;
        }
        */
        if (store.oneCare === "O") {
            badgesHtml += `
            <span class="badge one-care">
                <i class="fa-solid fa-screwdriver-wrench"></i> ?먯???            </span>`;
        }

        // [?좉퇋] 由ъ뒪?몄슜 ?쒖듅 ?덈궡 臾멸뎄
        const listTestRideGuide = `
            <div class="test-ride-guide" style="border-top:none; padding-top:0; margin-top:8px; justify-content:flex-start; font-size:12px;">
                <i class="fa-solid fa-circle-info" style="font-size:12px;"></i> ?쒖듅 媛???щ????대떦 留ㅼ옣??臾몄쓽??二쇱떆湲?諛붾엻?덈떎.
            </div>
        `;

        const phoneHtml = store.phone ? `<a href="tel:${escapeHTML(store.phone)}" class="phone-link" onclick="event.stopPropagation();">${escapeHTML(store.phone)}</a>` : '-';

        let branchHtml = '';
        if (store.branch && String(store.branch).trim() !== '') {
            branchHtml = `<div class="store-branch">?꾨━?ㅽ룷痢?${escapeHTML(store.branch)}</div>`;
        }

        const card = document.createElement("div");
        card.className = `store-card ${isPremium ? 'premium-card' : ''}`;
        card.dataset.storeName = store.name; // ID?⑹씠誘濡?洹몃?濡??ъ슜 (HTML ?띿꽦)

        card.onclick = () => {
            const targetPos = getStoreLatLng(store);

            document.querySelectorAll('.store-card').forEach(c => c.classList.remove('active-card'));
            card.classList.add('active-card');
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });

            showSelectedStore(store.name);

            if (map && targetPos) {
                if (isClusteringEnabled && markerClusterGroup) {
                    markerClusterGroup.zoomToShowLayer(store.markerRef, () => {
                        focusMarker(store.markerRef, targetPos, store);
                    });
                } else {
                    focusMarker(store.markerRef, targetPos, store);
                }
            }
        };

        // ?꾨━誘몄뾼 ?꾩씠肄?由ъ뒪?????쒖떆 (湲곗〈 S?깃툒)
        let locationIcon = '';
        if (grade === 'S') {
            locationIcon = `<i class="fa-solid fa-star" style="color:#FFD700; filter: drop-shadow(0 0 4px rgba(0,0,0,0.1));"></i>`;
        } /* A, B ?깃툒 ?꾩씠肄??쒖떆 二쇱꽍 泥섎━ */
        else {
            locationIcon = pos ? '<i class="fa-solid fa-location-dot" style="color:#e03131;"></i>' : '<i class="fa-solid fa-location-dot"></i>';
        }

        card.innerHTML = DOMPurify.sanitize(`
            <div class="card-header">
                <h3 class="store-name">${escapeHTML(store.name)}</h3>
            </div>
            <div class="card-body">
                ${branchHtml}
                <div class="info-row">
                    ${locationIcon}
                    <div>${escapeHTML(store.address)}</div>
                </div>
                <div class="info-row">
                    <i class="fa-solid fa-phone"></i>
                    <div>${phoneHtml}</div>
                </div>
                <div class="closed-day">
                    <i class="fa-regular fa-calendar-xmark" style="color:#888; margin-right:4px;"></i>
                    ?대Т: ${escapeHTML(store.closed) || '?놁쓬'}
                </div>
                <div class="badge-group">${badgesHtml}</div>
                ${listTestRideGuide}
            </div>
        `);
        container.appendChild(card);
    });
}

function updateFilter(checkbox) {
    const label = checkbox.parentElement;
    if (checkbox.checked) {
        label.classList.add('active');
    } else {
        label.classList.remove('active');
    }
}

function showSelectedStore(name) {
    const bar = document.getElementById('selectedStoreBar');
    const nameEl = document.getElementById('selectedStoreName');
    nameEl.innerText = name;
    bar.style.display = 'flex';
}

function clearSelection() {
    document.getElementById('selectedStoreBar').style.display = 'none';
    document.querySelectorAll('.store-card').forEach(c => c.classList.remove('active-card'));
    if (map) map.closePopup();
    setActivePin(null); // [異붽?] ?좏깮 ?댁젣 ??? 媛뺤“ 珥덇린??    scrollToListTop();
}

function highlightListItem(storeName, shouldScroll = true) {
    const cards = document.querySelectorAll('.store-card');
    let targetCard = null;
    cards.forEach(card => {
        if (card.dataset.storeName === storeName) {
            card.classList.add('active-card');
            targetCard = card;
        } else {
            card.classList.remove('active-card');
        }
    });

    if (targetCard && shouldScroll) {
        const isMobile = window.innerWidth <= 900;
        if (isMobile) {
            // 紐⑤컮?? 理쒖긽?⑥쑝濡??ㅽ겕濡?(start)
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            // ?곗뒪?ы깙: 以묒븰?쇰줈 ?ㅽ겕濡?(center)
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

function scrollTabs(direction) {
    const container = document.getElementById('categoryTabs');
    const scrollAmount = 150;
    if (direction === 'left') container.scrollLeft -= scrollAmount;
    else container.scrollLeft += scrollAmount;
}

function setCategory(cat, el) {
    currentCategory = cat;
    document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
    if (el) {
        el.classList.add('active');
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    document.getElementById("searchInput").value = "";
    applyFilter();
}

function toggleClearBtn() {
    const input = document.getElementById("searchInput");
    const clearBtn = document.getElementById("clearSearchBtn");
    if (input.value.length > 0) clearBtn.classList.add("show");
    else clearBtn.classList.remove("show");
}

function clearSearch() {
    const input = document.getElementById("searchInput");
    input.value = "";
    toggleClearBtn();
    filterData();
    input.focus();
}

function filterData() { toggleClearBtn(); applyFilter(); }

// 留덉빱 諛??앹뾽 ?ъ빱??(紐⑤컮???곗뒪?ы깙 紐⑤몢 吏???뺤쨷?숈뿉 ?앹뾽)
function focusMarker(marker, pos, storeData) {
    const isMobile = window.innerWidth <= 900;
    const zoomLevel = 16;

    // ?댁쟾 moveend 由ъ뒪???쒓굅
    if (_pendingPopupFn) {
        map.off('moveend', _pendingPopupFn);
        _pendingPopupFn = null;
    }

    const mapSize = map.getSize();
    const point = map.project([pos.lat, pos.lng], zoomLevel);

    let newPoint;
    if (isMobile) {
        // 紐⑤컮?? 諛뷀??쒗듃媛 ?섎떒????40%瑜?媛由щ?濡? ????붾㈃ ?곷떒 1/3 吏?먯뿉 ?ㅺ쾶 ?ㅼ젙
        // 留?而⑦뀒?대꼫 ?믪씠????1/4 ?뺣룄 ?꾨줈 ?щ젮以?        const mapHeight = map.getSize().y;
        newPoint = point.add([0, -mapHeight * 0.25]); // 25% ?뺣룄 ?꾨줈 ?듭뀑
    } else {
        // ?곗뒪?ы깙: ???吏???⑤꼸 醫뚯륫 1/4??諛곗튂 (?앹뾽??以묒븰????怨듦컙 ?뺣낫)
        newPoint = point.add([-mapSize.x / 4, 0]);
    }

    const newCenter = map.unproject(newPoint, zoomLevel);
    // 紐⑤컮?쇱? 遺?쒕윭???대룞???꾪빐 duration???쎄컙 ?섎┝
    const animDuration = isMobile ? 1.2 : 1;
    map.flyTo(newCenter, zoomLevel, { animate: true, duration: animDuration, easeLinearity: 0.25 });

    // flyTo ?꾨즺 ?? 紐⑤컮?쇱? ?꾩슜 紐⑤떖 ?앹뾽 ?꾩슦怨? ?곗뒪?ы깙? 吏??以묒븰 ?앹뾽 ?좎?
    _pendingPopupFn = function () {
        map.closePopup();
        if (isMobile) {
            showMobileModal(storeData);
        } else {
            const content = marker.getPopup().getContent();
            // offset Y: ?곗뒪?ы깙 ?앹뾽 ?믪씠 ??260px ??offset 130
            L.popup({
                closeOnClick: false,
                autoClose: false,
                autopan: false,
                offset: [0, 130],
                className: 'center-map-popup'
            })
                .setLatLng(map.getCenter())
                .setContent(content)
                .openOn(map);
        }
        _pendingPopupFn = null;
    };
    map.once('moveend', _pendingPopupFn);

    // ? 媛뺤“
    setTimeout(() => {
        setActivePin(marker);
    }, 450);
}



// [?좉퇋] 紐⑤컮???꾩슜 ?곸꽭 紐⑤떖 ?쒖떆
function showMobileModal(store) {
    if (window.innerWidth > 900) return; // ?곗뒪?ы깙? 臾댁떆

    const body = document.getElementById('mobileModalBody');
    const pos = getStoreLatLng(store);

    // 紐⑤떖 ?댁슜??誘몃땲 吏???곸뿭 異붽?
    // 怨좏빐?곷룄 ??쇱쓣 ?꾪빐 id ?ㅼ젙 (CSS?먯꽌 ?믪씠 愿由?, 諛붾줈 ?덈궡 臾멸뎄 異붽?
    let miniMapHtml = `
        <div id="mobileMiniMap"></div>
        <div style="font-size:12px; color:#8e8e93; text-align:center; margin-bottom:12px; display:flex; align-items:center; justify-content:center; gap:4px;">
            <i class="fa-regular fa-hand-pointer"></i> 吏?꾨? ?꾨Ⅴ硫??ㅼ씠踰?吏?꾨줈 ?대룞?⑸땲??        </div>
    `;

    const grade = store.grade;
    const isPremium = grade === 'S';
    let badgeHtml = '';
    if (grade === 'S') badgeHtml = '<span class="premium-badge badge-s"><i class="fa-solid fa-star" style="font-size:12px;"></i> ?곗닔?묐젰??/span><br>';
    /* A, B ?깃툒 諭껋? 鍮꾪솢?깊솕 */

    let branchHtml = '';
    if (store.branch && String(store.branch).trim() !== '') {
        branchHtml = `<div class="map-popup-branch">?꾨━?ㅽ룷痢?${escapeHTML(store.branch)}</div>`;
    }

    let popupLinkBtn = '';
    
    // 紐⑤컮??諛뷀??쒗듃?먯꽌??'?ㅼ씠踰?吏?꾨줈 蹂닿린' 踰꾪듉 ?쒖꽦??(?泥?寃???ы븿)
    let finalLink = '';
    if (store.link && String(store.link).trim() !== '' && store.link !== '#') {
        finalLink = escapeHTML(store.link);
    } else {
        finalLink = `${CONFIG.EXTERNAL_SERVICES.NAVER_SEARCH}${encodeURIComponent(store.name)}`;
    }
    popupLinkBtn += `
        <a href="${finalLink}" target="_blank" class="map-popup-btn">
            ?ㅼ씠踰?吏?꾨줈 蹂닿린
        </a>
    `;
    popupLinkBtn += `
        <a href="#" onclick="openNaverNavi(${pos.lat}, ${pos.lng}, '${escapeHTML(store.name).replace(/'/g, "\\'")}'); return false;" class="btn-map-link">
            <i class="fa-solid fa-location-arrow"></i> ?ㅼ씠踰?湲몄갼湲?        </a>
    `;

    // [?좉퇋] ?쒖듅 ?덈궡 臾멸뎄 (紐⑤컮??
    const testRideGuideHtml = `
        <div class="test-ride-guide">
            <i class="fa-solid fa-circle-info"></i> ?쒖듅 媛???щ????대떦 留ㅼ옣??臾몄쓽??二쇱떆湲?諛붾엻?덈떎.
        </div>
    `;

    // 紐⑤컮??紐⑤떖? 紐⑤뱺 ?뺣낫 ?쒖떆
    // ?꾨━誘몄뾼??寃쎌슦 而ㅼ뒪? ?대옒??遺李?(css/style.css ?먯꽌 ?ㅽ????쒖뼱)
    const headerClass = isPremium ? 'map-popup-header premium-popup-header' : 'map-popup-header';
    const titleClass = isPremium ? 'map-popup-title premium-popup-title' : 'map-popup-title';

    body.innerHTML = DOMPurify.sanitize(`
        <div class="map-popup-inner" style="padding:0;">
            ${miniMapHtml}
            <div class="${headerClass}">
                ${badgeHtml}
                <h4 class="${titleClass}" style="font-size:22px;">${escapeHTML(store.name)}</h4>
                ${branchHtml}
            </div>
            <div class="map-popup-body" style="font-size:15px; margin: 20px 0; display: flex; flex-direction: column; align-items: center;">
                <div style="width: 100%; max-width: 280px;">
                    <div class="map-popup-row" style="margin-bottom:12px; display:flex; align-items:flex-start; gap:10px;">
                        <i class="fa-solid fa-location-dot" style="color:var(--system-blue); width:20px; text-align:center; padding-top:3px; font-size:16px;"></i> 
                        <span style="flex:1; line-height:1.5; text-align:left; word-break:keep-all;">${escapeHTML(store.address)}</span>
                    </div>
                    <div class="map-popup-row" style="margin-bottom:12px; display:flex; align-items:flex-start; gap:10px;">
                        <i class="fa-solid fa-phone" style="color:var(--system-blue); width:20px; text-align:center; padding-top:3px; font-size:16px;"></i> 
                        <a href="tel:${escapeHTML(store.phone)}" style="color:var(--text-primary); text-decoration:none; font-weight:500; display:block; text-align:left;">${escapeHTML(store.phone) || '-'}</a>
                    </div>
                    <div class="map-popup-row" style="margin-bottom:0; display:flex; align-items:flex-start; gap:10px;">
                        <i class="fa-regular fa-calendar-xmark" style="color:var(--system-red); width:20px; text-align:center; padding-top:3px; font-size:16px;"></i> 
                        <span style="font-weight:500; text-align:left;">?대Т: ${escapeHTML(store.closed) || '?놁쓬'}</span>
                    </div>
                </div>
            </div>
            <div class="map-popup-buttons" style="margin-top:24px; display:flex; gap:8px;">
                ${popupLinkBtn}
            </div>
            ${testRideGuideHtml}
        </div>
    `);

    const overlay = document.getElementById('mobileModalOverlay');
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open'); // [?좉퇋] 紐⑤떖 ?ㅽ뵂 ??FAB ?④????대옒??異붽?

    // 紐⑤떖 ??誘몃땲 吏??珥덇린??(鍮꾨룞湲?泥섎━)
    setTimeout(() => {
        if (mobileMiniMap) {
            mobileMiniMap.remove();
        }
        mobileMiniMap = L.map('mobileMiniMap', {
            center: [pos.lat, pos.lng],
            zoom: 17, // ? 二쇰???媛源앷쾶 蹂댁뿬二쇨린 (15 ??17)
            zoomControl: false,
            dragging: false,
            touchZoom: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            attributionControl: false // [?좉퇋] ?ㅽ뵂?뚯뒪 吏??留덊겕 ??젣 (紐⑤컮??誘몃땲留?
        });

        L.tileLayer(CONFIG.MAP.LIGHT_TILE, {
            detectRetina: true, // 怨좏빐?곷룄(?덊떚?? ?붿뒪?뚮젅?댁뿉???좊챸?????濡쒕뱶 ?듭뀡
            maxZoom: 19
        }).addTo(mobileMiniMap);

        const miniIcon = L.divIcon({
            className: 'custom-pin',
            html: `<i class="fa-solid fa-location-dot" style="color:#ff3b30; font-size:30px;"></i>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });
        L.marker([pos.lat, pos.lng], { icon: miniIcon }).addTo(mobileMiniMap);

        // 留??대┃ ???ㅼ씠踰?吏?꾨줈 ?곌껐?섍쾶 ?ㅼ젙
        mobileMiniMap.on('click', () => {
            window.open(`${CONFIG.EXTERNAL_SERVICES.NAVER_SEARCH}${encodeURIComponent(store.address)}`, '_blank');
        });
    }, 200);
}

function closeMobileModal() {
    const overlay = document.getElementById('mobileModalOverlay');
    overlay.classList.remove('show');
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open'); // [?좉퇋] 紐⑤떖 醫낅즺 ??FAB ?ㅼ떆 ?쒖떆
}

function applyFilter() {
    const keyword = document.getElementById("searchInput").value.toUpperCase().trim();
    const showPremiumOnly = document.getElementById("premiumCheck").checked;
    // const showAGradeOnly = document.getElementById("aGradeCheck").checked;
    // const showBGradeOnly = document.getElementById("bGradeCheck").checked;
    const showOneCareOnly = document.getElementById("oneCareCheck").checked;
    // const showTestRideOnly = document.getElementById("testRideCheck").checked;

    clearSelection();

    // 1. ?꾪꽣留??섑뻾
    let filtered = ALL_DATA.filter(store => {
        if (currentCategory !== 'all' && store.category !== currentCategory) return false;

        if (showPremiumOnly && store.grade !== 'S') return false;
        // if (showAGradeOnly && store.grade !== 'A') return false;
        // if (showBGradeOnly && store.grade !== 'B') return false;
        if (showOneCareOnly && store.oneCare !== 'O') return false;
        // if (showTestRideOnly && store.testRide !== 'O') return false;

        if (keyword !== "") {
            return (store.name && String(store.name).toUpperCase().includes(keyword)) ||
                (store.address && String(store.address).toUpperCase().includes(keyword)) ||
                (store.branch && String(store.branch).toUpperCase().includes(keyword)) ||
                (store.subName && String(store.subName).toUpperCase().includes(keyword));
        }
        return true;
    });

    // 2. ?뺣젹 ?섑뻾 (S > A > B > ?쇰컲)
    filtered.sort((a, b) => {
        const gradeMap = { 'S': 3, 'A': 2, 'B': 1 };
        const scoreA = gradeMap[a.grade] || 0;
        const scoreB = gradeMap[b.grade] || 0;

        if (scoreA !== scoreB) return scoreB - scoreA; // ?믪? ?깃툒???욎쑝濡?        return 0; // ?깃툒 媛숈쑝硫??쒖꽌 ?좎?
    });

    renderList(filtered);
    updateMarkers(filtered);
    scrollToListTop();
}

function scrollToListTop() {
    const listEl = document.getElementById('listContent');
    listEl.scrollTo({ top: 0, behavior: 'smooth' });

    if (window.innerWidth <= 900) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// [?좉퇋] ?꾩뿭 ?몄텧???꾩슂???⑥닔??(?몃씪??HTML ?몄텧??
window.openNaverNavi = openNaverNavi;

})(); // [?좉퇋] IIFE 醫낅즺 (肄붾뱶 蹂댄샇)
