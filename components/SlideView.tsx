// Implemented the SlideView component to display slide content.
import React, { useState } from 'react';
import type { SlideState, MediaItem } from '../types';
import { isMediaContent } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { AddMediaModal } from './AddMediaModal';

interface SlideViewProps {
  slide: SlideState | null;
  onRegenerateText: (slideId: number) => void;
  onAddMediaItem: (item: MediaItem) => void;
  onDeleteMediaItem: (index: number) => void;
}

const BulletPoint: React.FC<{ text: string }> = ({ text }) => (
  <li className="flex items-start gap-3">
    <svg className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
    <span className="text-lg text-stone-300">{text}</span>
  </li>
);

const MediaCard: React.FC<{ item: MediaItem; onDelete: () => void; }> = ({ item, onDelete }) => {
    const getYouTubeThumbnail = (url: string) => {
        try {
            const videoId = new URL(url).searchParams.get('v');
            if (videoId) {
                return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            }
            const urlParts = new URL(url).pathname.split('/');
            const potentialId = urlParts[urlParts.length - 1];
            if(potentialId) return `https://img.youtube.com/vi/${potentialId}/hqdefault.jpg`;
            return '';
        } catch {
            return '';
        }
    };

    const renderIcon = () => {
         switch (item.type) {
            case 'youtube':
                return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>;
            case 'website':
                return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" /></svg>;
            case 'photo':
                return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>;
         }
    };

    const imageSrc = item.type === 'youtube' ? getYouTubeThumbnail(item.url) : item.type === 'photo' ? item.url : undefined;

    return (
        <div className="bg-gray-700 rounded-lg overflow-hidden shadow-md group flex flex-col relative">
            <button
                onClick={onDelete}
                className="absolute top-2 right-2 z-10 p-1 bg-gray-900/50 text-white rounded-full hover:bg-red-500/80 transition-colors"
                aria-label="Delete item"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:shadow-xl hover:-translate-y-1 transition-transform duration-300 flex flex-col flex-grow">
                {imageSrc && (
                    <div className="w-full h-40 bg-gray-900 overflow-hidden">
                        <img src={imageSrc} alt={item.title} className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" onError={(e) => { e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22320%22%20height%3D%22180%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%20320%20180%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text/css%22%3E%23holder_158bd1d28ef%20text%20%7B%20fill%3A%23AAAAAA%3Bfont-weight%3Anormal%3Bfont-family%3AHelvetica%2C%20monospace%3Bfont-size%3A16pt%20%7D%20%3C/style%3E%3C/defs%3E%3Cg%20id%3D%22holder_158bd1d28ef%22%3E%3Crect%20width%3D%22320%22%20height%3D%22180%22%20fill%3D%22%23374151%22%3E%3C/rect%3E%3Cg%3E%3Ctext%20x%3D%22104.1875%22%20y%3D%2297.2%22%3EImage%20not%20found%3C/text%3E%3C/g%3E%3C/g%3E%3C/svg%3E'; e.currentTarget.onerror = null; }} />
                    </div>
                )}
                <div className="p-4 flex-grow flex items-center gap-4">
                    <div className="flex-shrink-0">{renderIcon()}</div>
                    <h3 className="text-stone-200 font-semibold leading-tight flex-1">{item.title}</h3>
                </div>
            </a>
        </div>
    );
};

export const SlideView: React.FC<SlideViewProps> = ({ slide, onRegenerateText, onAddMediaItem, onDeleteMediaItem }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  if (!slide) {
    return (
      <div className="flex-1 flex items-center justify-center bg-stone-50 rounded-xl">
        <p className="text-stone-500">Select a slide to view its content</p>
      </div>
    );
  }

  const renderContentState = () => {
    switch (slide.status) {
      case 'loading':
        return <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>;
      case 'error':
        return (
          <div className="flex flex-col items-center justify-center h-full text-red-400 p-8 text-center">
            <p className="font-semibold">Failed to generate content.</p>
            <button
              onClick={() => onRegenerateText(slide.id)}
              className="mt-4 px-4 py-2 bg-red-500/20 text-red-300 rounded-md hover:bg-red-500/30"
            >
              Try Again
            </button>
          </div>
        );
      case 'initial':
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-stone-400">
             <p>Preparing this slide...</p>
             <div className='mt-4'>
                <LoadingSpinner />
             </div>
          </div>
        );
    }
  };

  if (slide.type === 'media') {
     const renderMediaContent = () => {
        if (!isMediaContent(slide.content)) return null;

        if (slide.content.items.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-stone-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
                    </svg>
                    <h2 className="text-2xl font-semibold text-white mb-2">Your Media Gallery</h2>
                    <p className="text-stone-400 mb-6">Add images, videos, and links to populate this slide.</p>
                    <button onClick={() => setIsModalOpen(true)} className="px-5 py-2.5 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition-colors flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Add Media
                    </button>
                </div>
            );
        }

        return (
            <>
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-green-300">{slide.content.title}</h1>
                    <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition-colors flex items-center gap-2 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Add More
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {slide.content.items.map((item, index) => (
                        <MediaCard key={index} item={item} onDelete={() => onDeleteMediaItem(index)} />
                    ))}
                </div>
            </>
        );
     }

     return (
        <section className="flex-1 flex flex-col bg-gray-800 rounded-xl shadow-lg overflow-hidden relative min-h-[550px]">
            {slide.status === 'generated' ? (
                 <div className="p-8 md:p-12 text-white h-full overflow-y-auto">
                    {renderMediaContent()}
                 </div>
            ) : (
                renderContentState()
            )}
            {isModalOpen && (
                <AddMediaModal 
                    onClose={() => setIsModalOpen(false)} 
                    onAddMedia={onAddMediaItem} 
                />
            )}
        </section>
     );
  }

  // Default 'content' slide view
  const renderTextContent = () => {
    if (slide.status === 'generated') {
      return (
        <div className="p-8 md:p-12 text-white">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-green-300">{slide.content?.title}</h1>
          {isMediaContent(slide.content) === false && slide.content?.subtitle && <h2 className="text-xl md:text-2xl text-stone-400 mb-8">{slide.content.subtitle}</h2>}
          <ul className="space-y-4">
            {isMediaContent(slide.content) === false && slide.content?.body.map((point, index) => (
              <BulletPoint key={index} text={point} />
            ))}
          </ul>
        </div>
      );
    }
    return renderContentState();
  };

  const renderImageContent = () => {
    switch (slide.imageStatus) {
      case 'loading':
        return <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><LoadingSpinner /></div>;
      case 'generated':
        if (!slide.imageUrl) return null;
        return (
            <img src={slide.imageUrl} alt={`AI generated visual for ${slide.title}`} className="w-full h-full object-cover" />
        );
      case 'error':
        return (
            <div className="absolute inset-0 bg-red-900/50 flex flex-col items-center justify-center text-red-300 text-center p-4">
                <p className='font-semibold'>Failed to generate image.</p>
                <p className="text-sm">Please try again.</p>
            </div>
        );
      case 'initial':
      default:
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-stone-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-2 text-sm">Generate an image via the 'Refine' panel.</p>
            </div>
          </div>
        )
    }
  };

  return (
    <section className="flex-1 flex flex-col bg-gray-800 rounded-xl shadow-lg overflow-hidden relative">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-[550px]">
        <div className="bg-gray-800 flex flex-col justify-center order-2 lg:order-1">
          {renderTextContent()}
        </div>
        <div className="relative bg-gray-900 min-h-[250px] lg:min-h-0 order-1 lg:order-2 flex items-center justify-center overflow-hidden">
           {renderImageContent()}
        </div>
      </div>
    </section>
  );
};