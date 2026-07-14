/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  TrendingUp, 
  Award, 
  Calendar, 
  CheckCircle,
  FileSpreadsheet,
  Grid
} from 'lucide-react';
import { Student } from '../types';

interface GradeViewerProps {
  student: Student;
  primaryColor: string;
}

export default function GradeViewer({ student, primaryColor }: GradeViewerProps) {
  const [activeSemesterTab, setActiveSemesterTab] = useState<string>('전체');

  const semesters = ['1-1', '1-2', '2-1', '2-2', '3-1'];

  // 주요 과목군별 평균 등급 계산 (국어, 수학, 영어, 탐구)
  const subjectGroupAverages = useMemo(() => {
    const groups: Record<string, { totalUnits: number; weightedSum: number }> = {
      '국어': { totalUnits: 0, weightedSum: 0 },
      '수학': { totalUnits: 0, weightedSum: 0 },
      '영어': { totalUnits: 0, weightedSum: 0 },
      '탐구': { totalUnits: 0, weightedSum: 0 },
    };

    student.grades.forEach(g => {
      let mappedGroup = '';
      if (g.subject.includes('국어') || g.subject === '독서' || g.subject === '문학') {
        mappedGroup = '국어';
      } else if (g.subject.includes('수학') || g.subject.includes('수학I') || g.subject.includes('수학II')) {
        mappedGroup = '수학';
      } else if (g.subject.includes('영어') || g.subject.includes('심화영어')) {
        mappedGroup = '영어';
      } else if (g.subject.includes('사회') || g.subject.includes('과학') || g.subject.includes('물리') || g.subject.includes('화학') || g.subject.includes('생명') || g.subject.includes('지구')) {
        mappedGroup = '탐구';
      }

      if (mappedGroup && groups[mappedGroup]) {
        groups[mappedGroup].totalUnits += g.unit;
        groups[mappedGroup].weightedSum += g.rank * g.unit;
      }
    });

    const result: Record<string, number> = {};
    Object.keys(groups).forEach(key => {
      const group = groups[key];
      result[key] = group.totalUnits > 0 
        ? Math.round((group.weightedSum / group.totalUnits) * 100) / 100 
        : 0;
    });

    return result;
  }, [student]);

  // 필터링된 성적 목록
  const displayedGrades = useMemo(() => {
    if (activeSemesterTab === '전체') return student.grades;
    return student.grades.filter(g => g.semester === activeSemesterTab);
  }, [student, activeSemesterTab]);

  // SVG 차트에 쓸 폴리라인 포인트 조합 계산
  // 학기: '1-1'=0, '1-2'=1, '2-1'=2, '2-2'=3, '3-1'=4
  // Y축: 1등급이 상단, 9등급이 하단
  // 등급 범위가 1.0 (최상단, y=30) ~ 9.0 (최하단, y=170) 일 때,
  // yPos = 30 + ((gpa - 1) / 8) * 140
  const svgPolypointsAndLabels = useMemo(() => {
    const width = 450;
    const height = 200;
    const paddingLeft = 40;
    const paddingRight = 40;
    const renderWidth = width - paddingLeft - paddingRight;
    const stepX = renderWidth / (semesters.length - 1);

    const points: { x: number; y: number; sem: string; val: number }[] = semesters.map((sem, idx) => {
      const gpa = student.semesterGpas[sem] || 5.0;
      const x = paddingLeft + (idx * stepX);
      const y = 30 + ((gpa - 1) / 8) * 140; // 1등급 -> y=30, 9등급 -> y=170
      return { x, y, sem, val: gpa };
    });

    const polylineExpr = points.map(p => `${p.x},${p.y}`).join(' ');
    return { points, polylineExpr };
  }, [student, semesters]);

  return (
    <div id="grade-viewer-tab" className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)] animate-fade-in text-white">
      
      {/* 1. 상단 타이틀 카드 */}
      <div className="professional-bg-card border professional-border rounded-xl p-6 relative overflow-hidden shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded-full uppercase tracking-wider">
              <BookOpen className="w-3 h-3" />
              학습 성취도 정보
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="font-extrabold text-gold" style={{ color: primaryColor }}>{student.name}</span> 학생 학기별 교과 석차 등급 분석
            </h2>
            <p className="text-xs text-zinc-400">
              1학년 1학기부터 3학년 1학기 수시 반영 학기까지의 정량 이수 등급 목록 및 교과군 가중치 일람 정보입니다.
            </p>
          </div>

          <div className="flex items-center gap-4.5 bg-[#0D0D0D] p-3 rounded-xl border professional-border shrink-0">
            <div className="text-center px-2">
              <div className="text-[10px] text-zinc-500 font-bold uppercase">전체 평균 내신</div>
              <div className="text-lg font-black text-white font-mono">{student.gpa} <span className="text-xs text-zinc-500">등급</span></div>
            </div>
            <div className="w-px h-8 bg-[#222]"></div>
            <div className="text-center px-2">
              <div className="text-[10px] text-zinc-500 font-bold uppercase">총 취득단위</div>
              <div className="text-lg font-black text-white font-mono">112 <span className="text-xs text-zinc-500">단위</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 교과군 평균 분석 & 내신 추이 그래프 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 선형 그래프 차트 (5컬럼) */}
        <div className="lg:col-span-5 professional-bg-card border professional-border rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 uppercase">
            <TrendingUp className="w-4 h-4 text-yellow-500" style={{ color: primaryColor }} />
            학기별 성적 추이 (평균 등급)
          </h3>

          <div className="bg-[#0D0D0D] p-4 rounded-xl border professional-border flex justify-center py-6 h-56 select-none relative">
            {/* 세로선 가이드라인 */}
            <svg viewBox="0 0 450 200" className="w-full h-full overflow-visible">
              {/* 수평 눈금 1~9등급선 가이드 */}
              {[1, 3, 5, 7, 9].map((g, idx) => {
                const y = 30 + ((g - 1) / 8) * 140;
                return (
                  <g key={g}>
                    <line x1="30" y1={y} x2="420" y2={y} stroke="#2E2E2E" strokeDasharray="3,3" />
                    <text x="15" y={y + 4} className="text-[10px] font-mono fill-zinc-600 font-bold">{g}등급</text>
                  </g>
                );
              })}

              {/* 포인트 연결 폴리라인 */}
              <polyline
                fill="none"
                stroke={primaryColor}
                strokeWidth="2.5"
                points={svgPolypointsAndLabels.polylineExpr}
                className="transition-all duration-500"
              />

              {/* 포인트에 들어가는 도트 써클 포인트 */}
              {svgPolypointsAndLabels.points.map((p, idx) => (
                <g key={p.sem} className="group cursor-pointer">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="5"
                    fill="#111111"
                    stroke={primaryColor}
                    strokeWidth="2"
                    className="hover:r-7 transition-all duration-300"
                  />
                  {/* 등급 요약 말풍선 */}
                  <text
                    x={p.x}
                    y={p.y - 12}
                    textAnchor="middle"
                    className="text-[11px] font-mono font-black fill-white"
                  >
                    {p.val}
                  </text>
                  {/* 하단 학년기 텍스트 */}
                  <text
                    x={p.x}
                    y="192"
                    textAnchor="middle"
                    className="text-[10px] font-bold fill-neutral-500 uppercase"
                  >
                    {p.sem}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* 교과군 평균 배분 분석 (7컬럼) */}
        <div className="lg:col-span-7 professional-bg-card border professional-border rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 uppercase">
            <Grid className="w-4 h-4 text-emerald-500" />
            핵심 영역별 특성화 성적 (평균 등급)
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.keys(subjectGroupAverages).map(group => {
              const val = subjectGroupAverages[group];
              return (
                <div key={group} className="p-4 bg-zinc-950/60 rounded-xl border professional-border space-y-2 text-center">
                  <span className="text-[11px] font-bold text-zinc-500">{group}교과 영역</span>
                  <div className="text-2xl font-black text-white font-mono tracking-tight">
                    {val > 0 ? `${val}등급` : '이수없음'}
                  </div>
                  {/* 등급 요건에 맞춘 등급 바 시뮬레이션 */}
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mt-2">
                    <div 
                      className="h-full bg-yellow-500"
                      style={{ 
                        width: `${Math.max(10, (10 - val) * 10)}%`,
                        backgroundColor: primaryColor
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-zinc-850 border professional-border text-xs text-zinc-400 rounded-xl leading-relaxed">
            * <b>교무 코멘트</b>: 위 학생은 <b>{student.cls >= 5 ? '이공계 지향 기술 수학/과학 탐구' : '인문사회 융합 핵심 역량'}</b> 군에서 특히 성적이 두드러집니다. 진로 교과목 선택 시 해당 계열 가중치가 적용되는 대학 전형들이 2027학년도 교과 계산 시 대단히 유리합니다.
          </div>
        </div>

      </div>

      {/* 3. 이수 성적 상세 테이블 피드 */}
      <div className="professional-bg-card border professional-border rounded-xl p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b professional-border pb-3">
          <h3 className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 uppercase">
            <FileSpreadsheet className="w-4 h-4 text-yellow-500" style={{ color: primaryColor }} />
            학기별 상세 교과 이수 대장
          </h3>

          {/* 학기 탭 선택 */}
          <div className="flex items-center gap-1.5">
            {['전체', '1-1', '1-2', '2-1', '2-2', '3-1'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveSemesterTab(tab)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  activeSemesterTab === tab 
                    ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' 
                    : 'text-zinc-500 hover:text-white'
                }`}
                style={{
                  color: activeSemesterTab === tab ? primaryColor : undefined,
                  borderColor: activeSemesterTab === tab ? `${primaryColor}33` : undefined,
                  backgroundColor: activeSemesterTab === tab ? `${primaryColor}11` : undefined,
                }}
              >
                {tab === '전체' ? '전체 학기' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* 테이블 디테일 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b professional-border text-zinc-500 uppercase font-semibold text-[10px] tracking-wider">
                <th className="py-3.5 px-4 font-bold">이수 학기</th>
                <th className="py-3.5 px-4">교과목명</th>
                <th className="py-3.5 px-4 text-center">반영 단위수</th>
                <th className="py-3.5 px-4 text-right">석차 등급</th>
                <th className="py-3.5 px-4 text-center">학업 성취수준</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-medium">
              {displayedGrades.map((g, idx) => {
                
                // 가상의 등급별 쾌차 배지
                let rankBadge = 'text-zinc-400';
                if (g.rank <= 2) rankBadge = 'text-yellow-500 font-extrabold';
                else if (g.rank <= 4) rankBadge = 'text-teal-400';

                return (
                  <tr key={idx} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="py-3 px-4 font-mono text-zinc-400">{g.semester}</td>
                    <td className="py-3 px-4 text-white font-semibold">{g.subject}</td>
                    <td className="py-3 px-4 text-center font-mono text-zinc-400">{g.unit} 단위</td>
                    <td className={`py-3 px-4 text-right font-mono text-base ${rankBadge}`}>
                      {g.rank} <span className="text-[10px] text-zinc-500 font-bold">등급</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-extrabold ${
                        g.rank <= 2 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                        g.rank <= 5 ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                        'bg-zinc-800 text-zinc-500'
                      }`}
                      style={{
                        color: g.rank <= 2 ? primaryColor : undefined,
                        borderColor: g.rank <= 2 ? `${primaryColor}33` : undefined,
                        backgroundColor: g.rank <= 2 ? `${primaryColor}11` : undefined,
                      }}
                      >
                        {g.rank <= 2 ? 'Excellent' : g.rank <= 5 ? 'Proficient' : 'Standard'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
