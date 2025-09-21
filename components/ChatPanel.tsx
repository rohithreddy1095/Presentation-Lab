// Implemented the ChatPanel component for refining slide content.
import React, { useState } from 'react';
import type { SlideState } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface ChatPanelProps {
  slide: SlideState | null;
  onRefineContent: (slideId: number, userRequest: string) => Promise<void>;
  onGenerateImage: (slideId: number) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ slide, onRefineContent, onGenerateImage }) => {
  const [userInput, setUserInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canRefine = slide && slide.type === 'content' && slide.status === 'generated';
  const canGenerateImage = slide && slide.type === 'content' && slide.status === 'generated' && slide.imageStatus !== 'loading';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !slide || !canRefine) return;

    setIsRefining(true);
    setError(null);
    try {
      await onRefineContent(slide.id, userInput);
      setUserInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsRefining(false);
    }
  };
  
  const handleImageGenClick = () => {
    if (slide && canGenerateImage) {
      onGenerateImage(slide.id);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-3 px-2">
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">Refine Content</h2>
        <button
            onClick={handleImageGenClick}
            disabled={!canGenerateImage}
            className="p-1.5 rounded-md text-stone-500 hover:bg-stone-100 hover:text-green-600 disabled:text-stone-300 disabled:hover:bg-transparent transition"
            title={canGenerateImage ? "Generate Image" : "Image generation is not available for this slide type"}
            aria-label="Generate Image"
        >
          {slide?.imageStatus === 'loading' ? <LoadingSpinner small /> : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>

      <div className="flex-1 min-h-[60px]">
        <p className="text-sm text-stone-600 px-2">
          {canRefine
            ? `Use this chat to refine the content for "${slide?.title}".`
            : slide?.type === 'media'
            ? 'Refining is not available for media slides.'
            : 'Generate or select a slide to start refining its content.'}
        </p>
        {error && <p className="text-sm text-red-600 px-2 mt-2">{error}</p>}
      </div>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={canRefine ? 'e.g., "Make the tone more formal"' : 'Refining is not available for this slide.'}
            disabled={!canRefine || isRefining}
            className="w-full p-2 pr-10 border border-stone-300 rounded-md resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
            rows={3}
          />
          <button
            type="submit"
            disabled={!canRefine || isRefining || !userInput.trim()}
            className="absolute bottom-2 right-2 p-1 rounded-full text-white bg-green-600 hover:bg-green-700 disabled:bg-stone-300 disabled:cursor-not-allowed transition flex items-center justify-center h-7 w-7"
          >
            {isRefining ? <LoadingSpinner small /> : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
            )}
          </button>
        </div>
      </form>
    </>
  );
};