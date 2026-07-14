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

// 4. 실서버용 진짜 데이터베이스 연결 (Long Polling 설정 유지)
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

// 7. [핵심] 다른 파일(CollegeCalculator.tsx)에서 애타게 찾고 있는 데이터 불러오기 함수
export async function fetchCollegeStats(): Promise<CollegeStat[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "officialStats"));
    const stats: CollegeStat[] = [];
    querySnapshot.forEach((doc) => {
      stats.push({ id: doc.id, ...doc.data() } as CollegeStat);
    });
    return stats;
  } catch (error) {
    console.error("Error fetching college stats:", error);
    throw error;
  }
}

// 8. [핵심] 초기 데이터를 파이어베이스에 심어주는 시드 함수
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
