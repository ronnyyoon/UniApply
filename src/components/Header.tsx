/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from 'react';
import { Users, GraduationCap, Eye, UserCheck, Settings } from 'lucide-react';
import { UserSession, Student } from '../types';

interface HeaderProps {
  session: UserSession;
  students: Student[];
  selectedStudentId: string;
  onSelectStudent: (id: string) => void;
  primaryColor: string;
}

export default function Header({ 
  session, 
  students, 
  selectedStudentId, 
  onSelectStudent, 
  primaryColor 
}: HeaderProps) {
  
  // 로그인한 유저에 따른 학생 필터링
  const filteredStudents = useMemo(() => {
    if (session.role === 'admin') {
      // 마스터 관리자는 전체 학생 노출
      return students;
    } else if (session.role === 'teacher' && session.cls) {
      // 교사는 본인 담임 학급 학생들만 노출
      return students.filter(s => s.cls === session.cls);
    } else if (session.role === 'student') {
      // 학생은 본인만 존재
      return students.filter(s => s.id === session.id);
    }
    return [];
  }, [students, session]);

  // 이용 가능한 학급(반) 리스트 추출
  const availableClasses = useMemo(() => {
    return Array.from(new Set(filteredStudents.map(s => s.cls))).sort((a, b) => Number(a) - Number(b));
  }, [filteredStudents]);

  const [selectedCls, setSelectedCls] = useState<number | ''>('');

  // 현재 선택된 학생의 반과 selectedCls 싱크 및 초기값 처리
  useEffect(() => {
    const stud = filteredStudents.find(s => s.id === selectedStudentId);
    if (stud) {
      setSelectedCls(stud.cls);
    } else if (filteredStudents.length > 0) {
      setSelectedCls(filteredStudents[0].cls);
    }
  }, [selectedStudentId, filteredStudents]);

  const studentsInSelectedCls = useMemo(() => {
    if (selectedCls === '') return [];
    return filteredStudents.filter(s => s.cls === selectedCls);
  }, [filteredStudents, selectedCls]);

  const handleClassChange = (clsVal: number) => {
    setSelectedCls(clsVal);
    const firstStud = filteredStudents.find(s => s.cls === clsVal);
    if (firstStud) {
      onSelectStudent(firstStud.id);
    }
  };

  // 현재 선택된 학생의 정보
  const activeStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  return (
    <header id="app-header" className="h-16 professional-bg-header border-b professional-border px-6 flex items-center justify-between shrink-0">
      
      {/* 왼쪽: 상담 학생 선택 드롭다운 (반선택, 학생선택 순) */}
      <div className="flex items-center gap-4">
        {session.role !== 'student' ? (
          <>
            <div className="flex items-center gap-3 bg-[#111111] px-4 py-2 rounded-xl border border-zinc-900">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-extrabold">반 선택</span>
                <div className="relative">
                  <select
                    id="header-class-select"
                    value={selectedCls}
                    onChange={(e) => handleClassChange(Number(e.target.value))}
                    className="bg-[#1A1A1A] border border-[#2D2D2D] hover:border-zinc-700 transition-colors text-xs rounded-lg px-2.5 py-1.5 pr-7 appearance-none focus:outline-none focus:border-gold text-white cursor-pointer font-bold"
                  >
                    {availableClasses.map((clsNum) => (
                      <option key={clsNum} value={clsNum} className="bg-neutral-900 text-white text-xs">
                        3학년 {clsNum}반
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-[8px]">▼</div>
                </div>
              </div>

              <div className="w-px h-5 bg-[#222]"></div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-extrabold">학생 선택</span>
                <div className="relative">
                  <select
                    id="header-student-select"
                    value={selectedStudentId}
                    onChange={(e) => onSelectStudent(e.target.value)}
                    className="bg-[#1A1A1A] border border-[#2D2D2D] hover:border-zinc-700 transition-colors text-xs rounded-lg px-3 py-1.5 pr-8 appearance-none focus:outline-none focus:border-gold text-white min-w-[130px] cursor-pointer font-bold"
                  >
                    {studentsInSelectedCls.map((stud) => (
                      <option key={stud.id} value={stud.id} className="bg-neutral-900 text-white text-xs">
                        {stud.num}번 - {stud.name} ({stud.id})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-[8px]">▼</div>
                </div>
              </div>
            </div>

            {/* 선택된 학생 요약 알림 */}
            {activeStudent && (
              <div className="hidden lg:flex items-center gap-1 text-[11px] text-zinc-400 bg-[#161616] px-3 py-1.5 rounded-lg border professional-border font-medium">
                <span className="font-bold text-gold" style={{ color: primaryColor }}>내신 평균: {activeStudent.gpa}등급</span>
                <span className="text-zinc-800">|</span>
                <span>담임: {activeStudent.teacherName}</span>
              </div>
            )}
          </>
        ) : (
          /* 학생인 경우 본인 성적 분석 전용 상태 표시 */
          <div className="flex items-center gap-2 bg-[#161616] border professional-border px-3.5 py-1.5 rounded-lg">
            <UserCheck className="w-4 h-4 text-gold" style={{ color: primaryColor }} />
            <span className="text-xs font-bold text-white tracking-wide">
              학생전용 상담포털 : [{session.id}] {session.name} 학생의 성적 맞춤 데이터 분석 중
            </span>
          </div>
        )}
      </div>

      {/* 오른쪽: 로그인 사용자명 표시창 및 정보 */}
      <div className="flex items-center gap-6">
        <div className="text-right hidden sm:block">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5 font-bold">Status</div>
          <div className="text-[11px] text-green-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
            시스템 정상 운영 중
          </div>
        </div>

        {/* '로그인 사용자명 표시창' */}
        <div id="user-info-badge" className="flex items-center gap-2.5 px-3 py-1.5 bg-[#161616] rounded-lg border professional-border">
          <p className="text-xs font-semibold text-zinc-300 animate-fade-in">
            접속자: <span className="text-white font-bold">{session.name}</span>
            {session.role === 'admin' && <span className="text-[9px] text-gold ml-1.5 bg-yellow-500/10 px-1.5 py-0.5 rounded font-bold border border-yellow-500/20" style={{ color: primaryColor }}>ADMIN</span>}
            {session.role === 'teacher' && <span className="text-[9px] text-teal-400 ml-1.5 bg-teal-500/10 px-1.5 py-0.5 rounded font-bold border border-teal-500/20">교사</span>}
            {session.role === 'student' && <span className="text-[9px] text-sky-400 ml-1.5 bg-sky-500/10 px-1.5 py-0.5 rounded font-bold border border-sky-500/20">학생</span>}
          </p>
        </div>
      </div>

    </header>
  );
}
