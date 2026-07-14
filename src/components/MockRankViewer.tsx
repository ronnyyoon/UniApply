import React, { useState, useMemo } from 'react';
import { Award, Trophy, User, Search, RefreshCw } from 'lucide-react';
import { Student } from '../types';

interface MockRankViewerProps {
  students: Student[];
  currentStudent?: Student;
  primaryColor: string;
}

export default function MockRankViewer({ students = [], currentStudent, primaryColor }: MockRankViewerProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>('korean');
  const [selectedSubExploration, setSelectedSubExploration] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const mainSubjects = [
    { id: 'korean', label: '국어' },
    { id: 'math', label: '수학' },
    { id: 'english', label: '영어' },
    { id: 'exploration', label: '탐구과목' },
    { id: 'history', label: '한국사' },
  ];

  const mockMonths = ['3월', '5월', '6월', '7월', '9월', '10월'];

  // 학생들의 모의고사 성적에서 실제 응시한 탐구 과목 목록을 동적 추출
  const uniqueExplorations = useMemo(() => {
    const subs = new Set<string>();
    students.forEach((st) => {
      st.mockGrades.forEach((mg) => {
        if (mg.exploration1 && mg.exploration1.trim()) {
          subs.add(mg.exploration1.trim());
        }
        if (mg.exploration2 && mg.exploration2.trim()) {
          subs.add(mg.exploration2.trim());
        }
      });
    });
    return Array.from(subs)
      .filter(s => s && s !== '미정' && s !== '미선택' && s !== '0')
      .sort();
  }, [students]);

  // 유효한 탐구 선택 과목 결정
  const currentSubExploration = useMemo(() => {
    if (selectedSubExploration && uniqueExplorations.includes(selectedSubExploration)) {
      return selectedSubExploration;
    }
    return uniqueExplorations[0] || '';
  }, [selectedSubExploration, uniqueExplorations]);

  // 탐구 선택 시 기본값 동기화
  React.useEffect(() => {
    if (selectedSubject === 'exploration' && !selectedSubExploration && uniqueExplorations.length > 0) {
      setSelectedSubExploration(uniqueExplorations[0]);
    }
  }, [selectedSubject, uniqueExplorations, selectedSubExploration]);

  // 각 월별로 정렬된 학생 랭킹 리스트를 미리 계산
  const monthlyRankings = useMemo(() => {
    const rankings: Record<string, Array<{ id: string; name: string; cls: number; scoreDisplay: string; rawSortValue: number }>> = {};

    mockMonths.forEach((month) => {
      const list = students.map((st) => {
        const mg = st.mockGrades.find((g) => g.date === month);
        if (!mg) return null;

        let rawSortValue = -1;
        let scoreDisplay = '';
        let isValid = false;

        if (selectedSubject === 'korean') {
          isValid = mg.korean > 0;
          rawSortValue = mg.koreanPercentile * 1000 + (100 - mg.koreanScore); // 백분위 우선, 그 다음 표준점수 역산 등
          scoreDisplay = mg.koreanPercentile > 0 ? `${mg.koreanPercentile}% (${mg.korean}등급)` : `${mg.korean}등급`;
        } else if (selectedSubject === 'math') {
          isValid = mg.math > 0;
          rawSortValue = mg.mathPercentile * 1000 + (100 - mg.mathScore);
          scoreDisplay = mg.mathPercentile > 0 ? `${mg.mathPercentile}% (${mg.math}등급)` : `${mg.math}등급`;
        } else if (selectedSubject === 'english') {
          isValid = mg.english > 0;
          rawSortValue = 10 - mg.english; // 등급이 낮을수록 좋음
          scoreDisplay = `${mg.english}등급`;
        } else if (selectedSubject === 'history') {
          isValid = mg.history > 0;
          rawSortValue = 10 - mg.history;
          scoreDisplay = `${mg.history}등급`;
        } else if (selectedSubject === 'exploration') {
          const isExploration1 = mg.exploration1 === currentSubExploration;
          const isExploration2 = mg.exploration2 === currentSubExploration;

          if (isExploration1 && mg.exploration1Grade > 0) {
            isValid = true;
            rawSortValue = mg.exploration1Percentile * 1000 + mg.exploration1Score;
            scoreDisplay = mg.exploration1Percentile > 0 
              ? `${mg.exploration1Percentile}% (${mg.exploration1Grade}등급)` 
              : `${mg.exploration1Grade}등급`;
          } else if (isExploration2 && mg.exploration2Grade > 0) {
            isValid = true;
            rawSortValue = mg.exploration2Percentile * 1000 + mg.exploration2Score;
            scoreDisplay = mg.exploration2Percentile > 0 
              ? `${mg.exploration2Percentile}% (${mg.exploration2Grade}등급)` 
              : `${mg.exploration2Grade}등급`;
          }
        }

        if (!isValid) return null;

        return {
          id: st.id,
          name: st.name,
          cls: st.cls,
          scoreDisplay,
          rawSortValue,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.rawSortValue - a.rawSortValue);

      rankings[month] = list;
    });

    return rankings;
  }, [students, selectedSubject, currentSubExploration]);

  // 테이블에 렌더링할 행 개수 결정 (성적이 있는 최장 리스트의 길이 기준, 기본 최소 25개~최대값)
  const maxRows = useMemo(() => {
    let maxLen = 22; // 첨부 이미지 기준 최소 22행은 기본 확보
    mockMonths.forEach((m) => {
      const len = monthlyRankings[m]?.length || 0;
      if (len > maxLen) {
        maxLen = len;
      }
    });
    return Math.min(maxLen, 100); // UI 안정성을 위해 최대 100등까지만 출력 (스크롤 최적화)
  }, [monthlyRankings]);

  const subjectLabel = useMemo(() => {
    if (selectedSubject === 'exploration') {
      return `탐구 [${currentSubExploration || '선택과목 없음'}]`;
    }
    return mainSubjects.find((s) => s.id === selectedSubject)?.label || '';
  }, [selectedSubject, currentSubExploration]);

  return (
    <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* 1. 상단 타이틀 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b professional-border pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-full uppercase tracking-wider mb-2 animate-pulse">
            <Trophy className="w-3 h-3" /> 모의고사 과목별 석차 조회
          </span>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            모의고사 과목별 석차 조회
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            시험시기별 전체 학생의 백분위와 등급을 한눈에 대조하여 성적 흐름과 반별 석차 분포를 입체 분석합니다.
          </p>
        </div>

        {/* 학생 검색 하이라이터 */}
        <div className="flex items-center gap-2 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="학생 이름으로 랭킹 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 w-[220px] text-xs bg-zinc-950 border professional-border text-white rounded-lg focus:outline-none focus:border-zinc-700 transition-all font-medium"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-2 py-1 text-[10px] text-zinc-400 hover:text-white bg-zinc-900 border professional-border rounded-md font-bold"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* 2. 대교과 선택 버튼 */}
      <div className="flex flex-wrap items-center gap-1.5 bg-zinc-950/40 p-1.5 rounded-xl border professional-border">
        {mainSubjects.map((subj) => (
          <button
            key={subj.id}
            onClick={() => {
              setSelectedSubject(subj.id);
            }}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex-1 min-w-[80px] text-center ${
              selectedSubject === subj.id
                ? 'bg-zinc-800 text-white shadow-md border professional-border'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
            style={{
              borderColor: selectedSubject === subj.id ? primaryColor : undefined,
              color: selectedSubject === subj.id ? primaryColor : undefined,
            }}
          >
            {subj.label}
          </button>
        ))}
      </div>

      {/* 탐구 세부 과목 선택 패널 */}
      {selectedSubject === 'exploration' && (
        <div className="p-4 bg-zinc-900/25 border professional-border rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
            <h4 className="text-xs font-bold text-zinc-300">세부 선택과목별 석차 조회</h4>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {uniqueExplorations.length > 0 ? (
              uniqueExplorations.map((subName) => (
                <button
                  key={`sub-exp-${subName}`}
                  onClick={() => setSelectedSubExploration(subName)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer border ${
                    currentSubExploration === subName
                      ? 'bg-zinc-800 text-white font-extrabold shadow-sm'
                      : 'text-zinc-400 hover:text-white bg-zinc-950/40 hover:bg-zinc-900/25 professional-border'
                  }`}
                  style={{
                    borderColor: currentSubExploration === subName ? primaryColor : undefined,
                    color: currentSubExploration === subName ? primaryColor : undefined,
                  }}
                >
                  {subName}
                </button>
              ))
            ) : (
              <span className="text-xs text-zinc-500">조회 가능한 세부 탐구 과목이 존재하지 않습니다.</span>
            )}
          </div>
        </div>
      )}

      {/* 3. 메인 석차 대조 테이블 (첨부 양식 100% 동일 재현) */}
      <div className="overflow-x-auto border professional-border rounded-xl bg-zinc-950/20 shadow-2xl custom-scrollbar">
        <table className="w-full text-center border-collapse text-xs min-w-[1200px]">
          {/* 테이블의 대헤더 과목명 */}
          <thead>
            <tr className="border-b professional-border">
              <th
                colSpan={13}
                className="py-3 px-4 bg-zinc-950/80 text-center font-bold text-sm tracking-widest text-zinc-100 border-b professional-border uppercase font-mono"
              >
                {subjectLabel} 영역 전국 모의고사 성적 대조표
              </th>
            </tr>
            {/* 가로 첫 행 헤더: 월 이름 */}
            <tr className="bg-zinc-900 text-zinc-300 font-bold border-b professional-border">
              <th rowSpan={2} className="py-3 px-2 border-r professional-border w-14 font-mono font-black text-zinc-400 bg-zinc-950/50">
                석차
              </th>
              {mockMonths.map((m) => (
                <th
                  key={`h-month-${m}`}
                  colSpan={2}
                  className="py-2 px-3 border-r professional-border font-bold text-center text-zinc-200 uppercase bg-zinc-900/80 font-mono"
                >
                  {m} 모의고사
                </th>
              ))}
            </tr>
            {/* 가로 두 번째 행 헤더: 이름, 백분위/등급 */}
            <tr className="bg-zinc-900/50 text-zinc-400 font-bold border-b professional-border text-[10px]">
              {mockMonths.map((m) => (
                <React.Fragment key={`h-sub-${m}`}>
                  <th className="py-1.5 px-2 border-r professional-border text-center bg-zinc-950/20 font-semibold text-zinc-400 w-24">
                    이름
                  </th>
                  <th className="py-1.5 px-2 border-r professional-border text-center bg-zinc-950/20 font-semibold text-zinc-400">
                    백분위/등급
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>

          {/* 테이블 바디 데이터 렌더링 */}
          <tbody>
            {Array.from({ length: maxRows }).map((_, rowIndex) => {
              const rank = rowIndex + 1;

              // 현재 행에 하이라이트할 학생이 한 명이라도 존재하는지 체크
              let hasSearchMatch = false;

              // 이 행에 상담중인 학생(또는 currentStudent)이 있는지 확인
              const isAnyCellCurrentUser = mockMonths.some((m) => {
                const item = monthlyRankings[m]?.[rowIndex];
                return item && currentStudent && item.id === currentStudent.id;
              });

              return (
                <tr
                  key={`rank-row-${rank}`}
                  className={`border-b professional-border transition-colors hover:bg-zinc-900/20 ${
                    isAnyCellCurrentUser ? 'bg-rose-500/5 shadow-inner' : ''
                  }`}
                >
                  {/* 석차 */}
                  <td className="py-2.5 px-1 bg-zinc-950/60 border-r professional-border font-mono font-bold text-zinc-300">
                    {rank}
                  </td>

                  {/* 각 월별 셀 데이터 */}
                  {mockMonths.map((month) => {
                    const item = monthlyRankings[month]?.[rowIndex];
                    const isCurrentUser = item && currentStudent && item.id === currentStudent.id;
                    const isSearchMatched =
                      item &&
                      searchQuery &&
                      item.name.toLowerCase().includes(searchQuery.toLowerCase());

                    if (isSearchMatched) {
                      hasSearchMatch = true;
                    }

                    return (
                      <React.Fragment key={`cell-${month}-${rank}`}>
                        {/* 이름 열 */}
                        <td
                          className={`py-2 px-2 border-r professional-border font-bold text-center transition-all ${
                            isCurrentUser
                              ? 'text-rose-400 bg-rose-500/10 font-black'
                              : isSearchMatched
                              ? 'bg-amber-500/20 text-amber-300 font-extrabold ring-1 ring-amber-500/50'
                              : 'text-zinc-300'
                          }`}
                        >
                          {item ? (
                            <div className="flex items-center justify-center gap-1">
                              <span>{item.name}</span>
                              <span className="text-[8px] font-mono font-normal opacity-60">
                                ({item.cls}반)
                              </span>
                              {isCurrentUser && (
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                              )}
                            </div>
                          ) : (
                            <span className="text-zinc-600">-</span>
                          )}
                        </td>

                        {/* 백분위 / 등급 열 */}
                        <td
                          className={`py-2 px-2 border-r professional-border text-center font-mono text-[10.5px] font-medium transition-all ${
                            isCurrentUser
                              ? 'text-rose-300 bg-rose-500/5'
                              : isSearchMatched
                              ? 'bg-amber-500/10 text-amber-200'
                              : 'text-zinc-400'
                          }`}
                        >
                          {item ? item.scoreDisplay : <span className="text-zinc-700">-</span>}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 4. 보조 안내 범례 정보 */}
      <div className="p-4 bg-zinc-900/40 rounded-xl border professional-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="font-bold text-zinc-300">상담 중인 학생 ({currentStudent?.name || '미선택'})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="font-bold text-zinc-300">검색 매칭 학생</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 font-mono font-bold">N% (M등급)</span>
            <span>백분위 및 전국 석차등급</span>
          </div>
        </div>
        <div className="text-[10px] text-zinc-500 font-medium">
          * 탐구과목 탭 선택 시 세부 선택과목별(ex. 생활과윤리, 물리학I 등) 독립적 석차가 완벽하게 개별 산출되어 표기됩니다.
        </div>
      </div>
    </div>
  );
}
