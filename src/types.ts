/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GradeItem {
  semester: string; // '1-1', '1-2', '2-1', '2-2', '3-1'
  subject: string;  // 과목명 (국어, 수학, 영어, 한국사, 통합사회, 통합과학, 물리, 경제 등)
  unit: number;     // 단위수
  rank: number;     // 석차등급 (1 ~ 9)
}

export interface MockGradeItem {
  date: string;     // '3월', '4월', '6월', '7월', '9월', '10월'
  korean: number;   // 국어 등급 (표준점수, 백분위는 계산식이나 더미 제공)
  koreanScore: number; // 표준점수
  koreanPercentile: number; // 백분위
  koreanSubj?: string; // 국어 세부과목 (예: 화법과작문, 언어와매체)
  math: number;     // 수학 등급
  mathScore: number;
  mathPercentile: number;
  mathSubj?: string; // 수학 세부과목 (예: 확률과통계, 미적분, 기하)
  english: number;  // 영어 등급 (절대평가)
  history: number;  // 한국사 등급
  exploration1: string; // 탐구1 과목명
  exploration1Grade: number; // 탐구1 등급
  exploration1Score: number;
  exploration1Percentile: number;
  exploration2: string; // 탐구2 과목명
  exploration2Grade: number; // 탐구2 등급
  exploration2Score: number;
  exploration2Percentile: number;
}

export interface StudentChoice {
  collegeName: string;
  major: string;
  applyType: '학생부교과' | '학생부종합' | '논술';
  suitability: '안정' | '적정' | '소신' | '우려' | '불가';
  targetGpa: number; // 대학의 합격 컷 평균
}

export interface Student {
  id: string;        // 학번 (예: 3101)
  name: string;      // 이름
  cls: number;       // 반 (1 ~ 8)
  num: number;       // 번호
  teacherName: string; // 담임 교사명 (예: 이홍필 선생님)
  gpa: number;       // 전과목 내신 평균
  semesterGpas: { [key: string]: number }; // 학기별 평균 내신
  grades: GradeItem[];
  mockGrades: MockGradeItem[];
  targetColleges: StudentChoice[];
  memo?: string; // 교사용 비공개 상담 메모
}

export interface College {
  id: string;
  name: string;
  major: string;
  group: '인문' | '자연';
  applyType: '학생부교과' | '학생부종합' | '논술';
  cutLine: number; // 평균 합격 컷 등급
  ratioKorean: number; // 국어 반영 비율 %
  ratioMath: number;   // 수학 반영 비율 %
  ratioEnglish: number;// 영어 반영 비율 %
  ratioSocial: number; // 사회 반영 비율 %
  ratioScience: number;// 과학 반영 비율 %
  criteria: string;    // 선발 방법 설명 (예: 교과 100% / 수능 최저학력기준 있음)
}

export interface CMSArticle {
  id: string;
  title: string;
  content: string;
  category: '공지사항' | '입시 정보' | '상담 자료' | '합격 사례';
  date: string;
  author: string;
  views: number;
}

export interface AppSettings {
  siteName: string;
  primaryColor: string; // Hex code 예: #D4AF37
  bannerTitle: string;
  bannerSubtitle: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  socialShareTitle: string;
  socialShareDesc: string;
}

export interface UserSession {
  role: 'student' | 'teacher' | 'admin' | null;
  id: string | null;   // 학번 또는 교사명 또는 'admin'
  name: string | null; // 실제 이름
  cls?: number;        // 교사인 경우 담임하는 반 (1 ~ 8), 학생인 경우 본인의 반
}
