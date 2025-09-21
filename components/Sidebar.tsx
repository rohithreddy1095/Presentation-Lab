import React from 'react';
import type { SlideState } from '../types';

interface SidebarProps {
  slides: SlideState[];
  currentSlideId: number;
  onSelectSlide: (index: number) => void;
}

const StatusDot: React.FC<{ status: SlideState['status'], type: 'text' | 'image' }> = ({ status, type }) => {
    const baseClasses = 'w-2 h-2 rounded-full transition-colors';
    let colorClass = 'bg-stone-300';
    let title = '';

    if (type === 'text') {
      if (status === 'loading') colorClass = 'bg-yellow-500 animate-pulse';
      else if (status === 'generated') colorClass = 'bg-green-500';
      else if (status === 'error') colorClass = 'bg-red-500';
      title = `Text: ${status}`;
    } else { // image
      if (status === 'loading') colorClass = 'bg-purple-500 animate-pulse';
      else if (status === 'generated') colorClass = 'bg-purple-500';
      else if (status === 'error') colorClass = 'bg-red-500';
      title = `Image: ${status}`;
    }

    return <div className={`${baseClasses} ${colorClass}`} title={title}></div>;
};

export const Sidebar: React.FC<SidebarProps> = ({ slides, currentSlideId, onSelectSlide }) => {
  return (
    <aside className="w-full md:w-64 lg:w-72 bg-white rounded-xl shadow-sm p-4 h-fit md:h-auto">
      <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3 px-2">Presentation Outline</h2>
      <nav>
        <ul>
          {slides.map((slide, index) => (
            <li key={slide.id}>
              <button
                onClick={() => onSelectSlide(index)}
                className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-base font-medium ${
                  currentSlideId === slide.id
                    ? 'bg-green-100 text-green-800'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <span className="pr-2">{slide.title}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <StatusDot status={slide.status} type="text" />
                    <StatusDot status={slide.imageStatus} type="image" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};
