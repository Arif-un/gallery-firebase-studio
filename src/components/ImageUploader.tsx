
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
import Webcam from '@uppy/webcam'; // Keep for type, Dashboard will init

import type { UploadedImage } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Import Uppy CSS
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import '@uppy/drag-drop/dist/style.min.css'; // Dashboard will handle DragDrop UI
import '@uppy/file-input/dist/style.min.css'; // Dashboard will handle FileInput UI
import '@uppy/progress-bar/dist/style.min.css';
import '@uppy/url/dist/style.min.css';
import '@uppy/webcam/dist/style.min.css'; // Dashboard will handle Webcam UI


interface ImageUploaderProps {
  onUploadComplete: (images: UploadedImage[]) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onUploadComplete }) => {
  const { toast } = useToast();

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

    // Plugins managed by Dashboard (DragDrop, FileInput, Webcam) are specified in Dashboard's `plugins` prop.
    // Only initialize plugins here that are not directly part of Dashboard's UI plugin set or need specific core config.
    uppyInstance
      .use(ProgressBar, { target: 'body', hideAfterFinish: true })
      .use(Url, { companionUrl: 'https://companion.uppy.io' }) // Uppy's demo companion
      // For GoogleDrive, Dropbox, Instagram, a Companion server is typically needed.
      // Using Uppy's public companion for demo purposes.
      // Replace with your own companion instance in production.
      .use(GoogleDrive, { companionUrl: 'https://companion.uppy.io' })
      .use(Dropbox, { companionUrl: 'https://companion.uppy.io' })
      .use(Instagram, { companionUrl: 'https://companion.uppy.io' });
      // Webcam plugin is listed in Dashboard plugins prop, so it will be initialized by Dashboard.
      // If specific core-level Webcam options were needed beyond what Dashboard offers, you might .use(Webcam) here
      // but without a 'target' if Dashboard is also listing it.
      // For this case, relying on Dashboard's plugin management is cleaner.

    return uppyInstance;
  }, []);

  useEffect(() => {
    const handleComplete = (result: { successful: any[]; failed: any[] }) => {
      const { successful, failed } = result;
      const uploadedImages: UploadedImage[] = [];

      if (failed.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Upload Error',
          description: `${failed.length} files failed to upload. Please check file types and sizes.`,
        });
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
                resolve(null); // Resolve with null if image can't be loaded
              }
              img.src = e.target?.result as string;
            };
            reader.onerror = () => {
              console.error("Error reading file: ", file.name);
              resolve(null);
            }
            reader.readAsDataURL(file.data);
          } else {
            resolve(null); // Not an image file
          }
        });
      });

      Promise.all(imagePromises).then(results => {
        const validImages = results.filter(img => img !== null) as UploadedImage[];
        if (validImages.length > 0) {
          onUploadComplete(validImages);
        }
        uppy.reset(); // Reset Uppy after processing
      }).catch(error => {
        console.error("Error processing uploaded files: ", error);
        toast({
          variant: 'destructive',
          title: 'Processing Error',
          description: 'There was an issue processing uploaded images.',
        });
      });
    };

    uppy.on('complete', handleComplete);

    return () => {
      uppy.off('complete', handleComplete);
      // uppy.close(); // Not needed for useMemo instance, it cleans up itself
    };
  }, [uppy, onUploadComplete, toast]);

  return (
    <Dashboard
      uppy={uppy}
      plugins={['DragDrop', 'FileInput', 'Url', 'Webcam', 'GoogleDrive', 'Dropbox', 'Instagram']}
      proudlyDisplayPoweredByUppy={false}
      width="100%"
      height={400}
      theme="light" // or 'dark' or 'auto'
      note="Images only, up to 10MB each, max 10 files."
      showProgressDetails={true}
      browserBackButtonClose={true}
      locale={{
        strings: {
          // You can customize strings here
          dropPasteImport: 'Drag & drop images here, paste, or %{browse}',
          browse: 'browse your computer',
        },
      }}
      // Apply some Tailwind classes for iOS feel
      className="[&_.uppy-Dashboard-inner]:rounded-lg [&_.uppy-Dashboard-AddFiles]:border-2 [&_.uppy-Dashboard-AddFiles]:border-dashed [&_.uppy-Dashboard-AddFiles]:border-primary/50 [&_.uppy-Dashboard-AddFiles]:bg-primary/5"
    />
  );
};

export default ImageUploader;
