'use client'

import { createEvent } from '@/actions/event-actions'
import Link from 'next/link'

export default function CreateRoundPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="p-4 border-b border-gray-100 flex items-center gap-3">
         <Link href="/rounds" className="text-gray-600">←</Link>
         <h1 className="text-lg font-bold">라운딩 만들기</h1>
      </header>

      <form action={createEvent} className="p-6 space-y-6">
         <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
            <input name="title" required placeholder="예: 주말 명랑골프 가실 분!" className="w-full border border-gray-300 rounded-lg p-3"/>
         </div>

         <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">테마</label>
            <select name="theme" className="w-full border border-gray-300 rounded-lg p-3 bg-white">
                <option value="General">일반 (General)</option>
                <option value="MZ Golf">MZ 골프 (2030)</option>
                <option value="Serious">진지 모드 (내기/비즈니스)</option>
                <option value="Beginner">골린이 환영</option>
            </select>
         </div>

         <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">골프장 (장소)</label>
            <input name="course_name" required placeholder="예: 스카이72" className="w-full border border-gray-300 rounded-lg p-3"/>
         </div>

         <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">일시</label>
            <input name="start_date" type="datetime-local" required className="w-full border border-gray-300 rounded-lg p-3"/>
         </div>

         <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">참가비 (원)</label>
                <input name="cost" type="number" required placeholder="0" className="w-full border border-gray-300 rounded-lg p-3"/>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">최대 인원</label>
                <input name="max_participants" type="number" defaultValue={4} min={1} max={10} className="w-full border border-gray-300 rounded-lg p-3"/>
             </div>
         </div>

         <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상세 내용</label>
            <textarea name="description" rows={4} placeholder="모집 내용, 규칙 등을 적어주세요." className="w-full border border-gray-300 rounded-lg p-3"></textarea>
         </div>

         <button type="submit" className="w-full bg-black text-white font-bold py-4 rounded-xl mt-4">
            라운딩 개설하기
         </button>
      </form>
    </div>
  )
}
