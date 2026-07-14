import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs, setDoc, doc } from 'firebase/firestore';

// 1. 진짜 내 파이어베이스 프로젝트 설정값으로만 완전히 고정
const firebaseConfig = {
  apiKey: "AIzaSyAEsGZwIBBdJ6rlgljHgeqqAIePQGnjR_s",
  authDomain: "gen-lang-client-0276044322.firebaseapp.com",
  projectId: "gen-lang-client-0276044322",
  storageBucket: "gen-lang-client-0276044322.firebasestorage.app",
  messagingSenderId: "519533024289",
  appId: "1:519533024289:web:76603cb68d776583133f60",
  firestoreDatabaseId: "ai-studio-7f96f620-b672-4d89-9be5-5aaf4ec4c62c"
};

// 2. 앱 초기화
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 3. 에러를 유발하던 dbEnv 및 샌드박스 분기문(Database 2)을 원천 제거하고, 
// 오직 내 진짜 데이터베이스 ID 하나만 바라보도록 고정 초기화
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, "ai-studio-7f96f620-b672-4d89-9be5-5aaf4ec4c62c");

// 기존에 다른 파일(App.tsx 등)에서 dbEnv를 참조하여 에러가 나는 것을 방지하기 위한 더미 변수 선언
export let dbEnv: any = null;

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
