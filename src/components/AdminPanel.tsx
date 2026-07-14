/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Settings, 
  FileText, 
  Palette, 
  Share2, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle,
  HelpCircle,
  Megaphone,
  BookOpen,
  Award,
  BookMarked,
  UploadCloud
} from 'lucide-react';
import { CMSArticle, AppSettings, UserSession, Student } from '../types';

interface AdminPanelProps {
  articles: CMSArticle[];
  setArticles: React.Dispatch<React.SetStateAction<CMSArticle[]>>;
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
  session: UserSession;
  primaryColor: string;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  onResetStudents?: () => void;
}

export default function AdminPanel({ 
  articles, 
  setArticles, 
  settings, 
  setSettings, 
  session,
  primaryColor,
  students,
  setStudents,
  onResetStudents
}: AdminPanelProps) {
  
  // 현재 내부 서브 탭: 'customize'(종합설정), 'cms'(게시판관리), 'seo'(SEO/소셜), 'upload'(성적업로드)
  const [adminSubTab, setAdminSubTab] = useState<'customize' | 'cms' | 'seo' | 'upload'>('customize');

  // 외관 커스터마이즈 폼 상태
  const [siteName, setSiteName] = useState(settings.siteName);
  const [primaryColorInput, setPrimaryColorInput] = useState(settings.primaryColor);
  const [bannerTitle, setBannerTitle] = useState(settings.bannerTitle);
  const [bannerSubtitle, setBannerSubtitle] = useState(settings.bannerSubtitle);

  // SEO/소셜 폼 상태
  const [seoTitle, setSeoTitle] = useState(settings.seoTitle);
  const [seoDescription, setSeoDescription] = useState(settings.seoDescription);
  const [seoKeywords, setSeoKeywords] = useState(settings.seoKeywords);
  const [socialShareTitle, setSocialShareTitle] = useState(settings.socialShareTitle);
  const [socialShareDesc, setSocialShareDesc] = useState(settings.socialShareDesc);

  // 게시판 CMS 상태
  const [articleTitle, setArticleTitle] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [articleCategory, setArticleCategory] = useState<'공지사항' | '입시 정보' | '상담 자료' | '합격 사례'>('공지사항');
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);

  // 모의고사 CSV 업로드 상태 변수 및 파일 처리 핸들러
  const [selectedUploadMonth, setSelectedUploadMonth] = useState<string>('7월');
  const [uploadStatus, setUploadStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const parseUploadedMockCsv = (csvContent: string): Record<string, any> => {
    const result: Record<string, any> = {};
    const lines = csvContent.trim().split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      // 콤마 파싱하되 양 끝 따옴표 제거
      const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
      const id = parts[0]?.trim();
      if (!id || isNaN(Number(id)) || id.length !== 4) continue; // 학번이 4자리 숫자인 경우만 유효

      const hasRecord = parts[2] !== undefined && parts[2] !== '' && parts[2] !== '0';
      if (!hasRecord) {
        result[id] = null;
        continue;
      }

      result[id] = {
        koreanSubj: parts[2] || '',
        koreanScore: parts[3] ? (parseInt(parts[3]) || 0) : 0,
        koreanPercentile: parts[4] ? (parseInt(parts[4]) || 0) : 0,
        korean: parts[5] ? (parseInt(parts[5]) || 0) : 0,
        
        mathSubj: parts[6] || '',
        mathScore: parts[7] ? (parseInt(parts[7]) || 0) : 0,
        mathPercentile: parts[8] ? (parseInt(parts[8]) || 0) : 0,
        math: parts[9] ? (parseInt(parts[9]) || 0) : 0,
        
        english: parts[10] ? (parseInt(parts[10]) || 0) : 0,
        
        exp1Subj: parts[11] || '',
        exp1Score: parts[12] ? (parseInt(parts[12]) || 0) : 0,
        exp1Percentile: parts[13] ? (parseInt(parts[13]) || 0) : 0,
        exp1Grade: parts[14] ? (parseInt(parts[14]) || 0) : 0,
        
        exp2Subj: parts[15] || '',
        exp2Score: parts[16] ? (parseInt(parts[16]) || 0) : 0,
        exp2Percentile: parts[17] ? (parseInt(parts[17]) || 0) : 0,
        exp2Grade: parts[18] ? (parseInt(parts[18]) || 0) : 0,
        
        history: parts[19] ? (parseInt(parts[19]) || 0) : 0,
      };
    }
    return result;
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>, fileFromDrag?: File) => {
    let file: File | null = null;
    if (fileFromDrag) {
      file = fileFromDrag;
    } else if (e && 'target' in e && (e.target as HTMLInputElement).files) {
      file = (e.target as HTMLInputElement).files?.[0] || null;
    }

    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target?.result as string;
      try {
        const parsedData = parseUploadedMockCsv(csvText);
        const keys = Object.keys(parsedData);
        if (keys.length === 0) {
          setUploadStatus({
            success: false,
            message: '파싱된 유효한 성적 데이터가 없습니다. CSV 파일 서식을 확인해 주세요. (학번이 4자리 숫자로 시작하는 행이 있어야 함)'
          });
          return;
        }

        // 학생 목록 업데이트
        setStudents((prevStudents) => {
          const updated = prevStudents.map((st) => {
            const mg = parsedData[st.id];
            const monthIndex = st.mockGrades.findIndex(g => g.date === selectedUploadMonth);
            
            let updatedGrades = [...st.mockGrades];
            if (mg) {
              const newGradeItem = {
                date: selectedUploadMonth,
                korean: mg.korean,
                koreanScore: mg.koreanScore,
                koreanPercentile: mg.koreanPercentile,
                koreanSubj: mg.koreanSubj || (st.cls >= 5 ? '언어와매체' : '화법과작문'),
                math: mg.math,
                mathScore: mg.mathScore,
                mathPercentile: mg.mathPercentile,
                mathSubj: mg.mathSubj || (st.cls >= 5 ? '미적분' : '확률과통계'),
                english: mg.english,
                history: mg.history,
                exploration1: mg.exp1Subj || (st.cls >= 5 ? '물리학I' : '생활과윤리'),
                exploration1Grade: mg.exp1Grade,
                exploration1Score: mg.exp1Score,
                exploration1Percentile: mg.exp1Percentile,
                exploration2: mg.exp2Subj || (st.cls >= 5 ? '생명과학I' : '사회문화'),
                exploration2Grade: mg.exp2Grade,
                exploration2Score: mg.exp2Score,
                exploration2Percentile: mg.exp2Percentile,
              };

              if (monthIndex > -1) {
                updatedGrades[monthIndex] = newGradeItem;
              } else {
                updatedGrades.push(newGradeItem);
              }
            } else {
              // 해당 월의 유효 레코드가 없어도 배열에 default 값을 넣어주어 자리 유지
              const defaultGradeItem = {
                date: selectedUploadMonth,
                korean: 0, koreanScore: 0, koreanPercentile: 0, koreanSubj: '',
                math: 0, mathScore: 0, mathPercentile: 0, mathSubj: '',
                english: 0, history: 0,
                exploration1: '', exploration1Grade: 0, exploration1Score: 0, exploration1Percentile: 0,
                exploration2: '', exploration2Grade: 0, exploration2Score: 0, exploration2Percentile: 0,
              };
              if (monthIndex > -1) {
                updatedGrades[monthIndex] = defaultGradeItem;
              } else {
                updatedGrades.push(defaultGradeItem);
              }
            }
            
            return {
              ...st,
              mockGrades: updatedGrades,
            };
          });

          // localStorage 저장하여 새로고침 시에도 성적 데이터 영구화
          localStorage.setItem('ADMIT2027_STUDENTS', JSON.stringify(updated));
          return updated;
        });

        setUploadStatus({
          success: true,
          message: `성공적으로 ${selectedUploadMonth} 모의고사 성적을 일괄 반영했습니다! (총 ${keys.length}개 학번 성적 데이터 매칭 완료)`
        });
      } catch (err: any) {
        setUploadStatus({
          success: false,
          message: `업로드 실패: 파싱 도중 오류가 발생했습니다. (${err.message})`
        });
      }
    };

    reader.readAsText(file, 'EUC-KR');
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleCsvUpload(e, e.dataTransfer.files[0]);
    }
  };

  // 색상 팔레트 프리셋
  const colorPresets = [
    { name: '대입 골드 (기본)', code: '#D4AF37' },
    { name: '코스믹 로즈', code: '#EC4899' },
    { name: '로열 블루', code: '#3B82F6' },
    { name: '텍 포레스트', code: '#10B981' },
    { name: '클래식 오렌지', code: '#F97316' },
  ];

  // 설정 저장 핸들러
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettings({
      siteName,
      primaryColor: primaryColorInput,
      bannerTitle,
      bannerSubtitle,
      seoTitle,
      seoDescription,
      seoKeywords,
      socialShareTitle,
      socialShareDesc
    });
    alert('전체 포털 커스터마이즈 환경 설정이 성공적으로 저장 및 실시간 사이트에 반영되었습니다!');
  };

  // CMS 글 쓰기 및 수정 완료 핸들러
  const handleSaveArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleTitle.trim() || !articleContent.trim()) {
      alert('공지 제목과 내용을 채워주세요.');
      return;
    }

    if (editingArticleId) {
      // 수정 모드
      setArticles(prev => prev.map(art => {
        if (art.id === editingArticleId) {
          return {
            ...art,
            title: articleTitle,
            content: articleContent,
            category: articleCategory,
            date: new Date().toISOString().split('T')[0]
          };
        }
        return art;
      }));
      setEditingArticleId(null);
      alert('게시글 수정이 완료되었습니다.');
    } else {
      // 신규 입력 모드
      const newArt: CMSArticle = {
        id: `art_${Date.now()}`,
        title: articleTitle,
        content: articleContent,
        category: articleCategory,
        date: new Date().toISOString().split('T')[0],
        author: session.name || '교무부',
        views: 0
      };
      setArticles(prev => [newArt, ...prev]);
      alert('신규 수시 입시 자료/공지가 등록되었습니다.');
    }

    // 인풋 초기화
    setArticleTitle('');
    setArticleContent('');
    setArticleCategory('공지사항');
  };

  // CMS 글 삭제 핸들러
  const handleDeleteArticle = (id: string) => {
    if (confirm('해당 입시자료 게시물을 복구 불가능하게 삭제하시겠습니까?')) {
      setArticles(prev => prev.filter(art => art.id !== id));
    }
  };

  // CMS 글 수정 준비
  const handleEditArticlePrep = (art: CMSArticle) => {
    setEditingArticleId(art.id);
    setArticleTitle(art.title);
    setArticleContent(art.content);
    setArticleCategory(art.category);
    // 스크롤 상단 등 유도 위함
    document.getElementById('cms-form-scroll')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div id="admin-panel-tab" className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)] animate-fade-in text-white font-medium">
      
      {/* 1. 상단 인트로 카드 */}
      <div className="professional-bg-card border professional-border rounded-xl p-6 relative overflow-hidden shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded-full uppercase tracking-wider">
              <Settings className="w-3" />
              시스템 관리 제어반
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              통합 교사 관리자 대시보드
            </h2>
            <p className="text-xs text-zinc-400">
              코딩 지식 없이도 로고명, 테마 컬러, 배너 소개글, SEO 가용 지표 및 전형 입시자료(CMS)를 전천후 원격 교정할 수 있습니다.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* 서브 탭 네비게이터 */}
            <button
              onClick={() => setAdminSubTab('customize')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                adminSubTab === 'customize' 
                  ? 'bg-yellow-500 text-neutral-950 font-extrabold shadow' 
                  : 'text-zinc-400 hover:text-white bg-zinc-850 border professional-border'
              }`}
              style={{
                backgroundColor: adminSubTab === 'customize' ? primaryColor : undefined,
                color: adminSubTab === 'customize' ? '#111111' : undefined
              }}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>외관 커스터마이징</span>
            </button>
            <button
              onClick={() => setAdminSubTab('cms')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                adminSubTab === 'cms' 
                  ? 'bg-yellow-500 text-neutral-950 font-extrabold shadow' 
                  : 'text-zinc-400 hover:text-white bg-zinc-850 border professional-border'
              }`}
              style={{
                backgroundColor: adminSubTab === 'cms' ? primaryColor : undefined,
                color: adminSubTab === 'cms' ? '#111111' : undefined
              }}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>CMS 공지·게시물 관리</span>
            </button>
            <button
              onClick={() => setAdminSubTab('seo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                adminSubTab === 'seo' 
                  ? 'bg-yellow-500 text-neutral-950 font-extrabold shadow' 
                  : 'text-zinc-400 hover:text-white bg-zinc-850 border professional-border'
              }`}
              style={{
                backgroundColor: adminSubTab === 'seo' ? primaryColor : undefined,
                color: adminSubTab === 'seo' ? '#111111' : undefined
              }}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>SEO 및 안심공유설정</span>
            </button>
            <button
              onClick={() => setAdminSubTab('upload')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                adminSubTab === 'upload' 
                  ? 'bg-yellow-500 text-neutral-950 font-extrabold shadow' 
                  : 'text-zinc-400 hover:text-white bg-zinc-850 border professional-border'
              }`}
              style={{
                backgroundColor: adminSubTab === 'upload' ? primaryColor : undefined,
                color: adminSubTab === 'upload' ? '#111111' : undefined
              }}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>모의고사 CSV 업로드</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 각 서브 탭 화면 분기 */}
      {adminSubTab === 'customize' && (
        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 입력 폼 필드 (8컬럼) */}
          <div className="lg:col-span-8 professional-bg-card border professional-border rounded-xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white border-b professional-border pb-2.5 flex items-center gap-2">
              <Palette className="w-4 h-4 text-yellow-500" style={{ color: primaryColor }} />
              웹 디자인 & 타이포그래피 커스텀 제어
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">포털 사이트 타이틀명</label>
                <input
                  type="text"
                  value={siteName}
                  onChange={e => setSiteName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-neutral-950 text-white border professional-border rounded-xl text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400">포인트 브랜드 컬러 (Hex)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={primaryColorInput}
                    onChange={e => setPrimaryColorInput(e.target.value)}
                    className="w-full px-4 py-2.5 bg-neutral-950 text-white border professional-border rounded-xl text-xs font-mono focus:ring-1 focus:ring-yellow-500 focus:outline-none"
                  />
                  {/* 컬러 피커 시각 표현 */}
                  <div 
                    className="w-10 h-10 rounded-xl border professional-border shrink-0"
                    style={{ backgroundColor: primaryColorInput }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400">메인 대배너 타이틀</label>
              <input
                type="text"
                value={bannerTitle}
                onChange={e => setBannerTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-950 text-white border professional-border rounded-xl text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400">메인 대배너 서브 소개 텍스트</label>
              <textarea
                value={bannerSubtitle}
                onChange={e => setBannerSubtitle(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-neutral-950 text-white border professional-border rounded-xl text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none resize-none leading-relaxed"
              ></textarea>
            </div>

            <button
              id="btn-save-cust-settings"
              type="submit"
              className="px-5 py-2.5 bg-gold hover:bg-opacity-90 text-[#111111] font-black rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              style={{ backgroundColor: primaryColor }}
            >
              <CheckCircle className="w-4 h-4" />
              <span>포털 환경 설정 일괄 저장</span>
            </button>
          </div>

          {/* 가이드 설명 / 프리셋 슬라이드 (4컬럼) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* 컬러 프리셋 선택 */}
            <div className="professional-bg-card border professional-border rounded-xl p-5 space-y-3.5">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">포인트 컬러 핫 프리셋</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                아래 사전 정의된 어울림 학년 컬러 팔레트를 클릭하시면 해당 Hex 코드가 자동 입력됩니다:
              </p>
              <div className="space-y-2">
                {colorPresets.map(cp => (
                  <button
                    key={cp.name}
                    type="button"
                    onClick={() => setPrimaryColorInput(cp.code)}
                    className="w-full flex items-center justify-between p-2.5 bg-neutral-950 hover:bg-zinc-850 rounded-xl border professional-border text-left text-xs text-zinc-300 font-bold transition-all"
                  >
                    <span>{cp.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-zinc-500">{cp.code}</span>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cp.code }}></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 보안 경고 */}
            <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 text-zinc-400 text-xs rounded-xl leading-relaxed space-y-2">
              <span className="font-bold text-yellow-500 block">⚠️ 보안 주의사항</span>
              본 대시보드는 <b>교사 로그인 이상</b> 혹은 전 교무실 관리 전산망 안에서만 노출됩니다. 학부모 및 학생 포털 로그인 시에는 본 페이지의 탭 자체가 격리 은폐 처리됩니다.
            </div>

          </div>
        </form>
      )}

      {adminSubTab === 'cms' && (
        <div className="space-y-6">
          <div id="cms-form-scroll" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* 글 생성/수정 폼 (5컬럼) */}
            <form onSubmit={handleSaveArticle} className="lg:col-span-5 professional-bg-card border professional-border rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-white border-b professional-border pb-2.5 flex items-center gap-2 uppercase">
                <Plus className="w-4 h-4 text-emerald-500" />
                {editingArticleId ? '선택한 입시 정보 게시글 수정' : '신규 대입 소식·상담자료 발행'}
              </h3>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400">카테고리 구분</label>
                <select
                  value={articleCategory}
                  onChange={e => setArticleCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-neutral-950 text-white rounded-xl border professional-border text-xs focus:ring-1 focus:ring-yellow-550/40 cursor-pointer"
                >
                  <option value="공지사항">공지사항</option>
                  <option value="입시 정보">입시 정보</option>
                  <option value="상담 자료">상담 자료</option>
                  <option value="합격 사례">합격 사례</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400">게시물 제목</label>
                <input
                  type="text"
                  value={articleTitle}
                  onChange={e => setArticleTitle(e.target.value)}
                  placeholder="예: [공지] 9월 평가원 성전표 배포 일정 및 주요의점"
                  className="w-full px-3.5 py-2.5 bg-neutral-950 text-white rounded-xl border professional-border text-xs focus:ring-1 focus:ring-yellow-550/40 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400">게시물 내용 본문 (마크다운 가용식)</label>
                <textarea
                  value={articleContent}
                  onChange={e => setArticleContent(e.target.value)}
                  rows={6}
                  placeholder="내용 및 상담 지침 안내를 세부적으로 기입하세요."
                  className="w-full px-3.5 py-2.5 bg-neutral-950 text-white rounded-xl border professional-border text-xs focus:ring-1 focus:ring-yellow-550/40 focus:outline-none resize-none leading-relaxed"
                ></textarea>
              </div>

              <div className="flex gap-2">
                <button
                  id="btn-cms-save"
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-black rounded-xl text-xs transition-all cursor-pointer flex-1"
                >
                  {editingArticleId ? '수정 내용 최종 저장' : '새 정보 즉시 등록 및 공고'}
                </button>
                {editingArticleId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingArticleId(null);
                      setArticleTitle('');
                      setArticleContent('');
                    }}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
                  >
                    취소
                  </button>
                )}
              </div>
            </form>

            {/* 현재 등록된 글 목록 (7컬럼) */}
            <div className="lg:col-span-7 professional-bg-card border professional-border rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 border-b professional-border pb-2.5 flex items-center justify-between uppercase">
                <span>등록된 입시 공지/성공사례 일람 ({articles.length}건)</span>
                <span className="text-[10px] font-bold text-zinc-500">조회수 내역 포함</span>
              </h3>

              <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
                {articles.map(art => {
                  
                  // 카테고리별 아바타 색상
                  let catBadge = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                  if (art.category === '공지사항') catBadge = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
                  else if (art.category === '상담 자료') catBadge = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                  else if (art.category === '합격 사례') catBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

                  return (
                    <div 
                      key={art.id} 
                      className="p-3.5 bg-zinc-950/60 rounded-xl border professional-border flex items-start justify-between gap-4 hover:border-zinc-700 transition-colors"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${catBadge}`}>
                            {art.category}
                          </span>
                          <span className="text-xs font-bold text-white truncate max-w-sm">{art.title}</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 flex items-center gap-2">
                          <span>작성: {art.author}</span>
                          <span>•</span>
                          <span>작성일: {art.date}</span>
                          <span>•</span>
                          <span>조회수: {art.views}</span>
                        </div>
                      </div>

                      {/* 수정 삭제 버튼액션 */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleEditArticlePrep(art)}
                          className="p-1 px-1.5 bg-zinc-850 hover:bg-zinc-700 hover:text-gold text-zinc-400 rounded transition-all cursor-pointer"
                          title="수정하기"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteArticle(art.id)}
                          className="p-1 px-1.5 bg-zinc-850 hover:bg-zinc-750 hover:text-rose-500 text-zinc-400 rounded transition-all cursor-pointer"
                          title="삭제하기"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {articles.length === 0 && (
                  <div className="py-12 text-center text-zinc-500 text-xs">
                    등록된 정보가 아직 존재하지 않습니다. 새로운 공지를 등록해 주십시오.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {adminSubTab === 'seo' && (
        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6">
          
          {/* SEO 메타태그 설정 (7컬럼) */}
          <div className="lg:col-span-7 professional-bg-card border professional-border rounded-xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white border-b professional-border pb-2.5 flex items-center gap-2 uppercase">
              <Megaphone className="w-4 h-4 text-rose-500" />
              검색 엔진 최적화 (SEO) 포털 태그 세팅
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400">SEO Meta Title (검색 상단 제목 노출명)</label>
              <input
                type="text"
                value={seoTitle}
                onChange={e => setSeoTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-950 text-white border professional-border rounded-xl text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400">SEO Meta Description (검색 설명 요약 스니펫)</label>
              <textarea
                value={seoDescription}
                onChange={e => setSeoDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-neutral-950 text-white border professional-border rounded-xl text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none resize-none leading-relaxed"
              ></textarea>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400">SEO Meta Keywords (검색 키워드 태그, 콤마로 구분)</label>
              <input
                type="text"
                value={seoKeywords}
                onChange={e => setSeoKeywords(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-950 text-white border professional-border rounded-xl text-xs focus:ring-1 focus:ring-yellow-500 focus:outline-none"
              />
            </div>

            <button
              id="btn-seo-save"
              type="submit"
              className="px-5 py-2.5 bg-gold hover:bg-opacity-90 text-[#111111] font-black rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              style={{ backgroundColor: primaryColor }}
            >
              <CheckCircle className="w-4 h-4" />
              <span>SEO 메타 세팅 즉시 배포</span>
            </button>
          </div>

          {/* 소셜 및 카카오 연동 메시지 설정 (5컬럼) */}
          <div className="lg:col-span-5 professional-bg-card border professional-border rounded-xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white border-b professional-border pb-2.5 flex items-center gap-2 uppercase">
              <Share2 className="w-4 h-4 text-yellow-500" style={{ color: primaryColor }} />
              소셜 미디어(카카오톡, 카스) 공유 안내 최적화
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400">공유 전송 대표 제목</label>
              <input
                type="text"
                value={socialShareTitle}
                onChange={e => setSocialShareTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-950 text-white border professional-border rounded-xl text-xs focus:ring-1 focus:ring-yellow-550/40 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400">공유 전송 대표 서브 요약 설명</label>
              <textarea
                value={socialShareDesc}
                onChange={e => setSocialShareDesc(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-neutral-950 text-white border professional-border rounded-xl text-xs focus:ring-1 focus:ring-yellow-500/40 focus:outline-none resize-none leading-relaxed"
              ></textarea>
            </div>

            <div className="p-3.5 bg-neutral-950 rounded-xl border professional-border text-[11px] text-zinc-500 leading-relaxed">
              * 여기에 기록되는 소셜 문구들은 학생들이 '2027학년도 희망대학 산출' 탭 등에서 <b>[진학 보고서 결과 공유]</b> 버튼을 눌러 링크를 내보내거나 카카오톡 모의 전송을 구사할 시 수취인(학부모, 동료 수험생) 카카오톡 메시지 박스 상에 그대로 기입되어 전송됩니다.
            </div>
          </div>

        </form>
      )}

      {adminSubTab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6">
          {/* CSV 파일 임포트 패널 (7컬럼) */}
          <div className="lg:col-span-7 professional-bg-card border professional-border rounded-xl p-6 space-y-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-full uppercase tracking-wider mb-2 animate-pulse">
                📂 대입 모의고사 원본 성적 반영
              </span>
              <h3 className="text-md font-black tracking-tight text-white flex items-center gap-2">
                모의고사 원격 CSV 성적 일괄 업로드
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                학교 성적 처리 시스템에서 내보낸 모의고사 원본 CSV 파일을 업로드하여 7월, 9월, 10월 등 후속 시험 성적을 포털에 일괄 동기화합니다.
              </p>
            </div>

            {/* 시행 시기 선택 */}
            <div className="space-y-2">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">업로드 대상 수능 모의고사 시기 선택</label>
              <div className="flex flex-wrap gap-2">
                {['3월', '5월', '6월', '7월', '9월', '10월'].map((month) => (
                  <button
                    key={`upload-m-${month}`}
                    type="button"
                    onClick={() => {
                      setSelectedUploadMonth(month);
                      setUploadStatus(null);
                    }}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all border cursor-pointer flex-1 min-w-[70px] text-center ${
                      selectedUploadMonth === month
                        ? 'bg-zinc-800 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white bg-zinc-950/40 hover:bg-zinc-900/40 professional-border'
                    }`}
                    style={{
                      borderColor: selectedUploadMonth === month ? primaryColor : undefined,
                      color: selectedUploadMonth === month ? primaryColor : undefined
                    }}
                  >
                    {month} 모의고사
                  </button>
                ))}
              </div>
            </div>

            {/* 드래그앤드롭 및 파일 업로드 트리거 영역 */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                isDragOver
                  ? 'bg-zinc-800/40 border-yellow-500/50 shadow-inner'
                  : 'bg-zinc-950/20 professional-border hover:bg-zinc-900/30 hover:border-zinc-700'
              }`}
              style={{
                borderColor: isDragOver ? primaryColor : undefined
              }}
              onClick={() => document.getElementById('csv-file-input')?.click()}
            >
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="hidden"
              />
              <UploadCloud className="w-10 h-10 text-zinc-500 mb-3" style={{ color: isDragOver ? primaryColor : undefined }} />
              <p className="text-xs font-bold text-white mb-1.5">
                성적 CSV 파일을 여기에 드래그하거나 클릭하여 업로드
              </p>
              <p className="text-[10px] text-zinc-500">
                지원 파일 확장자: .csv (Microsoft Excel 쉼표로 분리 서식 권장)
              </p>
            </div>

            {/* 업로드 완료/실패 상태 알림 스니펫 */}
            {uploadStatus && (
              <div
                className={`p-4 rounded-xl border text-xs leading-relaxed ${
                  uploadStatus.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  <span>{uploadStatus.success ? '✓ 업로드 성공 완료' : '⚠️ 데이터 반영 실패'}</span>
                </div>
                <p className="text-[11px] opacity-90">{uploadStatus.message}</p>
                {uploadStatus.success && (
                  <p className="text-[10px] text-zinc-400 mt-2 font-mono">
                    * 업로드된 데이터는 브라우저 영구보존 스토리지(LocalStorage)에 실시간 캐싱되어, 새로고침 시에도 입시 성적 대조표 및 희망대학 최저학력기준 산출 엔진에 자동 주입되어 구동됩니다.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 서식 및 가이드 안내 패널 (5컬럼) */}
          <div className="lg:col-span-5 professional-bg-card border professional-border rounded-xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">CSV 표준 성적 양식 가이드</h4>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              성적 데이터가 안전하게 파싱되려면 <b>3월, 5월, 6월 모의고사 원본</b>과 일치하는 아래와 같은 열 구조(컬럼 순서)를 반드시 준수해 주셔야 합니다:
            </p>

            <div className="bg-zinc-950 p-3.5 rounded-xl border professional-border text-[10px] font-mono text-zinc-400 overflow-x-auto space-y-2">
              <div className="text-yellow-500 font-bold border-b professional-border pb-1.5 flex justify-between">
                <span>[CSV 표준 컬럼 나열 순서]</span>
                <span className="text-[9px]">총 20개 컬럼</span>
              </div>
              <p className="whitespace-nowrap select-all bg-zinc-900/60 p-2 rounded border border-zinc-850">
                학번,이름,국어과목,국어표점,국어백분위,국어등급,수학과목,수학표점,수학백분위,수학등급,영어등급,탐구1과목,탐구1표점,탐구1백분위,탐구1등급,탐구2과목,탐구2표점,탐구2백분위,탐구2등급,한국사등급
              </p>
              <div className="text-zinc-500 text-[9px] pt-1 leading-relaxed">
                <span className="text-zinc-300 font-bold">샘플 데이터 행 예시:</span><br />
                <code className="text-emerald-400 block mt-1">
                  3102,강지원,화법과작문,106,60,4,미적분,105,59,5,7,물리학I,50,58,5,생명과학I,33,1,9,7
                </code>
              </div>
            </div>

            <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 text-zinc-400 text-[11px] rounded-xl leading-relaxed space-y-2.5">
              <span className="font-bold text-yellow-500 flex items-center gap-1.5">
                💡 유의사항 및 트러블 슈팅
              </span>
              <ul className="list-disc pl-4 space-y-1.5 text-zinc-400">
                <li>엑셀에서 <b>EUC-KR(한국어 쉼표로 분리)</b> 인코딩으로 저장된 모의고사 파일이 완벽하게 호환됩니다.</li>
                <li>첫 줄 또는 상위 헤더 6개 행은 파서에 의해 자동으로 스킵되므로, 원본 헤더가 복잡해도 행 삭제 없이 그대로 업로드하셔도 무방합니다.</li>
                <li>학번이 일치하는 학생 데이터의 성적만 수정 적용되며, 학번 불일치 또는 비어 있는 값은 안전하게 예외처리됩니다.</li>
              </ul>
            </div>

            {onResetStudents && (
              <div className="pt-4 border-t professional-border flex flex-col gap-2">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">포털 성적 데이터베이스 롤백</span>
                <button
                  type="button"
                  onClick={onResetStudents}
                  className="w-full text-center py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-black rounded-lg transition-all border border-rose-500/25 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>내장 성적 데이터 기본 세팅으로 전체 리셋</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
