/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Menu, 
  X, 
  Megaphone, 
  Award, 
  Calendar, 
  HelpCircle,
  GraduationCap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { UserSession, Student, CMSArticle, AppSettings } from './types';
import { 
  INITIAL_STUDENTS, 
  INITIAL_SETTINGS, 
  INITIAL_ARTICLES 
} from './data';

// 개별 컴포넌트 불러오기
import LoginModal from './components/LoginModal';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CollegeCalculator from './components/CollegeCalculator';
import GradeViewer from './components/GradeViewer';
import MockGradeViewer from './components/MockGradeViewer';
import MockRankViewer from './components/MockRankViewer';
import AdminPanel from './components/AdminPanel';

export default function App() {
  
  // 1. 상태 정의
  const [session, setSession] = useState<UserSession | null>(null);
  const [currentTab, setTab] = useState<string>('college');
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('ADMIT2027_STUDENTS');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_STUDENTS;
      }
    }
    return INITIAL_STUDENTS;
  });
  const [selectedStudentId, setSelectedStudentId] = useState<string>('3101'); // 강성민 기본선택
  const [articles, setArticles] = useState<CMSArticle[]>(INITIAL_ARTICLES);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  
  // 모바일 사이드바 활성 여부
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // 데스크톱 사이드바 접기 상태 (Gemini 스타일 열닫 기능)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // 선택한 CMS 공지사항을 하부 미니 팝업이나 패널로 바로 읽는 간이 수첩 기능
  const [activeNoticeDetail, setActiveNoticeDetail] = useState<CMSArticle | null>(INITIAL_ARTICLES[0]);

  // 2. 로그인 체결 시 후행 조치
  const handleLogin = (userSession: UserSession) => {
    setSession(userSession);
    
    // 로그인한 유저에 따른 기본 선택 학생 연출
    if (userSession.role === 'student') {
      setSelectedStudentId(userSession.id || '3101');
      setTab('college'); // 학생은 대입산출이 디폴트
    } else if (userSession.role === 'teacher' && userSession.cls) {
      // 교사가 로그인하면 자기 반의 첫번째 학생을 우선 분석 선택지정함
      const myClassStudents = INITIAL_STUDENTS.filter(s => s.cls === userSession.cls);
      if (myClassStudents.length > 0) {
        setSelectedStudentId(myClassStudents[0].id);
      }
      setTab('college');
    } else {
      // 관리자는 전체 목록 중 첫번째 전원 선택 가능
      setSelectedStudentId('3101');
      setTab('college');
    }
  };

  // 3. 로그아웃 
  const handleLogout = () => {
    setSession(null);
    setTab('college');
    setMobileMenuOpen(false);
  };

  // 4. 현재 선택된 학생 개체 파싱
  const currentStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId) || students[0];
  }, [students, selectedStudentId]);

  // 5. 사이트 배경색상 동률 설정
  const primaryColor = settings.primaryColor;

  return (
    <div id="app-root-container" className="flex professional-bg-main font-sans text-white h-screen overflow-hidden">
      
      {/* 로그인 세션 확인 (부재 시 전체화면 로그인 진입) */}
      {!session ? (
        <LoginModal onLogin={handleLogin} primaryColor={primaryColor} />
      ) : (
        <>
          {/* 데스크톱 왼쪽 내비게이션 사이드바 */}
          <div className={`hidden md:block transition-all duration-300 ease-in-out shrink-0 ${sidebarCollapsed ? 'w-14' : 'w-[205px]'}`}>
            <Sidebar 
              currentTab={currentTab} 
              setTab={setTab} 
              session={session} 
              onLogout={handleLogout} 
              primaryColor={primaryColor}
              isCollapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          </div>

          {/* 모바일 햄버거 오버레이 사이드바 */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-40 flex md:hidden animate-fade-in">
              {/* 블러 백드롭 반투명 배경층 */}
              <div 
                className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
              ></div>
              <div className="relative flex-1 flex flex-col max-w-xs w-full professional-bg-sidebar border-r professional-border animate-slide-right">
                {/* 닫기 버튼 */}
                <div className="absolute top-4 right-4 z-50">
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 bg-neutral-800 text-neutral-400 hover:text-white rounded-xl border professional-border"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {/* 동일 사이드바 전달 */}
                <Sidebar 
                  currentTab={currentTab} 
                  setTab={(tab) => {
                    setTab(tab);
                    setMobileMenuOpen(false);
                  }} 
                  session={session} 
                  onLogout={handleLogout} 
                  primaryColor={primaryColor}
                />
              </div>
            </div>
          )}

          {/* 메인 콘텐츠 작업 컨텍스트 (사이드바 우측 전부) */}
          <div className="flex-1 flex flex-col min-w-0 h-full relative">
            
            {/* 헤더 및 전용 학생 드롭다운 */}
            <div className="flex items-center w-full">
              {/* 모바일 햄버거 활성기 */}
              <button 
                id="mobile-hamburger-btn"
                onClick={() => setMobileMenuOpen(true)}
                className="block md:hidden ml-4 p-2 professional-bg-sidebar text-neutral-400 hover:text-white rounded-xl border professional-border shrink-0"
              >
                <Menu className="w-5 h-5" />
              </button>
              {/* 데스크톱 사이드바 접기/열기 버튼 (Gemini 스타일) */}
              <button
                id="desktop-sidebar-toggle-btn"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden md:block ml-4 p-2 professional-bg-sidebar text-neutral-400 hover:text-white rounded-xl border professional-border shrink-0 cursor-pointer transition-all hover:bg-neutral-800 animate-fade-in"
                title={sidebarCollapsed ? "상담메뉴 확장" : "상담메뉴 축소"}
              >
                {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
              <div className="flex-1 min-w-0">
                <Header 
                  session={session} 
                  students={students} 
                  selectedStudentId={selectedStudentId} 
                  onSelectStudent={setSelectedStudentId}
                  primaryColor={primaryColor}
                />
              </div>
            </div>

            {/* 정밀 페이지 탭 본문 (그리드 레이아웃 : 메인 65% + 보조 사이드 가젯 자료 바 35%) */}
            <div className="flex-1 flex flex-col xl:flex-row overflow-hidden min-h-0">
              
              {/* 좌측 메인 탭 활성화 화면 */}
              <main className="flex-1 overflow-hidden min-h-0">
                {currentTab === 'college' && (
                  <CollegeCalculator student={currentStudent} session={session} primaryColor={primaryColor} />
                )}
                {currentTab === 'gpa' && (
                  <GradeViewer student={currentStudent} primaryColor={primaryColor} />
                )}
                {currentTab === 'mock' && (
                  <MockGradeViewer student={currentStudent} students={students} primaryColor={primaryColor} />
                )}
                {currentTab === 'mock-rank' && session.role !== 'student' && (
                  <MockRankViewer students={students} primaryColor={primaryColor} />
                )}
                {currentTab === 'admin' && (
                  <AdminPanel 
                    articles={articles} 
                    setArticles={setArticles} 
                    settings={settings} 
                    setSettings={setSettings} 
                    session={session}
                    primaryColor={primaryColor}
                    students={students}
                    setStudents={setStudents}
                    onResetStudents={() => {
                      if (window.confirm('정말로 모의고사 성적 데이터를 포털 최초의 기본값(3월, 5월, 6월 내장 데이터)으로 전체 리셋하시겠습니까? 직접 업로드하신 성적 정보는 모두 영구 초기화됩니다.')) {
                        setStudents(INITIAL_STUDENTS);
                        localStorage.removeItem('ADMIT2027_STUDENTS');
                        alert('성공적으로 모의고사 성적 데이터셋이 초기 기본값으로 완벽히 복원 및 재구축되었습니다!');
                      }
                    }}
                  />
                )}
              </main>

              {/* 우측 사이드바: 고등학교 입시안내 CMS 위젯 및 상담사 가이드 (자연스러운 퀄리티 연장) */}
              {currentTab !== 'college' && currentTab !== 'mock' && currentTab !== 'gpa' && currentTab !== 'mock-rank' && currentTab !== 'admin' && (
                <aside className="hidden xl:flex w-80 professional-bg-sidebar border-l professional-border flex-col overflow-y-auto max-h-[calc(100vh-4rem)] p-5 space-y-5">
                  
                  {/* 실시간 미니 알림판 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: primaryColor }}>
                      <Megaphone className="w-3.5 h-3.5" />
                      대입공지 및 합격전략피드
                    </div>
                    
                    {/* 피드 CMS 리스트 */}
                    <div className="space-y-2.5">
                      {articles.slice(0, 3).map(art => (
                        <div 
                          key={art.id}
                          onClick={() => setActiveNoticeDetail(art)}
                          className={`p-3 rounded-xl border cursor-pointer text-left transition-all ${
                            activeNoticeDetail?.id === art.id
                              ? 'bg-zinc-800 professional-border'
                              : 'professional-bg-main professional-border hover:bg-zinc-800/60'
                          }`}
                        >
                          <div className="text-[10px] font-bold mb-1 flex items-center justify-between" style={{ color: primaryColor }}>
                            <span>{art.category}</span>
                            <span className="text-zinc-500 font-mono text-[9px]">{art.date}</span>
                          </div>
                          <h4 className="text-xs font-extrabold text-white truncate leading-snug">
                            {art.title}
                          </h4>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 선택한 공지 내용 일람 가젯 */}
                  {activeNoticeDetail && (
                    <div className="p-4 professional-bg-main border professional-border rounded-2xl space-y-2.5 animate-fade-in flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold text-zinc-500 border-b professional-border pb-2 flex items-center justify-between">
                          <span>[내용 상세 보기]</span>
                          <span>조회: {activeNoticeDetail.views + 7}회</span>
                        </div>
                        <h5 className="text-xs font-black text-white leading-relaxed">
                          {activeNoticeDetail.title}
                        </h5>
                        <p className="text-[11px] text-zinc-500 leading-relaxed whitespace-pre-wrap line-clamp-8">
                          {activeNoticeDetail.content}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => {
                          alert(`자세한 입시 자료나 공지사항 원안은 왼쪽 사이드바 맨 아래 '관리자 설정 - CMS 공지·게시물 관리'를 통해 편집 관리 또는 각 진학 교무실 배치 보드를 확인해 주십시오.`);
                        }}
                        className="w-full text-center py-2 bg-neutral-800 hover:bg-neutral-750 text-[10px] rounded-lg text-neutral-400 font-bold transition-all border professional-border cursor-pointer"
                      >
                        상세 분석 공고 원본 요청
                      </button>
                    </div>
                  )}

                </aside>
              )}

            </div>

          </div>
        </>
      )}

    </div>
  );
}

