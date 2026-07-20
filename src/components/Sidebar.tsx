/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Compass, 
  BookOpen, 
  Activity, 
  Settings, 
  LogOut, 
  GraduationCap, 
  User, 
  Lock,
  ChevronLeft,
  ChevronRight,
  Award
} from 'lucide-react';
import { UserSession } from '../types';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  session: UserSession;
  onLogout: () => void;
  primaryColor: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({ 
  currentTab, 
  setTab, 
  session, 
  onLogout, 
  primaryColor,
  isCollapsed = false,
  onToggleCollapse
}: SidebarProps) {
  
  // 전체 메뉴 구조
  const menuItems = [
    { id: 'college', name: '2027학년도 희망대학 산출', icon: Compass, roles: ['student', 'teacher', 'admin'] },
    { id: 'gpa', name: '내신성적 조회', icon: BookOpen, roles: ['student', 'teacher', 'admin'] },
    { id: 'mock', name: '모의고사 성적 조회', icon: Activity, roles: ['student', 'teacher', 'admin'] },
    { id: 'mock-rank', name: '모의고사 과목별 석차 조회', icon: Award, roles: ['teacher', 'admin'] },
    { id: 'admin', name: '관리자 설정', icon: Settings, roles: ['teacher', 'admin'] } // 학생에겐 비노출
  ];

  // 역할(Role)에 따른 메뉴 필터링
  const visibleMenu = menuItems.filter(item => item.roles.includes(session.role || ''));

  return (
    <div id="side-navigation" className="w-full professional-bg-sidebar border-r professional-border flex flex-col h-screen select-none shrink-0 transition-all duration-300">
      {/* 최고 상단 로고 */}
      {isCollapsed ? (
        <div className="p-4 py-6 border-b professional-border flex flex-col items-center justify-center gap-3">
          {onToggleCollapse && (
            <button 
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
              title="상담메뉴 확장"
            >
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>
          )}
          <GraduationCap className="w-5 h-5" style={{ color: primaryColor }} />
        </div>
      ) : (
        <div className="p-5 pb-6 border-b professional-border flex items-center justify-between">
          <div className="flex flex-col">
            <div className="text-xl font-bold tracking-tighter">
              <span className="accent-gold" style={{ color: primaryColor }}>ADMIT</span>2027
            </div>
            <div className="text-[9px] text-zinc-500 mt-0.5 uppercase tracking-widest font-semibold">
              High School Consulting
            </div>
          </div>
          {onToggleCollapse && (
            <button 
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-850 transition-all cursor-pointer"
              title="상담메뉴 축소"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* 내비게이션 메뉴 리스트 */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-5 mb-2.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            입시 상담 메뉴
          </div>
        )}
        {visibleMenu.map(item => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;
          return (
            <button
              id={`sidebar-tab-${item.id}`}
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex ${isCollapsed ? 'justify-center py-3.5 px-0' : 'items-center gap-2.5 px-3.5 py-2.5'} text-xs transition-all cursor-pointer text-left ${
                isActive 
                  ? 'text-gold bg-[#141415] border-l-[3px] font-bold' 
                  : 'text-zinc-400 hover:text-gold hover:bg-[#141415]'
              }`}
              style={{ 
                borderLeftColor: isActive ? primaryColor : 'transparent',
                color: isActive ? primaryColor : undefined
              }}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon 
                className="w-3.5 h-3.5 shrink-0 transition-transform duration-305"
                style={{ color: isActive ? primaryColor : undefined }}
              />
              {!isCollapsed && <span className="whitespace-nowrap tracking-tight text-[11.5px]">{item.name}</span>}
              {!isCollapsed && isActive && (
                <div 
                  className="w-1 h-1 rounded-full ml-auto" 
                  style={{ backgroundColor: primaryColor }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* 사용자 프로필 박스 및 로그아웃 */}
      <div className={`p-4 ${isCollapsed ? 'px-2 py-5' : 'p-5'} border-t professional-border bg-[#0D0D0D] space-y-4`}>
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-4">
            <div 
              className="w-8 h-8 rounded-full bg-zinc-800 border professional-border flex items-center justify-center text-white font-bold text-xs shrink-0"
              title={`${session.name} ${session.role === 'admin' ? '(최고 관리자)' : session.role === 'teacher' ? `(${session.cls}반 담임교사)` : `(${session.cls}반 학생포털)`}`}
            >
              {session.role === 'admin' ? <Lock className="w-3.5 h-3.5" style={{ color: primaryColor }} /> : <User className="w-3.5 h-3.5 text-zinc-400" />}
            </div>
            <button
              id="btn-sidebar-logout"
              onClick={onLogout}
              className="p-1.5 bg-zinc-850 hover:bg-zinc-800 hover:text-red-400 text-zinc-400 rounded-lg text-xs font-bold transition-all cursor-pointer border professional-border flex items-center justify-center"
              title="시스템 로그아웃"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-800 border professional-border flex items-center justify-center text-white font-bold text-xs shrink-0">
                {session.role === 'admin' ? <Lock className="w-4 h-4" style={{ color: primaryColor }} /> : <User className="w-4 h-4 text-zinc-400" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate leading-tight">
                  {session.name}
                </p>
                <p className="text-[9px] text-zinc-500 font-medium tracking-tight uppercase mt-0.5">
                  {session.role === 'admin' && '최고 관리자'}
                  {session.role === 'teacher' && `${session.cls}반 담임교사`}
                  {session.role === 'student' && `${session.cls}반 학생포털`}
                </p>
              </div>
            </div>

            <button
              id="btn-sidebar-logout"
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-zinc-850 hover:bg-zinc-800 hover:text-red-400 text-zinc-400 rounded-lg text-[11px] font-bold transition-all cursor-pointer border professional-border"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>시스템 로그아웃</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
