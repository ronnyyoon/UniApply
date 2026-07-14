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
  EyeOff
} from 'lucide-react';
import { Student } from '../types';

interface YearlyData {
  recruitCount: string;
  minGpa: string;
  maxGpa: string;
  avgGpa: string;
  stdDev: string;
  cut70: string;
  chuhapMin: string;
  chuhapNo: string;
  ratio: string;
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
function yData(rc: string, min: string, max: string, avg: string, sd: string, cut: string, chMin: string, chNo: string, rat: string): YearlyData {
  return { recruitCount: rc, minGpa: min, maxGpa: max, avgGpa: avg, stdDev: sd, cut70: cut, chuhapMin: chMin, chuhapNo: chNo, ratio: rat };
}

// 17 Template Rows precisely matching the user's high-school consultant spreadsheet
const TEMPLATE_ROWS: Omit<SimRow, 'studentGpa'>[] = [
  {
    id: 'row_1', region: '서울특별시', college: '서강대학교', major: '지식융합미디어학부', type: '학생부교과', detailType: '추천형', apply: 'O', recruitCount: '10',
    data2025: yData('10', '1.27', '1.02', '1.17', '0.09', '1.57', '1.67', '35', '16.3'),
    data2024: yData('7', '1.3', '1.12', '1.24', '0.08', '2.35', '5.42', '45', '6.43'),
    data2023: yData('14', '1.25', '1.07', '1.15', '0.07', '1.54', '1.93', '109', '7.79')
  },
  {
    id: 'row_2', region: '서울특별시', college: '한양대학교', major: '건설환경공학과', type: '학생부교과', detailType: '추천형', apply: 'O', recruitCount: '6',
    data2025: yData('6', '1.54', '1.42', '1.52', '0.06', '1.66', '1.71', '5', '18.3'),
    data2024: yData('7', '최저 없음', '', '', '', '', '', '13', '6.7'),
    data2023: yData('7', '', '', '', '', '', '', '12', '10')
  },
  {
    id: 'row_3', region: '서울특별시', college: '건국대학교', major: '재료공학부', type: '학생부교과', detailType: '추천형', apply: 'O', recruitCount: '4',
    data2025: yData('5', '1.81', '1.54', '1.7', '0.12', '1.75', '1.98', '9', '15.4'),
    data2024: yData('23', '학과 개편됨', '', '', '', '1.82', '', '', ''),
    data2023: yData('', '', '', '', '', '', '', '', '')
  },
  {
    id: 'row_4', region: '서울특별시', college: '한양대학교', major: '도시공학과', type: '학생부교과', detailType: '추천형', apply: 'O', recruitCount: '5',
    data2025: yData('5', '1.48', '1.3', '1.41', '0.08', '1.57', '1.67', '5', '16'),
    data2024: yData('5', '최저 없음', '', '', '', '', '', '0', '7.2'),
    data2023: yData('5', '', '', '', '', '', '', '0', '16.8')
  },
  {
    id: 'row_5', region: '서울특별시', college: '서울시립대학교', major: '신소재공학과', type: '학생부교과', detailType: '추천형', apply: 'O', recruitCount: '5',
    data2025: yData('5', '3.00', '', '1.69', '', '1.77', '', '1', '18'),
    data2024: yData('5', '', '', '2.04', '', '', '', '', ''),
    data2023: yData('', '', '', '1.67', '', '', '', '', '')
  },
  {
    id: 'row_6', region: '서울특별시', college: '중앙대학교', major: '미디어커뮤니케이션학부', type: '학생부교과', detailType: '지역균형전형', apply: 'O', recruitCount: '9',
    data2025: yData('9', '1.46', '1.29', '1.38', '0.06', '2.28', '2.35', '21', '13.1'),
    data2024: yData('6', '1.47', '1.34', '1.40', '0.06', '1.62', '1.60', '16', '7.2'),
    data2023: yData('6', '1.63', '1.22', '1.30', '0.05', '1.63', '1.65', '25', '14.6')
  },
  {
    id: 'row_7', region: '서울특별시', college: '중앙대학교', major: '경영학과', type: '학생부교과', detailType: '지역균형전형', apply: 'O', recruitCount: '46',
    data2025: yData('46', '', '', '1.61', '', '', '', '114', '10'),
    data2024: yData('50', '', '', '1.55', '', '', '', '147', '5.2'),
    data2023: yData('50', '', '', '1.60', '', '', '', '144', '6.6')
  },
  {
    id: 'row_8', region: '서울특별시', college: '한양대학교', major: '인터컬리지학부', type: '학생부종합', detailType: '서류형', apply: 'O', recruitCount: '25',
    data2025: yData('45', '', '', '2.19', '', '2.84', '', '', ''),
    data2024: yData('', '', '', '', '', '', '', '', ''),
    data2023: yData('', '', '', '', '', '', '', '', '')
  },
  {
    id: 'row_9', region: '서울특별시', college: '고려대학교', major: '산업경영공학과', type: '학생부교과', detailType: '추천형', apply: 'O', recruitCount: '8',
    data2025: yData('8', '', '', '', '', '1.39', '', '10', '13.5'),
    data2024: yData('9', '', '', '', '', '1.50', '', '11', '21'),
    data2023: yData('12', '', '', '', '', '1.82', '', '10', '18.3')
  },
  {
    id: 'row_10', region: '서울특별시', college: '고려대학교', major: '건축학과', type: '학생부교과', detailType: '학교장추천', apply: 'O', recruitCount: '6',
    data2025: yData('6', '', '', '', '', '1.47', '', '8', '8.33'),
    data2024: yData('7', '1.47', '1.24', '1.36', '0.09', '1.56', '1.68', '13', '9.86'),
    data2023: yData('9', '1.63', '1.12', '1.34', '0.17', '1.67', '1.89', '30', '12.56')
  },
  {
    id: 'row_11', region: '서울특별시', college: '고려대학교', major: '지구환경과학과', type: '학생부교과', detailType: '추천형', apply: 'O', recruitCount: '4',
    data2025: yData('4', '', '', '', '', '1.49', '', '12', '18.25'),
    data2024: yData('6', '', '', '', '', '', '', '10', '17.83'),
    data2023: yData('8', '', '', '', '', '1.81', '', '5', '22.6')
  },
  {
    id: 'row_12', region: '서울특별시', college: '고려대학교', major: '융합에너지공학과', type: '학생부교과', detailType: '추천형', apply: 'O', recruitCount: '5',
    data2025: yData('5', '', '', '', '', '1.40', '', '6', '16.4'),
    data2024: yData('5', '', '', '', '', '1.66', '', '8', '9.4'),
    data2023: yData('7', '', '', '', '', '1.62', '', '18', '10.7')
  },
  {
    id: 'row_13', region: '서울특별시', college: '고려대학교', major: '기계공학과', type: '학생부교과', detailType: '추천형', apply: 'O', recruitCount: '21',
    data2025: yData('21', '', '', '', '', '1.44', '', '32', '10.24'),
    data2024: yData('23', '', '', '', '', '1.49', '', '39', '11.43'),
    data2023: yData('30', '', '', '', '', '1.68', '', '65', '9')
  },
  {
    id: 'row_14', region: '서울특별시', college: '성균관대학교', major: '공과계열', type: '학생부종합', detailType: '융합형', apply: 'O', recruitCount: '100',
    data2025: yData('100', '', '', '2.11', '', '2.99', '', '421', '26.92'),
    data2024: yData('150', '', '', '2.24', '', '2.80', '', '553', '22.19'),
    data2023: yData('150', '', '', '2.23', '', '2.92', '', '', '14.12')
  },
  {
    id: 'row_15', region: '서울특별시', college: '성균관대학교', major: '건설환경공학부', type: '학생부교과', detailType: '추천형', apply: 'O', recruitCount: '15',
    data2025: yData('올해 신설학과', '', '', '', '', '', '', '', ''),
    data2024: yData('', '', '', '', '', '', '', '', ''),
    data2023: yData('', '', '', '', '', '', '', '', '')
  },
  {
    id: 'row_16', region: '서울특별시', college: '한양대학교', major: '인터컬리지학부', type: '학생부종합', detailType: '', apply: 'O', recruitCount: '26',
    data2025: yData('26', '1.38', '1.05', '1.25', '0.10', '1.57', '1.64', '77', '14.88'),
    data2024: yData('32', '', '', '', '', '', '', '119', '5.09'),
    data2023: yData('32', '', '', '', '', '', '', '142', '11.28')
  },
  {
    id: 'row_17', region: '서울특별시', college: '중앙대학교', major: '경영학부', type: '학생부교과', detailType: '지역균형전형', apply: 'O', recruitCount: '46',
    data2025: yData('46', '1.50', '1.15', '1.40', '0.08', '1.80', '', '', '10'),
    data2024: yData('50', '1.47', '1.15', '1.37', '0.08', '1.82', '1.72', '', '5.2'),
    data2023: yData('50', '1.48', '1.13', '1.36', '0.09', '1.74', '1.89', '', '6.58')
  }
];

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

// Rule 7: Analytical bounds calculations
function calculateAnalysis(
  type: string, 
  studentGpaStr: string, 
  maxStr: string, 
  avgStr: string, 
  minStr: string, 
  cutStr: string, 
  chuhapMinStr: string
): string {
  const s = parseFloat(studentGpaStr);
  if (isNaN(s)) return '-';

  const max = parseFloat(maxStr);
  const avg = parseFloat(avgStr);
  const min = parseFloat(minStr);
  const cut = parseFloat(cutStr);
  const chuhapMin = parseFloat(chuhapMinStr);

  const hasMax = !isNaN(max);
  const hasAvg = !isNaN(avg);
  const hasMin = !isNaN(min);
  const hasCut = !isNaN(cut);
  const hasChuhap = !isNaN(chuhapMin);

  if (type === '학생부교과') {
    if (hasMax && s < max) return '과하';
    if (hasMax && hasAvg && s >= max && s < avg) return '하향';
    if (hasAvg && hasMin && s >= avg && s < min) return '안전';
    if (hasMin && hasCut && s >= Math.min(min, cut) && s < Math.max(min, cut)) return '소신';
    if (hasCut && hasChuhap && s >= Math.min(cut, chuhapMin) && s < Math.max(cut, chuhapMin)) return '상향';
    if (hasChuhap && s >= chuhapMin) return '과상';

    // Fallbacks
    if (hasAvg) {
      if (s < avg) return '하향';
      if (hasCut && s >= cut) return '상향';
      if (hasMin && s >= min) return '소신';
      return '소신';
    }
  } else {
    // 학생부종합, 논술전형, 면접전형, 실기전형
    if (hasMax && s < max) return '안전';
    if (hasMax && hasAvg && s >= max && s < avg) return '소신';
    if (hasAvg && hasMin && s >= avg && s < min) return '상향';
    if (hasMin && s >= min) return '과상';

    // Fallbacks
    if (hasAvg) {
      if (s < avg) return '소신';
      return '상향';
    }
  }
  return '-';
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
}

export default function CollegeCalculator({ student, primaryColor }: CollegeCalculatorProps) {
  // Store spreadsheets in React State mapped by student id
  const [studentSpreadsheets, setStudentSpreadsheets] = useState<Record<string, SimRow[]>>(() => {
    const saved = localStorage.getItem('ADMIT2027_COLLEGE_SHEETS');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('ADMIT2027_COLLEGE_SHEETS', JSON.stringify(studentSpreadsheets));
  }, [studentSpreadsheets]);
  
  // Year visibility toggles
  const [show2025, setShow2025] = useState(true);
  const [show2024, setShow2024] = useState(true);
  const [show2023, setShow2023] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [selectedMockMonth, setSelectedMockMonth] = useState<string>('3월');

  // Initialize or fetch sheet for current student
  const currentSheet = useMemo(() => {
    if (!studentSpreadsheets[student.id]) {
      // Lazy load standard template pre-populated with student's personal GPA
      const populated = TEMPLATE_ROWS.map(row => ({
        ...row,
        studentGpa: student.gpa.toString()
      }));
      return populated;
    }
    return studentSpreadsheets[student.id];
  }, [studentSpreadsheets, student.id, student.gpa]);

  // Update master state helper
  const updateCurrentSheet = (newSheet: SimRow[]) => {
    setStudentSpreadsheets(prev => ({
      ...prev,
      [student.id]: newSheet
    }));
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
      data2025: yData('', '', '', '', '', '', '', '', ''),
      data2024: yData('', '', '', '', '', '', '', '', ''),
      data2023: yData('', '', '', '', '', '', '', '', '')
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
    const reseted = TEMPLATE_ROWS.map((row, idx) => ({
      ...row,
      id: `row_${idx + 1}`,
      region: '',
      college: '',
      major: '',
      type: '학생부교과' as const,
      detailType: '',
      apply: 'O' as const,
      recruitCount: '',
      studentGpa: student.gpa.toString(),
      data2025: yData('', '', '', '', '', '', '', '', ''),
      data2024: yData('', '', '', '', '', '', '', '', ''),
      data2023: yData('', '', '', '', '', '', '', '', '')
    }));
    updateCurrentSheet(reseted);
    setShowResetConfirm(false);
  };

  // Rule 5 + 7 + 10 + 11: Real-time values generator helper
  const processedRows = useMemo(() => {
    return currentSheet.map((row, idx) => {
      const gpaLoc2025 = calculateGpaLocation(row.studentGpa, row.data2025.avgGpa, row.data2025.stdDev);
      const estRank2025 = calculateEstimatedRank(row.studentGpa, row.data2025.avgGpa, row.data2025.stdDev, row.data2025.recruitCount);
      
      const gpaLoc2024 = calculateGpaLocation(row.studentGpa, row.data2024.avgGpa, row.data2024.stdDev);
      const estRank2024 = calculateEstimatedRank(row.studentGpa, row.data2024.avgGpa, row.data2024.stdDev, row.data2024.recruitCount);

      const gpaLoc2023 = calculateGpaLocation(row.studentGpa, row.data2023.avgGpa, row.data2023.stdDev);
      const estRank2023 = calculateEstimatedRank(row.studentGpa, row.data2023.avgGpa, row.data2023.stdDev, row.data2023.recruitCount);

      const anal2025 = calculateAnalysis(row.type, row.studentGpa, row.data2025.maxGpa, row.data2025.avgGpa, row.data2025.minGpa, row.data2025.cut70, row.data2025.chuhapMin);
      const anal2024 = calculateAnalysis(row.type, row.studentGpa, row.data2024.maxGpa, row.data2024.avgGpa, row.data2024.minGpa, row.data2024.cut70, row.data2024.chuhapMin);
      const anal2023 = calculateAnalysis(row.type, row.studentGpa, row.data2023.maxGpa, row.data2023.avgGpa, row.data2023.minGpa, row.data2023.cut70, row.data2023.chuhapMin);

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
            position: absolute;
            left: 0;
            top: 0;
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
        <div className="xl:col-span-7 bg-zinc-900/50 border professional-border rounded-xl p-4 space-y-4 shadow-xl flex flex-col justify-between text-[11px]">
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

            <div className="p-2 bg-zinc-950/30 rounded-lg border border-zinc-800 space-y-1 text-[10px]">
              <div className="font-bold text-zinc-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                <span>지선 대비분석 산출 로직 조건식</span>
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-[9.5px]/relaxed text-zinc-500">
                <li><b>학생부교과</b>: S &lt; 최고일 경우 <b className="text-blue-400">과하</b>, 최고~평균 <b className="text-sky-400">하향</b>, 평균~최저 <b className="text-emerald-400">안전</b>, 최저~70%CUT <b className="text-amber-400">소신</b>, 70%CUT~추합최저 <b className="text-orange-400 font-extrabold">상향</b>, 이하 <b className="text-rose-400">과상</b></li>
                <li><b>학종/논술/면접/실기</b>: S &lt; 최고일 경우 <b className="text-emerald-400">안전</b>, 최고~평균 <b className="text-amber-400">소신</b>, 평균~최저 <b className="text-orange-400 font-extrabold">상향</b>, 이하 <b className="text-rose-400">과상</b></li>
              </ul>
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
                <th colSpan={8} className="py-2 px-3 border border-zinc-800/80 font-extrabold text-[#D4AF37] text-left uppercase bg-[#18181B]">
                  희망 지원 대학 및 유형
                </th>
                <th colSpan={3} className="py-2 px-3 border border-zinc-800/80 text-center font-extrabold text-blue-400 bg-zinc-900">
                  연도별 대비 분석 결과
                </th>
                
                {show2025 && (
                  <th colSpan={11} className="py-2 px-3 border border-zinc-800/80 text-center font-black bg-emerald-950 text-emerald-400">
                    2026학년도 기준 성적
                  </th>
                )}
                
                {show2024 && (
                  <th colSpan={11} className="py-2 px-3 border border-zinc-800/80 text-center font-black bg-amber-950 text-amber-400">
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
                <th className="py-1 px-1 text-center border border-zinc-800/80 w-10">액션</th>

                {/* 대비 분석 */}
                <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 text-emerald-400 font-bold bg-[#1A1D20] tracking-tighter whitespace-nowrap">26년도</th>
                <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 text-amber-400 font-bold bg-[#1A1D20] tracking-tighter whitespace-nowrap">25년도</th>
                <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 text-rose-400 font-bold bg-[#1A1D20] tracking-tighter whitespace-nowrap">24년도</th>

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
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">70%<br />컷</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">추합<br />최저</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">추합<br />번호</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">경쟁<br />률</th>
                  </>
                )}

                {/* 2024 Year Details */}
                {show2024 && (
                  <>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">모집<br />인원</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400">최저</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400">최고</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-amber-950/40 text-amber-300 font-black leading-tight">평균</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">표준<br />편차</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">추정<br />등수</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-15 bg-zinc-950/80 text-zinc-400 font-bold leading-tight">내신<br />성적<br />위치</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">70%<br />컷</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">추합<br />최저</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">추합<br />번호</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">경쟁<br />률</th>
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
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">70%<br />컷</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">추합<br />최저</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">추합<br />번호</th>
                    <th className="py-1 px-1 text-center border border-zinc-800/80 w-14 bg-zinc-950/80 text-zinc-400 leading-tight">경쟁<br />률</th>
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
                    <td className="py-1 px-1.5 text-center bg-zinc-950 text-zinc-500 border border-zinc-800/80 font-mono select-none">{row.index}</td>
                    
                    {/* College Input */}
                    <td className="py-1 px-1.5 border border-zinc-800/80 font-semibold">
                      <input 
                        disabled={isExcluded}
                        type="text" 
                        value={row.college}
                        onChange={(e) => handleCellChange(row.id, ['college'], e.target.value)}
                        className="w-full bg-transparent border-0 focus:ring-1 focus:ring-yellow-500 text-white focus:outline-none font-bold rounded p-0.5 truncate"
                        placeholder="가용 대학명"
                      />
                    </td>

                    {/* Major Input */}
                    <td className="py-1 px-1.5 border border-zinc-800/80 text-zinc-200">
                      <input 
                        disabled={isExcluded}
                        type="text" 
                        value={row.major}
                        onChange={(e) => handleCellChange(row.id, ['major'], e.target.value)}
                        className="w-full bg-transparent border-0 focus:ring-1 focus:ring-yellow-500 text-zinc-300 focus:outline-none rounded p-0.5 truncate"
                        placeholder="희망 전공 기입"
                      />
                    </td>

                    {/* Admission Type Select */}
                    <td className="py-1 px-1.5 border border-zinc-800/80 font-semibold text-yellow-500/90 text-[10.5px]">
                      <select 
                        disabled={isExcluded}
                        value={row.type}
                        onChange={(e) => handleCellChange(row.id, ['type'], e.target.value)}
                        className="w-full bg-transparent border-0 focus:ring-1 focus:ring-yellow-500 text-yellow-500 text-[10.5px] rounded focus:outline-none p-0.5"
                      >
                        {ADMISSION_TYPES.map(tp => (
                          <option key={tp} className="bg-zinc-950 text-white text-[11px]" value={tp}>{tp}</option>
                        ))}
                      </select>
                    </td>

                    {/* Detail Type Input */}
                    <td className="py-1 px-1.5 border border-zinc-800/80">
                      <input 
                        disabled={isExcluded}
                        type="text" 
                        value={row.detailType}
                        onChange={(e) => handleCellChange(row.id, ['detailType'], e.target.value)}
                        className="w-full bg-transparent border-0 focus:ring-1 focus:ring-yellow-500 text-zinc-400 focus:outline-none rounded p-0.5"
                        placeholder="예: 추천형"
                      />
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
                    <td className="py-1 px-1 text-center border border-zinc-800/80">
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
                    <td className={`py-1 px-2 text-center font-extrabold border border-zinc-800/80 text-[10px] ${getAnalysisBadgeColor(row.anal2023)}`}>{row.anal2023}</td>

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
                        {/* 평균: 핵심 에메랄드 강조색 적용 (추정등수에서 가져옴) */}
                        <td className="py-1 px-1 border border-zinc-800/80 bg-emerald-950/25">
                          <input disabled={isExcluded} type="text" value={row.data2025.avgGpa} onChange={e => handleCellChange(row.id, ['data2025', 'avgGpa'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none font-bold p-0.5 text-emerald-400 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-zinc-950/30">
                          <input disabled={isExcluded} type="text" value={row.data2025.stdDev} onChange={e => handleCellChange(row.id, ['data2025', 'stdDev'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-zinc-400 font-mono text-[10px]" />
                        </td>
                        {/* 추정등수: 하이라이트 배경색 제거, 차분한 연회색 */}
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
                        <td className="py-1 px-1 border border-zinc-800/80 bg-zinc-950/30">
                          <input disabled={isExcluded} type="text" value={row.data2025.ratio} onChange={e => handleCellChange(row.id, ['data2025', 'ratio'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-zinc-400 font-mono text-[10px]" />
                        </td>
                      </>
                    )}

                    {/* 2024 Details */}
                    {show2024 && (
                      <>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-zinc-950/30">
                          <input disabled={isExcluded} type="text" value={row.data2024.recruitCount} onChange={e => handleCellChange(row.id, ['data2024', 'recruitCount'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-zinc-400 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-zinc-950/30">
                          <input disabled={isExcluded} type="text" value={row.data2024.minGpa} onChange={e => handleCellChange(row.id, ['data2024', 'minGpa'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-zinc-400 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-zinc-950/30">
                          <input disabled={isExcluded} type="text" value={row.data2024.maxGpa} onChange={e => handleCellChange(row.id, ['data2024', 'maxGpa'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-zinc-400 font-mono text-[10px]" />
                        </td>
                        {/* 평균: 핵심 앰버/오렌지 강조색 적용 (추정등수에서 가져옴) */}
                        <td className="py-1 px-1 border border-zinc-800/80 bg-amber-950/30">
                          <input disabled={isExcluded} type="text" value={row.data2024.avgGpa} onChange={e => handleCellChange(row.id, ['data2024', 'avgGpa'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none font-bold p-0.5 text-amber-400 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-zinc-950/30">
                          <input disabled={isExcluded} type="text" value={row.data2024.stdDev} onChange={e => handleCellChange(row.id, ['data2024', 'stdDev'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-zinc-400 font-mono text-[10px]" />
                        </td>
                        {/* 추정등수: 하이라이트 배경색 제거, 차분한 연회색 */}
                        <td className="py-1 px-1 text-center font-mono font-bold text-zinc-300 bg-zinc-950/30 border border-zinc-800/80 select-none text-[10px]">{row.estRank2024}</td>
                        <td className={`py-1 px-1 text-center font-bold border border-zinc-800/80 select-none text-[10px] ${
                          row.gpaLoc2024 === '상위' ? 'bg-[#064E3B] text-[#D1FAE5]' :
                          row.gpaLoc2024 === '중위' ? 'bg-[#78350F] text-[#FEF3C7]' :
                          row.gpaLoc2024 === '하위' ? 'bg-[#7F1D1D] text-[#FECACA]' : 'text-zinc-650'
                        }`}>{row.gpaLoc2024}</td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-zinc-950/30">
                          <input disabled={isExcluded} type="text" value={row.data2024.cut70} onChange={e => handleCellChange(row.id, ['data2024', 'cut70'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-zinc-400 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-zinc-950/30">
                          <input disabled={isExcluded} type="text" value={row.data2024.chuhapMin} onChange={e => handleCellChange(row.id, ['data2024', 'chuhapMin'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-zinc-400 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-zinc-950/30">
                          <input disabled={isExcluded} type="text" value={row.data2024.chuhapNo} onChange={e => handleCellChange(row.id, ['data2024', 'chuhapNo'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-zinc-400 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-zinc-950/30">
                          <input disabled={isExcluded} type="text" value={row.data2024.ratio} onChange={e => handleCellChange(row.id, ['data2024', 'ratio'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-zinc-400 font-mono text-[10px]" />
                        </td>
                      </>
                    )}

                    {/* 2023 Details */}
                    {show2023 && (
                      <>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-zinc-950/30">
                          <input disabled={isExcluded} type="text" value={row.data2023.recruitCount} onChange={e => handleCellChange(row.id, ['data2023', 'recruitCount'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-zinc-400 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-zinc-950/30">
                          <input disabled={isExcluded} type="text" value={row.data2023.minGpa} onChange={e => handleCellChange(row.id, ['data2023', 'minGpa'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-zinc-400 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-zinc-950/30">
                          <input disabled={isExcluded} type="text" value={row.data2023.maxGpa} onChange={e => handleCellChange(row.id, ['data2023', 'maxGpa'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-zinc-400 font-mono text-[10px]" />
                        </td>
                        {/* 평균: 핵심 장미/로즈 강조색 적용 (추정등수에서 가져옴) */}
                        <td className="py-1 px-1 border border-zinc-800/80 bg-rose-950/30">
                          <input disabled={isExcluded} type="text" value={row.data2023.avgGpa} onChange={e => handleCellChange(row.id, ['data2023', 'avgGpa'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none font-bold p-0.5 text-rose-350 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-zinc-950/30">
                          <input disabled={isExcluded} type="text" value={row.data2023.stdDev} onChange={e => handleCellChange(row.id, ['data2023', 'stdDev'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-zinc-400 font-mono text-[10px]" />
                        </td>
                        {/* 추정등수: 하이라이트 배경색 제거, 차분한 연회색 */}
                        <td className="py-1 px-1 text-center font-mono font-bold text-zinc-300 bg-zinc-950/30 border border-zinc-800/80 select-none text-[10px]">{row.estRank2023}</td>
                        <td className={`py-1 px-1 text-center font-bold border border-zinc-800/80 select-none text-[10px] ${
                          row.gpaLoc2023 === '상위' ? 'bg-[#064E3B] text-[#D1FAE5]' :
                          row.gpaLoc2023 === '중위' ? 'bg-[#78350F] text-[#FEF3C7]' :
                          row.gpaLoc2023 === '하위' ? 'bg-[#7F1D1D] text-[#FECACA]' : 'text-zinc-650'
                        }`}>{row.gpaLoc2023}</td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-zinc-950/30">
                          <input disabled={isExcluded} type="text" value={row.data2023.cut70} onChange={e => handleCellChange(row.id, ['data2023', 'cut70'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-zinc-400 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-zinc-950/30">
                          <input disabled={isExcluded} type="text" value={row.data2023.chuhapMin} onChange={e => handleCellChange(row.id, ['data2023', 'chuhapMin'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-zinc-400 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-zinc-950/30">
                          <input disabled={isExcluded} type="text" value={row.data2023.chuhapNo} onChange={e => handleCellChange(row.id, ['data2023', 'chuhapNo'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-zinc-400 font-mono text-[10px]" />
                        </td>
                        <td className="py-1 px-1 border border-zinc-800/80 bg-zinc-950/30">
                          <input disabled={isExcluded} type="text" value={row.data2023.ratio} onChange={e => handleCellChange(row.id, ['data2023', 'ratio'], e.target.value)} className="w-full bg-transparent border-0 text-center focus:outline-none p-0.5 text-zinc-400 font-mono text-[10px]" />
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
