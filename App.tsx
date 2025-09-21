// Implemented the main App component to manage state and UI.
import React, { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import { Sidebar } from './components/Sidebar';
import { SlideView } from './components/SlideView';
import { ChatPanel } from './components/ChatPanel';
import { LoadingSpinner } from './components/LoadingSpinner';
import { PRESENTATION_OUTLINE } from './constants';
import type { SlideState, SlideContent, MediaContent, MediaItem } from './types';
import { isMediaContent } from './types';
import { generateSlideContent, refineSlideContent, generateSlideImage } from './services/geminiService';

const App: React.FC = () => {
  const [slides, setSlides] = useState<SlideState[]>(() =>
    PRESENTATION_OUTLINE.map(slide => ({
      ...slide,
      status: 'initial',
      imageStatus: 'initial',
    }))
  );
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const updateSlideState = (slideId: number, updates: Partial<SlideState>) => {
    setSlides(prevSlides =>
      prevSlides.map(s => (s.id === slideId ? { ...s, ...updates } : s))
    );
  };

  const generateContentForSlide = useCallback(async (slideId: number, force: boolean = false) => {
    const slideToGenerate = slides.find(s => s.id === slideId);
    if (!slideToGenerate || (!force && (slideToGenerate.status === 'loading' || slideToGenerate.status === 'generated'))) return;

    // Generate Text
    updateSlideState(slideId, { status: 'loading' });
    try {
      const content = await generateSlideContent(slideToGenerate.promptTopic, 'Bhoomi Naturals Presentation', slideToGenerate.type);
      updateSlideState(slideId, { status: 'generated', content });
    } catch (textError) {
      console.error("Text generation failed for slide", slideId, textError);
      updateSlideState(slideId, { status: 'error' });
    }
  }, [slides]);

  // Effect to generate content for the current slide if it's initial
  useEffect(() => {
    const currentSlide = slides[currentSlideIndex];
    if (currentSlide && currentSlide.status === 'initial') {
      generateContentForSlide(currentSlide.id);
    }
  }, [currentSlideIndex, slides, generateContentForSlide]);


  const handleSelectSlide = (index: number) => {
    setCurrentSlideIndex(index);
  };
  
  const handleRegenerateText = (slideId: number) => {
     generateContentForSlide(slideId, true);
  };

  const handleGenerateImage = async (slideId: number) => {
    const slideToUpdate = slides.find(s => s.id === slideId);
    if (!slideToUpdate || !slideToUpdate.content || slideToUpdate.type === 'media') {
      console.error("Cannot generate image for a slide without content or for a media slide.");
      updateSlideState(slideId, { imageStatus: 'error' });
      return;
    };

    updateSlideState(slideId, { imageStatus: 'loading' });
    
    try {
      const generatedImageUrl = await generateSlideImage(slideToUpdate.content as SlideContent);
      updateSlideState(slideId, { imageStatus: 'generated', imageUrl: generatedImageUrl });
    } catch (imageError) {
      console.error("AI Image generation failed for slide", slideId, imageError);
      updateSlideState(slideId, { imageStatus: 'error' });
    }
  };

  const handleRefineContent = async (slideId: number, userRequest: string) => {
    const slideToRefine = slides.find(s => s.id === slideId);
    if (!slideToRefine || !slideToRefine.content || slideToRefine.type === 'media') {
      throw new Error("Cannot refine content for this slide type.");
    }

    updateSlideState(slideId, { status: 'loading' });
    try {
      const refinedContent = await refineSlideContent(slideToRefine.content as SlideContent, userRequest);
      updateSlideState(slideId, { status: 'generated', content: refinedContent });
    } catch (error) {
      console.error("Refining content failed for slide", slideId, error);
      updateSlideState(slideId, { status: 'generated' }); // Revert status even on failure
      throw error;
    }
  };
  
  const handleAddMediaItem = (slideId: number, newItem: MediaItem) => {
    setSlides(prevSlides =>
      prevSlides.map(s => {
        if (s.id === slideId && s.type === 'media' && isMediaContent(s.content)) {
          const updatedContent: MediaContent = {
            ...s.content,
            items: [...s.content.items, newItem],
          };
          return { ...s, content: updatedContent };
        }
        return s;
      })
    );
  };

  const handleDeleteMediaItem = (slideId: number, itemIndex: number) => {
      setSlides(prevSlides =>
          prevSlides.map(s => {
              if (s.id === slideId && s.type === 'media' && isMediaContent(s.content)) {
                  const updatedItems = s.content.items.filter((_, index) => index !== itemIndex);
                  const updatedContent: MediaContent = { ...s.content, items: updatedItems };
                  return { ...s, content: updatedContent };
              }
              return s;
          })
      );
  };

  const handleDownloadPresentation = async () => {
    const allGeneratedSlides = slides.filter(s => s.status === 'generated' && s.content);
    if (allGeneratedSlides.length === 0) {
        alert("Please generate content for at least one slide before downloading.");
        return;
    }
    
    setIsDownloading(true);

    try {
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [1280, 720] // 16:9 aspect ratio
        });

        for (let i = 0; i < allGeneratedSlides.length; i++) {
            const slide = allGeneratedSlides[i];
            
            if (i > 0) {
                pdf.addPage();
            }
            
            pdf.setFillColor(31, 41, 55); // bg-gray-800
            pdf.rect(0, 0, 1280, 720, 'F');
            
            const padding = 60;
            let currentY = 120;
            
            if (slide.type === 'content') {
                const content = slide.content as SlideContent;
                const textContentWidth = 600;

                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(48);
                pdf.setTextColor(134, 239, 172); // text-green-300
                pdf.text(content.title, padding, currentY, { maxWidth: textContentWidth });
                currentY += pdf.getTextDimensions(content.title, { maxWidth: textContentWidth }).h + 40;

                if (content.subtitle) {
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(24);
                    pdf.setTextColor(156, 163, 175); // text-stone-400
                    pdf.text(content.subtitle, padding, currentY, { maxWidth: textContentWidth });
                    currentY += pdf.getTextDimensions(content.subtitle, { maxWidth: textContentWidth }).h + 30;
                }

                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(20);
                for (const point of content.body) {
                    pdf.setTextColor(74, 222, 128); // text-green-400
                    pdf.text('✓', padding, currentY);
                    
                    pdf.setTextColor(209, 213, 219); // text-stone-300
                    const lines = pdf.splitTextToSize(point, textContentWidth - 25);
                    pdf.text(lines, padding + 25, currentY);
                    currentY += (lines.length * 22) + 15;
                }

                if (slide.imageUrl) {
                    try {
                      pdf.addImage(slide.imageUrl, 'PNG', 700, 110, 520, 292.5); // 16:9 aspect ratio
                    } catch (e) {
                        console.error("Could not add image to PDF for slide: ", slide.title, e);
                        pdf.setTextColor(239, 68, 68);
                        pdf.text("Image failed to load", 860, 360);
                    }
                }
            } else if (slide.type === 'media' && isMediaContent(slide.content)) {
                const content = slide.content;

                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(48);
                pdf.setTextColor(134, 239, 172); // text-green-300
                pdf.text(content.title, padding, currentY, { maxWidth: 1280 - (2 * padding) });
                currentY += pdf.getTextDimensions(content.title).h + 50;

                for (const item of content.items) {
                    if (currentY > 720 - 100) {
                        pdf.addPage();
                        pdf.setFillColor(31, 41, 55);
                        pdf.rect(0, 0, 1280, 720, 'F');
                        currentY = 120;
                    }
                    
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(22);
                    pdf.setTextColor(209, 213, 219);
                    const itemTitle = `[${item.type.charAt(0).toUpperCase() + item.type.slice(1)}] ${item.title}`;
                    const titleLines = pdf.splitTextToSize(itemTitle, 1280 - (2 * padding));
                    pdf.text(titleLines, padding, currentY);
                    currentY += (titleLines.length * 24);

                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(18);
                    pdf.setTextColor(107, 114, 128);
                    pdf.textWithLink(item.url, padding + 2, currentY, { url: item.url });
                    currentY += 20 + 30;
                }
            }
        }
        
        pdf.save('Bhoomi-Naturals-Presentation.pdf');
    } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert("An error occurred while generating the PDF. Please check the console.");
    } finally {
        setIsDownloading(false);
    }
  };

  const currentSlide = slides[currentSlideIndex];

  return (
    <div className="bg-stone-100 min-h-screen font-sans text-stone-900">
        <header className="bg-white shadow-sm sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center h-10 w-10 bg-green-100 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7.657 5.343 12 5.343s5.657 2 5.657 2m-3.15-3.15l-.9.9m2.25 2.25l-.9-.9m-6.3 8.1a4 4 0 015.657 0" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-green-700">Bhoomi Presentation Lab</h1>
                        <p className="text-sm text-stone-500">Powered by Gemini</p>
                    </div>
                </div>
                
                <button
                  onClick={handleDownloadPresentation}
                  disabled={isDownloading || !slides.some(s => s.status === 'generated')}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 disabled:bg-stone-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isDownloading ? (
                    <div className="w-5 h-5"><LoadingSpinner small /></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="ml-2 hidden sm:inline">{isDownloading ? 'Generating...' : 'Download'}</span>
                </button>
            </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-auto">
                    <Sidebar slides={slides} currentSlideId={currentSlide.id} onSelectSlide={handleSelectSlide} />
                </div>
                <div className="flex-1 flex gap-8">
                    <SlideView
                        slide={currentSlide}
                        onRegenerateText={handleRegenerateText}
                        onAddMediaItem={(item) => handleAddMediaItem(currentSlide.id, item)}
                        onDeleteMediaItem={(index) => handleDeleteMediaItem(currentSlide.id, index)}
                    />
                    <div className="hidden lg:block w-full md:w-64 lg:w-72">
                        <aside className="bg-white rounded-xl shadow-sm p-4 flex flex-col h-full">
                           <ChatPanel slide={currentSlide} onRefineContent={handleRefineContent} onGenerateImage={handleGenerateImage} />
                        </aside>
                    </div>
                </div>
            </div>
        </main>

        {/* Mobile/Tablet Chat UI */}
        <div className="lg:hidden">
            {!isChatPanelOpen && (
              <button 
                onClick={() => setIsChatPanelOpen(true)}
                className="fixed bottom-6 right-6 bg-green-600 text-white rounded-full p-4 shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-transform hover:scale-110 z-20"
                aria-label="Refine content"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
            )}

            <div 
              className={`fixed bottom-0 left-0 right-0 z-30 transform transition-transform duration-300 ease-in-out ${isChatPanelOpen ? 'translate-y-0' : 'translate-y-full'}`}
              aria-hidden={!isChatPanelOpen}
            >
                <div className="bg-white p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] rounded-t-lg">
                    <button 
                      onClick={() => setIsChatPanelOpen(false)} 
                      className="absolute top-3 right-3 text-stone-500 hover:text-stone-800"
                      aria-label="Close chat panel"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <ChatPanel slide={currentSlide} onRefineContent={handleRefineContent} onGenerateImage={handleGenerateImage} />
                </div>
            </div>

            {isChatPanelOpen && (
                <div 
                    className="fixed inset-0 bg-black/30 z-20"
                    onClick={() => setIsChatPanelOpen(false)}
                    aria-hidden="true"
                ></div>
            )}
        </div>
    </div>
  );
};

export default App;