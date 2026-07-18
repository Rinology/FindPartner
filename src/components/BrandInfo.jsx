import React from 'react';

export default function BrandInfo() {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500 animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <i className="fa-solid fa-bicycle text-3xl text-blue-500"></i>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-2 tracking-tight">퀄리스포츠 X 엑스트론</h3>
            <p className="text-sm leading-relaxed mb-6">
                가까운 공식 대리점과 우수협력점을 찾아보세요.<br/>
                가장 스마트한 모빌리티 라이프를 시작하세요.
            </p>

            <div className="w-full mb-8 rounded-2xl overflow-hidden shadow-md aspect-video relative">
                <iframe 
                    className="absolute top-0 left-0 w-full h-full"
                    src="https://www.youtube.com/embed/n30Dk7wG5B4?autoplay=1&mute=1&loop=1&playlist=n30Dk7wG5B4" 
                    title="Quali Sports Video" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen>
                </iframe>
            </div>
            
            <div className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-left space-y-4">
                <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <i className="fa-solid fa-star text-xs"></i>
                    </span>
                    <div>
                        <p className="text-sm font-bold text-gray-900">우수협력점</p>
                        <p className="text-xs text-gray-500">본사가 인증한 최우수 서비스 매장</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <i className="fa-solid fa-screwdriver-wrench text-xs"></i>
                    </span>
                    <div>
                        <p className="text-sm font-bold text-gray-900">원케어 매장</p>
                        <p className="text-xs text-gray-500">원스톱 A/S 및 케어 서비스 제공</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
