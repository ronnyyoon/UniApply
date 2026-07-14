/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, College, CMSArticle, AppSettings, GradeItem, MockGradeItem, StudentChoice } from './types';
import { RAW_MOCK_3, RAW_MOCK_5, RAW_MOCK_6 } from './mockDataRaw';

// 3학년 전체 명렬표 데이터 원본 (CSV 형식 멀티라인 문자열)
export const RAW_STUDENT_LIST = `담임,학번,이름
이홍필 선생님,3101,강성민
이홍필 선생님,3102,강지원
이홍필 선생님,3103,김강륜
이홍필 선생님,3104,김규현
이홍필 선생님,3105,김민찬
이홍필 선생님,3106,김성수
이홍필 선생님,3107,김수영
이홍필 선생님,3108,김유빈
이홍필 선생님,3109,김형준
이홍필 선생님,3110,박지환
이홍필 선생님,3111,배성민
이홍필 선생님,3112,선우진
이홍필 선생님,3113,양지혁
이홍필 선생님,3114,용호륜
이홍필 선생님,3115,정승환
이홍필 선생님,3116,정지용
이홍필 선생님,3117,조민찬
이홍필 선생님,3118,차유건
이홍필 선생님,3119,최태영
이홍필 선생님,3120,추범규
이홍필 선생님,3121,한율
김대건 선생님,3201,김건우
김대건 선생님,3202,김다운
김대건 선생님,3203,김송현
김대건 선생님,3204,김시우
김대건 선생님,3205,김재훈
김대건 선생님,3206,김태완
김대건 선생님,3207,김홍석
김대건 선생님,3208,남민규
김대건 선생님,3209,마승인
김대건 선생님,3210,문민혁
김대건 선생님,3211,박수완
김대건 선생님,3212,박종혁
김대건 선생님,3213,송우진
김대건 선생님,3214,안희민
김대건 선생님,3215,오현빈
김대건 선생님,3216,이선재
김대건 선생님,3217,이정우
김대건 선생님,3218,이준서
김대건 선생님,3219,임종혁
김대건 선생님,3220,정지호
김대건 선생님,3221,정하람
문국식 선생님,3301,김성진
문국식 선생님,3302,김시우
문국식 선생님,3303,김은호
문국식 선생님,3304,김재현
문국식 선생님,3305,김재환
문국식 선생님,3306,김하리
문국식 선생님,3307,박현진
문국식 선생님,3308,배준성
문국식 선생님,3309,신혜성
문국식 선생님,3310,윤현승
문국식 선생님,3311,이승규
문국식 선생님,3312,이지운
문국식 선생님,3313,임원준
문국식 선생님,3314,임율
문국식 선생님,3315,장하늘
문국식 선생님,3316,정석영
문국식 선생님,3317,조승우
문국식 선생님,3318,천지훈
문국식 선생님,3319,최윤석
문국식 선생님,3320,최주원
문국식 선생님,3321,황이찬
윤득경 선생님,3401,강경훈
윤득경 선생님,3402,권의준
윤득경 선생님,3403,김강준
윤득경 선생님,3404,김건우
윤득경 선생님,3405,김시우
윤득경 선생님,3406,김요한
윤득경 선생님,3407,김진우
윤득경 선생님,3408,김태원
윤득경 선생님,3409,김한결
윤득경 선생님,3410,김현우
윤득경 선생님,3411,문성원
윤득경 선생님,3412,박병현
윤득경 선생님,3413,박세영
윤득경 선생님,3414,박영웅
윤득경 선생님,3415,백경탁
윤득경 선생님,3416,서지한
윤득경 선생님,3417,서태민
윤득경 선생님,3418,송우혁
윤득경 선생님,3419,오수빈
윤득경 선생님,3420,원종운
윤득경 선생님,3421,유시우
윤득경 선생님,3422,윤주혁
윤득경 선생님,3423,이민찬
윤득경 선생님,3424,이우준
윤득경 선생님,3425,이정호
윤득경 선생님,3426,장은찬
윤득경 선생님,3427,장현수
윤득경 선생님,3428,정세웅
윤득경 선생님,3429,조준호
윤득경 선생님,3430,조현재
윤득경 선생님,3431,한승우
손세영 선생님,3501,김민준
손세영 선생님,3502,김선웅
손세영 선생님,3503,김승규
손세영 선생님,3504,김인호
손세영 선생님,3505,김주영
손세영 선생님,3506,김준성
손세영 선생님,3507,김지승
손세영 선생님,3508,김지후
손세영 선생님,3509,김지훈
손세영 선생님,3510,김태완
손세영 선생님,3511,박도민
손세영 선생님,3512,박준후
손세영 선생님,3513,박진오
손세영 선생님,3514,박진혁
손세영 선생님,3515,서예준
손세영 선생님,3516,안형준
손세영 선생님,3517,양민후
손세영 선생님,3518,오시후
손세영 선생님,3519,오정헌
손세영 선생님,3520,왕여준
손세영 선생님,3521,이기범
손세영 선생님,3522,이명호
손세영 선생님,3523,이준영
손세영 선생님,3524,장한결
손세영 선생님,3525,정민교
손세영 선생님,3526,정우성
손세영 선생님,3527,정재민
손세영 선생님,3528,정태진
손세영 선생님,3529,황규빈
손세영 선생님,3530,황주원
이성아 선생님,3601,강민재
이성아 선생님,3602,강승균
이성아 선생님,3603,김민성
이성아 선생님,3604,김성명
이성아 선생님,3605,김승호
이성아 선생님,3606,김진우
이성아 선생님,3607,류수한
이성아 선생님,3608,문지후
이성아 선생님,3609,서재영
이성아 선생님,3610,송주효
이성아 선생님,3611,윤미르
이성아 선생님,3612,이문기
이성아 선생님,3613,이태욱
이성아 선생님,3614,임종운
이성아 MSM,3615,장우현
이성아 선생님,3616,장준희
이성아 선생님,3617,전하랑
이성아 선생님,3618,조은혁
이성아 선생님,3619,진예단
김기연 선생님,3701,강민건
김기연 선생님,3702,김현성
김기연 선생님,3703,김형욱
김기연 선생님,3704,류재민
김기연 선생님,3705,박재범
김기연 선생님,3706,박종수
김기연 선생님,3707,서형주
김기연 선생님,3708,우승진
김기연 선생님,3709,이민우
김기연 선생님,3710,이승민
김기연 선생님,3711,이정우
김기연 선생님,3712,정안성
김기연 선생님,3713,정원석
김기연 선생님,3714,조우성
김기연 선생님,3715,주정민
김기연 선생님,3716,주찬욱
김기연 선생님,3717,최병언
김기연 선생님,3718,최인열
김기연 선생님,3719,최치원
윤재성 선생님,3801,고상혁
윤재성 선생님,3802,고준혁
윤재성 선생님,3803,권성음
윤재성 선생님,3804,김도헌
윤재성 선생님,3805,김영동
윤재성 선생님,3806,김은후
윤재성 선생님,3807,김준명
윤재성 선생님,3808,김지석
윤재성 선생님,3809,김혜성
윤재성 선생님,3810,김혜환
윤재성 선생님,3811,김희창
윤재성 선생님,3812,문준휘
윤재성 선생님,3813,박주찬
윤재성 선생님,3814,박하윤
윤재성 선생님,3815,신현우
윤재성 선생님,3816,오주호
윤재성 선생님,3817,옥윤수
윤재성 선생님,3818,유동현
윤재성 선생님,3819,윤현서
윤재성 선생님,3820,이준우
윤재성 선생님,3821,이효일
윤재성 선생님,3822,임강혁`;

// 교사 정보 목록 및 담당 학반
export const TEACHERS = [
  { id: '이홍필', name: '이홍필', cls: 1, title: '3학년 1반 담임' },
  { id: '김대건', name: '김대건', cls: 2, title: '3학년 2반 담임' },
  { id: '문국식', name: '문국식', cls: 3, title: '3학년 3반 담임' },
  { id: '윤득경', name: '윤득경', cls: 4, title: '3학년 4반 담임' },
  { id: '손세영', name: '손세영', cls: 5, title: '3학년 5반 담임' },
  { id: '이성아', name: '이성아', cls: 6, title: '3학년 6반 담임' },
  { id: '김기연', name: '김기연', cls: 7, title: '3학년 7반 담임' },
  { id: '윤재성', name: '윤재성', cls: 8, title: '3학년 8반 담임' },
];

// 간단한 결정론적 의사 난수 생성기 (해시 기반 시드)
function seedRandom(seedStr: string): () => number {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

// 2027학년도 주요 대학 및 학과 기본 정보
export const COLLEGES: College[] = [
  {
    id: 'snu_1',
    name: '서울대학교',
    major: '컴퓨터공학부',
    group: '자연',
    applyType: '학생부종합',
    cutLine: 1.25,
    ratioKorean: 25,
    ratioMath: 40,
    ratioEnglish: 0, // 영어는 등급 감점식
    ratioScience: 35,
    ratioSocial: 0,
    criteria: '서류평가 100% (단계별 전형: 1단계 서류 2배수, 2단계 면접 30% 합산), 수능 최저학력기준 없음(지역균형은 있음)',
  },
  {
    id: 'snu_2',
    name: '서울대학교',
    major: '경영학과',
    group: '인문',
    applyType: '학생부종합',
    cutLine: 1.30,
    ratioKorean: 33,
    ratioMath: 33,
    ratioEnglish: 0,
    ratioScience: 0,
    ratioSocial: 34,
    criteria: '서류평가 100% 및 심층면접 실시. 학생부 종합평가',
  },
  {
    id: 'yonsei_1',
    name: '연세대학교',
    major: '신소재공학부',
    group: '자연',
    applyType: '학생부교과',
    cutLine: 1.42,
    ratioKorean: 20,
    ratioMath: 35,
    ratioEnglish: 10,
    ratioScience: 35,
    ratioSocial: 0,
    criteria: '학생부 교과 100% (추천형, 면접 폐지 및 수능최저 적용: 국수영탐 중 2개 등급 합 5 이내)',
  },
  {
    id: 'yonsei_2',
    name: '연세대학교',
    major: '경제학부',
    group: '인문',
    applyType: '학생부교과',
    cutLine: 1.38,
    ratioKorean: 30,
    ratioMath: 30,
    ratioEnglish: 10,
    ratioScience: 0,
    ratioSocial: 30,
    criteria: '학생부 교과 100% (대표적인 학생부 추천 전형, 면접 없이 수능 수능최저 충족 시 우선 선발)',
  },
  {
    id: 'korea_1',
    name: '고려대학교',
    major: '기계공학부',
    group: '자연',
    applyType: '학생부교과',
    cutLine: 1.50,
    ratioKorean: 20,
    ratioMath: 35,
    ratioEnglish: 15,
    ratioScience: 30,
    ratioSocial: 0,
    criteria: '학교추천 전형 (학생부 교과 80% + 서류 20% 일괄합산, 수능최저: 3개 영역 등급 합 7 이내 및 한국사 4등급)',
  },
  {
    id: 'korea_2',
    name: '고려대학교',
    major: '행정학과',
    group: '인문',
    applyType: '학생부종합',
    cutLine: 1.75,
    ratioKorean: 30,
    ratioMath: 25,
    ratioEnglish: 20,
    ratioScience: 0,
    ratioSocial: 25,
    criteria: '학업우수자 전형 (서류 100%, 수능최저기준 매우 높음: 국수영탐 4개 영역 등급 합 8 이내)',
  },
  {
    id: 'sogang_1',
    name: '서강대학교',
    major: '전자공학과',
    group: '자연',
    applyType: '학생부교과',
    cutLine: 1.62,
    ratioKorean: 25,
    ratioMath: 35,
    ratioEnglish: 15,
    ratioScience: 25,
    ratioSocial: 0,
    criteria: '지역균형 전형 (교과 90% + 출결 10%, 수능최저: 국수영탐 중 3개 과목 각 3 등급 이내)',
  },
  {
    id: 'skku_1',
    name: '성균관대학교',
    major: '반도체시스템공학과',
    group: '자연',
    applyType: '학생부종합',
    cutLine: 1.45,
    ratioKorean: 20,
    ratioMath: 40,
    ratioEnglish: 0,
    ratioScience: 40,
    ratioSocial: 0,
    criteria: '학생부종합(학과모집): 서류 100% 및 수능 최저학력 기준 없음 (미래 인재 집중 육성형)',
  },
  {
    id: 'skku_2',
    name: '성균관대학교',
    major: '정치외교학과',
    group: '인문',
    applyType: '학생부교과',
    cutLine: 1.68,
    ratioKorean: 30,
    ratioMath: 25,
    ratioEnglish: 15,
    ratioSocial: 30,
    ratioScience: 0,
    criteria: '학교추천 전형 (정량교과 80% + 정성평가 20%), 수능최저: 국수영탐 중 3개 합 7 이내',
  },
  {
    id: 'hanyang_1',
    name: '한양대학교',
    major: '융합전자공학부',
    group: '자연',
    applyType: '학생부교과',
    cutLine: 1.35,
    ratioKorean: 15,
    ratioMath: 40,
    ratioEnglish: 10,
    ratioScience: 35,
    ratioSocial: 0,
    criteria: '추천형 (교과 90% + 교과정성 10%), 2027 수능최저 신설: 국수영탐(1) 중 3개 등급 합 7 이내',
  },
  {
    id: 'hanyang_2',
    name: '한양대학교',
    major: '미디어커뮤니케이션학과',
    group: '인문',
    applyType: '학생부종합',
    cutLine: 1.95,
    ratioKorean: 35,
    ratioMath: 20,
    ratioEnglish: 20,
    ratioSocial: 25,
    ratioScience: 0,
    criteria: '종합(추천형): 학생부 정성 평가 100%, 학생부의 종합적 이수 현황과 세부능력 및 특기사항 집중 분석',
  },
  {
    id: 'cau_1',
    name: '중앙대학교',
    major: '소프트웨어학부',
    group: '자연',
    applyType: '학생부종합',
    cutLine: 1.85,
    ratioKorean: 20,
    ratioMath: 35,
    ratioEnglish: 15,
    ratioScience: 30,
    ratioSocial: 0,
    criteria: 'CAU융합형인재 (1단계 서류 100%로 3.5배수 선발 후, 2단계 면접 20% 반영), 수능최저 없음',
  },
  {
    id: 'cau_2',
    name: '중앙대학교',
    major: '경영학부(글로벌금융)',
    group: '인문',
    applyType: '학생부교과',
    cutLine: 1.60,
    ratioKorean: 30,
    ratioMath: 30,
    ratioEnglish: 10,
    ratioSocial: 30,
    ratioScience: 0,
    criteria: '지역균형 (교과 90% + 비교과 10%), 수능최저: 국수영탐 3개 영역 등급 합 7 이내',
  },
  {
    id: 'khu_1',
    name: '경희대학교',
    major: '정보디스플레이학과',
    group: '자연',
    applyType: '학생부종합',
    cutLine: 1.90,
    ratioKorean: 20,
    ratioMath: 35,
    ratioEnglish: 15,
    ratioScience: 30,
    ratioSocial: 0,
    criteria: '네오르네상스 전형 (서류 70% + 면접 30%), 단수 면접 및 수능최저 없음. 학생부 서류 연계성 점검',
  },
  {
    id: 'khu_2',
    name: '경희대학교',
    major: '국어국문학과',
    group: '인문',
    applyType: '학생부교과',
    cutLine: 1.78,
    ratioKorean: 35,
    ratioMath: 20,
    ratioEnglish: 15,
    ratioSocial: 30,
    ratioScience: 0,
    criteria: '지역균형 전형 (교과 및 비교과 100%), 수능최저: 국수영탐(1) 중 2개 영역 등급 합 5 이내',
  },
  {
    id: 'uofs_1',
    name: '서울시립대학교',
    major: '도시행정학과',
    group: '인문',
    applyType: '학생부종합',
    cutLine: 1.82,
    ratioKorean: 30,
    ratioMath: 25,
    ratioEnglish: 20,
    ratioSocial: 25,
    ratioScience: 0,
    criteria: '학생부종합전형I(면접형): 서류 100%(3배수) 후 면접 40% 합산 반영',
  },
  {
    id: 'konkuk_1',
    name: '건국대학교',
    major: '생명과학특성학과',
    group: '자연',
    applyType: '학생부종합',
    cutLine: 2.15,
    ratioKorean: 20,
    ratioMath: 30,
    ratioEnglish: 15,
    ratioScience: 35,
    ratioSocial: 0,
    criteria: 'KU자기추천 전형: 서류 70% + 면접 30% 합산, 대표적인 학종형 전형으로 수능최저학력기준 없음',
  },
  {
    id: 'dongguk_1',
    name: '동국대학교',
    major: '경찰행정학부',
    group: '인문',
    applyType: '학생부교과',
    cutLine: 1.55,
    ratioKorean: 30,
    ratioMath: 25,
    ratioEnglish: 15,
    ratioSocial: 30,
    ratioScience: 0,
    criteria: '학교추천인재 (교과 70% + 서류 30% 정성평가), 동국대 전통의 최고 인기 학과',
  },
  {
    id: 'kookmin_1',
    name: '국민대학교',
    major: '자동차융합대학',
    group: '자연',
    applyType: '학생부교과',
    cutLine: 2.24,
    ratioKorean: 20,
    ratioMath: 35,
    ratioEnglish: 20,
    ratioScience: 25,
    ratioSocial: 0,
    criteria: '교과성적우수자 전형: 교과 100%, 수능최저: 국수영탐(1) 중 2개 합 6 이내',
  }
];

// 예시 CMS 게시판 글 (더미 데이터)
export const INITIAL_ARTICLES: CMSArticle[] = [
  {
    id: 'art_1',
    title: '★ [필독] 2027학년도 주요 대학 수시모집 핵심 변경 사항 안내',
    content: `안녕하세요. 3학년 진학지도부입니다.
2027학년도 대학 수시 모집요강 발표에 따른 우리 학교 학생들을 위한 핵심 요약 분석자료입니다.

현재 고3 학생들에게 적용되는 주요 변화는 다음과 같습니다:

1. **연세대학교 학생부교과(추천형) 전형 변경**:
   - 면접 평가가 전면 폐지되었으며, 학생부 교과 100% 일괄 합산 방식으로 전환되었습니다.
   - 단, 수능 최저학력기준(국수영탐 2개 영역 합 5 이내, 영어 3등급 이내 등)이 적용되므로, 6월 및 9월 모의평가 성적 관리가 최우선입니다.

2. **한양대학교 전형 개편**:
   - 기존의 수능 최저가 없던 교과 전형과 학종 전형 다수에 '수능 최저학력기준'이 드디어 신설되었습니다.
   - 교과(추천형) 및 종합(추천형) 전형 합격 여부는 수능 등급 삼합 7(또는 탐구 1과목 반영 등) 충족에 전적으로 걸려 있습니다.
   
3. **학생부종합전형의 진로선택과목 이수 현황 반영 강화**:
   - 서강대, 성균관대, 중앙대 등은 전 학년의 수학 및 과학/사회 진로선택과목 이수 내역 및 전공 적합성 세부 성취도를 서류평가의 최고 배점으로 반영합니다.

상세 파일은 행정실 앞 입시 정보 게판 및 아래 첨부한 한 장 요약본을 확인하시어 기말고사 준비에 끝까지 매진해 주십시오.`,
    category: '입시 정보',
    date: '2026-05-20',
    author: '진학지도부장',
    views: 142,
  },
  {
    id: 'art_2',
    title: '[공지] 6월 수능 모의평가 사후 분석 및 개인별 삼자 대면 상담 주간 운영',
    content: `6월 4일(목) 개최되는 한국교육과정평가원 주관 수능 모의평가 안내입니다.

수시 지원 여부를 판단하는 가장 정밀한 지표가 되는 시험인 만큼, 수험생들은 전력을 다해주시기 바랍니다. 시험 종료 후 각 담임 선생님께서는 개인 가채점 점수 및 모의고사 성적표 데이터를 이 시스템 상에 완벽 기입해 주시기 바랍니다.

- **상담 주간**: 6월 8일(월) ~ 6월 19일(금), 방과 후 야간 자율학습 시간
- **대상**: 3학년 전체 학생 및 학부모 1인 필수 동반 가능
- **상담 내용**: 3학년 1학기 지필평가 중간 종합 성적 환산 결과 + 6월 모평 성적 기반 수시 6장 최적 카드(상향/적정/하향) 도출

교실별 상담 신청 슬롯은 3학년 층 게시판에 부착되었으니 선착순으로 접수 바랍니다.`,
    category: '공지사항',
    date: '2026-05-25',
    author: '3학년 학년부장',
    views: 189,
  },
  {
    id: 'art_3',
    title: '[상담 자료] 3등급 중반 수험생을 위한 학생부종합 전형 돌파 전략 가이드',
    content: `내신 3.0 ~ 3.7 등급 사이에 위치한 일반고 자연계열 학생들의 입시 돌파구 안내 자료입니다.

주요 합격 전략 요약:
1. **학생부 세특의 전공 구체화**:
   - 단순히 지식을 나열하지 말고, 자율 탐구 활동에서 자신의 진로(예: 인공지능, 생명신소재)에 관련된 확장 주제 활동을 드러내야 합니다.
2. **수능최저학력기준이 있는 학생부교과 우회 전략**:
   - 3등급 중반이어도 홍익대, 국민대, 가천대 등 2개 합 6~7등급의 적정 무난한 수능 최저학력기준이 걸려 있는 전형은 이월 및 수능 미충족 인원으로 인해 최종 컷이 대폭 내려갑니다.
3. **논술 전형의 병행 검토**:
   - 수학적 기초 역량이 우수한 자연계 학생이라면 3학년 내신을 더 이상 상향하기 어려울 시 약술형 논술(가천대, 삼육대 등)이나 정통 논술(인하대, 아주대 등) 서브 카드를 1~2개 섞는 것이 안정적입니다.
   
본 상세 책자는 교무실에 비치되어 있으니 관심 있는 학생들은 언제든 대여 가능합니다.`,
    category: '상담 자료',
    date: '2026-05-26',
    author: '진학지도부',
    views: 95,
  },
  {
    id: 'art_4',
    title: '★ [합격사례] 2026학년도 내신 2.45 등급 고려대 학생부종합(학업우수형) 기적의 합격 수기',
    content: `■ 2026학년도 고려대학교 신소재공학부 합격 사례 (일반고 내신 2.45 등급)

1. **합격 요인 분석**:
   - **학업 성취 추이**: 1학년 1학기 2.98등급 -> 2학년 2학기 2.12등급 -> 3학년 1학기 1.84등급으로 꾸준하고 가파른 우상향 곡선을 그렸음.
   - **세특 강점**: 화학II, 물리학II 교과에서 에너지 소자 효율 개선 및 배터리 전해액 활성화 이론에 대해 연계 보고서를 직접 작성하여, 세부 특기사항에 전공 역량이 아주 높게 기록됨.
   - **결정적 요인(수능최저 충족)**: 4개 영역 등급 합 8 이내라는 매우 까다로우리만치 높은 최저기준을 6, 9월 모평 실패 후 수능 당일 기적으로 충족하여 실질 경쟁률을 뚫고 최종 합격함.

2. **후배들에게 주는 조언**:
   "학교 내신 등급 숫자에 일희일비해서 교과를 포기하지 마세요. 1학년 때 성적이 안 좋았어도 전공 관련 심화 탐구를 끝까지 챙기는 '우상향' 흔적을 세특에 남기면, 명문 대학 입학사정관들의 눈을 분명히 사로잡을 수 있습니다. 그리고 절대로 수능 공부를 병행하지 않는 학종은 반쪽짜리에 불과하다는 점을 잊지 마세요!"`,
    category: '합격 사례',
    date: '2026-05-26',
    author: '2026년 수석졸업생',
    views: 254,
  }
];

// 이홍필 등 교사의 아이디 비밀번호 룰
// 아이디: 교사이름 (ex. 이홍필)
// 비밀번호: 학년반00 (3학년 5반 담임 손세영 -> 3500)
// 학생: 아이디: 강성민, 비밀번호: 3101

function parseMockCsv(csvContent: string): Record<string, any> {
  const result: Record<string, any> = {};
  const lines = csvContent.trim().split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    const id = parts[0]?.trim();
    if (!id || isNaN(Number(id))) continue; // Skip headers
    
    // Check if absent or empty
    const hasRecord = parts[2] !== undefined && parts[2] !== '' && parts[2] !== '0';
    if (!hasRecord) {
      result[id] = null;
      continue;
    }
    
    result[id] = {
      koreanSubj: parts[2]?.trim(),
      koreanScore: parts[3] ? (parseInt(parts[3]) || 0) : 0,
      koreanPercentile: parts[4] ? (parseInt(parts[4]) || 0) : 0,
      korean: parts[5] ? (parseInt(parts[5]) || 0) : 0,
      
      mathSubj: parts[6]?.trim(),
      mathScore: parts[7] ? (parseInt(parts[7]) || 0) : 0,
      mathPercentile: parts[8] ? (parseInt(parts[8]) || 0) : 0,
      math: parts[9] ? (parseInt(parts[9]) || 0) : 0,
      
      english: parts[10] ? (parseInt(parts[10]) || 0) : 0,
      
      exp1Subj: parts[11]?.trim(),
      exp1Score: parts[12] ? (parseInt(parts[12]) || 0) : 0,
      exp1Percentile: parts[13] ? (parseInt(parts[13]) || 0) : 0,
      exp1Grade: parts[14] ? (parseInt(parts[14]) || 0) : 0,
      
      exp2Subj: parts[15]?.trim(),
      exp2Score: parts[16] ? (parseInt(parts[16]) || 0) : 0,
      exp2Percentile: parts[17] ? (parseInt(parts[17]) || 0) : 0,
      exp2Grade: parts[18] ? (parseInt(parts[18]) || 0) : 0,
      
      history: parts[19] ? (parseInt(parts[19]) || 0) : 0,
    };
  }
  return result;
}

const parsedMock3 = parseMockCsv(RAW_MOCK_3);
const parsedMock5 = parseMockCsv(RAW_MOCK_5);
const parsedMock6 = parseMockCsv(RAW_MOCK_6);

// 명렬표 행을 파싱하여 정적 학생 리스트로 전환 및 랜덤 성적 시드 부여
export function buildStudentsFromRaw(): Student[] {
  const lines = RAW_STUDENT_LIST.trim().split('\n');
  const headers = lines[0].split(','); // 담임,학번,이름
  const students: Student[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const [teacherName, id, name] = line.split(',');
    
    // 학번 파싱 (ex. 3101 -> 반: 1반, 번호: 1번)
    const cls = parseInt(id.substring(1, 2));
    const num = parseInt(id.substring(2, 4));

    // 해시 기반 데이터 생성을 위한 시드
    const rng = seedRandom(id + name);
    
    // 1대1 교과성적 및 전체 내신 등급(2.0 ~ 4.8 범위로 고정, 일부 우수 학생 1.1~1.9 부여)
    const baseGpaSelector = rng();
    let gpa = 2.0 + baseGpaSelector * 2.8; 
    // 일부 고학번 우수생 특화
    if (num <= 3) {
      gpa = 1.1 + baseGpaSelector * 0.8;
    } else if (num >= 25) {
      gpa = 3.5 + baseGpaSelector * 1.4;
    }
    gpa = Math.round(gpa * 100) / 100;

    // 학학기별 내신 성적 생성 (약간의 변동폭 제공)
    const semesters = ['1-1', '1-2', '2-1', '2-2', '3-1'];
    const semesterGpas: Record<string, number> = {};
    semesters.forEach((sem, idx) => {
      // 우상향 또는 우하향 성격 부여
      const trend = (idx - 2) * (rng() - 0.5) * 0.3; // -0.3 ~ 0.3 변리
      const semGpa = Math.min(9.0, Math.max(1.0, gpa + trend));
      semesterGpas[sem] = Math.round(semGpa * 100) / 100;
    });

    // 개별 교과 성적(GradeItem) 복합 생성
    const grades: GradeItem[] = [];
    const subjects = [
      { name: '국어', units: [4, 4, 4, 4, 4] },
      { name: '수학', units: [4, 4, 4, 4, 4] },
      { name: '영어', units: [4, 4, 4, 4, 4] },
      { name: '한국사', units: [2, 2, 2, 2, 1] },
      { name: '사회교과', units: [3, 3, 4, 4, 3] },
      { name: '과학교과', units: [3, 3, 4, 4, 3] },
    ];

    semesters.forEach(sem => {
      subjects.forEach((subj, sIdx) => {
        const semGpa = semesterGpas[sem];
        const offset = (rng() - 0.5) * 1.5; // +/- 0.75
        const itemGrade = Math.min(9, Math.max(1, Math.round(semGpa + offset)));
        
        grades.push({
          semester: sem,
          subject: subj.name,
          unit: subj.units[semesters.indexOf(sem)],
          rank: itemGrade
        });
      });
    });

    // 모의고사 성적(3, 5, 6, 7, 9, 10월)
    const m3 = parsedMock3[id];
    const m5 = parsedMock5[id];
    const m6 = parsedMock6[id];

    const mockDates = ['3월', '5월', '6월', '7월', '9월', '10월'];
    const mockGrades: MockGradeItem[] = mockDates.map((date) => {
      if (date === '3월' && m3) {
        return {
          date: '3월',
          korean: m3.korean,
          koreanScore: m3.koreanScore,
          koreanPercentile: m3.koreanPercentile,
          koreanSubj: m3.koreanSubj || (cls >= 5 ? '언어와매체' : '화법과작문'),
          math: m3.math,
          mathScore: m3.mathScore,
          mathPercentile: m3.mathPercentile,
          mathSubj: m3.mathSubj || (cls >= 5 ? '미적분' : '확률과통계'),
          english: m3.english,
          history: m3.history,
          exploration1: m3.exp1Subj || (cls >= 5 ? '물리학I' : '생활과윤리'),
          exploration1Grade: m3.exp1Grade,
          exploration1Score: m3.exp1Score,
          exploration1Percentile: m3.exp1Percentile,
          exploration2: m3.exp2Subj || (cls >= 5 ? '생명과학I' : '사회문화'),
          exploration2Grade: m3.exp2Grade,
          exploration2Score: m3.exp2Score,
          exploration2Percentile: m3.exp2Percentile,
        };
      } else if (date === '5월' && m5) {
        return {
          date: '5월',
          korean: m5.korean,
          koreanScore: m5.koreanScore,
          koreanPercentile: m5.koreanPercentile,
          koreanSubj: m5.koreanSubj || (cls >= 5 ? '언어와매체' : '화법과작문'),
          math: m5.math,
          mathScore: m5.mathScore,
          mathPercentile: m5.mathPercentile,
          mathSubj: m5.mathSubj || (cls >= 5 ? '미적분' : '확률과통계'),
          english: m5.english,
          history: m5.history,
          exploration1: m5.exp1Subj || (cls >= 5 ? '물리학I' : '생활과윤리'),
          exploration1Grade: m5.exp1Grade,
          exploration1Score: m5.exp1Score,
          exploration1Percentile: m5.exp1Percentile,
          exploration2: m5.exp2Subj || (cls >= 5 ? '생명과학I' : '사회문화'),
          exploration2Grade: m5.exp2Grade,
          exploration2Score: m5.exp2Score,
          exploration2Percentile: m5.exp2Percentile,
        };
      } else if (date === '6월' && m6) {
        return {
          date: '6월',
          korean: m6.korean,
          koreanScore: m6.koreanScore,
          koreanPercentile: m6.koreanPercentile,
          koreanSubj: m6.koreanSubj || (cls >= 5 ? '언어와매체' : '화법과작문'),
          math: m6.math,
          mathScore: m6.mathScore,
          mathPercentile: m6.mathPercentile,
          mathSubj: m6.mathSubj || (cls >= 5 ? '미적분' : '확률과통계'),
          english: m6.english,
          history: m6.history,
          exploration1: m6.exp1Subj || (cls >= 5 ? '물리학I' : '생활과윤리'),
          exploration1Grade: m6.exp1Grade,
          exploration1Score: m6.exp1Score,
          exploration1Percentile: m6.exp1Percentile,
          exploration2: m6.exp2Subj || (cls >= 5 ? '생명과학I' : '사회문화'),
          exploration2Grade: m6.exp2Grade,
          exploration2Score: m6.exp2Score,
          exploration2Percentile: m6.exp2Percentile,
        };
      } else {
        // 6월, 7월, 9월, 10월 등 미지정/대기 성적 (추후 업로드 예정)
        return {
          date,
          korean: 0,
          koreanScore: 0,
          koreanPercentile: 0,
          koreanSubj: cls >= 5 ? '언어와매체' : '화법과작문',
          math: 0,
          mathScore: 0,
          mathPercentile: 0,
          mathSubj: cls >= 5 ? '미적분' : '확률과통계',
          english: 0,
          history: 0,
          exploration1: cls >= 5 ? '물리학I' : '생활과윤리',
          exploration1Grade: 0,
          exploration1Score: 0,
          exploration1Percentile: 0,
          exploration2: cls >= 5 ? '생명과학I' : '사회문화',
          exploration2Grade: 0,
          exploration2Score: 0,
          exploration2Percentile: 0,
        };
      }
    });

    // 개별 학생의 대학 수시 지원 시뮬레이션 설정 (3~4개씩 배치)
    const targetColleges: StudentChoice[] = [];
    const filteredColleges = COLLEGES.filter(col => {
      // 학생 계열에 맞춘 대학 학과 매칭
      const isNatural = cls >= 5;
      return isNatural ? col.group === '자연' : col.group === '인문';
    });

    // 학생 내신과 대학 컷 비례하여 합격 가능성 성향 배치
    filteredColleges.forEach((col, cIdx) => {
      const difference = gpa - col.cutLine;
      let suitability: '안정' | '적정' | '소신' | '우려' | '불가' = '적정';
      
      if (difference < -0.8) suitability = '불가';
      else if (difference < -0.4) suitability = '불가';
      else if (difference < -0.2) suitability = '우려';
      else if (difference < -0.05) suitability = '소신';
      else if (difference <= 0.15) suitability = '적정';
      else suitability = '안정';

      targetColleges.push({
        collegeName: col.name,
        major: col.major,
        applyType: col.applyType,
        suitability,
        targetGpa: col.cutLine
      });
    });

    // 최대 4개까지만 정렬 보관
    const sortedTargets = targetColleges.sort(() => rng() - 0.5).slice(0, 4);

    // 개별 학생의 교사 종합 비공개 메모 생성
    const memos = [
      `수능 최저만 맞추면 무난하게 ${sortedTargets[0]?.collegeName || '건국대학교'} 합격권. 학평 오답노트 작성에 집중 지도 필요.`,
      `학생부 교과보다 종합 전형이 유리함. 학생부 세특 기록 보완을 위해 물리 실험 분석 보고서 기한 내 보완 약속함.`,
      `수능 최저 충족이 불확실함. 내신 등급은 우수하나 모의평가 등급 불안정. 교과 전형보다는 수능 최저 완화된 전형 권장.`,
      `모의고사 성적이 내신에 비해 월등히 우수함. 논술 및 정시 준비 병행을 원하며 수시도 상향(고려대, 연세대) 3장 이내 제한적 작성 합의.`,
      `수시 교과형 위주로 안전 지원 지향. 3-1 지필 기말고사 수학/영어 1등급 컷 수성을 최우선 전제 조건으로 강조 상담함.`
    ];
    const memo = memos[Math.floor(rng() * memos.length)];

    students.push({
      id,
      name,
      cls,
      num,
      teacherName,
      gpa,
      semesterGpas,
      grades,
      mockGrades,
      targetColleges: sortedTargets,
      memo
    });
  }

  return students;
}

// 명렬표 파싱 후 학생 리스트 데이터 초기값
export const INITIAL_STUDENTS: Student[] = buildStudentsFromRaw();

// CMS, AppSettings 기본 초기 상태 및 상태 변경 로컬 함수
export const INITIAL_SETTINGS: AppSettings = {
  siteName: "2027학년도 대학 수시 모의산출",
  primaryColor: "#FFC107", // Gold
  bannerTitle: "2027학년도 대학 입시 상담 포털",
  bannerSubtitle: "일반계 고등학교 3학년 주도적 수시 합격 가능성 및 내신·모의고사 데이터 분석 솔루션",
  seoTitle: "2027학년도 대학 수시 모의산출 진학지도 솔루션",
  seoDescription: "학생들의 학기별 학생부 성적과 월별 수능 의사 평가를 통합적으로 추적하고, 개별 맞춤형 진로 탐구 교과 및 수시 시뮬레이션 합격 판정을 제공합니다.",
  seoKeywords: "2027학년도 수시산출, 고등학교 입시상담, 내신등급조회, 모의고사 전형, 합격사례 분석, 수시모의지원",
  socialShareTitle: "내 수시 내신 점수로 가고 싶은 대학교 합격 가치를 알아볼까?",
  socialShareDesc: "2027학년도 대학 입시 상담 프로그램에서 내 등급에 특화된 실시간 모의환산과 상세 교과 보고서를 확인해보세요!"
};
