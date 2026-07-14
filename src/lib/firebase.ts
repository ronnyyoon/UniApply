import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

// 1. 진짜 내 파이어베이스 프로젝트 설정값 완벽 고정
const firebaseConfig = {
  apiKey: "AIzaSyAEsGZwIBBdJ6rlgljHgeqqAIePQGnjR_s",
  authDomain: "gen-lang-client-0276044322.firebaseapp.com",
  projectId: "gen-lang-client-0276044322",
  storageBucket: "gen-lang-client-0276044322.firebasestorage.app",
  messagingSenderId: "519533024289",
  appId: "1:519533024289:web:76603cb68d776583133f60",
  firestoreDatabaseId: "ai-studio-7f96f620-b672-4d89-9be5-5aaf4ec4c62c"
};

// 2. 파이어베이스 앱 인스턴스 초기화
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 3. 실서버용 진짜 데이터베이스 연결 (긴 통신 지연 방지 세팅 적용)
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, "ai-studio-7f96f620-b672-4d89-9be5-5aaf4ec4c62c");

// 4. [중요] 타 파일의 빌드 에러를 막기 위해 원래 존재하던 dbEnv 변수를 그대로 흉내 냅니다.
// 이렇게 하면 다른 코드에서 dbEnv를 불러써도 에러가 나지 않고, 실제로는 진짜 db를 바라보게 됩니다.
export const dbEnv = db;

// 5. 타입 에러 방지를 위한 인터페이스 선언
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
