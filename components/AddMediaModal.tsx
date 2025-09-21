import React, { useState } from 'react';
import type { MediaItem } from '../types';

interface AddMediaModalProps {
    onClose: () => void;
    onAddMedia: (item: MediaItem) => void;
}

type InputType = 'url' | 'image';

export const AddMediaModal: React.FC<AddMediaModalProps> = ({ onClose, onAddMedia }) => {
    const [inputType, setInputType] = useState<InputType>('url');
    const [url, setUrl] = useState('');
    const [title, setTitle] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                setError('Image size cannot exceed 2MB.');
                return;
            }
            setImageFile(file);
            setError(null);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!title.trim()) {
            setError('Please provide a title.');
            return;
        }

        if (inputType === 'url') {
            if (!url.trim()) {
                setError('Please provide a URL.');
                return;
            }
            try {
                // Basic URL validation
                new URL(url);
                const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
                onAddMedia({ type: isYouTube ? 'youtube' : 'website', url, title });
            } catch (_) {
                setError('Please enter a valid URL.');
                return;
            }
        } else { // image
            if (!imagePreview) {
                setError('Please select an image file.');
                return;
            }
            onAddMedia({ type: 'photo', url: imagePreview, title });
        }
        
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-gray-700 text-white rounded-lg shadow-xl w-full max-w-md"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-600">
                    <h2 className="text-xl font-semibold">Add New Media</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close modal">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Media Type</label>
                            <div className="flex gap-4 rounded-md bg-gray-800 p-1">
                                <button type="button" onClick={() => setInputType('url')} className={`flex-1 p-2 rounded text-sm font-semibold transition-colors ${inputType === 'url' ? 'bg-green-600' : 'hover:bg-gray-600'}`}>URL (Link/Video)</button>
                                <button type="button" onClick={() => setInputType('image')} className={`flex-1 p-2 rounded text-sm font-semibold transition-colors ${inputType === 'image' ? 'bg-green-600' : 'hover:bg-gray-600'}`}>Upload Image</button>
                            </div>
                        </div>

                        <div>
                           <label htmlFor="title" className="block text-sm font-medium text-gray-300">Title</label>
                           <input
                                id="title"
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm p-2"
                                placeholder="e.g., Bhoomi Naturals Farm"
                                required
                           />
                        </div>

                        {inputType === 'url' ? (
                            <div>
                                <label htmlFor="url" className="block text-sm font-medium text-gray-300">URL</label>
                                <input
                                    id="url"
                                    type="url"
                                    value={url}
                                    onChange={e => setUrl(e.target.value)}
                                    className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm p-2"
                                    placeholder="https://example.com"
                                    required
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Image File</label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                                    <div className="space-y-1 text-center">
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="mx-auto h-24 max-w-full rounded-md object-contain" />
                                        ) : (
                                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                        <div className="flex text-sm text-gray-400 justify-center">
                                            <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-700 rounded-md font-medium text-green-400 hover:text-green-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 focus-within:ring-green-500 px-2 py-1">
                                                <span>{imageFile ? 'Change file' : 'Upload a file'}</span>
                                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, image/gif, image/webp" />
                                            </label>
                                        </div>
                                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 2MB</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {error && <p className="text-sm text-red-400">{error}</p>}
                    </div>

                    <div className="bg-gray-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="submit"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Add Media
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-500 shadow-sm px-4 py-2 bg-transparent text-base font-medium text-gray-200 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};