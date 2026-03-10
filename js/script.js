// [보안] 키보드 단축키 방지 (F12, 소스보기, 저장, 인쇄, 개발자도구 등)
document.addEventListener('keydown', function (e) {
    // F12
    if (e.keyCode === 123) { e.preventDefault(); return false; }
    // Ctrl+Shift+I (개발자 도구), Ctrl+Shift+J (콘솔), Ctrl+Shift+C (요소 검사)
    if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
        e.preventDefault(); return false;
    }
    // Ctrl+U (소스 보기)
    if (e.ctrlKey && e.keyCode === 85) { e.preventDefault(); return false; }
    // Ctrl+S (저장)
    if (e.ctrlKey && e.keyCode === 83) { e.preventDefault(); return false; }
    // Ctrl+P (인쇄)
    if (e.ctrlKey && e.keyCode === 80) { e.preventDefault(); return false; }
});

const GAS_URL = CONFIG.GAS_URL;

let map;
let markers = []; // This will now act as a reference if needed, but mainly use cluster
let markerClusterGroup; // New global for clustering
let isClusteringEnabled = true; // [신규] 클러스터링 토글 상태
let userLat = null; // [신규] 사용자 현재 위도
let userLng = null; // [신규] 사용자 현재 경도
let ALL_DATA = [];
let currentCategory = 'all';

document.addEventListener("DOMContentLoaded", function () {
    initMap();
    fetchData();
    requestInitialLocation(); // [신규] 페이지 진입 시 위치 권한 요청
    handleResponsiveLayout(); // [신규] 화면 크기에 따른 레이아웃 처리

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

// [신규] 모바일 버전에서 컨트롤 영역을 헤더로 이동시키는 포털 기능
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
    // [변경] 대한민국 영역 제한 (독도 포함, 일본/북한 최소화) - OSM 복구 시에도 유지
    const southWest = L.latLng(32.9, 124.0);
    const northEast = L.latLng(38.9, 132.5);
    const bounds = L.latLngBounds(southWest, northEast);

    map = L.map('map', {
        center: [36.5, 127.5],
        zoom: 7,
        minZoom: 7,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0,
        attributionControl: false // [신규] 오픈소스 지도 마크 삭제
    });

    // [복구] OpenStreetMap (OSM)
    // 기본 타일 (Light)
    window.lightTile = L.tileLayer(CONFIG.MAP.LIGHT_TILE, {
        attribution: CONFIG.MAP.ATTRIBUTION.OSM,
        maxZoom: 19
    }).addTo(map);

    // 다크 모드용 타일 (CartoDB Dark Matter)
    window.darkTile = L.tileLayer(CONFIG.MAP.DARK_TILE, {
        attribution: CONFIG.MAP.ATTRIBUTION.CARTO,
        maxZoom: 19
    });

    // 마커 클러스터 그룹 초기화
    markerClusterGroup = L.markerClusterGroup({
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

    // 초기 로딩 시 클러스터링 활성화 상태면 추가
    if (isClusteringEnabled) {
        map.addLayer(markerClusterGroup);
    }

    // 지도 빈 곳 클릭 시 선택 해제 (핀 클릭은 _suppressMapClick 플래그로 구분)
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

    if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
    }
    return null;
}

function getMarkerIcon(category, isPremium) {
    if (isPremium) {
        // [원복] 프리미엄 핀: 별 모양만 나오게 디자인 (사용자 요청)
        return L.divIcon({
            className: 'custom-pin premium-star-only',
            html: `<i class="fa-solid fa-star"></i>`,
            iconSize: [42, 42],
            iconAnchor: [21, 21], // 중앙 정렬
            popupAnchor: [0, -20]
        });
    }

    // 일반 핀: 카테고리에 맞춰 색상만 변경 (아이콘은 일관성 있게 location-dot 통일)
    let color = '#2f6286'; // 기본 블루
    if (category === 'testride') color = '#72bf44'; // 그린
    if (category === 'onecare') color = '#3a86ff'; // 라이트블루

    return L.divIcon({
        className: 'custom-pin',
        html: `<i class="fa-solid fa-location-dot" style="color:${color};"></i>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -32]
    });
}

function fetchData() {
    fetch(GAS_URL)
        .then(res => res.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            ALL_DATA = data;
            applyFilter();
        })
        .catch(err => {
            document.getElementById("listContent").innerHTML =
                '<div class="message-box" style="color:red;">데이터 로드 실패</div>';
        });
}

function updateMarkers(stores) {
    // 기존 마커 및 클러스터 제거
    markerClusterGroup.clearLayers();
    // 개별 마커 레이어 제거 (클러스터 미사용 시)
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    const bounds = [];

    stores.forEach((store) => {
        const pos = getStoreLatLng(store);

        if (pos) {
            const isPremium = store.grade === 'S';
            const customIcon = getMarkerIcon(store.category, isPremium);
            const marker = L.marker([pos.lat, pos.lng], { icon: customIcon });

            const badgeHtml = isPremium ? '<span class="premium-badge"><i class="fa-solid fa-star" style="font-size:11px;"></i> S등급 우수 대리점</span><br>' : '';

            // [상세 정보 HTML 생성]
            let branchHtml = '';
            if (store.branch && store.branch.trim() !== '') {
                branchHtml = `<div class="map-popup-branch">퀄리스포츠 ${store.branch}</div>`;
            }

            // [변경] 웹사이트(데스크탑)에서 정보를 모두 표시하기 위해 팝업 내용은 항상 전체 정보를 포함하도록 생성
            // 모바일에서는 노출 시점(focusMarker)에서 팝업이 뜨지 않게 제어하므로, 데이터는 항상 전체 바인딩해둡니다.
            let popupLinkBtn = '';

            // 네이버 지도로 보기 (상세)
            if (store.link && store.link.trim() !== '' && store.link !== '#') {
                popupLinkBtn += `
                    <a href="${store.link}" target="_blank" class="map-popup-btn">
                        네이버 지도로 보기
                    </a>
                `;
            }

            // 길찾기 버튼 (네이버) - 클릭 시점에 동적으로 내 위치 확인하여 연동
            popupLinkBtn += `
                <a href="#" onclick="openNaverNavi(${pos.lat}, ${pos.lng}, '${store.name}'); return false;" class="btn-map-link">
                    <i class="fa-solid fa-location-arrow"></i> 네이버 길찾기
                </a>
            `;

            // 프리미엄일 경우 전용 클래스 부착
            const headerClass = isPremium ? 'map-popup-header premium-popup-header' : 'map-popup-header';
            const titleClass = isPremium ? 'map-popup-title premium-popup-title' : 'map-popup-title';

            const popupContent = `
                <div class="map-popup-inner">
                    <div class="${headerClass}">
                        ${badgeHtml}
                        <h4 class="${titleClass}">${store.name}</h4>
                        ${branchHtml}
                    </div>
                    <div class="map-popup-body popup-mobile-hide">
                        <div class="map-popup-row">
                            <i class="fa-solid fa-location-dot" style="color:var(--quali-blue);"></i> 
                            <span>${store.address}</span>
                        </div>
                        <div class="map-popup-row">
                            <i class="fa-solid fa-phone" style="color:var(--quali-blue);"></i> 
                            <a href="tel:${store.phone}">${store.phone || '-'}</a>
                        </div>
                        <div class="map-popup-row">
                            <i class="fa-regular fa-calendar-xmark" style="color:var(--system-red);"></i> 
                            <span>휴무: ${store.closed || '없음'}</span>
                        </div>
                    </div>
                    <div class="map-popup-buttons">
                        ${popupLinkBtn}
                    </div>
                </div>
            `;

            // [개선] 데스크탑에서만 팝업 바인딩 (모바일은 바텀시트만 사용)
            // [신규] 데스크탑에서 마우스 호버 시 이름 툴팁 표시
            const isMobile = window.innerWidth <= 900;
            if (!isMobile) {
                marker.bindPopup(popupContent, { minWidth: 260 });

                // 핀 디자인(일반 vs 프리미엄)에 따라 툴팁 높이 조정
                const tooltipOffset = isPremium ? [0, -25] : [0, -15];
                marker.bindTooltip(store.name, {
                    direction: 'top',
                    offset: tooltipOffset,
                    permanent: false,
                    sticky: true
                });
            }

            marker.on('click', () => {
                // 마커 클릭이 지도 click 이벤트로 전파되어 clearSelection이 호출되지 않도록 억제
                _suppressMapClick = true;
                setTimeout(() => { _suppressMapClick = false; }, 100);

                const isMobile = window.innerWidth <= 900;
                highlightListItem(store.name, !isMobile);
                showSelectedStore(store.name);
                focusMarker(marker, pos, store);
            });

            store.markerRef = marker;
            markers.push(marker); // Keep reference

            // [신규] 클러스터링 토글 상태에 따라 추가 방식 분기
            if (isClusteringEnabled) {
                markerClusterGroup.addLayer(marker);
            } else {
                marker.addTo(map);
            }

            bounds.push([pos.lat, pos.lng]);
        }
    });

    // 클러스터링 미사용 시에도 markerClusterGroup Layer는 map에 있어야 할 수 있으나(관리상),
    // 토글 시 isClusteringEnabled에 따라 clearLayers 혹은 removeLayer 처리를 하는 것이 깔끔.
    // 여기서는 applyFilter가 전체 재호출되므로, 위쪽 로직으로 충분.
    if (isClusteringEnabled) {
        if (!map.hasLayer(markerClusterGroup)) map.addLayer(markerClusterGroup);
    } else {
        if (map.hasLayer(markerClusterGroup)) map.removeLayer(markerClusterGroup);
    }

    if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
    }
}

// [신규 기능] 활성화 핀 스타일 적용 (빨간색 강조)
function setActivePin(marker) {
    // 모든 마커에서 active-pin 클래스 제거
    document.querySelectorAll('.custom-pin').forEach(el => {
        el.classList.remove('active-pin');
        el.style.zIndex = ""; // z-index 초기화
    });

    // 현재 마커 아이콘에 클래스 추가
    if (marker && marker.getElement()) {
        const iconEl = marker.getElement();
        iconEl.classList.add('active-pin');
        iconEl.style.zIndex = 9999;
    }
}

// [신규 기능] 초기 위치 권한 요청
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

// [신규 기능] 네이버 길찾기 동적 연동
function openNaverNavi(lat, lng, name) {
    // 기본 URL (도착지)
    let url = `${CONFIG.EXTERNAL_SERVICES.NAVER_ROUTE}?elat=${lat}&elng=${lng}&etext=${name}&menu=route`;

    // 현재 시점의 내 위치가 있으면 출발지로 추가
    // 만약 userLat가 없다면, 다시 한번 시도해볼 수도 있음 (여기서는 저장된 값 사용)
    if (navigator.geolocation && (!userLat || !userLng)) {
        // 위치 정보가 없으면, 즉시 요청 후 이동 시도 (약간의 딜레이 발생 가능하므로 바로 이동시키는게 나을수도 있음)
        // 여기서는 사용자 경험상 바로 띄우는게 낫지만, 권한 체크를 위해 getCurrentPosition을 한 번 더 수행
        navigator.geolocation.getCurrentPosition((position) => {
            userLat = position.coords.latitude;
            userLng = position.coords.longitude;
            url += `&slat=${userLat}&slng=${userLng}&stext=내위치`;
            window.open(url, '_blank');
        }, () => {
            // 권한 없으면 도착지만
            window.open(url, '_blank');
        });
    } else if (userLat && userLng) {
        url += `&slat=${userLat}&slng=${userLng}&stext=내위치`;
        window.open(url, '_blank');
    } else {
        window.open(url, '_blank');
    }
}

// [신규 기능] 클러스터링 토글
function toggleClustering() {
    isClusteringEnabled = !isClusteringEnabled;
    const btn = document.getElementById('btnCluster'); // ID 변경

    if (isClusteringEnabled) {
        btn.classList.add('active');
        applyFilter();
    } else {
        btn.classList.remove('active');
        applyFilter();
    }
}

// [신규 기능] 다크 모드 토글
function toggleDarkMode() {
    const body = document.body;
    body.classList.toggle('dark-mode');
    const isDark = body.classList.contains('dark-mode');
    const btn = document.getElementById('btnDarkMode'); // ID 변경

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

// [신규 기능] 내 위치 토글 (Toggle)
function toggleMyLocation() {
    const btn = document.getElementById('btnMyLocation');

    // 이미 마커가 있다면 -> 끄기 (제거)
    if (window.myLocationMarker) {
        map.removeLayer(window.myLocationMarker);
        window.myLocationMarker = null;
        btn.classList.remove('active');
        return;
    }

    // 없다면 -> 켜기 (찾기)
    if (!navigator.geolocation) {
        alert("이 브라우저에서는 위치 서비스를 지원하지 않습니다.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            // [업데이트] 전역 변수 동기화
            userLat = lat;
            userLng = lng;

            // 지도 이동
            map.flyTo([lat, lng], 14, { duration: 1.5 });

            // [변경] 커스텀 디자인 마커 (레이더 효과)
            const myLocIcon = L.divIcon({
                className: 'my-location-marker',
                html: '<div class="my-location-pulse"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            // [변경] 커스텀 팝업 적용 (X버튼 숨김, 오토클로즈)
            window.myLocationMarker = L.marker([lat, lng], { icon: myLocIcon }).addTo(map)
                .bindPopup('현재 내 위치', {
                    className: 'custom-location-popup',
                    minWidth: 50,
                    closeButton: false, // CSS로도 숨겼지만 명시적으로 false
                    autoClose: true,    // 다른거 누르면 닫힘
                    closeOnClick: true
                })
                .openPopup();

            // 버튼 활성화
            btn.classList.add('active');
        },
        (error) => {
            alert("위치 정보를 가져올 수 없습니다. 권한을 확인해주세요.");
            btn.classList.remove('active');
        }
    );
}

function renderList(data) {
    const container = document.getElementById("listContent");
    container.innerHTML = "";

    if (!data || data.length === 0) {
        container.innerHTML = '<div class="message-box">조건에 맞는 매장이 없습니다.</div>';
        return;
    }

    data.forEach((store) => {
        const isPremium = (store.grade === 'S');
        const pos = getStoreLatLng(store);

        let badgesHtml = '';
        if (store.testRide === "O") {
            badgesHtml += `
            <span class="badge test-ride">
                <i class="fa-solid fa-motorcycle"></i> 시승가능
            </span>`;
        }
        if (store.oneCare === "O") {
            badgesHtml += `
            <span class="badge one-care">
                <i class="fa-solid fa-screwdriver-wrench"></i> 원케어
            </span>`;
        }

        const phoneHtml = store.phone ? `<a href="tel:${store.phone}" class="phone-link" onclick="event.stopPropagation();">${store.phone}</a>` : '-';

        let branchHtml = '';
        if (store.branch && store.branch.trim() !== '') {
            branchHtml = `<div class="store-branch">퀄리스포츠 ${store.branch}</div>`;
        }

        const card = document.createElement("div");
        card.className = `store-card ${isPremium ? 'premium-card' : ''}`;
        card.dataset.storeName = store.name;

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

        // 프리미엄 핀 리스트 내 아이콘 표시 (기존 지도 핀과 동일한 fa-star)
        let locationIcon = isPremium
            ? '<i class="fa-solid fa-star" style="color:#FFD700; filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.5));"></i>'
            : (pos ? '<i class="fa-solid fa-location-dot" style="color:#e03131;"></i>' : '<i class="fa-solid fa-location-dot"></i>');

        card.innerHTML = `
            <div class="card-header">
                <h3 class="store-name">${store.name}</h3>
            </div>
            <div class="card-body">
                ${branchHtml}
                <div class="info-row">
                    ${locationIcon}
                    <div>${store.address}</div>
                </div>
                <div class="info-row">
                    <i class="fa-solid fa-phone"></i>
                    <div>${phoneHtml}</div>
                </div>
                <div class="closed-day">
                    <i class="fa-regular fa-calendar-xmark" style="color:#888; margin-right:4px;"></i>
                    휴무: ${store.closed || '없음'}
                </div>
                <div class="badge-group">${badgesHtml}</div>
            </div>
        `;
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
    setActivePin(null); // [추가] 선택 해제 시 핀 강조 초기화
    scrollToListTop();
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
            // 모바일: 최상단으로 스크롤 (start)
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            // 데스크탑: 중앙으로 스크롤 (center)
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

// 마커 및 팝업 포커싱 (모바일/데스크탑 모두 지도 정중앙에 팝업)
function focusMarker(marker, pos, storeData) {
    const isMobile = window.innerWidth <= 900;
    const zoomLevel = 16;

    // 이전 moveend 리스너 제거
    if (_pendingPopupFn) {
        map.off('moveend', _pendingPopupFn);
        _pendingPopupFn = null;
    }

    const mapSize = map.getSize();
    const point = map.project([pos.lat, pos.lng], zoomLevel);

    let newPoint;
    if (isMobile) {
        // 모바일: 바텀시트가 하단의 약 40%를 가리므로, 핀을 화면 상단 1/3 지점에 오게 설정
        // 맵 컨테이너 높이의 약 1/4 정도 위로 올려줌
        const mapHeight = map.getSize().y;
        newPoint = point.add([0, -mapHeight * 0.25]); // 25% 정도 위로 옵셋
    } else {
        // 데스크탑: 핀을 지도 패널 좌측 1/4에 배치 (팝업이 중앙에 올 공간 확보)
        newPoint = point.add([-mapSize.x / 4, 0]);
    }

    const newCenter = map.unproject(newPoint, zoomLevel);
    // 모바일은 부드러운 이동을 위해 duration을 약간 늘림
    const animDuration = isMobile ? 1.2 : 1;
    map.flyTo(newCenter, zoomLevel, { animate: true, duration: animDuration, easeLinearity: 0.25 });

    // flyTo 완료 후: 모바일은 전용 모달 팝업 띄우고, 데스크탑은 지도 중앙 팝업 유지
    _pendingPopupFn = function () {
        map.closePopup();
        if (isMobile) {
            showMobileModal(storeData);
        } else {
            const content = marker.getPopup().getContent();
            // offset Y: 데스크탑 팝업 높이 ≈ 260px → offset 130
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

    // 핀 강조
    setTimeout(() => {
        setActivePin(marker);
    }, 450);
}

let mobileMiniMap = null;
let _pendingPopupFn = null;    // 지도 중앙 팝업용 moveend 리스너 참조
let _suppressMapClick = false; // 마커 클릭 시 map click 이벤트 억제용 플래그

// [신규] 모바일 전용 상세 모달 표시
function showMobileModal(store) {
    if (window.innerWidth > 900) return; // 데스크탑은 무시

    const body = document.getElementById('mobileModalBody');
    const pos = getStoreLatLng(store);

    // 모달 내용에 미니 지도 영역 추가
    // 고해상도 타일을 위해 id 설정 (CSS에서 높이 관리), 바로 안내 문구 추가
    let miniMapHtml = `
        <div id="mobileMiniMap"></div>
        <div style="font-size:12px; color:#8e8e93; text-align:center; margin-bottom:12px; display:flex; align-items:center; justify-content:center; gap:4px;">
            <i class="fa-regular fa-hand-pointer"></i> 지도를 누르면 네이버 지도로 이동합니다
        </div>
    `;

    const isPremium = store.grade === 'S';
    const badgeHtml = isPremium ? '<span class="premium-badge"><i class="fa-solid fa-star" style="font-size:12px;"></i> S등급 우수 대리점</span><br>' : '';

    let branchHtml = '';
    if (store.branch && store.branch.trim() !== '') {
        branchHtml = `<div class="map-popup-branch">퀄리스포츠 ${store.branch}</div>`;
    }

    let popupLinkBtn = '';
    // 모바일 바텀시트에서는 지도 자체가 클릭 시 네이버지도로 연결되므로, '네이버 지도로 보기' 버튼은 비활성화
    // if (store.link && store.link.trim() !== '' && store.link !== '#') {
    //     popupLinkBtn += `<a href="${store.link}" target="_blank" class="map-popup-btn">네이버 지도로 보기</a>`;
    // }
    popupLinkBtn += `
        <a href="#" onclick="openNaverNavi(${pos.lat}, ${pos.lng}, '${store.name}'); return false;" class="btn-map-link">
            <i class="fa-solid fa-location-arrow"></i> 네이버 길찾기
        </a>
    `;

    // 모바일 모달은 모든 정보 표시
    // 프리미엄일 경우 커스텀 클래스 부착 (css/style.css 에서 스타일 제어)
    const headerClass = isPremium ? 'map-popup-header premium-popup-header' : 'map-popup-header';
    const titleClass = isPremium ? 'map-popup-title premium-popup-title' : 'map-popup-title';

    body.innerHTML = `
        <div class="map-popup-inner" style="padding:0;">
            ${miniMapHtml}
            <div class="${headerClass}">
                ${badgeHtml}
                <h4 class="${titleClass}" style="font-size:22px;">${store.name}</h4>
                ${branchHtml}
            </div>
            <div class="map-popup-body" style="font-size:15px; margin: 15px 0;">
                <div class="map-popup-row" style="margin-bottom:10px; display:flex; align-items:flex-start; gap:8px;"><i class="fa-solid fa-location-dot" style="color:var(--system-blue); width:24px; text-align:center; padding-top:2px;"></i> <span style="flex:1; line-height:1.4;">${store.address}</span></div>
                <div class="map-popup-row" style="margin-bottom:10px; display:flex; align-items:flex-start; gap:8px;"><i class="fa-solid fa-phone" style="color:var(--system-blue); width:24px; text-align:center; padding-top:2px;"></i> <a href="tel:${store.phone}" style="color:var(--text-primary); text-decoration:none; font-weight:500; display:block;">${store.phone || '-'}</a></div>
                <div class="map-popup-row" style="margin-bottom:10px; display:flex; align-items:flex-start; gap:8px;"><i class="fa-regular fa-calendar-xmark" style="color:var(--system-red); width:24px; text-align:center; padding-top:2px;"></i> <span style="font-weight:500;">휴무: ${store.closed || '없음'}</span></div>
            </div>
            <div class="map-popup-buttons" style="margin-top:24px; display:flex; gap:8px;">
                ${popupLinkBtn}
            </div>
        </div>
    `;

    const overlay = document.getElementById('mobileModalOverlay');
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';

    // 모달 내 미니 지도 초기화 (비동기 처리)
    setTimeout(() => {
        if (mobileMiniMap) {
            mobileMiniMap.remove();
        }
        mobileMiniMap = L.map('mobileMiniMap', {
            center: [pos.lat, pos.lng],
            zoom: 17, // 핀 주변을 가깝게 보여주기 (15 → 17)
            zoomControl: false,
            dragging: false,
            touchZoom: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            attributionControl: false // [신규] 오픈소스 지도 마크 삭제 (모바일 미니맵)
        });

        L.tileLayer(CONFIG.MAP.LIGHT_TILE, {
            detectRetina: true, // 고해상도(레티나) 디스플레이에서 선명한 타일 로드 옵션
            maxZoom: 19
        }).addTo(mobileMiniMap);

        const miniIcon = L.divIcon({
            className: 'custom-pin',
            html: `<i class="fa-solid fa-location-dot" style="color:#ff3b30; font-size:30px;"></i>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });
        L.marker([pos.lat, pos.lng], { icon: miniIcon }).addTo(mobileMiniMap);

        // 맵 클릭 시 네이버 지도로 연결되게 설정
        mobileMiniMap.on('click', () => {
            window.open(`${CONFIG.EXTERNAL_SERVICES.NAVER_SEARCH}${encodeURIComponent(store.address)}`, '_blank');
        });
    }, 200);
}

function closeMobileModal() {
    const overlay = document.getElementById('mobileModalOverlay');
    overlay.classList.remove('show');
    document.body.style.overflow = '';
}

function applyFilter() {
    const keyword = document.getElementById("searchInput").value.toUpperCase().trim();
    // [주석처리] 프리미엄 필터 체크박스 비활성화
    // const showPremiumOnly = document.getElementById("premiumCheck").checked;
    const showPremiumOnly = false; // 강제 false 처리
    const showOneCareOnly = document.getElementById("oneCareCheck").checked;
    const showTestRideOnly = document.getElementById("testRideCheck").checked;

    clearSelection();

    // 1. 필터링 수행
    let filtered = ALL_DATA.filter(store => {
        if (currentCategory !== 'all' && store.category !== currentCategory) return false;

        if (showPremiumOnly && store.grade !== 'S') return false;
        if (showOneCareOnly && store.oneCare !== 'O') return false;
        if (showTestRideOnly && store.testRide !== 'O') return false;

        if (keyword !== "") {
            return (store.name && store.name.toUpperCase().includes(keyword)) ||
                (store.address && store.address.toUpperCase().includes(keyword)) ||
                (store.branch && store.branch.toUpperCase().includes(keyword));
        }
        return true;
    });

    // 2. [주석처리] 정렬 수행 비활성화 (S등급 최상단 기능 끔)
    /*
    filtered.sort((a, b) => {
        const isPremiumA = a.grade === 'S';
        const isPremiumB = b.grade === 'S';

        if (isPremiumA && !isPremiumB) return -1; // A가 프리미엄이면 앞으로
        if (!isPremiumA && isPremiumB) return 1;  // B가 프리미엄이면 앞으로
        return 0; // 둘 다 같으면 순서 유지
    });
    */

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
