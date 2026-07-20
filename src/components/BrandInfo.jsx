import React from 'react';
import { useStoreContext } from '../StoreContext';
import { getClosestStoreRegion } from '../utils/mapUtils';
import eventBannerImg from '../assets/event_banner.png';

export default function BrandInfo() {
    const { allData, setUserLocation, setIsLocationActive, setSelectedRegion, isLocationActive } = useStoreContext();

    const [currentAdIndex, setCurrentAdIndex] = React.useState(0);
    const adsCount = 3;
    const prevAd = () => setCurrentAdIndex((prev) => (prev === 0 ? adsCount - 1 : prev - 1));
    const nextAd = () => setCurrentAdIndex((prev) => (prev === adsCount - 1 ? 0 : prev + 1));

    const handleRequestLocation = () => {
        if (isLocationActive) {
            setIsLocationActive(false);
            window.isLocationActive = false;
            setUserLocation(null);
            window.userLocation = null;
        } else {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
                        setUserLocation(loc);
                        window.userLocation = loc;
                        setIsLocationActive(true);
                        window.isLocationActive = true;
                        
                        // 가장 가까운 매장의 지역을 찾아 자동 설정
                        const closestRegion = getClosestStoreRegion(allData, loc.lat, loc.lng);
                        if (closestRegion) {
                            setSelectedRegion(closestRegion);
                        }

                        // 지도 이동 트리거 (MapPanel.jsx에서 감지)
                        if (window.mapInstance && window.mapInstance.current) {
                            window.mapInstance.current.flyTo([loc.lat, loc.lng], 15, { animate: true, duration: 1.0 });
                        }
                    },
                    (error) => {
                        console.error("Error getting location:", error);
                        alert("위치 정보를 가져올 수 없습니다. 브라우저 주소창 왼쪽의 자물쇠 아이콘을 눌러 위치 권한이 '허용'되어 있는지 확인해주세요.");
                    }
                );
            } else {
                alert("이 브라우저에서는 위치 기반 서비스를 지원하지 않습니다.");
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-start min-h-full p-8 text-center text-gray-500 animate-in fade-in duration-500">
            <div className="mb-4">
                <img src="https://cdn.xtron-guide.kr/common/logos/Xtron_x_Qualisports_Logo_Black.webp" alt="Qualisports x Xtron Logo" className="h-10 object-contain mx-auto" />
            </div>
            <p className="text-sm leading-relaxed mb-6 font-medium text-gray-600 break-keep px-2">
                가까운 공식 대리점과 우수협력점을 찾아보세요. 
                <span className="text-blue-600 font-bold"> 상단의 지역을 선택</span>하시거나 <span className="text-blue-600 font-bold">내 주변 매장 찾기</span>를 통해 
                대리점 리스트를 바로 확인하실 수 있습니다.
            </p>

            <button 
                onClick={handleRequestLocation}
                className={`mb-6 w-full py-3.5 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 ${isLocationActive ? 'bg-white text-blue-600 border border-blue-600 hover:bg-gray-50' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'}`}
            >
                <i className="fa-solid fa-location-crosshairs"></i> {isLocationActive ? "내 위치 끄기" : "내 주변 매장 찾기"}
            </button>

            {/* 2. 광고 영역 (Carousel) */}
            <div className="w-full mb-6 relative group">
                {/* Carousel Container */}
                <div className="w-full overflow-hidden rounded-2xl relative shadow-md aspect-video bg-gray-100">
                    <div 
                        className="flex w-full h-full transition-transform duration-500 ease-in-out"
                        style={{ transform: `translateX(-${currentAdIndex * 100}%)` }}
                    >
                        {/* 광고 1: 배너 이미지 */}
                        <div 
                            className="w-full h-full shrink-0 cursor-pointer relative" 
                            onClick={() => window.open('https://buyxtron.com/', '_blank')}
                        >
                            <img 
                                src={eventBannerImg} 
                                alt="퀄리스포츠 X 엑스트론 이벤트" 
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* 광고 2: 유튜브 영상 */}
                        <div className="w-full h-full shrink-0 relative bg-black">
                            <iframe 
                                className="absolute top-0 left-0 w-full h-full pointer-events-auto"
                                src="https://www.youtube.com/embed/PaRQ9nw8VWw?rel=0&playsinline=1" 
                                title="Quali Sports Video" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen>
                            </iframe>
                        </div>

                        {/* 광고 3: 프로모션 안내 (플레이스홀더) */}
                        <div className="w-full h-full shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600 flex flex-col items-center justify-center p-6 text-white text-center">
                            <h3 className="text-lg sm:text-xl font-bold mb-2">특별 프로모션</h3>
                            <p className="text-sm sm:text-base opacity-90">지정된 대리점을 방문하고<br/>특별한 혜택을 만나보세요!</p>
                        </div>
                    </div>
                    
                    {/* Navigation Arrows */}
                    <button 
                        onClick={prevAd}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white/70 hover:bg-white text-gray-800 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <i className="fa-solid fa-chevron-left text-sm"></i>
                    </button>
                    <button 
                        onClick={nextAd}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white/70 hover:bg-white text-gray-800 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <i className="fa-solid fa-chevron-right text-sm"></i>
                    </button>
                </div>

                {/* Pagination Dots */}
                <div className="flex justify-center gap-1.5 mt-3">
                    {[0, 1, 2].map(idx => (
                        <button 
                            key={idx}
                            onClick={() => setCurrentAdIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-colors ${currentAdIndex === idx ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'}`}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            </div>

            {/* 3. 우수협력점 및 원케어 매장 설명 */}
            <div className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-left space-y-4">
                <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 mt-1">
                        <i className="fa-solid fa-star text-xs"></i>
                    </span>
                    <div>
                        <p className="text-[13px] text-gray-700 break-keep flex flex-wrap items-center gap-x-1.5 mt-0.5">
                            <span className="font-bold text-gray-900 text-sm">우수협력점</span>
                            <span className="text-[11.5px] text-gray-500">본사가 인증한 최우수 서비스 매장</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-1">
                        <i className="fa-solid fa-screwdriver-wrench text-xs"></i>
                    </span>
                    <div>
                        <p className="text-[13px] text-gray-700 break-keep flex flex-wrap items-center gap-x-1.5 mt-0.5">
                            <span className="font-bold text-gray-900 text-sm">원케어 매장</span>
                            <span className="text-[11.5px] text-gray-500">대리점이 책임지는 확실한 AS관리</span>
                        </p>
                        <ul className="text-[11.5px] text-gray-500 space-y-0.5 list-disc list-outside pl-3.5 mt-1.5 leading-relaxed font-medium tracking-tight break-keep">
                            <li>퀄리스포츠 공식 스토어에서 안심구매 가능!</li>
                            <li>집에서 가까운 대리점에서 제품 수령!</li>
                            <li>수령 받은 대리점이 책임지는 AS관리까지!</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
