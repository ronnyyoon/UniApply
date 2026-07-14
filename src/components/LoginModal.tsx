/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LogIn, HelpCircle, ShieldCheck, Award, GraduationCap } from 'lucide-react';
import { UserSession } from '../types';
import { TEACHERS, buildStudentsFromRaw } from '../data';

interface LoginModalProps {
  onLogin: (session: UserSession) => void;
  primaryColor: string;
}

export default function LoginModal({ onLogin, primaryColor }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showTips, setShowTips] = useState(true);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      setError('아이디와 비밀번호를 모두 입력해 주세요.');
      return;
    }

    // 1. 최고 관리자 로그인 확인
    if (trimmedUser === '관리자' && trimmedPass === 'admin') {
      onLogin({
        role: 'admin',
        id: 'admin',
        name: '최고 관리자'
      });
      return;
    }

    // 2. 교사 로그인 확인
    const teacher = TEACHERS.find(t => t.name === trimmedUser);
    if (teacher) {
      // 비밀번호 규칙 : '학년반00' -> 3학년 5반이면 3500
      const expectedPass = `3${teacher.cls}00`;
      if (trimmedPass === expectedPass) {
        onLogin({
          role: 'teacher',
          id: teacher.id,
          name: `${teacher.name} 선생님`,
          cls: teacher.cls
        });
        return;
      } else {
        setError('비밀번호가 올바르지 않습니다. 교사 비밀번호 형식은 [3학년반00] 입니다. (예: 5반은 3500)');
        return;
      }
    }

    // 3. 학생 로그인 확인
    const allStudents = buildStudentsFromRaw();
    const student = allStudents.find(s => s.name === trimmedUser && s.id === trimmedPass);
    if (student) {
      onLogin({
        role: 'student',
        id: student.id,
        name: student.name,
        cls: student.cls
      });
      return;
    }

    setError('일치하는 계정 정보가 없습니다. 이름(아이디)과 학번/비밀번호를 확인해 주세요.');
  };

  return (
    <div id="login-overlay" className="fixed inset-0 bg-[#0A0A0A]/95 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div id="login-card" className="w-full max-w-sm bg-[#111111] border professional-border rounded-xl shadow-2xl overflow-hidden animate-fade-in relative">
        {/* 탑 장식 배너 */}
        <div className="h-[3px]" style={{ backgroundColor: primaryColor }}></div>
        
        <div className="p-8">
          <div className="flex flex-col items-center justify-center text-center mb-6">
            <div className="bg-[#161616] p-3 rounded-full border professional-border mb-3" style={{ color: primaryColor }}>
              <GraduationCap className="w-8 h-8 animate-pulse" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white mb-1.5 border-none">
              2027학년도 대학 수시 모의산출
            </h1>
            <p className="text-xs text-zinc-500 font-semibold tracking-wide uppercase">
              High School Admission Portal
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                사용자 이름 (이름)
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="예: 강성민 (학생) 또는 이홍필 (교사)"
                className="w-full px-4 py-2.5 bg-[#1A1A1A] border border-[#333] text-white rounded-lg focus:outline-none focus:border-gold transition-all text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                비밀번호 (학번 또는 교사비밀번호)
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="학생: 학번(3101) / 교사: 학년반00(3100)"
                className="w-full px-4 py-2.5 bg-[#1A1A1A] border border-[#333] text-white rounded-lg focus:outline-none focus:border-gold transition-all text-xs"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-950/20 border border-red-500/20 text-red-400 rounded-lg text-[11px] leading-relaxed">
                {error}
              </div>
            )}

            <button
              id="btn-login-submit"
              type="submit"
              className="w-full py-3 bg-gold hover:bg-opacity-90 text-[#111111] font-bold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98 text-xs font-semibold"
              style={{ backgroundColor: primaryColor }}
            >
              <LogIn className="w-4 h-4" />
              <span>로그인 시스템 접속</span>
            </button>
          </form>

          {showTips && (
            <div className="mt-6 border-t professional-border pt-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                  접속 테스트 계정 정보
                </span>
                <button 
                  onClick={() => setShowTips(false)}
                  className="text-[10px] text-zinc-500 hover:text-white"
                >
                  숨기기
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
                <div className="bg-[#161616] p-2 rounded border professional-border">
                  <span className="font-bold text-gold block mb-0.5" style={{ color: primaryColor }}>👨‍🎓 학생 로그인 체험</span>
                  이름: <b className="text-white">강성민</b> <br />
                  비번: <b className="text-white">3101</b>
                </div>
                <div className="bg-[#161616] p-2 rounded border professional-border">
                  <span className="font-bold text-teal-400 block mb-0.5">👩‍🏫 교사 로그인 체험</span>
                  이름: <b className="text-white">이홍필</b> <br />
                  비번: <b className="text-white">3100</b>
                </div>
                <div className="bg-[#161616] p-2 rounded border professional-border col-span-2">
                  <span className="font-bold text-amber-500 flex items-center gap-1 mb-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    마스터 관리자 통합 로그인
                  </span>
                  아이디: <b className="text-white font-mono">관리자</b> / 패스워드: <b className="text-white font-mono">admin</b>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
