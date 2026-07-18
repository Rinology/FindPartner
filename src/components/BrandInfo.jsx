import React from 'react';

export default function BrandInfo() {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500 animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <i className="fa-solid fa-bicycle text-3xl text-blue-500"></i>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-2 tracking-tight">퀄리스포츠 공식 대리점 안내</h3>
            <p className="text-sm leading-relaxed mb-8">
                상단의 검색창이나 지도를 통해<br/>
                가까운 공식 대리점과 우수협력점을 찾아보세요.<br/>
                원케어 매장에서는 더욱 특별한 서비스를 제공합니다.
            </p>
            
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
