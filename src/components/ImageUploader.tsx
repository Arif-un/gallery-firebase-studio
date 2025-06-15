"use client";

import React, { useEffect, useMemo } from 'react';
import Uppy from '@uppy/core';
import { Dashboard } from '@uppy/react';
// Import plugins that are NOT managed by Dashboard's 'plugins' prop directly here if needed for Uppy core instance
import ProgressBar from '@uppy/progress-bar';
import Url from '@uppy/url';
import GoogleDrive from '@uppy/google-drive';
import Dropbox from '@uppy/dropbox';
import Instagram from '@uppy/instagram';
// Webcam plugin is managed by Dashboard

import type { UploadedImage } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';

// Import Uppy CSS
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import '@uppy/progress-bar/dist/style.min.css';
import '@uppy/url/dist/style.min.css';


interface ImageUploaderProps {
  onUploadComplete: (images: UploadedImage[]) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onUploadComplete }) => {
  const { toast } = useToast();
  const { theme } = useTheme();

  const uppy = useMemo(() => {
    const uppyInstance = new Uppy({
      debug: process.env.NODE_ENV === 'development',
      
      autoProceed: false, // Wait for user to click upload
      restrictions: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedFileTypes: ['image/*'],
        maxNumberOfFiles: 10,
      },
    });

    uppyInstance
      .use(ProgressBar, { target: 'body', hideAfterFinish: true })
      .use(Url, { companionUrl: 'https://companion.uppy.io' })
      .use(GoogleDrive, { companionUrl: 'https://companion.uppy.io' })
      .use(Dropbox, { companionUrl: 'https://companion.uppy.io' })
      .use(Instagram, { companionUrl: 'https://companion.uppy.io' });
      
    return uppyInstance;
  }, [theme]);

  useEffect(() => {
    const handleComplete = (result: { successful: any[]; failed: any[] }) => {
      const { successful, failed } = result;

      if (failed.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Upload Error',
          description: `${failed.length} files failed to upload. Please check file types and sizes.`,
        });
      }

      if (successful.length === 0 && failed.length > 0) {
        // If only failures, reset immediately
        uppy.cancelAll();
        return;
      }
      
      if (successful.length === 0) {
        // No successful files to process, reset if not already handled by failure case
        uppy.cancelAll();
        return;
      }

      const imagePromises = successful.map(file => {
        return new Promise<UploadedImage | null>((resolve) => {
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const img = new Image();
              img.onload = () => {
                resolve({
                  id: file.id,
                  src: e.target?.result as string,
                  name: file.name,
                  width: img.naturalWidth,
                  height: img.naturalHeight,
                  type: file.type,
                });
              };
              img.onerror = () => {
                console.error("Error loading image for dimensions: ", file.name);
                resolve(null); 
              }
              img.src = e.target?.result as string;
            };
            reader.onerror = () => {
              console.error("Error reading file: ", file.name);
              resolve(null);
            }
            reader.readAsDataURL(file.data);
          } else {
            resolve(null); 
          }
        });
      });

      Promise.all(imagePromises).then(results => {
        const validImages = results.filter(img => img !== null) as UploadedImage[];
        if (validImages.length > 0) {
          onUploadComplete(validImages);
        }
      }).catch(error => {
        console.error("Error processing uploaded files: ", error);
        toast({
          variant: 'destructive',
          title: 'Processing Error',
          description: 'There was an issue processing uploaded images.',
        });
      }).finally(() => {
        // Always reset Uppy after attempting to process files
        uppy.cancelAll()
      });
    };

    uppy.on('complete', handleComplete);

    return () => {
      uppy.off('complete', handleComplete);
    };
  }, [uppy, onUploadComplete, toast]);

  return (
    <Dashboard
      uppy={uppy}
      plugins={['DragDrop', 'FileInput', 'Url', 'Webcam', 'GoogleDrive', 'Dropbox', 'Instagram']}
      proudlyDisplayPoweredByUppy={false}
      width="100%"
      height={300}
      theme={theme}
      note="Images only, up to 10MB each, max 10 files."
      showProgressDetails={true}
      locale={{
        strings: {
          dropPasteImportBoth: 'Drag & drop images here, paste, or %{browseFiles}',
          browseFiles: 'browse your computer',
        },
      }}
      className="[&_.uppy-Dashboard-inner]:rounded-lg [&_.uppy-Dashboard-AddFiles]:border-2 [&_.uppy-Dashboard-AddFiles]:border-dashed [&_.uppy-Dashboard-AddFiles]:border-primary/50 [&_.uppy-Dashboard-AddFiles]:bg-primary/5 [&_.uppy-Dashboard-inner]:dark:bg-gray-800 [&_.uppy-Dashboard-inner]:dark:border-gray-700 [&_.uppy-Dashboard-AddFiles]:dark:bg-gray-900/50 [&_.uppy-Dashboard-AddFiles]:dark:border-gray-600 [&_.uppy-Dashboard-browse]:dark:text-blue-400 [&_.uppy-Dashboard-dropFilesHereHint]:dark:text-gray-300 [&_.uppy-Dashboard-Item-name]:dark:text-gray-300 [&_.uppy-Dashboard-Item-statusSize]:dark:text-gray-400 [&_.uppy-Dashboard-Item]:dark:bg-gray-900/50 [&_.uppy-Dashboard-Item]:dark:border-gray-700 [&_.uppy-Dashboard-Item-preview]:dark:bg-gray-800 [&_.uppy-Dashboard-Item-previewInnerWrap]:dark:border-gray-700 [&_.uppy-Dashboard-FileInput]:dark:text-gray-300"
    />
  );
};

export default ImageUploader;
