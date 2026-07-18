import React from 'react';
import { useStoreContext } from '../StoreContext';
import ControlArea from './ControlArea';

export default function Header() {
    const { isMobile } = useStoreContext();

    return (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200">
            <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
                {/* Left Side: Title & Info (Desktop only or simplified on Mobile) */}
                <div className="flex flex-col">
                    <div className="text-lg md:text-xl font-bold tracking-tight text-gray-900">전국 대리점 안내</div>
                    <div className="hidden md:flex items-center gap-2 ml-4">
                        <a href="http://pf.kakao.com/_xhxhRZxl/chat" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FEE500] hover:bg-[#F4DC00] text-[#000000] text-xs font-bold rounded-full transition-colors shadow-sm">
                            <i className="fa-brands fa-kakao text-sm"></i> 카카오톡 1:1 상담
                        </a>
                        <a href="https://xtroncare.kr" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full transition-colors shadow-sm">
                            <i className="fa-solid fa-file-signature text-sm"></i> 정품등록센터
                        </a>
                    </div>
                    <div className="text-xs md:text-sm text-gray-500">가까운 공식 대리점을 검색해보세요</div>
                </div>

                {/* Right Side: Action Buttons & Logo */}
                <div className="flex items-center gap-6">
                    {/* Desktop Action Buttons */}
                    {!isMobile && (
                        <div className="flex gap-3">
                            <a href="http://pf.kakao.com/_xhxhRZxl/chat" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-4 py-2 bg-[#FEE500] text-[#191919] text-sm font-semibold rounded-full hover:brightness-95 transition-all shadow-sm">
                                <i className="fa-brands fa-kakao text-lg"></i> 카카오톡 1:1 상담하기
                            </a>
                            <a href="https://xtroncare.kr" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 transition-all shadow-sm">
                                <i className="fa-solid fa-file-signature"></i> 정품등록센터
                            </a>
                        </div>
                    )}

                    {/* Logo */}
                    <div className="h-7 w-auto">
                        <img src="https://cdn.xtron-guide.kr/common/logos/Xtron_x_Qualisports_Logo_Black.webp" alt="Qualisports Logo" className="h-full object-contain" />
                    </div>
                </div>
            </div>

            {/* Mobile Control Area (Search & Filters) injected below header */}
            {isMobile && (
                <div className="w-full">
                    <ControlArea />
                </div>
            )}
        </header>
    );
}

