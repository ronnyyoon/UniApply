/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  TrendingUp, 
  Compass, 
  FileText
} from 'lucide-react';
import { Student } from '../types';

interface MockGradeViewerProps {
  student: Student;
  students?: Student[];
  primaryColor: string;
}

interface SubjectStats {
  grade: number;
  score: number | null;
  pct: number | null;
  subjName?: string;
}

// Helper to extract stats for any subject on any given month grade record
function getSubjectStats(monthGrade: any, field: string): SubjectStats | null {
  if (!monthGrade) return null;
  if (field === 'korean') {
    return { grade: monthGrade.korean, score: monthGrade.koreanScore, pct: monthGrade.koreanPercentile, subjName: '국어' };
  }
  if (field === 'math') {
    return { grade: monthGrade.math, score: monthGrade.mathScore, pct: monthGrade.mathPercentile, subjName: '수학' };
  }
  if (field === 'english') {
    return { grade: monthGrade.english, score: null, pct: null, subjName: '영어' };
  }
  if (field === 'history') {
    return { grade: monthGrade.history, score: null, pct: null, subjName: '한국사' };
  }
  
  // Custom exploration subject matches
  if (monthGrade.exploration1 === field) {
    return { grade: monthGrade.exploration1Grade, score: monthGrade.exploration1Score, pct: monthGrade.exploration1Percentile, subjName: field };
  }
  if (monthGrade.exploration2 === field) {
    return { grade: monthGrade.exploration2Grade, score: monthGrade.exploration2Score, pct: monthGrade.exploration2Percentile, subjName: field };
  }
  return null;
}

export default function MockGradeViewer({ student, students = [], primaryColor }: MockGradeViewerProps) {
  const [activeDateTab, setActiveDateTab] = useState<string>('5월');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // 모의고사 시행월 목록 (3월, 5월 + 추후 업로드될 6월, 7월, 9월, 10월)
  const mockMonths = ['3월', '5월', '6월', '7월', '9월', '10월'];

  // 선택된 달의 세부 성적 자료
  const activeMonthGrade = useMemo(() => {
    return student.mockGrades.find(mg => mg.date === activeDateTab) || student.mockGrades[0];
  }, [student, activeDateTab]);

  // 직전 모의평가 성적 찾기
  const prevMonthGrade = useMemo(() => {
    const currentIndex = mockMonths.indexOf(activeDateTab);
    if (currentIndex <= 0) return null;
    // 역순으로 데이터가 존재하는 직전 달 탐색 (점수 또는 등급이 0이 아닌 달)
    for (let i = currentIndex - 1; i >= 0; i--) {
      const prevMonth = mockMonths[i];
      const prevGrade = student.mockGrades.find(mg => mg.date === prevMonth);
      if (prevGrade && (prevGrade.koreanScore > 0 || prevGrade.mathScore > 0)) {
        return prevGrade;
      }
    }
    return null;
  }, [student, activeDateTab, mockMonths]);

  // 국수탐 국수영 평균 백분위/등급 산산 (실데이터가 있는 달만 요약에 연동)
  const summaryAverages = useMemo(() => {
    return student.mockGrades.map(mg => {
      const avgPercentile = mg.koreanPercentile > 0
        ? Math.round((mg.koreanPercentile + mg.mathPercentile + mg.exploration1Percentile + mg.exploration2Percentile) / 4)
        : 0;
      const avgGrade = mg.korean > 0
        ? Math.round(((mg.korean + mg.math + mg.exploration1Grade + mg.exploration2Grade) / 4) * 10) / 10
        : 0;
      return { month: mg.date, avgPercentile, avgGrade };
    });
  }, [student]);

  // 실시간 성적 추이용 SVG 포인트 계산 (데이터가 탑재된 달만 선으로 연결)
  const svgPointsAndLines = useMemo(() => {
    const width = 450;
    const height = 200;
    const paddingLeft = 45;
    const paddingRight = 45;
    const renderWidth = width - paddingLeft - paddingRight;
    const stepX = renderWidth / (mockMonths.length - 1);

    const points = summaryAverages.map((pt, idx) => {
      const x = paddingLeft + (idx * stepX);
      const y = 30 + ((100 - pt.avgPercentile) / 100) * 140;
      const possessesData = pt.avgPercentile > 0;
      return { x, y, month: pt.month, pct: pt.avgPercentile, grade: pt.avgGrade, possessesData };
    });

    const validPoints = points.filter(p => p.possessesData);
    const polylineExpr = validPoints.map(p => `${p.x},${p.y}`).join(' ');
    return { points, polylineExpr };
  }, [summaryAverages, mockMonths]);

  const [scoreRatios, setScoreRatios] = useState({
    korean: 20,
    math: 20,
    english: 20,
    exploration1: 20,
    exploration2: 20,
  });

  const [pctRatios, setPctRatios] = useState({
    korean: 20,
    math: 20,
    english: 20,
    exploration1: 20,
    exploration2: 20,
  });

  const handleScoreRatioChange = (key: keyof typeof scoreRatios, value: string) => {
    const num = parseFloat(value);
    setScoreRatios(prev => ({
      ...prev,
      [key]: isNaN(num) ? 0 : num,
    }));
  };

  const handlePctRatioChange = (key: keyof typeof pctRatios, value: string) => {
    const num = parseFloat(value);
    setPctRatios(prev => ({
      ...prev,
      [key]: isNaN(num) ? 0 : num,
    }));
  };

  // 1. 한국사를 제외한 상위 등급 합 분석
  const topGradesAnalysis = useMemo(() => {
    const targetGrade = activeMonthGrade && activeMonthGrade.korean > 0 
      ? activeMonthGrade 
      : (student.mockGrades.find(mg => mg.korean > 0) || student.mockGrades[0]);

    if (!targetGrade || targetGrade.korean === 0) {
      return null;
    }

    const candidates = [
      { name: '국어', grade: targetGrade.korean },
      { name: '수학', grade: targetGrade.math },
      { name: '영어', grade: targetGrade.english },
      { name: targetGrade.exploration1 || '탐구1', grade: targetGrade.exploration1Grade },
      { name: targetGrade.exploration2 || '탐구2', grade: targetGrade.exploration2Grade },
    ].filter(c => c.grade > 0 && c.grade <= 9);

    // Sort ascending (lower grade number is better)
    candidates.sort((a, b) => a.grade - b.grade);

    const result = {
      month: targetGrade.date,
      top1: { sum: 0, detailsStr: '' },
      top2: { sum: 0, detailsStr: '' },
      top3: { sum: 0, detailsStr: '' },
    };

    if (candidates.length >= 1) {
      result.top1.sum = candidates[0].grade;
      result.top1.detailsStr = `${candidates[0].name} (${candidates[0].grade}등급)`;
    }
    if (candidates.length >= 2) {
      result.top2.sum = candidates[0].grade + candidates[1].grade;
      result.top2.detailsStr = `${candidates[0].name}(${candidates[0].grade}등급) + ${candidates[1].name}(${candidates[1].grade}등급)`;
    } else if (candidates.length === 1) {
      result.top2.sum = candidates[0].grade;
      result.top2.detailsStr = `${candidates[0].name}(${candidates[0].grade}등급)`;
    }
    if (candidates.length >= 3) {
      result.top3.sum = candidates[0].grade + candidates[1].grade + candidates[2].grade;
      result.top3.detailsStr = `${candidates[0].name}(${candidates[0].grade}등급) + ${candidates[1].name}(${candidates[1].grade}등급) + ${candidates[2].name}(${candidates[2].grade}등급)`;
    } else {
      const sumVal = candidates.reduce((s, c) => s + c.grade, 0);
      const det = candidates.map(c => `${c.name}(${c.grade}등급)`).join(' + ');
      result.top3.sum = sumVal;
      result.top3.detailsStr = det;
    }

    return result;
  }, [student, activeMonthGrade]);

  // English absolute grade converters
  const getEnglishMapping = (grade: number) => {
    if (grade === 1) return { score: 140, pct: 96 };
    if (grade === 2) return { score: 130, pct: 89 };
    if (grade === 3) return { score: 115, pct: 77 };
    if (grade === 4) return { score: 100, pct: 60 };
    if (grade === 5) return { score: 85, pct: 40 };
    if (grade === 6) return { score: 70, pct: 23 };
    if (grade === 7) return { score: 55, pct: 11 };
    if (grade === 8) return { score: 40, pct: 4 };
    if (grade === 9) return { score: 25, pct: 1 };
    return { score: 0, pct: 0 };
  };

  // 2. 표준점수 전용 1000점 산출식
  const calculatedScoresOnly = useMemo(() => {
    const targetGrade = activeMonthGrade && activeMonthGrade.korean > 0 
      ? activeMonthGrade 
      : (student.mockGrades.find(mg => mg.korean > 0) || student.mockGrades[0]);

    if (!targetGrade || targetGrade.korean === 0) {
      return null;
    }

    const engMap = getEnglishMapping(targetGrade.english);

    const korW = scoreRatios.korean * 10;
    const matW = scoreRatios.math * 10;
    const engW = scoreRatios.english * 10;
    const exp1W = scoreRatios.exploration1 * 10;
    const exp2W = scoreRatios.exploration2 * 10;

    const rawData = {
      korean: { 
        name: '국어',
        subj: targetGrade.koreanSubj || (targetGrade.korean >= 5 ? '화법과작문' : '언어와매체'),
        score: targetGrade.koreanScore,
        ratio: scoreRatios.korean,
        weight: korW
      },
      math: { 
        name: '수학',
        subj: targetGrade.mathSubj || (targetGrade.math >= 6 ? '확률과통계' : '미적분'),
        score: targetGrade.mathScore,
        ratio: scoreRatios.math,
        weight: matW
      },
      english: { 
        name: '영어',
        subj: '절대평가',
        score: engMap.score,
        ratio: scoreRatios.english,
        weight: engW
      },
      exploration1: { 
        name: targetGrade.exploration1 || '탐구1',
        subj: targetGrade.exploration1 || '탐구1',
        score: targetGrade.exploration1Score,
        ratio: scoreRatios.exploration1,
        weight: exp1W
      },
      exploration2: { 
        name: targetGrade.exploration2 || '탐구2',
        subj: targetGrade.exploration2 || '탐구2',
        score: targetGrade.exploration2Score,
        ratio: scoreRatios.exploration2,
        weight: exp2W
      },
    };

    // Normalized standard points calculation
    const calcKorScore = rawData.korean.score > 0 ? (rawData.korean.score / 200) * korW : 0;
    const calcMatScore = rawData.math.score > 0 ? (rawData.math.score / 200) * matW : 0;
    const calcEngScore = rawData.english.score > 0 ? (rawData.english.score / 200) * engW : 0;
    const calcExp1Score = rawData.exploration1.score > 0 ? (rawData.exploration1.score / 100) * exp1W : 0;
    const calcExp2Score = rawData.exploration2.score > 0 ? (rawData.exploration2.score / 100) * exp2W : 0;

    const totalScoreCalc = calcKorScore + calcMatScore + calcEngScore + calcExp1Score + calcExp2Score;

    return {
      month: targetGrade.date,
      rawData,
      weightedVals: {
        korean: Math.round(calcKorScore * 10) / 10,
        math: Math.round(calcMatScore * 10) / 10,
        english: Math.round(calcEngScore * 10) / 10,
        exploration1: Math.round(calcExp1Score * 10) / 10,
        exploration2: Math.round(calcExp2Score * 10) / 10,
      },
      total: Math.round(totalScoreCalc * 10) / 10,
    };
  }, [student, activeMonthGrade, scoreRatios]);

  // 3. 백분위 점수 전용 1000점 산출식
  const calculatedPercentilesOnly = useMemo(() => {
    const targetGrade = activeMonthGrade && activeMonthGrade.korean > 0 
      ? activeMonthGrade 
      : (student.mockGrades.find(mg => mg.korean > 0) || student.mockGrades[0]);

    if (!targetGrade || targetGrade.korean === 0) {
      return null;
    }

    const engMap = getEnglishMapping(targetGrade.english);

    const korW = pctRatios.korean * 10;
    const matW = pctRatios.math * 10;
    const engW = pctRatios.english * 10;
    const exp1W = pctRatios.exploration1 * 10;
    const exp2W = pctRatios.exploration2 * 10;

    const rawData = {
      korean: { 
        name: '국어',
        subj: targetGrade.koreanSubj || (targetGrade.korean >= 5 ? '화법과작문' : '언어와매체'),
        pct: targetGrade.koreanPercentile,
        ratio: pctRatios.korean,
        weight: korW
      },
      math: { 
        name: '수학',
        subj: targetGrade.mathSubj || (targetGrade.math >= 6 ? '확률과통계' : '미적분'),
        pct: targetGrade.mathPercentile,
        ratio: pctRatios.math,
        weight: matW
      },
      english: { 
        name: '영어',
        subj: '절대평가',
        pct: engMap.pct,
        ratio: pctRatios.english,
        weight: engW
      },
      exploration1: { 
        name: targetGrade.exploration1 || '탐구1',
        subj: targetGrade.exploration1 || '탐구1',
        pct: targetGrade.exploration1Percentile,
        ratio: pctRatios.exploration1,
        weight: exp1W
      },
      exploration2: { 
        name: targetGrade.exploration2 || '탐구2',
        subj: targetGrade.exploration2 || '탐구2',
        pct: targetGrade.exploration2Percentile,
        ratio: pctRatios.exploration2,
        weight: exp2W
      },
    };

    // Normalized percentiles (percentile / 100 * weight)
    const calcKorPct = (rawData.korean.pct / 100) * korW;
    const calcMatPct = (rawData.math.pct / 100) * matW;
    const calcEngPct = (rawData.english.pct / 100) * engW;
    const calcExp1Pct = (rawData.exploration1.pct / 100) * exp1W;
    const calcExp2Pct = (rawData.exploration2.pct / 100) * exp2W;

    const totalPctCalc = calcKorPct + calcMatPct + calcEngPct + calcExp1Pct + calcExp2Pct;

    return {
      month: targetGrade.date,
      rawData,
      weightedVals: {
        korean: Math.round(calcKorPct * 10) / 10,
        math: Math.round(calcMatPct * 10) / 10,
        english: Math.round(calcEngPct * 10) / 10,
        exploration1: Math.round(calcExp1Pct * 10) / 10,
        exploration2: Math.round(calcExp2Pct * 10) / 10,
      },
      total: Math.round(totalPctCalc * 10) / 10,
    };
  }, [student, activeMonthGrade, pctRatios]);

  // 성적 등락 표시 컴포넌트 렌더러
  const renderValueAndDiff = (
    field: string,
    type: 'grade' | 'score' | 'percentile',
    currVal: number | null,
    prevVal: number | null,
    suffix: string = ''
  ) => {
    if (currVal === null || currVal === 0) {
      return (
        <div className="flex flex-col items-center justify-center font-mono text-zinc-500">
          <span>-</span>
        </div>
      );
    }

    const valueStr = `${currVal}${suffix}`;
    const showDiff = prevVal !== null && prevVal !== 0;
    let diffNode = null;

    if (showDiff) {
      const diff = currVal - prevVal;
      if (type === 'grade') {
        // 등급은 숫자가 낮아질수록 오른 것(상향)
        if (diff < 0) {
          diffNode = (
            <span className="text-[10px] font-black text-blue-500 font-mono flex items-center gap-0.5 mt-0.5 justify-center">
              ▲ {Math.abs(diff)}등급
            </span>
          );
        } else if (diff > 0) {
          diffNode = (
            <span className="text-[10px] font-black text-red-500 font-mono flex items-center gap-0.5 mt-0.5 justify-center">
              ▼ {diff}등급
            </span>
          );
        } else {
          diffNode = (
            <span className="text-[10px] text-zinc-600 font-mono flex items-center gap-0.5 mt-0.5 justify-center">
              -
            </span>
          );
        }
      } else {
        // 표준점수/백분위는 숫자가 올라갈수록 상향
        if (diff > 0) {
          diffNode = (
            <span className="text-[10px] font-black text-blue-500 font-mono flex items-center gap-0.5 mt-0.5 justify-end">
              ▲ {diff}{suffix}
            </span>
          );
        } else if (diff < 0) {
          diffNode = (
            <span className="text-[10px] font-black text-red-500 font-mono flex items-center gap-0.5 mt-0.5 justify-end">
              ▼ {Math.abs(diff)}{suffix}
            </span>
          );
        } else {
          diffNode = (
            <span className="text-[10px] text-zinc-600 font-mono flex items-center gap-0.5 mt-0.5 justify-end">
              -
            </span>
          );
        }
      }
    }

    if (type === 'grade') {
      return (
        <div className="flex flex-col items-center">
          <span className="font-mono text-yellow-500">{valueStr}</span>
          {diffNode}
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-end">
          <span className="font-mono text-zinc-300">{valueStr}</span>
          {diffNode}
        </div>
      );
    }
  };

  // 과목 클릭 시 historical trend를 가져오기 위한 Memo
  const subjectHistory = useMemo(() => {
    if (!selectedSubject) return [];
    return mockMonths.map(m => {
      const monthData = student.mockGrades.find(mg => mg.date === m);
      const stats = getSubjectStats(monthData, selectedSubject);
      return {
        month: m,
        stats,
      };
    });
  }, [student, selectedSubject, mockMonths]);

  // 개별 과목 입체분석 Modal 구현
  const renderSubjectModal = () => {
    if (!selectedSubject) return null;
    
    let displayTitle = selectedSubject;
    if (selectedSubject === 'korean') displayTitle = '국어';
    if (selectedSubject === 'math') displayTitle = '수학';
    if (selectedSubject === 'english') displayTitle = '영어';
    if (selectedSubject === 'history') displayTitle = '한국사';

    const chartPoints = subjectHistory
      .map((item, idx) => {
        if (!item.stats || item.stats.grade === 0) return null;
        const scoreVal = item.stats.score || 0;
        const pctVal = item.stats.pct || 0;
        const gradeVal = item.stats.grade || 0;
        return {
          month: item.month,
          idx,
          score: scoreVal,
          pct: pctVal,
          grade: gradeVal,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    const w = 500;
    const h = 250;
    const padL = 50;
    const padR = 50;
    const padT = 30;
    const padB = 40;
    const renderW = w - padL - padR;
    const renderH = h - padT - padB;
    const stepX = renderW / 5;

    const pointsAndPaths = chartPoints.map(p => {
      const x = padL + p.idx * stepX;
      const scoreNormalized = (p.score - 50) / 100;
      const yScore = padT + renderH - Math.max(0, Math.min(1, scoreNormalized)) * renderH;
      const pctNormalized = p.pct / 100;
      const yPct = padT + renderH - Math.max(0, Math.min(1, pctNormalized)) * renderH;
      const gradeNormalized = (9 - p.grade) / 8;
      const yGrade = padT + renderH - Math.max(0, Math.min(1, gradeNormalized)) * renderH;

      return { x, yScore, yPct, yGrade, ...p };
    });

    const isAbsoluteObj = selectedSubject === 'english' || selectedSubject === 'history';
    const scorePath = pointsAndPaths.map(p => `${p.x},${p.yScore}`).join(' ');
    const pctPath = pointsAndPaths.map(p => `${p.x},${p.yPct}`).join(' ');
    const gradePath = pointsAndPaths.map(p => `${p.x},${p.yGrade}`).join(' ');

    return (
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" id="subject-trend-modal">
        <div className="bg-[#0B0B0B] border professional-border max-w-2xl w-full rounded-2xl p-6 relative flex flex-col gap-6 text-white shadow-2xl">
          <button 
            onClick={() => setSelectedSubject(null)}
            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors cursor-pointer p-1.5 hover:bg-zinc-900 rounded-lg"
            id="close-modal-btn"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div>
            <h4 className="text-md font-extrabold tracking-tight flex items-center gap-2">
              <span className="py-0.5 px-2 bg-rose-500/10 text-rose-500 rounded border border-rose-500/20 text-xs font-bold font-mono">성적 입체분석</span>
              {displayTitle} 과목 연간 누적 성적 추이
            </h4>
            <p className="text-xs text-zinc-500 mt-1">
              3월, 5월 모평 실데이터 및 향후 탑재될 6월, 7월, 9월, 10월 모평의 성적 추적 그래프입니다.
            </p>
          </div>

          <div className="bg-[#050505] border professional-border rounded-xl p-4 flex flex-col items-center">
            {chartPoints.length > 0 ? (
              <div className="w-full h-48 select-none">
                <svg viewBox="0 0 500 250" className="w-full h-full overflow-visible">
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const y = padT + ratio * renderH;
                    return (
                      <g key={idx}>
                        <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="#1B1B1B" strokeDasharray="3,3" />
                      </g>
                    );
                  })}
                  
                  {mockMonths.map((m, idx) => {
                    const x = padL + idx * stepX;
                    return (
                      <text
                        key={`modal-lbl-${m}`}
                        x={x}
                        y={h - 15}
                        textAnchor="middle"
                        className="text-[9px] font-bold fill-zinc-500"
                      >
                        {m}
                      </text>
                    );
                  })}

                  {!isAbsoluteObj ? (
                    <>
                      <polyline fill="none" stroke="#EC4899" strokeWidth="2" points={pctPath} />
                      <polyline fill="none" stroke="#3B82F6" strokeWidth="2" points={scorePath} />

                      {pointsAndPaths.map(p => (
                        <g key={`dots-${p.month}`}>
                          <circle cx={p.x} cy={p.yPct} r="3.5" fill="#050505" stroke="#EC4899" strokeWidth="1.5" />
                          <text x={p.x + 8} y={p.yPct + 3} className="text-[8px] font-mono fill-pink-400 font-bold">{p.pct}%</text>

                          <circle cx={p.x} cy={p.yScore} r="3.5" fill="#050505" stroke="#3B82F6" strokeWidth="1.5" />
                          <text x={p.x - 8} y={p.yScore - 6} textAnchor="end" className="text-[8px] font-mono fill-blue-400 font-bold">{p.score}점</text>
                        </g>
                      ))}
                    </>
                  ) : (
                    <>
                      <polyline fill="none" stroke="#EAB308" strokeWidth="2" points={gradePath} />

                      {pointsAndPaths.map(p => (
                        <g key={`dots-absolute-${p.month}`}>
                          <circle cx={p.x} cy={p.yGrade} r="3.5" fill="#050505" stroke="#EAB308" strokeWidth="1.5" />
                          <text x={p.x} y={p.yGrade - 8} textAnchor="middle" className="text-[9px] font-mono fill-yellow-500 font-bold">{p.grade}등급</text>
                        </g>
                      ))}
                    </>
                  )}
                </svg>
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-500 text-xs">
                시행된 모의평가에서 해당 과목의 유효한 성적 이력이 존재하지 않습니다.
              </div>
            )}

            <div className="flex gap-4 items-center justify-center mt-2 text-[10px] font-bold">
              {!isAbsoluteObj ? (
                <>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <span className="text-zinc-400">전국 표준점수 (점)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                    <span className="text-zinc-400">전국 백분위 수 (%)</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                  <span className="text-zinc-400">수능 절대등급 (등급)</span>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto border professional-border rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b professional-border bg-[#0E0E0E] text-zinc-500 uppercase font-semibold text-[9px] tracking-wider">
                  <th className="py-2.5 px-4">시험시기</th>
                  <th className="py-2.5 px-4 text-center">선택 과목명</th>
                  <th className="py-2.5 px-4 text-center">등급</th>
                  <th className="py-2.5 px-4 text-right">전국 표준점수</th>
                  <th className="py-2.5 px-4 text-right">전국 백분위 수</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 font-semibold">
                {subjectHistory.map(item => {
                  const hasData = item.stats && item.stats.grade > 0;
                  return (
                    <tr 
                      key={item.month} 
                      className={`hover:bg-zinc-900/40 transition-colors ${
                        !hasData ? 'text-zinc-650' : 'text-zinc-300'
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-white">{item.month} 모평</td>
                      <td className="py-3 px-4 text-center font-mono">
                        {hasData ? (item.stats?.subjName || displayTitle) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {hasData ? (
                          <span className="font-mono text-yellow-500">{item.stats?.grade}등급</span>
                        ) : (
                          <span className="text-zinc-650 font-mono">- (미업로드)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {hasData ? (
                          item.stats?.score ? `${item.stats.score}점` : '-'
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {hasData ? (
                          item.stats?.pct ? `${item.stats.pct}%` : '-'
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="text-[10px] text-zinc-500 text-center leading-relaxed">
            * 6월, 7월, 9월, 10월 성적표는 시행 후 교육청/평가원의 정식 발표 주기에 맞춰 일괄 탑재될 예정입니다.
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="mock-grade-viewer-tab" className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)] animate-fade-in text-white font-medium">
      
      {/* 1. 상단 히어로 배너 */}
      <div className="professional-bg-card border professional-border rounded-xl p-6 relative overflow-hidden shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded-full uppercase tracking-wider">
              <Activity className="w-3" />
              모평 모의평가 추적보고
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="font-extrabold text-gold" style={{ color: primaryColor }}>{student.name}</span> 학생 수능 모의평가 분석
            </h2>
            <p className="text-xs text-zinc-400">
              고3 실시 한국교육과정평가원 주관 대학수학능력시험 모의평가 영역별 백분위, 표준점수, 상세 등급 추적 자료입니다.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[#0D0D0D] p-3 rounded-xl border professional-border shrink-0">
            <div className="text-center px-2">
              <div className="text-[10px] text-zinc-500 font-bold uppercase">국수영탐 평균등급</div>
              <div className="text-lg font-black text-rose-500 font-mono">
                {activeMonthGrade && activeMonthGrade.korean > 0 ? Math.round(((activeMonthGrade.korean + activeMonthGrade.math + activeMonthGrade.exploration1Grade + activeMonthGrade.exploration2Grade) / 4) * 10) / 10 : '-'} <span className="text-xs text-zinc-400">등급</span>
              </div>
            </div>
            <div className="w-px h-8 bg-[#222]"></div>
            <div className="text-center px-1.5">
              <div className="text-[10px] text-zinc-500 font-bold uppercase">전국 백분위합</div>
              <div className="text-sm font-bold text-white font-mono">
                {activeMonthGrade && activeMonthGrade.koreanPercentile > 0 ? activeMonthGrade.koreanPercentile + activeMonthGrade.mathPercentile + activeMonthGrade.exploration1Percentile + activeMonthGrade.exploration2Percentile : '-'} <span className="text-[10px] text-zinc-500 font-bold">/ 400</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 모의고사 종합 추이 (SVG 선형 차트) & 정시 포지셔닝 추천 가이드 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 상위 영역 등급합 분석 (4컬럼) */}
        <div className="lg:col-span-4 professional-bg-card border professional-border rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 uppercase">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              수능 최저 영역 등급 합산 분석 ({topGradesAnalysis?.month || activeMonthGrade?.date || '최근'} 모평 기준)
            </h3>
            <p className="text-[11px] text-zinc-500 mt-1">
              한국사를 제외한 5개 수능 영역(국어, 수학, 영어, 탐구1, 탐구2) 중 최상위 등급 과목을 자동 합산한 결과입니다.
            </p>
          </div>

          {topGradesAnalysis ? (
            <div className="space-y-3 my-2" id="top-grades-sum-container">
              {/* Top 1 */}
              <div className="p-3.5 bg-zinc-950/50 rounded-lg border border-zinc-900 flex items-center justify-between hover:border-emerald-500/20 transition-all">
                <div className="space-y-0.5 text-left">
                  <span className="text-[11px] font-bold text-zinc-400 block">상위 1개 영역 등급 합</span>
                  <span className="text-[10px] text-zinc-500 font-medium">반영 과목: {topGradesAnalysis.top1.detailsStr}</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold font-mono text-emerald-400">{topGradesAnalysis.top1.sum}</span>
                  <span className="text-xs text-zinc-400 font-bold ml-1">등급</span>
                </div>
              </div>

              {/* Top 2 */}
              <div className="p-3.5 bg-zinc-950/50 rounded-lg border border-zinc-900 flex items-center justify-between hover:border-blue-500/20 transition-all">
                <div className="space-y-0.5 text-left">
                  <span className="text-[11px] font-bold text-zinc-400 block">상위 2개 영역 등급 합</span>
                  <span className="text-[10px] text-zinc-500 font-medium">반영 과목: {topGradesAnalysis.top2.detailsStr}</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold font-mono text-blue-400">{topGradesAnalysis.top2.sum}</span>
                  <span className="text-xs text-zinc-400 font-bold ml-1">등급</span>
                </div>
              </div>

              {/* Top 3 */}
              <div className="p-3.5 bg-zinc-950/50 rounded-lg border border-zinc-900 flex items-center justify-between hover:border-purple-500/20 transition-all">
                <div className="space-y-0.5 text-left">
                  <span className="text-[11px] font-bold text-zinc-400 block">상위 3개 영역 등급 합</span>
                  <span className="text-[10px] text-zinc-500 font-medium">반영 과목: {topGradesAnalysis.top3.detailsStr}</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold font-mono text-purple-400">{topGradesAnalysis.top3.sum}</span>
                  <span className="text-xs text-zinc-400 font-bold ml-1">등급</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-zinc-500 text-xs">
              모의평가 성적 데이터가 존재하지 않습니다.
            </div>
          )}
        </div>

        {/* 표준점수 산출 (4컬럼) */}
        <div className="lg:col-span-4 professional-bg-card border professional-border rounded-xl p-5 space-y-3.5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 uppercase">
              <Compass className="w-4 h-4 text-[#EAB308]" />
              수능 표준점수 산출기 (1000점 기준)
            </h3>
            <p className="text-[11.5px] text-zinc-500 mt-1 leading-normal">
              최근 모평({calculatedScoresOnly?.month || activeMonthGrade?.date || '최근'} 모평) 기준이며 과목별 반영 비율로 환산 산정합니다.
            </p>
          </div>

          {calculatedScoresOnly ? (
            <div className="space-y-4 my-2">
              <div className="bg-[#050505] p-3 rounded-lg border border-zinc-900 space-y-3">
                <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 pb-1.5 border-b border-zinc-900">
                  <span>과목명 / 세부과목</span>
                  <div className="flex gap-8">
                    <span>표점</span>
                    <span>반영율 / 환산</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {([
                    { key: 'korean', label: '국어', colorClass: 'text-blue-400' },
                    { key: 'math', label: '수학', colorClass: 'text-rose-400' },
                    { key: 'english', label: '영어', colorClass: 'text-teal-400' },
                    { key: 'exploration1', label: '탐구1', colorClass: 'text-purple-400' },
                    { key: 'exploration2', label: '탐구2', colorClass: 'text-indigo-400' },
                  ] as const).map(({ key, label, colorClass }) => {
                    const data = calculatedScoresOnly.rawData[key];
                    const weightedVal = calculatedScoresOnly.weightedVals[key];
                    return (
                      <div key={key} className="flex justify-between items-center gap-2">
                        <div className="text-left">
                          <span className={`text-[11px] font-bold ${colorClass} block`}>{label}</span>
                          <span className="text-[9px] text-zinc-500 font-semibold truncate max-w-[100px] block" title={data.subj}>{data.subj}</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[11px] text-zinc-300 font-bold bg-[#111] px-1.5 py-0.5 rounded border border-zinc-850">
                            {data.score}점
                          </span>
                          <div className="flex items-center gap-1">
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={scoreRatios[key]}
                                onChange={(e) => handleScoreRatioChange(key, e.target.value)}
                                className="w-10 bg-zinc-900 border border-zinc-800 focus:border-yellow-500/50 focus:outline-none rounded text-center font-mono text-[11px] text-white p-0.5"
                              />
                              <span className="absolute right-0.5 top-0.5 text-[8px] text-zinc-500 font-bold pointer-events-none">%</span>
                            </div>
                            <span className="text-[10px] text-yellow-500 font-extrabold w-12 text-right">
                              {weightedVal}점
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 pt-2 border-t border-zinc-900 px-0.5">
                  <span>반영비 합산:</span>
                  <span className={`${scoreRatios.korean + scoreRatios.math + scoreRatios.english + scoreRatios.exploration1 + scoreRatios.exploration2 === 100 ? 'text-emerald-400' : 'text-yellow-500'}`}>
                    {scoreRatios.korean + scoreRatios.math + scoreRatios.english + scoreRatios.exploration1 + scoreRatios.exploration2}% ({ (scoreRatios.korean + scoreRatios.math + scoreRatios.english + scoreRatios.exploration1 + scoreRatios.exploration2) * 10 } / 1000점)
                  </span>
                </div>
              </div>

              {/* Total output */}
              <div className="p-3 bg-zinc-950/70 rounded-lg border border-zinc-900 text-center space-y-1">
                <span className="text-zinc-500 font-bold block text-[10px] uppercase">최종 환산 표준점수</span>
                <div className="font-extrabold text-[#EAB308] text-xl font-mono flex items-baseline justify-center gap-0.5">
                  <span>{calculatedScoresOnly.total}</span>
                  <span className="text-xs text-zinc-500 font-bold">/ 1000</span>
                </div>
                <span className="text-[9px] text-[#888] block leading-tight">
                  * 국수영 실득점 및 변표 환산식 누적합
                </span>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-zinc-500 text-xs">
              선택된 월별 모평 성적표에 산출할 유효한 표준점수가 존재하지 않습니다.
            </div>
          )}
        </div>

        {/* 백분위 산출 (4컬럼) */}
        <div className="lg:col-span-4 professional-bg-card border professional-border rounded-xl p-5 space-y-3.5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 uppercase">
              <Compass className="w-4 h-4 text-[#EF4444]" />
              수능 백분위 산출기 (1000점 기준)
            </h3>
            <p className="text-[11.5px] text-zinc-500 mt-1 leading-normal">
              최근 모평({calculatedPercentilesOnly?.month || activeMonthGrade?.date || '최근'} 모평) 기준이며 과목별 반영 비율로 백분위를 산정합니다.
            </p>
          </div>

          {calculatedPercentilesOnly ? (
            <div className="space-y-4 my-2">
              <div className="bg-[#050505] p-3 rounded-lg border border-zinc-900 space-y-3">
                <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 pb-1.5 border-b border-zinc-900">
                  <span>과목명 / 세부과목</span>
                  <div className="flex gap-8">
                    <span>백분율</span>
                    <span>반영율 / 환산</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {([
                    { key: 'korean', label: '국어', colorClass: 'text-blue-400' },
                    { key: 'math', label: '수학', colorClass: 'text-rose-400' },
                    { key: 'english', label: '영어', colorClass: 'text-teal-400' },
                    { key: 'exploration1', label: '탐구1', colorClass: 'text-purple-400' },
                    { key: 'exploration2', label: '탐구2', colorClass: 'text-indigo-400' },
                  ] as const).map(({ key, label, colorClass }) => {
                    const data = calculatedPercentilesOnly.rawData[key];
                    const weightedVal = calculatedPercentilesOnly.weightedVals[key];
                    return (
                      <div key={key} className="flex justify-between items-center gap-2">
                        <div className="text-left">
                          <span className={`text-[11px] font-bold ${colorClass} block`}>{label}</span>
                          <span className="text-[9px] text-zinc-500 font-semibold truncate max-w-[100px] block" title={data.subj}>{data.subj}</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[11px] text-zinc-300 font-bold bg-[#111] px-1.5 py-0.5 rounded border border-zinc-850">
                            {data.pct}%
                          </span>
                          <div className="flex items-center gap-1">
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={pctRatios[key]}
                                onChange={(e) => handlePctRatioChange(key, e.target.value)}
                                className="w-10 bg-zinc-900 border border-zinc-800 focus:border-pink-500/50 focus:outline-none rounded text-center font-mono text-[11px] text-white p-0.5"
                              />
                              <span className="absolute right-0.5 top-0.5 text-[8px] text-zinc-500 font-bold pointer-events-none">%</span>
                            </div>
                            <span className="text-[10px] text-pink-550 font-extrabold w-12 text-right">
                              {weightedVal}점
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 pt-2 border-t border-zinc-900 px-0.5">
                  <span>반영비 합산:</span>
                  <span className={`${pctRatios.korean + pctRatios.math + pctRatios.english + pctRatios.exploration1 + pctRatios.exploration2 === 100 ? 'text-emerald-400' : 'text-yellow-500'}`}>
                    {pctRatios.korean + pctRatios.math + pctRatios.english + pctRatios.exploration1 + pctRatios.exploration2}% ({ (pctRatios.korean + pctRatios.math + pctRatios.english + pctRatios.exploration1 + pctRatios.exploration2) * 10 } / 1000점)
                  </span>
                </div>
              </div>

              {/* Total output */}
              <div className="p-3 bg-zinc-950/70 rounded-lg border border-zinc-900 text-center space-y-1">
                <span className="text-zinc-500 font-bold block text-[10px] uppercase">최종 환산 백분위 점수</span>
                <div className="font-extrabold text-[#EF4444] text-xl font-mono flex items-baseline justify-center gap-0.5">
                  <span>{calculatedPercentilesOnly.total}</span>
                  <span className="text-xs text-zinc-500 font-bold">/ 1000</span>
                </div>
                <span className="text-[9px] text-[#888] block leading-tight">
                  * 백분위 반영비 기준 1000점 산출합
                </span>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-zinc-500 text-xs">
              선택된 월별 모평 성적표에 산출할 유효한 백분위가 존재하지 않습니다.
            </div>
          )}
        </div>

      </div>

      {/* 3. 모의고사 일자별 성적표 피드 */}
      <div className="professional-bg-card border professional-border rounded-xl p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b professional-border pb-3 animate-fade-in">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 uppercase">
              <FileText className="w-4 h-4 text-rose-500" />
              시험 시행 시기별 세부 성적 기록부
            </h3>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              💡 세부 과목명을 클릭하시면 전국 모평 누적 꺾은선 그래프와 이력을 실시간 입체분석 조회할 수 있습니다.
            </p>
          </div>

          {/* 시행일 탭 */}
          <div className="flex items-center gap-1.5">
            {mockMonths.map(m => (
              <button
                key={m}
                onClick={() => setActiveDateTab(m)}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  activeDateTab === m 
                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                {m} 모평
              </button>
            ))}
          </div>
        </div>

        {/* 선택한 달의 세부 성적 테이블 */}
        {activeMonthGrade && activeMonthGrade.korean > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b professional-border text-zinc-500 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-4">평가 과목</th>
                  <th className="py-3 px-4 text-center">등급</th>
                  <th className="py-3 px-4 text-right">전국 표준점수</th>
                  <th className="py-3 px-4 text-right">전국 백분위 수</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-semibold">
                
                {/* 국어 과목 */}
                <tr 
                  onClick={() => setSelectedSubject('korean')}
                  className="hover:bg-zinc-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 text-white font-bold flex items-center gap-1.5">
                    국어 ({activeMonthGrade.koreanSubj || (activeMonthGrade.korean >= 5 ? '화법과작문' : '언어와매체')})
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {renderValueAndDiff(
                      'korean', 
                      'grade', 
                      activeMonthGrade.korean, 
                      prevMonthGrade?.korean || null, 
                      '등급'
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {renderValueAndDiff(
                      'korean', 
                      'score', 
                      activeMonthGrade.koreanScore, 
                      prevMonthGrade?.koreanScore || null, 
                      '점'
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {renderValueAndDiff(
                      'korean', 
                      'percentile', 
                      activeMonthGrade.koreanPercentile, 
                      prevMonthGrade?.koreanPercentile || null, 
                      '%'
                    )}
                  </td>
                </tr>

                {/* 수학 과목 */}
                <tr 
                  onClick={() => setSelectedSubject('math')}
                  className="hover:bg-zinc-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 text-white font-bold flex items-center gap-1.5">
                    수학 ({activeMonthGrade.mathSubj || (activeMonthGrade.math >= 6 ? '확률과통계' : '미적분')})
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {renderValueAndDiff(
                      'math', 
                      'grade', 
                      activeMonthGrade.math, 
                      prevMonthGrade?.math || null, 
                      '등급'
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {renderValueAndDiff(
                      'math', 
                      'score', 
                      activeMonthGrade.mathScore, 
                      prevMonthGrade?.mathScore || null, 
                      '점'
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {renderValueAndDiff(
                      'math', 
                      'percentile', 
                      activeMonthGrade.mathPercentile, 
                      prevMonthGrade?.mathPercentile || null, 
                      '%'
                    )}
                  </td>
                </tr>

                {/* 영어 과목 (영어는 절대평가라 백분위, 표준점수가 없음) */}
                <tr 
                  onClick={() => setSelectedSubject('english')}
                  className="hover:bg-zinc-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 text-white font-bold">영어 (외국어 절대)</td>
                  <td className="py-3.5 px-4 text-center">
                    {renderValueAndDiff(
                      'english', 
                      'grade', 
                      activeMonthGrade.english, 
                      prevMonthGrade?.english || null, 
                      '등급'
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-zinc-500">- (절대평가)</td>
                  <td className="py-3.5 px-4 text-right font-mono text-zinc-500">-</td>
                </tr>

                {/* 한국사 과목 */}
                <tr 
                  onClick={() => setSelectedSubject('history')}
                  className="hover:bg-zinc-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 text-white font-bold">한국사 (절대)</td>
                  <td className="py-3.5 px-4 text-center">
                    {renderValueAndDiff(
                      'history', 
                      'grade', 
                      activeMonthGrade.history, 
                      prevMonthGrade?.history || null, 
                      '등급'
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-zinc-500">-</td>
                  <td className="py-3.5 px-4 text-right font-mono text-zinc-500">-</td>
                </tr>

                {/* 탐구 1 과목 */}
                {activeMonthGrade.exploration1 && (() => {
                  const sub1 = activeMonthGrade.exploration1;
                  const prevSub1Stats = getSubjectStats(prevMonthGrade, sub1);
                  return (
                    <tr 
                      onClick={() => setSelectedSubject(sub1)}
                      className="hover:bg-zinc-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 text-white font-bold">선택탐구 1: {sub1}</td>
                      <td className="py-3.5 px-4 text-center">
                        {renderValueAndDiff(
                          sub1, 
                          'grade', 
                          activeMonthGrade.exploration1Grade, 
                          prevSub1Stats?.grade || null, 
                          '등급'
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {renderValueAndDiff(
                          sub1, 
                          'score', 
                          activeMonthGrade.exploration1Score, 
                          prevSub1Stats?.score || null, 
                          '점'
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {renderValueAndDiff(
                          sub1, 
                          'percentile', 
                          activeMonthGrade.exploration1Percentile, 
                          prevSub1Stats?.pct || null, 
                          '%'
                        )}
                      </td>
                    </tr>
                  );
                })()}

                {/* 탐구 2 과목 */}
                {activeMonthGrade.exploration2 && (() => {
                  const sub2 = activeMonthGrade.exploration2;
                  const prevSub2Stats = getSubjectStats(prevMonthGrade, sub2);
                  return (
                    <tr 
                      onClick={() => setSelectedSubject(sub2)}
                      className="hover:bg-zinc-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 text-white font-bold">선택탐구 2: {sub2}</td>
                      <td className="py-3.5 px-4 text-center">
                        {renderValueAndDiff(
                          sub2, 
                          'grade', 
                          activeMonthGrade.exploration2Grade, 
                          prevSub2Stats?.grade || null, 
                          '등급'
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {renderValueAndDiff(
                          sub2, 
                          'score', 
                          activeMonthGrade.exploration2Score, 
                          prevSub2Stats?.score || null, 
                          '점'
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {renderValueAndDiff(
                          sub2, 
                          'percentile', 
                          activeMonthGrade.exploration2Percentile, 
                          prevSub2Stats?.pct || null, 
                          '%'
                        )}
                      </td>
                    </tr>
                  );
                })()}

              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-zinc-500 text-xs bg-zinc-950 rounded-xl border professional-border">
            {activeDateTab} 모의평가 성적 데이터는 아직 업로드 전입니다.
            <div className="text-[10px] text-zinc-600 mt-1">교육청/평가원의 발표 일정에 정식 탑재됩니다.</div>
          </div>
        )}
      </div>

      {/* 과목 상세 입체분석 누적 Modal Overlay */}
      {renderSubjectModal()}

    </div>
  );
}
