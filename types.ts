// Defined necessary TypeScript types for the application.
export interface SlideContent {
  title: string;
  subtitle?: string;
  body: string[];
}

export interface MediaItem {
  type: 'youtube' | 'website' | 'photo';
  url: string;
  title: string;
}

export interface MediaContent {
  title: string;
  items: MediaItem[];
}

export interface Slide {
  id: number;
  title: string;
  promptTopic: string;
  videoId?: string;
  type: 'content' | 'media';
}

export type GenerationStatus = 'initial' | 'loading' | 'generated' | 'error';

export interface SlideState extends Slide {
  status: GenerationStatus;
  imageStatus: GenerationStatus;
  content?: SlideContent | MediaContent;
  imageUrl?: string; // Stores a single base64 encoded image with data URI scheme
}

export function isMediaContent(content: any): content is MediaContent {
    return content && Array.isArray(content.items) && typeof content.title === 'string';
}