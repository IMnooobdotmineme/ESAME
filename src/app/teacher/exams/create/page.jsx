// Inside app/teacher/exams/create/page.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateExamPage() {
  const router = useRouter();

  // 1. Form state
  const [formData, setFormData] = useState({
    codeTag: 'CS101',
    title: '',
    durationMinutes: 60,
    questionCount: 10,
    status: 'active'
  });

  // 2. Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Generate a random access code (e.g. X8K29P)
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const newExam = {
      ...formData,
      joinCode,
    };

    // Save exam to your database/API
    const response = await fetch('/api/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newExam),
    });

    if (response.ok) {
      // 3. Automatically redirect to the list page after creation
      router.push('/teacher/exams');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">Create Exam</h1>
      
      <div>
        <label className="block text-sm font-medium">Exam Title</label>
        <input 
          type="text" 
          required
          className="border p-2 w-full rounded"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <button 
        type="submit" 
        className="bg-slate-800 text-white px-4 py-2 rounded"
      >
        Save & Publish Exam
      </button>
    </form>
  );
}