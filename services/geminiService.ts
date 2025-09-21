// Implemented Gemini API service functions.
import { GoogleGenAI, Type } from "@google/genai";
import type { SlideContent, MediaContent } from '../types';

// As per guidelines, API key is handled externally via process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const slideContentSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A concise and engaging title for the slide.",
    },
    subtitle: {
      type: Type.STRING,
      description: "An optional short subtitle to complement the title.",
    },
    body: {
      type: Type.ARRAY,
      description: "The main content of the slide, as an array of bullet points (strings). Keep each point concise.",
      items: {
        type: Type.STRING,
      }
    },
  },
  required: ["title", "body"],
};

// This schema is no longer used for generation but is kept for type consistency.
const mediaContentSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A concise and engaging title for the slide, e.g., 'Resources & Media'.",
    },
    items: {
      type: Type.ARRAY,
      description: "A list of 3-6 relevant media resources like YouTube videos, websites, or photos.",
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            enum: ['youtube', 'website', 'photo'],
            description: "The type of media: 'youtube', 'website', or 'photo'."
          },
          url: {
            type: Type.STRING,
            description: "The direct URL to the resource. For photos, use a placeholder from a service like Unsplash (e.g., https://images.unsplash.com/photo-...).",
          },
          title: {
            type: Type.STRING,
            description: "A brief, descriptive title for the resource."
          }
        },
        required: ['type', 'url', 'title']
      }
    }
  },
  required: ['title', 'items']
};


export const generateSlideContent = async (topic: string, presentationTitle: string, type: 'content' | 'media'): Promise<SlideContent | MediaContent> => {
  // For media slides, return a default empty structure instead of calling the AI.
  // This allows users to add their own content.
  if (type === 'media') {
    return Promise.resolve({
      title: 'Resources & Media',
      items: [],
    });
  }

  const prompt = `You are a presentation creator. Your task is to generate the content for a single slide of a presentation titled "${presentationTitle}". The topic for this specific slide is "${topic}". Generate a title, an optional subtitle, and the body content as a list of bullet points. Ensure the content is professional, clear, and concise.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: slideContentSchema,
      },
    });

    const jsonText = response.text.trim();
    const sanitizedJson = jsonText.replace(/^```json\s*|```\s*$/g, '');
    const generatedContent = JSON.parse(sanitizedJson);
    
    return generatedContent;

  } catch (error) {
    console.error("Error generating slide content:", error);
    throw new Error("Failed to generate slide content. Please try again.");
  }
};

export const refineSlideContent = async (originalContent: SlideContent, userRequest: string): Promise<SlideContent> => {
  const prompt = `You are a presentation editor. A user wants to refine the content of a slide.
  
  Original Content:
  Title: ${originalContent.title}
  Subtitle: ${originalContent.subtitle || 'N/A'}
  Body: ${originalContent.body.map(b => `- ${b}`).join('\n')}

  User's Request: "${userRequest}"

  Based on the user's request, generate the refined slide content. Adhere to the original JSON structure with a title, an optional subtitle, and a body with bullet points.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: slideContentSchema,
      },
    });

    const jsonText = response.text.trim();
    const sanitizedJson = jsonText.replace(/^```json\s*|```\s*$/g, '');
    const refinedContent = JSON.parse(sanitizedJson);
    
    return refinedContent;

  } catch (error) {
    console.error("Error refining slide content:", error);
    throw new Error("Failed to refine slide content. Please try again.");
  }
};


export const generateSlideImage = async (slideContent: SlideContent): Promise<string> => {
  // FIX: Updated prompt to be more strict about not including text in the generated image.
  const prompt = `Generate a purely visual, professional, and minimalistic vector illustration for a presentation slide. The slide's topic is "${slideContent.title}: ${slideContent.body.join(', ')}".
Key requirements:
- **Strictly no text**: This is the most important rule. Do not include any words, letters, numbers, or any form of typography in the generated image. The image must be entirely pictorial.
- Style: Modern, clean, abstract, and conceptual.
- Color Palette: Use a harmonious blend of blues, greens, and earthy tones.
- Content: The image must be purely symbolic and represent the core idea of the slide without being literal.
- Composition: Simple, elegant, and free of clutter.`;

  try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '16:9',
        },
    });

    if (response.generatedImages.length === 0) {
        throw new Error("No images were generated.");
    }
    
    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
  
  } catch(error) {
    console.error("Error generating slide image:", error);
    throw new Error("Failed to generate slide image. Please try again.");
  }
};