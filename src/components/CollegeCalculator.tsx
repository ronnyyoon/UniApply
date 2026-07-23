/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  ChevronRight, 
  HelpCircle,
  Eye,
  EyeOff,
  Database,
  WifiOff,
  Info,
  Users
} from 'lucide-react';
import { Student, UserSession } from '../types';
import { fetchCollegeStats, CollegeStat, seedCollegeStats, subscribeStudentSheet, saveStudentSheet } from '../lib/firebase';
import universityData from '../university_stats.json';

interface YearlyData {
  recruitCount: string;
  minGpa: string;
  maxGpa: string;
  avgGpa: string;
  stdDev: string;
  cut50: string;
  cut70: string;
  chuhapMin: string;
  chuhapNo: string;
  ratio: string;
  finalAvgGpa?: string;
}

interface SimRow {
  id: string;
  region: string;
  college: string;
  major: string;
  type: string;
  detailType: string;
  apply: 'O' | 'X';
  recruitCount: string;
  studentGpa: string;
  data2025: YearlyData;
  data2024: YearlyData;
  data2023: YearlyData;
}

// Compact helper to generate year statistics
function yData(rc: string, min: string, max: string, avg: string, sd: string, cut50: string, cut: string, chMin: string, chNo: string, rat: string, finalAvgGpa: string = ''): YearlyData {
  return { recruitCount: rc, minGpa: min, maxGpa: max, avgGpa: avg, stdDev: sd, cut50, cut70: cut, chuhapMin: chMin, chuhapNo: chNo, ratio: rat, finalAvgGpa };
}

// Helper function to create default blank rows
const createDefaultRows = (studentGpa: string = ""): SimRow[] => {
  return Array.from({ length: 5 }, (_, idx) => ({
    id: `row_${idx + 1}`,
    region: '',
    college: '',
    major: '',
    type: '학생부교과',
    detailType: '',
    apply: 'O',
    recruitCount: '',
    studentGpa,
    data2025: yData('', '', '', '', '', '', '', '', '', ''),
    data2024: yData('', '', '', '', '', '', '', '', '', ''),
    data2023: yData('', '', '', '', '', '', '', '', '', '')
  }));
};

// Helper statistical functions for Normdist
function erf(x: number): number {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}

function normdist(x: number, mean: number, stdDev: number): number {
  if (stdDev <= 0) return x >= mean ? 1.0 : 0.0;
  return 0.5 * (1.0 + erf((x - mean) / (stdDev * Math.sqrt(2))));
}

// Rule 10: ROUND(NORMDIST(학생성적, 평균, 표준편차, TRUE)*모집인원, 1)
function calculateEstimatedRank(studentGpaStr: string, avgGpaStr: string, stdDevStr: string, recruitCountStr: string): string {
  const gpa = parseFloat(studentGpaStr);
  const avg = parseFloat(avgGpaStr);
  const sd = parseFloat(stdDevStr);
  const rc = parseFloat(recruitCountStr);

  if (isNaN(gpa) || isNaN(avg) || isNaN(sd) || isNaN(rc) || sd <= 0) return '-';
  const p = normdist(gpa, avg, sd);
  let rank = Math.round((p * rc) * 10) / 10;
  if (rank > rc) {
    rank = rc;
  }
  return rank.toString();
}

// Rule 11: NORM.S.DIST(ROUND((학생성적-평균)/표준편차, 2))
function calculateGpaLocation(studentGpaStr: string, avgGpaStr: string, stdDevStr: string): '상위' | '중위' | '하위' | '-' {
  const gpa = parseFloat(studentGpaStr);
  const avg = parseFloat(avgGpaStr);
  const sd = parseFloat(stdDevStr);

  if (isNaN(gpa) || isNaN(avg) || isNaN(sd) || sd <= 0) return '-';
  const z = Math.round(((gpa - avg) / sd) * 100) / 100;
  const p = normdist(z, 0, 1);

  if (p >= 0.67) return '하위';
  if (p >= 0.34) return '중위';
  return '상위';
}

interface PositionResult {
  label: string;
  bgClass: string;
  textClass: string;
}

export function calculateMyPosition(
  type: string,
  studentGpaStr: string,
  maxStr: string,
  avgStr: string,
  cutStr: string,
  minStr: string
): PositionResult {
  const s = parseFloat(studentGpaStr);
  if (isNaN(s)) return { label: '-', bgClass: 'bg-slate-100', textClass: 'text-slate-500' };

  const max = parseFloat(maxStr);
  const avg = parseFloat(avgStr);
  const cut = parseFloat(cutStr);
  const min = parseFloat(minStr);

  const hasMax = !isNaN(max);
  const hasAvg = !isNaN(avg);
  const hasCut = !isNaN(cut);
  const hasMin = !isNaN(min);

  // If no average/stats populated yet
  if (!hasAvg) return { label: '-', bgClass: 'bg-slate-100', textClass: 'text-slate-500' };

  const COLORS = {
    '하향': { label: '하향', bgClass: 'bg-blue-100 border border-blue-200', textClass: 'text-blue-700 font-extrabold' },
    '안전': { label: '안전', bgClass: 'bg-emerald-100 border border-emerald-200', textClass: 'text-emerald-700 font-extrabold' },
    '소신': { label: '소신', bgClass: 'bg-amber-100 border border-amber-200', textClass: 'text-amber-700 font-extrabold' },
    '상향': { label: '상향', bgClass: 'bg-orange-100 border border-orange-200', textClass: 'text-orange-700 font-extrabold' },
    '과상': { label: '과상', bgClass: 'bg-red-100 border border-red-200', textClass: 'text-red-700 font-extrabold' },
  };

  if (type === '학생부교과') {
    // 최고성적 이상일 경우 '하향'
    if (hasMax && s <= max) return COLORS['하향'];
    // 최고성적보다 낮고, 평균 이상일 경우 '안전'
    if (hasMax && s > max && s <= avg) return COLORS['안전'];
    if (!hasMax && s <= avg) return COLORS['안전'];
    
    // 평균보다 낮고, 70% 이상일 경우 '소신'
    if (hasCut && s > avg && s <= cut) return COLORS['소신'];
    if (!hasCut && hasMin && s > avg && s <= min) return COLORS['소신'];

    // 70%보다 낮고, 최저 이상일 경우 '상향'
    if (hasCut && hasMin && s > cut && s <= min) return COLORS['상향'];
    if (!hasCut && hasMin && s <= min) return COLORS['상향'];

    // 최저보다 낮을 경우 '과상'
    if (hasMin && s > min) return COLORS['과상'];
    if (!hasMin && hasCut && s > cut) return COLORS['과상'];
    
    return COLORS['소신'];
  } else {
    // 최고성적 이상일 경우 '안전'
    if (hasMax && s <= max) return COLORS['안전'];
    // 최고성적보다 낮고, 평균 이상일 경우 '소신'
    if (hasMax && s > max && s <= avg) return COLORS['소신'];
    if (!hasMax && s <= avg) return COLORS['소신'];

    // 평균보다 낮고, 70% 이상일 경우 '상향'
    if (hasCut && s > avg && s <= cut) return COLORS['상향'];
    if (!hasCut && s > avg) return COLORS['상향'];

    // 70%보다 낮을 경우 '과상'
    if (hasCut && s > cut) return COLORS['과상'];
    
    return COLORS['소신'];
  }
}

// Rule 7: Analytical bounds calculations
function calculateAnalysis(
  type: string, 
  studentGpaStr: string, 
  maxStr: string, 
  avgStr: string, 
  minStr: string, 
  cutStr: string, 
  chuhapMinStr?: string
): string {
  return calculateMyPosition(type, studentGpaStr, maxStr, avgStr, cutStr, minStr).label;
}

const REGIONS = [
  '서울특별시', '부산광역시', '대구광역시', '대전광역시', '광주광역시', '인천광역시', 
  '울산광역시', '세종자치시', '경기도', '경상북도', '경상남도', '전라북도', '전라남도', 
  '충청북도', '충청남도', '강원도', '제주도'
];

const ADMISSION_TYPES = [
  '학생부종합', '학생부교과', '논술전형', '면접전형', '실기전형'
];

interface CollegeCalculatorProps {
  student: Student;
  primaryColor: string;
  session?: UserSession | null;
}

export default function CollegeCalculator({ student, primaryColor, session }: CollegeCalculatorProps) {
  // Store spreadsheets in React State mapped by student id
  const [studentSpreadsheets, setStudentSpreadsheets] = useState<Record<string, SimRow[]>>(() => {
    const saved = localStorage.getItem('ADMIT2027_COLLEGE_SHEETS_V2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  // Real-time sync metadata state
  const [lastSyncInfo, setLastSyncInfo] = useState<{ updatedAt?: string; updatedBy?: string } | null>(null);

  useEffect(() => {
    localStorage.setItem('ADMIT2027_COLLEGE_SHEETS_V2', JSON.stringify(studentSpreadsheets));
  }, [studentSpreadsheets]);

  // Firestore real-time listener for shared student calculation sheet (학생-교사 공동 영역 연동)
  useEffect(() => {
    if (!student || !student.id) return;

    const unsubscribe = subscribeStudentSheet(student.id, ({ rows, updatedAt, updatedBy }) => {
      setStudentSpreadsheets(prev => {
        const existing = prev[student.id];
        if (JSON.stringify(existing) === JSON.stringify(rows)) {
          return prev;
        }
        return {
          ...prev,
          [student.id]: rows
        };
      });
      if (updatedAt || updatedBy) {
        setLastSyncInfo({ updatedAt, updatedBy });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [student.id]);

  // Firestore stats state
  const [dbStats, setDbStats] = useState<CollegeStat[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsSource, setStatsSource] = useState<'firestore' | 'seed_data' | 'offline_fallback'>('firestore');
  const [isSeeding, setIsSeeding] = useState(false);

  const loadStats = () => {
    setIsLoadingStats(true);
    fetchCollegeStats().then(data => {
      setDbStats(data);
      setIsLoadingStats(false);
      if (data.length > 0) {
        const firstId = data[0].id;
        if (firstId.startsWith('seed_')) {
          setStatsSource('seed_data');
        } else if (firstId.startsWith('offline_')) {
          setStatsSource('offline_fallback');
        } else {
          setStatsSource('firestore');
        }
      }
    }).catch(err => {
      console.error(err);
      setIsLoadingStats(false);
      setStatsSource('offline_fallback');
    });
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleManualSeed = async () => {
    if (window.confirm('Firestore 데이터베이스를 기본 대학 입시 결과 3개년 통계 데이터셋(서울대, 연세대, 고려대, 성균관대 등 40개+ 핵심 전형)으로 강제 초기화 및 동기화하시겠습니까?')) {
      setIsSeeding(true);
      try {
        await seedCollegeStats();
        alert('Firestore 입시 통계 데이터베이스 구축 및 실시간 동기화에 성공했습니다!');
        loadStats();
      } catch (err: any) {
        console.error(err);
        alert(`Firestore 동기화 중 오류가 발생했습니다: ${err.message}\n(만약 프로젝트의 일일 무료 쓰기 쿼터량이 초과되었다면, 리셋 시간까지는 로컬 백업 모드로 정상 안전 연동됩니다.)`);
      } finally {
        setIsSeeding(false);
      }
    }
  };

  // Cascade Select helper calculations
  const getColleges = () => {
    return Array.from(new Set(dbStats.map(s => s.college))).sort();
  };

  const getMajors = (collegeName: string) => {
    if (!collegeName) return [];
    return Array.from(new Set(dbStats.filter(s => s.college === collegeName).map(s => s.major))).sort();
  };

  const getTypes = (collegeName: string, majorName: string) => {
    if (!collegeName || !majorName) return [];
    return Array.from(new Set(dbStats.filter(s => s.college === collegeName && s.major === majorName).map(s => s.type))).sort();
  };

  const getDetailTypes = (collegeName: string, majorName: string, typeName: string) => {
    if (!collegeName || !majorName || !typeName) return [];
    return Array.from(new Set(dbStats.filter(s => s.college === collegeName && s.major === majorName && s.type === typeName).map(s => s.detailType))).sort();
  };

  const handleCascadeChange = (rowId: string, level: 'college' | 'major' | 'type' | 'detailType', value: string) => {
    const updated = currentSheet.map(row => {
      if (row.id !== rowId) return row;
      const copy = { ...row };

      if (level === 'college') {
        copy.college = value;
        copy.major = '';
        copy.type = '';
        copy.detailType = '';
      } else if (level === 'major') {
        copy.major = value;
        copy.type = '';
        copy.detailType = '';
      } else if (level === 'type') {
        copy.type = value;
        copy.detailType = '';
      } else if (level === 'detailType') {
        copy.detailType = value;
        
        // Find matching statistics in our database
        const match = dbStats.find(s => 
          s.college === copy.college && 
          s.major === copy.major && 
          s.type === copy.type && 
          s.detailType === value
        );

        if (match) {
          copy.recruitCount = '';
          copy.data2025 = yData(
            match.recruitCount2026 || '',
            match.minGpa2026 || '',
            match.maxGpa2026 || '',
            '', // Keep empty for manual first-pass input
            match.stdDev2026 || '',
            match.cut50_2026 || '',
            match.cut70_2026 || '',
            match.chuhapMin2026 || '',
            match.chuhapNo2026 || '',
            match.ratio2026 || '',
            match.avgGpa2026 || '' // finalAvgGpa queried from DB
          );
          copy.data2024 = yData(
            match.recruitCount2025 || '',
            match.minGpa2025 || '',
            match.maxGpa2025 || '',
            '', // Keep empty for manual first-pass input
            match.stdDev2025 || '',
            match.cut50_2025 || '',
            match.cut70_2025 || '',
            match.chuhapMin2025 || '',
            match.chuhapNo2025 || '',
            match.ratio2025 || '',
            match.avgGpa2025 || '' // finalAvgGpa queried from DB
          );
          copy.data2023 = yData(
            match.recruitCount2024 || '',
            match.minGpa2024 || '',
            match.maxGpa2024 || '',
            '', // Keep empty for manual first-pass input
            match.stdDev2024 || '',
            match.cut50_2024 || '',
            match.cut70_2024 || '',
            match.chuhapMin2024 || '',
            match.chuhapNo2024 || '',
            match.ratio2024 || '',
            match.avgGpa2024 || '' // finalAvgGpa queried from DB
          );
        }
      }
      return copy;
    });
    updateCurrentSheet(updated);
  };
  
  // Year visibility toggles
  const [show2025, setShow2025] = useState(true);
  const [show2024, setShow2024] = useState(true);
  const [show2023, setShow2023] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [selectedMockMonth, setSelectedMockMonth] = useState<string>('3월');

  // State for the White-themed overlay showing 3-year statistical trends
  const [activeOverlayData, setActiveOverlayData] = useState<{
    rowId: string;
    college: string;
    major: string;
    type: string;
    detailType: string;
    stats2024: any;
    stats2025: any;
    stats2026: any;
  } | null>(null);

  // Helper functions for parsing and calculating trends
  const parseNum = (val: any): number | null => {
    if (val === undefined || val === null || val === "") return null;
    const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
    return isNaN(num) ? null : num;
  };

  const getWaitlistPct = (enrollment: any, waitlist: any): number | null => {
    const e = parseNum(enrollment);
    const w = parseNum(waitlist);
    if (e === null || w === null || e === 0) return null;
    return (w / e) * 100;
  };

  const getTrend = (v24Val: any, v25Val: any, v26Val: any, type: 'recruit' | 'ratio' | 'score' | 'waitlist'): { text: string; className: string } => {
    const v24 = parseNum(v24Val);
    const v25 = parseNum(v25Val);
    const v26 = parseNum(v26Val);

    // Trend requires all 3 years to have valid data
    if (v24 === null || v25 === null || v26 === null) {
      return { text: "", className: "" };
    }

    if (type === 'recruit' || type === 'waitlist') {
      if (v24 < v25 && v25 < v26) {
        return { text: "증가", className: "text-blue-600 font-extrabold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]" };
      }
      if (v24 > v25 && v25 > v26) {
        return { text: "감소", className: "text-red-600 font-extrabold bg-red-50 px-2 py-0.5 rounded border border-red-200 text-[11px]" };
      }
      if (v24 === v25 && v25 === v26) {
        return { text: "동일", className: "text-amber-600 font-extrabold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]" };
      }
    } else if (type === 'ratio') {
      if (v24 < v25 && v25 < v26) {
        return { text: "증가", className: "text-red-600 font-extrabold bg-red-50 px-2 py-0.5 rounded border border-red-200 text-[11px]" };
      }
      if (v24 > v25 && v25 > v26) {
        return { text: "감소", className: "text-blue-600 font-extrabold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]" };
      }
      if (v24 === v25 && v25 === v26) {
        return { text: "동일", className: "text-amber-600 font-extrabold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]" };
      }
    } else if (type === 'score') {
      // Small is better = 상승 (red)
      // Large is worse = 하락 (blue)
      if (v24 > v25 && v25 > v26) {
        return { text: "상승", className: "text-red-600 font-extrabold bg-red-50 px-2 py-0.5 rounded border border-red-200 text-[11px]" };
      }
      if (v24 < v25 && v25 < v26) {
        return { text: "하락", className: "text-blue-600 font-extrabold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]" };
      }
      if (v24 === v25 && v25 === v26) {
        return { text: "동일", className: "text-amber-600 font-extrabold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]" };
      }
    }

    return { text: "", className: "" };
  };

  const formatWaitlist = (enrollment: any, waitlist: any) => {
    const e = parseNum(enrollment);
    const w = parseNum(waitlist);
    if (w === null) return "-";
    if (e === null || e === 0) return `${w}명`;
    const pct = Math.round((w / e) * 100);
    return `${w}명 (${pct}%)`;
  };

  const handleRowIndexClick = (row: SimRow) => {
    if (!row.college || !row.major || !row.type || !row.detailType) {
      alert("일치하는 자료가 없습니다.");
      return;
    }

    const match = (universityData as any[]).find((data: any) => {
      const uName = data.universityName || data.college || "";
      const dName = data.departmentName || data.major || "";
      const aType = data.admissionType || data.type || "";
      const detType = data.detailedType || data.detailType || "";
      return (
        uName.trim() === row.college.trim() &&
        dName.trim() === row.major.trim() &&
        aType.trim() === row.type.trim() &&
        detType.trim() === row.detailType.trim()
      );
    });

    const statsObj = match ? (match.stats || {}) : {};
    const stats2024 = statsObj['2024'] || {};
    const stats2025 = statsObj['2025'] || {};
    const stats2026 = statsObj['2026'] || {};

    setActiveOverlayData({
      rowId: row.id,
      college: row.college,
      major: row.major,
      type: row.type,
      detailType: row.detailType,
      stats2024,
      stats2025,
      stats2026
    });
  };

  // Initialize or fetch sheet for current student
  const currentSheet = useMemo(() => {
    if (!studentSpreadsheets[student.id]) {
      // Lazy load standard template with 5 default blank rows pre-populated with student's personal GPA
      return createDefaultRows(student.gpa.toString());
    }
    return studentSpreadsheets[student.id];
  }, [studentSpreadsheets, student.id, student.gpa]);

  // Update master state helper and sync to shared Firestore database
  const updateCurrentSheet = (newSheet: SimRow[]) => {
    setStudentSpreadsheets(prev => {
      const updatedMap = {
        ...prev,
        [student.id]: newSheet
      };
      localStorage.setItem('ADMIT2027_COLLEGE_SHEETS_V2', JSON.stringify(updatedMap));
      return updatedMap;
    });

    const updaterName = session ? `${session.name} (${session.role === 'teacher' ? '교사' : session.role === 'student' ? '학생' : '관리자'})` : '사용자';
    saveStudentSheet(student.id, newSheet, updaterName).catch(err => {
      console.error('Firestore 공동 영역 저장 실패:', err);
    });
  };

  const handleModalValueChange = (year: '2023' | '2024' | '2025', field: keyof YearlyData, value: string) => {
    if (!activeOverlayData) return;
    const targetYearKey = year === '2023' ? 'data2023' : year === '2024' ? 'data2024' : 'data2025';
    
    const updatedSheet = currentSheet.map(row => {
      if (row.id !== activeOverlayData.rowId) return row;
      return {
        ...row,
        [targetYearKey]: {
          ...row[targetYearKey],
          [field]: value
        }
      };
    });
    updateCurrentSheet(updatedSheet);
  };

  const handleCellChange = (rowId: string, path: string[], value: any) => {
    const updated = currentSheet.map(row => {
      if (row.id !== rowId) return row;
      const copy = { ...row };
      if (path.length === 1) {
        (copy as any)[path[0]] = value;
      } else if (path.length === 2) {
        const sub = { ...(copy as any)[path[0]] };
        sub[path[1]] = value;
        (copy as any)[path[0]] = sub;
      }
      return copy;
    });
    updateCurrentSheet(updated);
  };

  const handleAddRow = () => {
    const nextId = 'custom_' + Date.now();
    const newRow: SimRow = {
      id: nextId,
      region: '',
      college: '',
      major: '',
      type: '학생부교과',
      detailType: '',
      apply: 'O',
      recruitCount: '',
      studentGpa: student.gpa.toString(),
      data2025: yData('', '', '', '', '', '', '', '', '', ''),
      data2024: yData('', '', '', '', '', '', '', '', '', ''),
      data2023: yData('', '', '', '', '', '', '', '', '', '')
    };
    updateCurrentSheet([...currentSheet, newRow]);
  };

  const handleDeleteRow = (rowId: string) => {
    updateCurrentSheet(currentSheet.filter(row => row.id !== rowId));
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const executeReset = () => {
    // Reset to exactly 5 empty rows with empty studentGpa
    const reseted = createDefaultRows("");
    updateCurrentSheet(reseted);
    setShowResetConfirm(false);
  };

  // Rule 5 + 7 + 10 + 11: Real-time values generator helper
  const processedRows = useMemo(() => {
    return currentSheet.map((row, idx) => {
      const avg2025 = row.data2025.avgGpa || row.data2025.finalAvgGpa || '';
      const avg2024 = row.data2024.avgGpa || row.data2024.finalAvgGpa || '';
      const avg2023 = row.data2023.avgGpa || row.data2023.finalAvgGpa || '';

      const gpaLoc2025 = calculateGpaLocation(row.studentGpa, avg2025, row.data2025.stdDev);
      const estRank2025 = calculateEstimatedRank(row.studentGpa, avg2025, row.data2025.stdDev, row.data2025.recruitCount);
      
      const gpaLoc2024 = calculateGpaLocation(row.studentGpa, avg2024, row.data2024.stdDev);
      const estRank2024 = calculateEstimatedRank(row.studentGpa, avg2024, row.data2024.stdDev, row.data2024.recruitCount);

      const gpaLoc2023 = calculateGpaLocation(row.studentGpa, avg2023, row.data2023.stdDev);
      const estRank2023 = calculateEstimatedRank(row.studentGpa, avg2023, row.data2023.stdDev, row.data2023.recruitCount);

      const anal2025 = calculateAnalysis(row.type, row.studentGpa, row.data2025.maxGpa, avg2025, row.data2025.minGpa, row.data2025.cut70, row.data2025.chuhapMin);
      const anal2024 = calculateAnalysis(row.type, row.studentGpa, row.data2024.maxGpa, avg2024, row.data2024.minGpa, row.data2024.cut70, row.data2024.chuhapMin);
      const anal2023 = calculateAnalysis(row.type, row.studentGpa, row.data2023.maxGpa, avg2023, row.data2023.minGpa, row.data2023.cut70, row.data2023.chuhapMin);

      return {
        ...row,
        index: idx + 1,
        estRank2025,
        gpaLoc2025,
        anal2025,
        estRank2024,
        gpaLoc2024,
        anal2024,
        estRank2023,
        gpaLoc2023,
        anal2023,
      };
    });
  }, [currentSheet]);

  // Computed 수능 최저 영역 등급 합산 분석 for 3월, 5월, 6월, 7월, 9월
  const computedMockAnalysis = useMemo(() => {
    const analMonths = ['3월', '5월', '6월', '7월', '9월'];
    return analMonths.map(month => {
      const record = student.mockGrades.find(mg => mg.date === month);
      
      if (!record || !record.korean || record.korean <= 0) {
        return {
          month,
          top1: { sum: '-등급', subjects: '미실시' },
          top2: { sum: '-등급', subjects: '미실시' },
          top3: { sum: '-등급', subjects: '미실시' }
        };
      }

      const subjects = [
        { name: '국어', grade: record.korean },
        { name: '수학', grade: record.math },
        { name: '영어', grade: record.english },
        { name: record.exploration1 || '탐구1', grade: record.exploration1Grade },
        { name: record.exploration2 || '탐구2', grade: record.exploration2Grade }
      ].filter(sub => sub.grade > 0 && sub.grade <= 9);

      if (subjects.length === 0) {
        return {
          month,
          top1: { sum: '-등급', subjects: '미실시' },
          top2: { sum: '-등급', subjects: '미실시' },
          top3: { sum: '-등급', subjects: '미실시' }
        };
      }

      // Sort by grade ascending (lower is better, e.g. 1등급 is better than 2등급)
      const sorted = [...subjects].sort((a, b) => a.grade - b.grade);

      // Top 1
      const top1Sum = sorted[0].grade;
      const top1Subjs = sorted[0].name;

      // Top 2
      let top2Sum = '-';
      let top2Subjs = '미실시';
      if (sorted.length >= 2) {
        top2Sum = (sorted[0].grade + sorted[1].grade).toString();
        top2Subjs = `${sorted[0].name}, ${sorted[1].name}`;
      } else if (sorted.length === 1) {
        top2Sum = sorted[0].grade.toString();
        top2Subjs = sorted[0].name;
      }

      // Top 3
      let top3Sum = '-';
      let top3Subjs = '미실시';
      if (sorted.length >= 3) {
        top3Sum = (sorted[0].grade + sorted[1].grade + sorted[2].grade).toString();
        top3Subjs = `${sorted[0].name}, ${sorted[1].name}, ${sorted[2].name}`;
      } else if (sorted.length > 0) {
        const sumVal = sorted.reduce((sum, s) => sum + s.grade, 0);
        const subjsVal = sorted.map(s => s.name).join(', ');
        top3Sum = sumVal.toString();
        top3Subjs = subjsVal;
      }

      return {
        month,
        top1: { sum: `${top1Sum}등급`, subjects: top1Subjs },
        top2: { sum: top2Sum !== '-' ? `${top2Sum}등급` : '-등급', subjects: top2Subjs },
        top3: { sum: top3Sum !== '-' ? `${top3Sum}등급` : '-등급', subjects: top3Subjs }
      };
    });
  }, [student]);

  const getAnalysisBadgeColor = (val: string) => {
    switch (val) {
      case '과하': return 'bg-blue-900 border border-blue-500 text-blue-200';
      case '하향': return 'bg-sky-950 border border-sky-600 text-sky-400';
      case '안전': return 'bg-emerald-950 border border-emerald-600 text-emerald-400';
      case '소신': return 'bg-amber-950 border border-amber-600 text-amber-400';
      case '상향': return 'bg-orange-950 border border-orange-600 text-orange-400';
      case '과상': return 'bg-rose-950 border border-rose-600 text-rose-400';
      default: return 'bg-zinc-900/60 text-zinc-500 border border-zinc-800';
    }
  };

  return (
    <div id="print-section" className="p-4 space-y-5 overflow-y-auto max-h-[calc(100vh-4rem)] print:max-h-none print:overflow-visible print:p-0 print:m-0 animate-fade-in text-white text-[12px]">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          html, body, #app-root-container, #app-root-container div, main, #print-section {
            overflow: visible !important;
            height: auto !important;
            max-height: none !important;
            min-height: 0 !important;
            flex: none !important;
            display: block !important;
            position: static !important;
          }
          body {
            background-color: #0b0b0c !important;
            color: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, footer, nav, aside, .no-print, [role="navigation"] {
            display: none !important;
          }
          #print-section {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 10mm !important;
            background-color: #0b0b0c !important;
          }
          @page {
            size: B4 landscape;
            margin: 0 !important;
          }
          .overflow-x-auto {
            overflow: visible !important;
            overflow-x: visible !important;
          }
        }
      `}} />
      
      {/* Upper Title Section */}
      <div className="bg-zinc-900/80 border professional-border rounded-xl p-5 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-5 shadow-lg">
        <div className="space-y-1.5 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded-full uppercase tracking-wider">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            2027학년도 희망대학 모의산출 보드
          </span>
          <h2 className="text-lg font-extrabold text-white leading-tight">
            <span className="text-yellow-500">{student.name}</span> 학생 희망대학 모의대응 상담 플랫폼
          </h2>
          <p className="text-[11px] text-zinc-400 leading-relaxed max-w-3xl">
            한국대학교육협의회 전국수시 배치 지침과 동일하게 구성한 통합 시뮬레이터입니다. 각 년도별 최저, 최고, 평균, 표준편차 값을 직접 갱신하여 고등학교 교량 환산 등수와 내신 위치 판정을 즉석에서 연쇄 연산할 수 있습니다.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-sky-950/40 border border-sky-500/30 px-3 py-1.5 rounded-lg">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
              <span className="text-[10px] font-bold text-sky-400 font-sans flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                학생·교사 실시간 공동 공유 영역 작동 중
                {lastSyncInfo?.updatedBy && (
                  <span className="text-zinc-400 font-normal">
                    (최종 작성: <strong className="text-sky-300 font-bold">{lastSyncInfo.updatedBy}</strong>
                    {lastSyncInfo.updatedAt && ` - ${new Date(lastSyncInfo.updatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`})
                  </span>
                )}
              </span>
            </div>

            {statsSource === 'firestore' && (
              <div className="flex items-center gap-2 bg-emerald-950/25 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold text-emerald-400 font-sans flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  Firebase Firestore 원격 DB 연동 활성화 ({dbStats.length}개 전형 정보 실시간 연동됨)
                </span>
              </div>
            )}

            {statsSource === 'seed_data' && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 bg-amber-950/25 border border-amber-500/30 px-3 py-1.5 rounded-lg">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-amber-400 font-sans flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                    로컬 입시 통계 엔진 작동 중 ({dbStats.length}개 기본 데이터셋 탑재 완료 · 원격 DB 비어있음)
                  </span>
                </div>
                <button
                  disabled={isSeeding}
                  onClick={handleManualSeed}
                  className="px-2.5 py-1 text-[10px] font-black bg-amber-600 hover:bg-amber-500 border border-amber-400 text-white rounded transition-all cursor-pointer shadow disabled:opacity-50 no-print"
                >
                  {isSeeding ? 'Firestore 초기 구축 중...' : '원격 DB에 초기 통계 데이터 구축하기'}
                </button>
              </div>
            )}

            {statsSource === 'offline_fallback' && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 bg-zinc-800/80 border border-zinc-700/80 px-3 py-1.5 rounded-lg">
                  <span className="text-[10px] font-bold text-zinc-400 font-sans flex items-center gap-1">
                    <WifiOff className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                    오프라인 백업 엔진 작동 중 ({dbStats.length}개 대학 데이터 로드됨 · Firestore 쿼터 제한 또는 오프라인 상태)
                  </span>
                </div>
                <button
                  disabled={isSeeding}
                  onClick={handleManualSeed}
                  className="px-2.5 py-1 text-[10px] font-black bg-zinc-700 hover:bg-zinc-600 border border-zinc-500 text-zinc-300 rounded transition-all cursor-pointer shadow disabled:opacity-50 no-print"
                >
                  {isSeeding ? 'DB 동기화 진행 중...' : '원격 DB 강제 동기화 시도'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 no-print">
          <button 
            onClick={handleAddRow}
            className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-600 border border-emerald-500 text-xs font-black text-white rounded-lg flex items-center gap-1.5 transition-all text-center cursor-pointer shadow-md shadow-emerald-500/5"
          >
            <Plus className="w-4 h-4" />
            지망 희망 대학 추가
          </button>
          
          <button 
            onClick={() => window.print()}
            className="px-3.5 py-2.5 bg-sky-700 hover:bg-sky-600 border border-sky-500 text-xs font-black text-white rounded-lg flex items-center gap-1.5 transition-all text-center cursor-pointer shadow-md shadow-sky-500/5"
            title="B4 사이즈 및 가로 방향 출력/PDF 다운로드"
          >
            <FileSpreadsheet className="w-4 h-4" />
            PDF 다운로드 (B4)
          </button>

          <button 
            onClick={handleReset}
            className="px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-zinc-300 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            title="모든 배치 원본으로 리셋"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            초기화
          </button>
        </div>
      </div>

      {/* Grid: 1. 전형별 지원현황 Dashboard + 2. 명세범례 */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch no-print">
        
        {/* Left Side: 수능 최저 영역 등급 합산 분석 (Tabbed Interface) */}
        <div className="xl:col-span-7 bg-zinc-900/50 border professional-border rounded-xl p-4 space-y-4 shadow-xl flex flex-col justify-between text-[11px] relative overflow-hidden min-h-[420px]">
          <div className="space-y-3">
            {/* Elegant Header */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-blue-500 animate-pulse inline-block shadow-sm shadow-blue-500/50"></span>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  수능 최저 영역 등급 합산 분석
                </h3>
              </div>
              <span className="text-[9.5px] font-black tracking-tight text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 uppercase">
                실시간 등급 합산
              </span>
            </div>

            {/* Stylish Months Selection Tab Bar */}
            <div className="grid grid-cols-5 gap-1 p-1 bg-zinc-950/80 rounded-lg border border-zinc-850/80">
              {['3월', '5월', '6월', '7월', '9월'].map((month) => {
                const isSelected = selectedMockMonth === month;
                const hasRecord = student.mockGrades.some(
                  (mg) => mg.date === month && mg.korean && mg.korean > 0
                );
                return (
                  <button
                    key={month}
                    type="button"
                    onClick={() => setSelectedMockMonth(month)}
                    className={`relative py-2 text-[11px] font-black rounded transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/10'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                    }`}
                  >
                    <span>{month}</span>
                    {hasRecord && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Styled Table Block */}
            <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950/30">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-zinc-900/60 text-zinc-400 font-bold border-b border-zinc-800 text-center select-none">
                    <th className="py-2.5 px-3 text-left w-2/5">최저 영역 기준</th>
                    <th className="py-2.5 px-2.5 w-1/5">모평 시기</th>
                    <th className="py-2.5 px-2.5 w-1/5">등급합</th>
                    <th className="py-2.5 px-3 text-left pl-4">반영과목 조합</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/60">
                  {([
                    { key: 'top1', label: '상위 1개 영역 등급 합' },
                    { key: 'top2', label: '상위 2개 영역 등급 합' },
                    { key: 'top3', label: '상위 3개 영역 등급 합' }
                  ] as const).map((crit) => {
                    const monthData = computedMockAnalysis.find(m => m.month === selectedMockMonth);
                    const info = monthData ? monthData[crit.key] : { sum: '-등급', subjects: '미실시' };
                    const isNoExam = info.sum === '-등급' || info.subjects === '미실시';

                    return (
                      <tr key={crit.key} className="hover:bg-zinc-900/40 text-zinc-300 transition-colors">
                        <td className="py-3 px-3 font-extrabold text-zinc-200 select-none flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            crit.key === 'top1' ? 'bg-indigo-500' :
                            crit.key === 'top2' ? 'bg-blue-500' : 'bg-cyan-500'
                          }`} />
                          {crit.label}
                        </td>
                        <td className="py-3 px-2.5 text-center text-zinc-400 select-none font-semibold">
                          {selectedMockMonth}
                        </td>
                        <td className="py-3 px-2.5 text-center">
                          {isNoExam ? (
                            <span className="text-zinc-600 font-bold text-[10.5px] bg-zinc-950/40 px-2 py-0.5 rounded border border-zinc-850">
                              -등급
                            </span>
                          ) : (
                            <span className="text-yellow-400 font-black text-[11.5px] bg-yellow-500/10 px-2.5 py-0.5 rounded border border-yellow-500/20 font-mono shadow-sm">
                              {info.sum}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-left pl-4 font-bold">
                          {isNoExam ? (
                            <span className="text-zinc-600 font-semibold text-[10.5px] bg-zinc-950/20 px-2 py-0.5 rounded border border-zinc-900">
                              미실시
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {info.subjects.split(', ').map((sub, sidx) => (
                                <span key={sidx} className="bg-zinc-850 text-zinc-300 px-2 py-0.5 rounded text-[10px] font-black border border-zinc-800">
                                  {sub}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Help Banner at the bottom empty space of the left column */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 flex items-center gap-2 mt-auto select-none no-print">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-zinc-300 text-[11px] font-bold leading-normal">
              연번을 누르면 3개년 대학 입시 통계 상세자료를 확인할 수 있습니다.
            </span>
          </div>

          {/* White-themed elegant statistical overlay */}
          {activeOverlayData && (
            <div className="absolute inset-0 bg-white z-20 flex flex-col p-3 md:p-4 text-slate-800 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto">
              <div className="flex flex-col h-full space-y-2.5">
                {(() => {
                  const targetRow = processedRows.find(r => r.id === activeOverlayData.rowId);
                  if (!targetRow) return <div className="text-slate-500 font-bold p-4">데이터를 찾을 수 없습니다.</div>;

                  const finalAvg24 = targetRow.data2023.finalAvgGpa !== undefined ? targetRow.data2023.finalAvgGpa : (activeOverlayData.stats2024?.average || '');
                  const finalAvg25 = targetRow.data2024.finalAvgGpa !== undefined ? targetRow.data2024.finalAvgGpa : (activeOverlayData.stats2025?.average || '');
                  const finalAvg26 = targetRow.data2025.finalAvgGpa !== undefined ? targetRow.data2025.finalAvgGpa : (activeOverlayData.stats2026?.average || '');

                  const pos24 = calculateMyPosition(targetRow.type, targetRow.studentGpa, targetRow.data2023.maxGpa, finalAvg24, targetRow.data2023.cut70, targetRow.data2023.minGpa);
                  const pos25 = calculateMyPosition(targetRow.type, targetRow.studentGpa, targetRow.data2024.maxGpa, finalAvg25, targetRow.data2024.cut70, targetRow.data2024.minGpa);
                  const pos26 = calculateMyPosition(targetRow.type, targetRow.studentGpa, targetRow.data2025.maxGpa, finalAvg26, targetRow.data2025.cut70, targetRow.data2025.minGpa);

                  return (
                    <div>
                      {/* Overlay Title & Close Button */}
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 mb-2.5 shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block animate-pulse"></span>
                          <h3 className="text-[11px] md:text-xs font-black text-slate-900 tracking-wider">
                            3개년 대학 입시 통계 상세자료 (사용자 직접 수정 가능)
                          </h3>
                        </div>
                        <button 
                          onClick={() => setActiveOverlayData(null)}
                          className="px-2 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer select-none"
                        >
                          닫기 (X)
                        </button>
                      </div>

                      {/* Header Details Table - Reorganized to show Student Grade below Student Grade label */}
                      <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 mb-2.5 shadow-sm text-[11px] md:text-xs">
                        <table className="w-full text-center border-collapse">
                          <thead>
                            <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 font-extrabold text-[10px] md:text-[11px]">
                              <th className="w-[20%] py-1 border-r border-slate-200 select-none">대학</th>
                              <th className="w-[20%] py-1 border-r border-slate-200 select-none">모집단위</th>
                              <th className="w-[20%] py-1 border-r border-slate-200 select-none">전형유형</th>
                              <th className="w-[25%] py-1 border-r border-slate-200 select-none">세부전형</th>
                              <th className="w-[15%] py-1 bg-amber-100 text-amber-800 font-black select-none">학생 성적</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="font-bold text-slate-900 bg-white">
                              <td className="py-1.5 border-r border-slate-200 px-2 text-center font-black">{activeOverlayData.college}</td>
                              <td className="py-1.5 border-r border-slate-200 px-2 text-center font-black">{activeOverlayData.major}</td>
                              <td className="py-1.5 border-r border-slate-200 px-2 text-center text-indigo-600 text-[11px]">{activeOverlayData.type}</td>
                              <td className="py-1.5 border-r border-slate-200 px-2 text-center text-slate-700 text-[11px]">{activeOverlayData.detailType}</td>
                              <td className="py-1.5 text-center px-2 font-mono font-extrabold text-amber-600 bg-amber-50/50">
                                {targetRow.studentGpa || '-'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Trend Table */}
                      <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm text-[11px] md:text-xs">
                        <table className="w-full text-center border-collapse">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 text-[10px] md:text-[11px]">
                              <th className="py-1 px-1 border-r border-slate-200 w-[20%]">구분</th>
                              <th className="py-1 px-1 border-r border-slate-200 w-[20%]">2024학년도</th>
                              <th className="py-1 px-1 border-r border-slate-200 w-[20%]">2025학년도</th>
                              <th className="py-1 px-1 border-r border-slate-200 w-[20%]">2026학년도</th>
                              <th className="py-1 px-1 w-[20%]">3개년 추이</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 font-semibold text-[11px]">
                            {/* 1. 모집인원 */}
                            <tr>
                              <td className="py-1 px-1 bg-slate-50 font-bold border-r border-slate-200 text-slate-700">모집인원</td>
                              <td className="py-0.5 px-1 border-r border-slate-200">
                                <input
                                  type="text"
                                  value={targetRow.data2023.recruitCount}
                                  onChange={(e) => handleModalValueChange('2023', 'recruitCount', e.target.value)}
                                  className="w-full h-6 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-center rounded font-mono font-bold text-slate-900 focus:outline-none transition-all text-[11px] py-0"
                                />
                              </td>
                              <td className="py-0.5 px-1 border-r border-slate-200">
                                <input
                                  type="text"
                                  value={targetRow.data2024.recruitCount}
                                  onChange={(e) => handleModalValueChange('2024', 'recruitCount', e.target.value)}
                                  className="w-full h-6 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-center rounded font-mono font-bold text-slate-900 focus:outline-none transition-all text-[11px] py-0"
                                />
                              </td>
                              <td className="py-0.5 px-1 border-r border-slate-200">
                                <input
                                  type="text"
                                  value={targetRow.data2025.recruitCount}
                                  onChange={(e) => handleModalValueChange('2025', 'recruitCount', e.target.value)}
                                  className="w-full h-6 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-center rounded font-mono font-bold text-slate-900 focus:outline-none transition-all text-[11px] py-0"
                                />
                              </td>
                              <td className="py-1 px-1 font-bold text-[10px] md:text-[11px]">
                                {(() => {
                                  const trend = getTrend(targetRow.data2023.recruitCount, targetRow.data2024.recruitCount, targetRow.data2025.recruitCount, 'recruit');
                                  return trend.text ? <span className={trend.className}>{trend.text}</span> : <span className="text-slate-400">-</span>;
                                })()}
                              </td>
                            </tr>
                            {/* 2. 경쟁률 */}
                            <tr>
                              <td className="py-1 px-1 bg-slate-50 font-bold border-r border-slate-200 text-slate-700">경쟁률</td>
                              <td className="py-0.5 px-1 border-r border-slate-200">
                                <input
                                  type="text"
                                  value={targetRow.data2023.ratio}
                                  onChange={(e) => handleModalValueChange('2023', 'ratio', e.target.value)}
                                  className="w-full h-6 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-center rounded font-mono font-bold text-slate-900 focus:outline-none transition-all text-[11px] py-0"
                                />
                              </td>
                              <td className="py-0.5 px-1 border-r border-slate-200">
                                <input
                                  type="text"
                                  value={targetRow.data2024.ratio}
                                  onChange={(e) => handleModalValueChange('2024', 'ratio', e.target.value)}
                                  className="w-full h-6 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-center rounded font-mono font-bold text-slate-900 focus:outline-none transition-all text-[11px] py-0"
                                />
                              </td>
                              <td className="py-0.5 px-1 border-r border-slate-200">
                                <input
                                  type="text"
                                  value={targetRow.data2025.ratio}
                                  onChange={(e) => handleModalValueChange('2025', 'ratio', e.target.value)}
                                  className="w-full h-6 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-center rounded font-mono font-bold text-slate-900 focus:outline-none transition-all text-[11px] py-0"
                                />
                              </td>
                              <td className="py-1 px-1 font-bold text-[10px] md:text-[11px]">
                                {(() => {
                                  const trend = getTrend(targetRow.data2023.ratio, targetRow.data2024.ratio, targetRow.data2025.ratio, 'ratio');
                                  return trend.text ? <span className={trend.className}>{trend.text}</span> : <span className="text-slate-400">-</span>;
                                })()}
                              </td>
                            </tr>
                            {/* 3. 최고 */}
                            <tr>
                              <td className="py-1 px-1 bg-slate-50 font-extrabold border-r border-slate-200 text-slate-700">최고</td>
                              <td className="py-0.5 px-1 border-r border-slate-200">
                                <input
                                  type="text"
                                  value={targetRow.data2023.maxGpa}
                                  onChange={(e) => handleModalValueChange('2023', 'maxGpa', e.target.value)}
                                  className="w-full h-6 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-center rounded font-mono font-bold text-slate-900 focus:outline-none transition-all text-[11px] py-0"
                                />
                              </td>
                              <td className="py-0.5 px-1 border-r border-slate-200">
                                <input
                                  type="text"
                                  value={targetRow.data2024.maxGpa}
                                  onChange={(e) => handleModalValueChange('2024', 'maxGpa', e.target.value)}
                                  className="w-full h-6 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-center rounded font-mono font-bold text-slate-900 focus:outline-none transition-all text-[11px] py-0"
                                />
                              </td>
                              <td className="py-0.5 px-1 border-r border-slate-200">
                                <input
                                  type="text"
                                  value={targetRow.data2025.maxGpa}
                                  onChange={(e) => handleModalValueChange('2025', 'maxGpa', e.target.value)}
                                  className="w-full h-6 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-center rounded font-mono font-bold text-slate-900 focus:outline-none transition-all text-[11px] py-0"
                                />
                              </td>
                              <td className="py-1 px-1 font-bold text-[10px] md:text-[11px]">
                                {(() => {
                                  const trend = getTrend(targetRow.data2023.maxGpa, targetRow.data2024.maxGpa, targetRow.data2025.maxGpa, 'score');
                                  return trend.text ? <span className={trend.className}>{trend.text}</span> : <span className="text-slate-400">-</span>;
                                })()}
                              </td>
                            </tr>
                            {/* 4. 평균 */}
                            <tr>
                              <td className="py-1 px-1 bg-slate-50 font-extrabold border-r border-slate-200 text-slate-700 select-none leading-tight text-[10px] md:text-[11px]">
                                평균<br />(최종등록자 기준)
                              </td>
                              <td className="py-0.5 px-1 border-r border-slate-200">
                                <input
                                  type="text"
                                  value={targetRow.data2023.finalAvgGpa !== undefined ? targetRow.data2023.finalAvgGpa : (activeOverlayData.stats2024?.average || '')}
                                  onChange={(e) => handleModalValueChange('2023', 'finalAvgGpa', e.target.value)}
                                  className="w-full h-6 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-center rounded font-mono font-bold text-slate-900 focus:outline-none transition-all text-[11px] py-0"
                                />
                              </td>
                              <td className="py-0.5 px-1 border-r border-slate-200">
                                <input
                                  type="text"
                                  value={targetRow.data2024.finalAvgGpa !== undefined ? targetRow.data2024.finalAvgGpa : (activeOverlayData.stats2025?.average || '')}
                                  onChange={(e) => handleModalValueChange('2024', 'finalAvgGpa', e.target.value)}
                                  className="w-full h-6 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-center rounded font-mono font-bold text-slate-900 focus:outline-none transition-all text-[11px] py-0"
                                />
                              </td>
                              <td className="py-0.5 px-1 border-r border-slate-200">
                                <input
                                  type="text"
                                  value={targetRow.data2025.finalAvgGpa !== undefined ? targetRow.data2025.finalAvgGpa : (activeOverlayData.stats2026?.average || '')}
                                  onChange={(e) => handleModalValueChange('2025', 'finalAvgGpa', e.target.value)}
                                  className="w-full h-6 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-center rounded font-mono font-bold text-slate-900 focus:outline-none transition-all text-[11px] py-0"
                                />
                              </td>
                              <td className="py-1 px-1 font-bold text-[10px] md:text-[11px]">
                                {(() => {
                                  const v24 = targetRow.data2023.finalAvgGpa !== undefined ? targetRow.data2023.finalAvgGpa : (activeOverlayData.stats2024?.average || '');
                                  const v25 = targetRow.data2024.finalAvgGpa !== undefined ? targetRow.data2024.finalAvgGpa : (activeOverlayData.stats2025?.average || '');
                                  const v26 = targetRow.data2025.finalAvgGpa !== undefined ? targetRow.data2025.finalAvgGpa : (activeOverlayData.stats2026?.average || '');
                                  const trend = getTrend(v24, v25, v26, 'score');
                                  return trend.text ? <span className={trend.className}>{trend.text}</span> : <span className="text-slate-400">-</span>;
                                })()}
                              </td>
                            </tr>
                            {/* 5. 70% CUT */}
                            <tr>
                              <td className="py-1 px-1 bg-slate-50 font-bold border-r border-slate-200 text-slate-700">70% CUT</td>
                              <td className="py-0.5 px-1 border-r border-slate-200">
                                <input
                                  type="text"
                                  value={targetRow.data2023.cut70}
                                  onChange={(e) => handleModalValueChange('2023', 'cut70', e.target.value)}
                                  className="w-full h-6 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-center rounded font-mono font-bold text-slate-900 focus:outline-none transition-all text-[11px] py-0"
                                />
                              </td>
                              <td className="py-0.5 px-1 border-r border-slate-200">
                                <input
                                  type="text"
                                  value={targetRow.data2024.cut70}
                                  onChange={(e) => handleModalValueChange('2024', 'cut70', e.target.value)}
                                  className="w-full h-6 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-center rounded font-mono font-bold text-slate-900 focus:outline-none transition-all text-[11px] py-0"
                                />
                              </td>
                              <td className="py-0.5 px-1 border-r border-slate-200">
                                <input
                                  type="text"
                                  value={targetRow.data2025.cut70}
                                  onChange={(e) => handleModalValueChange('2025', 'cut70', e.target.value)}
                                  className="w-full h-6 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-center rounded font-mono font-bold text-slate-900 focus:outline-none transition-all text-[11px] py-0"
                                />
                              </td>
                              <td className="py-1 px-1 font-bold text-[10px] md:text-[11px]">
                                {(() => {
                                  const trend = getTrend(targetRow.data2023.cut70, targetRow.data2024.cut70, targetRow.data2025.cut70, 'score');
                                  return trend.text ? <span className={trend.className}>{trend.text}</span> : <span className="text-slate-400">-</span>;
                                })()}
                              </td>
                            </tr>
                            {/* 6. 최저 */}
                            <tr>
                              <td className="py-1 px-1 bg-slate-50 font-extrabold border-r border-slate-200 text-slate-700">최저</td>
                              <td className="py-0.5 px-1 border-r border-slate-200">
                                <input
                                  type="text"
                                  value={targetRow.data2023.minGpa}
                                  onChange={(e) => handleModalValueChange('2023', 'minGpa', e.target.value)}
                                  className="w-full h-6 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-center rounded font-mono font-bold text-slate-900 focus:outline-none transition-all text-[11px] py-0"
                                />
                              </td>
                              <td className="py-0.5 px-1 border-r border-slate-200">
                                <input
                                  type="text"
                                  value={targetRow.data2024.minGpa}
                                  onChange={(e) => handleModalValueChange('2024', 'minGpa', e.target.value)}
                                  className="w-full h-6 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-center rounded font-mono font-bold text-slate-900 focus:outline-none transition-all text-[11px] py-0"
                                />
                              </td>
                              <td className="py-0.5 px-1 border-r border-slate-200">
                                <input
                                  type="text"
                                  value={targetRow.data2025.minGpa}
                                  onChange={(e) => handleModalValueChange('2025', 'minGpa', e.target.value)}
                                  className="w-full h-6 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-center rounded font-mono font-bold text-slate-900 focus:outline-none transition-all text-[11px] py-0"
                                />
                              </td>
                              <td className="py-1 px-1 font-bold text-[10px] md:text-[11px]">
                                {(() => {
                                  const trend = getTrend(targetRow.data2023.minGpa, targetRow.data2024.minGpa, targetRow.data2025.minGpa, 'score');
                                  return trend.text ? <span className={trend.className}>{trend.text}</span> : <span className="text-slate-400">-</span>;
                                })()}
                              </td>
                            </tr>
                            {/* 7. 충원인원 */}
                            <tr>
                              <td className="py-1 px-1 bg-slate-50 font-bold border-r border-slate-200 text-slate-700">충원인원</td>
                              <td className="py-0.5 px-1 border-r border-slate-200">
                                <input
                                  type="text"
                                  value={targetRow.data2023.chuhapNo}
                                  onChange={(e) => handleModalValueChange('2023', 'chuhapNo', e.target.value)}
                                  className="w-full h-6 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-center rounded font-mono font-bold text-slate-900 focus:outline-none transition-all text-[11px] py-0"
                                />
                              </td>
                              <td className="py-0.5 px-1 border-r border-slate-200">
                                <input
                                  type="text"
                                  value={targetRow.data2024.chuhapNo}
                                  onChange={(e) => handleModalValueChange('2024', 'chuhapNo', e.target.value)}
                                  className="w-full h-6 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-center rounded font-mono font-bold text-slate-900 focus:outline-none transition-all text-[11px] py-0"
                                />
                              </td>
                              <td className="py-0.5 px-1 border-r border-slate-200">
                                <input
                                  type="text"
                                  value={targetRow.data2025.chuhapNo}
                                  onChange={(e) => handleModalValueChange('2025', 'chuhapNo', e.target.value)}
                                  className="w-full h-6 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-center rounded font-mono font-bold text-slate-900 focus:outline-none transition-all text-[11px] py-0"
                                />
                              </td>
                              <td className="py-1 px-1 font-bold text-[10px] md:text-[11px]">
                                {(() => {
                                  const trend = getTrend(targetRow.data2023.chuhapNo, targetRow.data2024.chuhapNo, targetRow.data2025.chuhapNo, 'recruit');
                                  return trend.text ? <span className={trend.className}>{trend.text}</span> : <span className="text-slate-400">-</span>;
                                })()}
                              </td>
                            </tr>
                            {/* 8. 내 위치 (2-line layout requested) */}
                            <tr className="bg-slate-50/60">
                              <td className="py-1 px-1 bg-slate-100 font-extrabold border-r border-slate-200 text-indigo-900 select-none leading-tight text-[10px] md:text-[11px]">
                                내 위치<br />(최종등록자 기준)
                              </td>
                              <td className="py-1 px-1 border-r border-slate-200 text-center">
                                {pos24.label !== '-' ? (
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${pos24.bgClass} ${pos24.textClass}`}>
                                    {pos24.label}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="py-1 px-1 border-r border-slate-200 text-center">
                                {pos25.label !== '-' ? (
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${pos25.bgClass} ${pos25.textClass}`}>
                                    {pos25.label}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="py-1 px-1 border-r border-slate-200 text-center">
                                {pos26.label !== '-' ? (
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${pos26.bgClass} ${pos26.textClass}`}>
                                    {pos26.label}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="py-1 px-1 text-center font-bold text-[10px] md:text-[11px] text-indigo-700">
                                {pos24.label !== '-' && pos25.label !== '-' && pos26.label !== '-' ? (
                                  <span className="bg-indigo-50 border border-indigo-100 px-1 py-0.5 rounded text-[10px] whitespace-nowrap">
                                    {pos24.label} → {pos25.label} → {pos26.label}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: 대교협 상담프로그램 범례 및 표시 색상 정보 */}
        <div className="xl:col-span-5 bg-zinc-900/40 border professional-border rounded-xl p-3.5 flex flex-col justify-between gap-2.5">
          <div className="space-y-1.5">
            <h3 className="text-xs font-extrabold text-zinc-400 flex items-center justify-between pb-1 border-b border-zinc-800/80">
              <span>한국대학교육협의회 입시 정보 진단 기준안</span>
              <span className="text-[10px] text-zinc-600">[최초합격 기준]</span>
            </h3>
            
            <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-extrabold">
              <div className="bg-emerald-950/40 border border-emerald-800 p-1.5 rounded text-emerald-400 flex flex-col items-center justify-center gap-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>상위 (0% ~ 33%)</span>
              </div>
              <div className="bg-amber-950/40 border border-amber-800 p-1.5 rounded text-amber-500 flex flex-col items-center justify-center gap-0.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>중위 (34% ~ 66%)</span>
              </div>
              <div className="bg-rose-950/40 border border-rose-800 p-1.5 rounded text-rose-400 flex flex-col items-center justify-center gap-0.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>하위 (67% ~ 100%)</span>
              </div>
            </div>

            <div className="p-2 bg-zinc-950/30 rounded-lg border border-zinc-800 space-y-1.5 text-[10px]">
              <div className="font-bold text-zinc-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                <span>지선 대비분석 산출 로직 조건식</span>
              </div>
              <div className="overflow-hidden rounded border border-zinc-850 bg-zinc-950/40">
                <table className="w-full text-center text-[8.5px] border-collapse leading-tight font-sans">
                  <thead>
                    <tr className="bg-zinc-900/80 text-zinc-400 font-extrabold border-b border-zinc-850">
                      <th className="py-0.5 px-1 border-r border-zinc-850 w-[24%]">성적기준</th>
                      <th className="py-0.5 px-1 border-r border-zinc-850 w-[38%]">학생부교과</th>
                      <th className="py-0.5 px-1 w-[38%]">학종/논술 등</th>
                    </tr>
                  </thead>
                  <tbody className="font-medium text-zinc-300">
                    <tr className="border-b border-zinc-850/60">
                      <td className="py-0.5 px-0.5 border-r border-zinc-850 text-zinc-500 font-extrabold text-[9.5px]">↑</td>
                      <td className="py-0.5 px-0.5 border-r border-zinc-850 bg-blue-950/40 text-blue-400 font-extrabold text-[9px]">과하</td>
                      <td className="py-0.5 px-0.5 bg-emerald-950/40 text-emerald-400 font-extrabold text-[9px]">안전</td>
                    </tr>
                    <tr className="border-b border-zinc-850/60">
                      <td className="py-0.5 px-0.5 border-r border-zinc-850 text-zinc-400 font-bold">최고</td>
                      <td className="py-0.5 px-0.5 border-r border-zinc-850 bg-sky-950/40 text-sky-400 font-extrabold text-[9px]" rowSpan={2}>하향</td>
                      <td className="py-0.5 px-0.5 bg-amber-950/40 text-amber-500 font-extrabold text-[9px]" rowSpan={2}>소신</td>
                    </tr>
                    <tr className="border-b border-zinc-850/60">
                      <td className="py-0.5 px-0.5 border-r border-zinc-850 text-zinc-500 text-[8px]">↕</td>
                    </tr>
                    <tr className="border-b border-zinc-850/60">
                      <td className="py-0.5 px-0.5 border-r border-zinc-850 text-zinc-400 font-bold">평균</td>
                      <td className="py-0.5 px-0.5 border-r border-zinc-850 bg-emerald-950/40 text-emerald-400 font-extrabold text-[9px]" rowSpan={2}>안전</td>
                      <td className="py-0.5 px-0.5 bg-orange-950/40 text-orange-400 font-extrabold text-[9px]" rowSpan={2}>상향</td>
                    </tr>
                    <tr className="border-b border-zinc-850/60">
                      <td className="py-0.5 px-0.5 border-r border-zinc-850 text-zinc-500 text-[8px]">↕</td>
                    </tr>
                    <tr className="border-b border-zinc-850/60">
                      <td className="py-0.5 px-0.5 border-r border-zinc-850 text-zinc-400 font-bold">최저</td>
                      <td className="py-0.5 px-0.5 border-r border-zinc-850 bg-amber-950/40 text-amber-500 font-extrabold text-[9px]" rowSpan={2}>소신</td>
                      <td className="py-0.5 px-0.5 bg-rose-950/45 text-rose-400 font-extrabold text-[9px]" rowSpan={6}>과상</td>
                    </tr>
                    <tr className="border-b border-zinc-850/60">
                      <td className="py-0.5 px-0.5 border-r border-zinc-850 text-zinc-500 text-[8px]">↕</td>
                    </tr>
                    <tr className="border-b border-zinc-850/60">
                      <td className="py-0.5 px-0.5 border-r border-zinc-850 text-zinc-400 font-bold">70%</td>
                      <td className="py-0.5 px-0.5 border-r border-zinc-850 bg-orange-950/40 text-orange-400 font-extrabold text-[9px]" rowSpan={2}>상향</td>
                    </tr>
                    <tr className="border-b border-zinc-850/60">
                      <td className="py-0.5 px-0.5 border-r border-zinc-850 text-zinc-500 text-[8px]">↕</td>
                    </tr>
                    <tr className="border-b border-zinc-850/60">
                      <td className="py-0.5 px-0.5 border-r border-zinc-850 text-zinc-400 font-bold text-[7.5px] scale-95 origin-center leading-none">추합최저</td>
                      <td className="py-0.5 px-0.5 border-r border-zinc-850 bg-rose-950/40 text-rose-400 font-extrabold text-[9px]" rowSpan={2}>과상</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 px-0.5 border-r border-zinc-850 text-zinc-500 font-extrabold text-[9.5px]">↓</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section columns filter controls for spreadsheet density */}
          <div className="border-t border-zinc-800/80 pt-1.5 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
              <span>스프레드시트 출력 범위 제어:</span>
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShow2025(!show2025)}
                className={`px-2 py-1 text-[10.5px] font-black rounded border flex items-center gap-1 cursor-pointer transition-all ${show2025 ? 'bg-emerald-950 border-emerald-800 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
              >
                {show2025 ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <span>2026년</span>
              </button>
              <button 
                onClick={() => setShow2024(!show2024)}
                className={`px-2 py-1 text-[10.5px] font-black rounded border flex items-center gap-1 cursor-pointer transition-all ${show2024 ? 'bg-amber-950 border-amber-800 text-amber-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
              >
                {show2024 ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <span>2025년</span>
              </button>
              <button 
                onClick={() => setShow2023(!show2023)}
                className={`px-2 py-1 text-[10.5px] font-black rounded border flex items-center gap-1 cursor-pointer transition-all ${show2023 ? 'bg-rose-950 border-rose-800 text-rose-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
              >
                {show2023 ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <span>2024년</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Main Interactive Spreadsheet Editor */}
      <div className="bg-[#111112] border professional-border rounded-xl overflow-hidden shadow-lg flex flex-col">
        <div className="overflow-x-auto max-w-full font-sans">
          <table className="w-full text-left text-[11px] border-collapse min-w-[1550px]">
            
            {/* Header Tier 1: Group Ranges */}
            <thead>
              <tr className="bg-zinc-950 select-none border-b professional-border">
                <th colSpan={8} className="py-2 px-3 border border-zinc-800/80 border-r-4 border-r-zinc-500 font-extrabold text-[#D4AF37] text-left uppercase bg-[#18181B]">
                  희망 지원 대학 및 유형
                </th>
                <th colSpan={3} className="py-2 px-3 border border-zinc-800/80 border-r-4 border-r-zinc-500 text-center font-extrabold text-blue-400 bg-zinc-900">
                  연도별 대비 분석 결과
                </th>
                
                {show2025 && (
                  <th colSpan={11} className="py-2 px-3 border border-zinc-800/80 border-r-4 border-r-zinc-500 text-center font-black bg-emerald-950 text-emerald-400">
                    2026학년도 기준 성적
                  </th>
                )}
                
                {show2024 && (
                  <th colSpan={11} className="py-2 px-3 border border-zinc-800/80 border-r-4 border-r-zinc-500 text-center font-black bg-indigo-950 text-indigo-400">
                    2025학년도 기준 성적
                  </th>
                )}
                
                {show2023 && (
                  <th colSpan={11} className="py-2 px-3 border border-zinc-800/80 text-center font-black bg-rose-950 text-rose-400">
                    2024학년도 기준 성적
                  </th>
                )}
              </tr>

              {/* Header Tier 2: Exact Column Items */}
              <tr className="bg-zinc-900/90 text-zinc-400 font-bold border-b border-zinc-800/80">
                <th className="py-1 px-1 text-center border border-zinc-800/80 w-10 bg-zinc-950">연번</th>
                <th className="py-1 px-1 border border-zinc-800/80 w-48 font-extrabold text-zinc-200">대학교</th>
                <th className="py-1 px-1 border border-zinc-800/80 w-56 text-zinc-200">희망학과</th>
                <th className="py-1 px-1 border border-zinc-800/80 w-36">전형유형</th>
                <th className="py-1 px-1 border border-zinc-800/80 w-36">세부전형</th>
                <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 leading-tight">모집<br />인원</th>
                <th className="py-1 px-1 text-center border border-zinc-800/80 w-16 bg-yellow-500/5 text-yellow-400 leading-tight">학생<br />성적</th>
                <th className="py-1 px-1 text-center border border-zinc-800/80 border-r-4 border-r-zinc-500 w-10">액션</th>

                {/* 대비 분석 */}
                <th className="py-1 px-1 text-center border border-zinc-800/80 w-11 text-emerald-400 font-bold bg-[#1A1D20] tracking-tighter leading-tight">26<br />년도</th>
                <th className="py-1 px-1 text-center border border-zinc-800/80 w-11 text-indigo-450 font-bold bg-[#1A1D20] tracking-tighter leading-tight">25<br />년도</th>
                <th className="py-1 px-1 text-center border border-zinc-800/80 border-r-4 border-r-zinc-500 w-11 text-rose-400 font-bold bg-[#1A1D20] tracking-tighter leading-tight">24<br />년도</th>

                {/* 2025 Year Details */}
                {show2025 && (
                  <>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">모집<br />인원</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400">최저</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400">최고</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-emerald-950/30 text-emerald-300 font-black leading-tight">평균</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">표준<br />편차</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">추정<br />등수</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-15 bg-zinc-950/80 text-zinc-400 font-bold leading-tight">내신<br />성적<br />위치</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">70%<br />CUT</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">추합<br />최저</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">추합<br />번호</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 border-r-4 border-r-zinc-500 w-16 bg-zinc-950/80 text-zinc-400 leading-tight whitespace-nowrap">경쟁률</th>
                  </>
                )}

                {/* 2024 Year Details */}
                {show2024 && (
                  <>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">모집<br />인원</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400">최저</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400">최고</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-indigo-900/40 text-indigo-300 font-black leading-tight">평균</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">표준<br />편차</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">추정<br />등수</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-15 bg-zinc-950/80 text-zinc-400 font-bold leading-tight">내신<br />성적<br />위치</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">70%<br />CUT</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">추합<br />최저</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">추합<br />번호</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 border-r-4 border-r-zinc-500 w-16 bg-zinc-950/80 text-zinc-400 leading-tight whitespace-nowrap">경쟁률</th>
                  </>
                )}

                {/* 2023 Year Details */}
                {show2023 && (
                  <>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">모집<br />인원</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400">최저</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400">최고</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-rose-950/30 text-rose-350 font-black leading-tight">평균</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">표준<br />편차</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">추정<br />등수</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-15 bg-zinc-950/80 text-zinc-400 font-bold leading-tight">내신<br />성적<br />위치</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">70%<br />CUT</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">추합<br />최저</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">추합<br />번호</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-16 bg-zinc-950/80 text-zinc-400 leading-tight whitespace-nowrap">경쟁률</th>
                  </>
                )}
              </tr>
            </thead>

            {/* List Body */}
            <tbody>
              {processedRows.map((row) => {
                const isExcluded = row.apply === 'X';
                // Exclusive shadow row style
                const trClass = isExcluded 
                  ? 'bg-zinc-900/60 opacity-50 border-b border-zinc-800/60 line-through select-none text-zinc-600 transition-colors' 
                  : 'hover:bg-zinc-900/40 border-b border-zinc-800/50 text-zinc-300 transition-colors';

                return (
                  <tr key={row.id} className={trClass}>
                    {/* Index */}
                    <td 
                      className="py-1 px-1.5 text-center bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800/80 font-mono font-bold cursor-pointer select-none transition-all duration-150"
                      onClick={() => handleRowIndexClick(row)}
                      title="3개년 대학 입시 통계 상세 오버랩 보기"
                    >
                      {row.index}
                    </td>
                    
                    {/* College Input */}
                    <td className="py-1 px-1.5 border border-zinc-800/80 font-semibold">
                      <input 
                        disabled={isExcluded}
                        type="text"
                        list={`colleges-${row.id}`}
                        value={row.college}
                        onChange={(e) => handleCascadeChange(row.id, 'college', e.target.value)}
                        className="w-full bg-transparent border-0 focus:ring-1 focus:ring-yellow-500 text-white focus:outline-none font-bold rounded p-0.5 text-[11px]"
                        placeholder="대학 입력/선택"
                      />
                      <datalist id={`colleges-${row.id}`}>
                        {getColleges().map(c => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </td>

                    {/* Major Input */}
                    <td className="py-1 px-1.5 border border-zinc-800/80 text-zinc-200">
                      <input 
                        disabled={isExcluded}
                        type="text"
                        list={`majors-${row.id}`}
                        value={row.major}
                        onChange={(e) => handleCascadeChange(row.id, 'major', e.target.value)}
                        className="w-full bg-transparent border-0 focus:ring-1 focus:ring-yellow-500 text-zinc-300 focus:outline-none rounded p-0.5 text-[11px] disabled:opacity-45"
                        placeholder="전공 입력/선택"
                      />
                      <datalist id={`majors-${row.id}`}>
                        {getMajors(row.college).map(m => (
                          <option key={m} value={m} />
                        ))}
                      </datalist>
                    </td>

                    {/* Admission Type Select */}
                    <td className="py-1 px-1.5 border border-zinc-800/80 font-semibold text-yellow-500/90 text-[10.5px]">
                      <input 
                        disabled={isExcluded}
                        type="text"
                        list={`types-${row.id}`}
                        value={row.type}
                        onChange={(e) => handleCascadeChange(row.id, 'type', e.target.value)}
                        className="w-full bg-transparent border-0 focus:ring-1 focus:ring-yellow-500 text-yellow-500 text-[10.5px] rounded focus:outline-none p-0.5 disabled:opacity-45"
                        placeholder="전형유형 입력/선택"
                      />
                      <datalist id={`types-${row.id}`}>
                        {(row.college && row.major ? getTypes(row.college, row.major) : ADMISSION_TYPES).map(tp => (
                          <option key={tp} value={tp} />
                        ))}
                      </datalist>
                    </td>

                    {/* Detail Type Input */}
                    <td className="py-1 px-1.5 border border-zinc-800/80">
                      <input 
                        disabled={isExcluded}
                        type="text"
                        list={`detailTypes-${row.id}`}
                        value={row.detailType}
                        onChange={(e) => handleCascadeChange(row.id, 'detailType', e.target.value)}
                        className="w-full bg-transparent border-0 focus:ring-1 focus:ring-yellow-500 text-zinc-400 focus:outline-none rounded p-0.5 text-[11px] disabled:opacity-45"
                        placeholder="세부전형 입력/선택"
                      />
                      <datalist id={`detailTypes-${row.id}`}>
                        {getDetailTypes(row.college, row.major, row.type).map(dt => (
                          <option key={dt} value={dt} />
                        ))}
                      </datalist>
                    </td>

                    {/* Row Recruit count */}
                    <td className="py-1 px-1 text-center border border-zinc-800/80">
                      <input 
                        disabled={isExcluded}
                        type="text" 
                        value={row.recruitCount}
                        onChange={(e) => handleCellChange(row.id, ['recruitCount'], e.target.value)}
                        className="w-full bg-transparent border-0 text-center font-bold text-zinc-300 focus:outline-none rounded p-0.5 text-[10px]"
                      />
                    </td>

                    {/* Student current GPA */}
                    <td className="py-1 px-1 text-center border border-zinc-800/80 bg-yellow-500/5">
                      <input 
                        disabled={isExcluded}
                        type="text" 
                        value={row.studentGpa}
                        onChange={(e) => handleCellChange(row.id, ['studentGpa'], e.target.value)}
                        className="w-full bg-transparent border-0 text-center font-mono font-extrabold text-yellow-400 focus:outline-none rounded p-0.5 text-[10px]"
                      />
                    </td>

                    {/* Single Row actions */}
                    <td className="py-1 px-1 text-center border border-zinc-800/80 border-r-4 border-r-zinc-500">
                      <button 
                        onClick={() => handleDeleteRow(row.id)}
                        className="p-1 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                        title="해당 희망대학 행 제외"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>

                    {/* Analysis outputs */}
                    <td className={`py-1 px-2 text-center font-extrabold border border-zinc-800/80 text-[10px] ${getAnalysisBadgeColor(row.anal2025)}`}>{row.anal2025}</td>
                    <td className={`py-1 px-2 text-center font-extrabold border border-zinc-800/80 text-[10px] ${getAnalysisBadgeColor(row.anal2024)}`}>{row.anal2024}</td>
                    <td className={`py-1 px-2 text-center font-extrabold border border-zinc-800/80 border-r-4 border-r-zinc-500 text-[10px] ${getAnalysisBadgeColor(row.anal2023)}`}>{row.anal2023}</td>

                    {/* 2025 Details */}
                    {show2025 && (
                      <>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-zinc-950/30">
                          <input disabled={isExcluded} type="text" value={row.data2025.recruitCount} onChange={e => handleCellChange(row.id, ['data2025', 'recruitCount'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-zinc-400 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-zinc-950/30">
                          <input disabled={isExcluded} type="text" value={row.data2025.minGpa} onChange={e => handleCellChange(row.id, ['data2025', 'minGpa'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-zinc-400 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-zinc-950/30">
                          <input disabled={isExcluded} type="text" value={row.data2025.maxGpa} onChange={e => handleCellChange(row.id, ['data2025', 'maxGpa'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-zinc-400 font-mono text-[10px]" />
                        </td>
                        {/* 평균: 핵심 에메랄드 강조색 적용 */}
                        <td className="py-1 px-1 border border-zinc-800/80 bg-emerald-950/25">
                          <input disabled={isExcluded} type="text" value={row.data2025.avgGpa} onChange={e => handleCellChange(row.id, ['data2025', 'avgGpa'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none font-bold p-0.5 text-emerald-400 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-zinc-950/30">
                          <input disabled={isExcluded} type="text" value={row.data2025.stdDev} onChange={e => handleCellChange(row.id, ['data2025', 'stdDev'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-zinc-400 font-mono text-[10px]" />
                        </td>
                        {/* 추정등수 */}
                        <td className="py-1 px-1 text-center font-mono font-bold text-zinc-300 bg-zinc-950/30 border border-zinc-800/80 select-none text-[10px]">{row.estRank2025}</td>
                        <td className={`py-1 px-1 text-center font-bold border border-zinc-800/80 select-none text-[10px] ${
                          row.gpaLoc2025 === '상위' ? 'bg-[#064E3B] text-[#D1FAE5]' :
                          row.gpaLoc2025 === '중위' ? 'bg-[#78350F] text-[#FEF3C7]' :
                          row.gpaLoc2025 === '하위' ? 'bg-[#7F1D1D] text-[#FECACA]' : 'text-zinc-650'
                        }`}>{row.gpaLoc2025}</td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-zinc-950/30">
                          <input disabled={isExcluded} type="text" value={row.data2025.cut70} onChange={e => handleCellChange(row.id, ['data2025', 'cut70'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-zinc-400 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-zinc-950/30">
                          <input disabled={isExcluded} type="text" value={row.data2025.chuhapMin} onChange={e => handleCellChange(row.id, ['data2025', 'chuhapMin'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-zinc-400 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-zinc-950/30">
                          <input disabled={isExcluded} type="text" value={row.data2025.chuhapNo} onChange={e => handleCellChange(row.id, ['data2025', 'chuhapNo'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-zinc-400 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 border-r-4 border-r-zinc-500 bg-zinc-950/30">
                          <input disabled={isExcluded} type="text" value={row.data2025.ratio} onChange={e => handleCellChange(row.id, ['data2025', 'ratio'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-zinc-400 font-mono text-[10px]" />
                        </td>
                      </>
                    )}

                    {/* 2024 Details */}
                    {show2024 && (
                      <>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-indigo-950/15">
                          <input disabled={isExcluded} type="text" value={row.data2024.recruitCount} onChange={e => handleCellChange(row.id, ['data2024', 'recruitCount'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-indigo-200 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-indigo-950/15">
                          <input disabled={isExcluded} type="text" value={row.data2024.minGpa} onChange={e => handleCellChange(row.id, ['data2024', 'minGpa'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-indigo-200 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-indigo-950/15">
                          <input disabled={isExcluded} type="text" value={row.data2024.maxGpa} onChange={e => handleCellChange(row.id, ['data2024', 'maxGpa'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-indigo-200 font-mono text-[10px]" />
                        </td>
                        {/* 평균: 핵심 인디고/블루 강조색 적용 */}
                        <td className="py-1 px-1 border border-zinc-800/80 bg-indigo-950/35">
                          <input disabled={isExcluded} type="text" value={row.data2024.avgGpa} onChange={e => handleCellChange(row.id, ['data2024', 'avgGpa'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none font-bold p-0.5 text-indigo-400 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-indigo-950/15">
                          <input disabled={isExcluded} type="text" value={row.data2024.stdDev} onChange={e => handleCellChange(row.id, ['data2024', 'stdDev'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-indigo-350 font-mono text-[10px]" />
                        </td>
                        {/* 추정등수 */}
                        <td className="py-1 px-1 text-center font-mono font-bold text-indigo-350 bg-indigo-950/15 border border-zinc-800/80 select-none text-[10px]">{row.estRank2024}</td>
                        <td className={`py-1 px-1 text-center font-bold border border-zinc-800/80 select-none text-[10px] ${
                          row.gpaLoc2024 === '상위' ? 'bg-[#1e1b4b] text-[#c7d2fe]' :
                          row.gpaLoc2024 === '중위' ? 'bg-[#312e81] text-[#a5b4fc]' :
                          row.gpaLoc2024 === '하위' ? 'bg-zinc-950 text-zinc-500' : 'text-zinc-650'
                        }`}>{row.gpaLoc2024}</td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-indigo-950/15">
                          <input disabled={isExcluded} type="text" value={row.data2024.cut70} onChange={e => handleCellChange(row.id, ['data2024', 'cut70'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-indigo-200 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-indigo-950/15">
                          <input disabled={isExcluded} type="text" value={row.data2024.chuhapMin} onChange={e => handleCellChange(row.id, ['data2024', 'chuhapMin'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-indigo-200 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-indigo-950/15">
                          <input disabled={isExcluded} type="text" value={row.data2024.chuhapNo} onChange={e => handleCellChange(row.id, ['data2024', 'chuhapNo'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-indigo-200 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 border-r-4 border-r-zinc-500 bg-indigo-950/15">
                          <input disabled={isExcluded} type="text" value={row.data2024.ratio} onChange={e => handleCellChange(row.id, ['data2024', 'ratio'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-indigo-200 font-mono text-[10px]" />
                        </td>
                      </>
                    )}

                    {/* 2023 Details */}
                    {show2023 && (
                      <>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-rose-950/15">
                          <input disabled={isExcluded} type="text" value={row.data2023.recruitCount} onChange={e => handleCellChange(row.id, ['data2023', 'recruitCount'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-rose-300 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-rose-950/15">
                          <input disabled={isExcluded} type="text" value={row.data2023.minGpa} onChange={e => handleCellChange(row.id, ['data2023', 'minGpa'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-rose-300 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-rose-950/15">
                          <input disabled={isExcluded} type="text" value={row.data2023.maxGpa} onChange={e => handleCellChange(row.id, ['data2023', 'maxGpa'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-rose-300 font-mono text-[10px]" />
                        </td>
                        {/* 평균: 핵심 장미/로즈 강조색 적용 */}
                        <td className="py-1 px-1 border border-zinc-800/80 bg-rose-950/30">
                          <input disabled={isExcluded} type="text" value={row.data2023.avgGpa} onChange={e => handleCellChange(row.id, ['data2023', 'avgGpa'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none font-bold p-0.5 text-rose-350 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-rose-950/15">
                          <input disabled={isExcluded} type="text" value={row.data2023.stdDev} onChange={e => handleCellChange(row.id, ['data2023', 'stdDev'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-rose-350 font-mono text-[10px]" />
                        </td>
                        {/* 추정등수 */}
                        <td className="py-1 px-1 text-center font-mono font-bold text-rose-350 bg-rose-950/15 border border-zinc-800/80 select-none text-[10px]">{row.estRank2023}</td>
                        <td className={`py-1 px-1 text-center font-bold border border-zinc-800/80 select-none text-[10px] ${
                          row.gpaLoc2023 === '상위' ? 'bg-[#881337] text-[#fecdd3]' :
                          row.gpaLoc2023 === '중위' ? 'bg-[#4c0519] text-[#fda4af]' :
                          row.gpaLoc2023 === '하위' ? 'bg-zinc-950 text-zinc-500' : 'text-zinc-650'
                        }`}>{row.gpaLoc2023}</td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-rose-950/15">
                          <input disabled={isExcluded} type="text" value={row.data2023.cut70} onChange={e => handleCellChange(row.id, ['data2023', 'cut70'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-rose-300 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-rose-950/15">
                          <input disabled={isExcluded} type="text" value={row.data2023.chuhapMin} onChange={e => handleCellChange(row.id, ['data2023', 'chuhapMin'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-rose-300 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-rose-950/15">
                          <input disabled={isExcluded} type="text" value={row.data2023.chuhapNo} onChange={e => handleCellChange(row.id, ['data2023', 'chuhapNo'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-rose-300 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-rose-950/15">
                          <input disabled={isExcluded} type="text" value={row.data2023.ratio} onChange={e => handleCellChange(row.id, ['data2023', 'ratio'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-rose-300 font-mono text-[10px]" />
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in no-print">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-white">희망대학 데이터 초기화</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                현재 학생의 모든 희망대학 작성 내용을 삭제하고 공란으로 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={executeReset}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-lg shadow-red-600/10"
              >
                초기화 실행
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
