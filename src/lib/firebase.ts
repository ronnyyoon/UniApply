import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs, setDoc, doc } from 'firebase/firestore';

// 1. 빌드 에러 방지용 가짜 json 대응 더미 변수
const importedConfig: any = {};
export default importedConfig;

// 2. 진짜 내 파이어베이스 프로젝트 설정값 완벽 고정
const firebaseConfig = {
  apiKey: "AIzaSyAEsGZwIBBdJ6rlgljHgeqqAIePQGnjR_s",
  authDomain: "gen-lang-client-0276044322.firebaseapp.com",
  projectId: "gen-lang-client-0276044322",
  storageBucket: "gen-lang-client-0276044322.firebasestorage.app",
  messagingSenderId: "519533024289",
  appId: "1:519533024289:web:76603cb68d776583133f60",
  firestoreDatabaseId: "ai-studio-7f96f620-b672-4d89-9be5-5aaf4ec4c62c"
};

// 3. 파이어베이스 앱 인스턴스 초기화
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 4. 실서버용 진짜 데이터베이스 연결
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, "ai-studio-7f96f620-b672-4d89-9be5-5aaf4ec4c62c");

// 5. 타 파일의 빌드 에러 방지용 변수 매핑
export const dbEnv = db;

// 6. 타입 에러 방지를 위한 인터페이스 선언
export interface CollegeStat {
  id: string;
  college: string;
  major: string;
  type: string;
  detailType: string;
  recruitCount2026: string;
  cut70_2026: string;
  chuhapNo2026: string;
  ratio2026: string;
  avgGpa2026?: string;
}

// 7. [수정] 필드명 뒤에 연도가 붙어있거나(recruitCount2026) 붙어있지 않더라도(recruitCount) 둘 다 안전하게 매핑
export async function fetchCollegeStats(): Promise<CollegeStat[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "officialStats"));
    const stats: CollegeStat[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // 값이 undefined이거나 null인 경우를 방지하기 위해 빈 문자열 혹은 대시(-) 처리
      const getSafeValue = (val: any) => {
        if (val === undefined || val === null) return "-";
        return String(val);
      };

      stats.push({
        id: doc.id,
        // 드롭다운 연동 필드 매핑
        college: data.universityName || data.college || "",
        major: data.departmentName || data.major || "",
        type: data.admissionType || data.type || "",
        detailType: data.detailedType || data.detailType || "",
        
        // 표 수치 데이터 매핑 (2026 접미사가 붙은 경우와 안 붙은 경우 모두 대응)
        recruitCount2026: getSafeValue(data.recruitCount2026 !== undefined ? data.recruitCount2026 : data.recruitCount),
        cut70_2026: getSafeValue(data.cut70_2026 !== undefined ? data.cut70_2026 : data.cut70),
        chuhapNo2026: getSafeValue(data.chuhapNo2026 !== undefined ? data.chuhapNo2026 : data.chuhapNo),
        ratio2026: getSafeValue(data.ratio2026 !== undefined ? data.ratio2026 : data.ratio),
        avgGpa2026: data.avgGpa2026 ? String(data.avgGpa2026) : undefined
      });
    });
    
    return stats;
  } catch (error) {
    console.error("Error fetching college stats:", error);
    throw error;
  }
}

// 8. 초기 데이터를 파이어베이스에 심어주는 시드 함수
export async function seedCollegeStats(stats: Omit<CollegeStat, 'id'>[]): Promise<void> {
  try {
    for (const stat of stats) {
      const docRef = doc(collection(db, "officialStats"));
      await setDoc(docRef, stat);
    }
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
