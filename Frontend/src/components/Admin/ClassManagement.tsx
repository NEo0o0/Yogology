"use client";

import { useState } from 'react';
import { Plus, Edit2, Trash2, Calendar, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ClassTypesTab } from '@/components/classes/ClassTypesTab';
import { ScheduleGeneratorTab } from '@/components/bookings/ScheduleGeneratorTab';

export function ClassManagement() {
  const [activeTab, setActiveTab] = useState<'types' | 'generator'>('types');

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl text-[var(--color-earth-dark)] mb-2">Class Management</h1>
        <p className="text-[var(--color-stone)]">Create class templates and generate your weekly schedule</p>
      </div>

      {/* Tab Switcher */}
      <div className="mb-8 border-b border-[var(--color-sand)]">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('types')}
            className={`px-6 py-3 flex items-center gap-2 transition-all duration-300 border-b-2 ${
              activeTab === 'types'
                ? 'border-[var(--color-sage)] text-[var(--color-sage)]'
                : 'border-transparent text-[var(--color-stone)] hover:text-[var(--color-earth-dark)]'
            }`}
          >
            <Sparkles size={20} />
            <span>Class Types (Templates)</span>
          </button>
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-6 py-3 flex items-center gap-2 transition-all duration-300 border-b-2 ${
              activeTab === 'generator'
                ? 'border-[var(--color-sage)] text-[var(--color-sage)]'
                : 'border-transparent text-[var(--color-stone)] hover:text-[var(--color-earth-dark)]'
            }`}
          >
            <Calendar size={20} />
            <span>Schedule Generator</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'types' && <ClassTypesTab />}
      {activeTab === 'generator' && <ScheduleGeneratorTab />}
    </div>
  );
}
