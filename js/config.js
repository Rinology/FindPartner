/**
 * FindPartner Project Configuration
 * Manage all external URLs and API endpoints here.
 */

const CONFIG = {
    // API Data Source (GAS Proxy)
    GAS_URL: "/api/gas-proxy",

    // Map Configuration (Leaflet Tiles)
    MAP: {
        LIGHT_TILE: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        DARK_TILE: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        ATTRIBUTION: {
            OSM: "&copy; OpenStreetMap contributors",
            CARTO: "&copy; OpenStreetMap &copy; CartoDB"
        }
    },

    // External Map Service Links
    EXTERNAL_SERVICES: {
        NAVER_ROUTE: "https://map.naver.com/index.nhn",
        NAVER_SEARCH: "https://map.naver.com/v5/search/",
        KAKAO_CHANNEL: "#", // 공식 카카오톡 채널 링크를 입력하세요
        REGIST_CENTER: "#"  // 제품등록센터 링크를 입력하세요
    }
};
