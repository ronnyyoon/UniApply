// src 바로 밑에 저장한 68만 줄짜리 로컬 입결 JSON 파일 로드
import universityData from '../university_stats.json';

// 외부 원격 파이어베이스 서버 연동 완전 해제를 위한 더미 선언 (빌드 에러 방지)
const importedConfig: any = {};
export default importedConfig;
export const db: any = {};
export const dbEnv: any = {};

export interface CollegeStat {
  id: string;
  college: string;
  major: string;
  type: string;
  detailType: string;
  
  // 2026학년도 (UI data2025)
  recruitCount2026: string;
  minGpa2026?: string;
  maxGpa2026?: string;
  avgGpa2026?: string;
  stdDev2026?: string;
  cut50_2026?: string;
  cut70_2026: string;
  chuhapMin2026?: string;
  chuhapNo2026: string;
  ratio2026: string;

  // 2025학년도 (UI data2024)
  recruitCount2025: string;
  minGpa2025?: string;
  maxGpa2025?: string;
  avgGpa2025?: string;
  stdDev2025?: string;
  cut50_2025?: string;
  cut70_2025: string;
  chuhapMin2025?: string;
  chuhapNo2025: string;
  ratio2025: string;

  // 2024학년도 (UI data2023)
  recruitCount2024: string;
  minGpa2024?: string;
  maxGpa2024?: string;
  avgGpa2024?: string;
  stdDev2024?: string;
  cut50_2024?: string;
  cut70_2024: string;
  chuhapMin2024?: string;
  chuhapNo2024: string;
  ratio2024: string;
}

// [핵심 매핑 함수] JSON 내부 계층 구조(stats)에서 값을 뽑아 프론트엔드 표에 공급
export async function fetchCollegeStats(): Promise<CollegeStat[]> {
  try {
    console.log("🚀 [Dream Engine] 68만 줄의 오프라인 로컬 데이터셋 바인딩 완료!");
    
    return universityData.map((data: any, index: number) => {
      // stats 내부 객체 추출 안전장치
      const statsObj = data.stats || {};
      const data2026 = statsObj['2026'] || {};
      const data2025 = statsObj['2025'] || {};
      const data2024 = statsObj['2024'] || {};

      const getVal = (...args: any[]) => {
        for (const val of args) {
          if (val !== undefined && val !== null && val !== "") return String(val);
        }
        return "";
      };

      return {
        id: data.id || String(index),
        // 기본 필드명 매핑
        college: getVal(data.universityName, data.college),
        major: getVal(data.departmentName, data.major),
        type: getVal(data.admissionType, data.type),
        detailType: getVal(data.detailedType, data.detailType),
        
        // 2026학년도 statistics (represented in UI state as data2025)
        recruitCount2026: getVal(data2026.enrollment, ""),
        minGpa2026: "",
        maxGpa2026: "",
        avgGpa2026: "",
        stdDev2026: "",
        cut50_2026: "",
        cut70_2026: getVal(data2026.cut70, ""),
        chuhapMin2026: "",
        chuhapNo2026: getVal(data2026.waitlistLastRank, ""),
        ratio2026: getVal(data2026.competitionRate, ""),

        // 2025학년도 statistics (represented in UI state as data2024)
        recruitCount2025: getVal(data2025.enrollment, ""),
        minGpa2025: "",
        maxGpa2025: "",
        avgGpa2025: "",
        stdDev2025: "",
        cut50_2025: "",
        cut70_2025: getVal(data2025.cut70, ""),
        chuhapMin2025: "",
        chuhapNo2025: getVal(data2025.waitlistLastRank, ""),
        ratio2025: getVal(data2025.competitionRate, ""),

        // 2024학년도 statistics (represented in UI state as data2023)
        recruitCount2024: getVal(data2024.enrollment, ""),
        minGpa2024: "",
        maxGpa2024: "",
        avgGpa2024: "",
        stdDev2024: "",
        cut50_2024: "",
        cut70_2024: getVal(data2024.cut70, ""),
        chuhapMin2024: "",
        chuhapNo2024: getVal(data2024.waitlistLastRank, ""),
        ratio2024: getVal(data2024.competitionRate, "")
      };
    });
  } catch (error) {
    console.error("로컬 입결 JSON 동기화 실패:", error);
    return [];
  }
}

export async function seedCollegeStats(stats?: Omit<CollegeStat, 'id'>[]): Promise<void> {
  return Promise.resolve();
}