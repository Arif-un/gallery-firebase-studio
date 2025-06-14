"use client";

import React, { useState, useCallback, useEffect } from 'react';
import type { UploadedImage, CustomLayoutItem } from '@/types';
import type { Layout, Layouts } from 'react-grid-layout';
import ImageUploader from '@/components/ImageUploader';
import ImageGrid from '@/components/ImageGrid';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Trash2 } from 'lucide-react';

const DEFAULT_ITEM_WIDTH = 4; // In grid units
const DEFAULT_ROW_HEIGHT = 30; // In pixels, ensure this matches ImageGrid's rowHeight
const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }; // Match ImageGrid's cols

export default function IGalleryPage() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [layouts, setLayouts] = useState<Layouts>({ lg: [] });
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem('igallery-theme') as 'light' | 'dark' | null;
    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.classList.toggle('dark', storedTheme === 'dark');
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('igallery-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const calculateInitialLayoutItem = (
    image: UploadedImage,
    existingLayout: Layout[] = []
  ): Layout => {
    // Simplified calculation for h - assumes colWidth is roughly (containerWidth / cols)
    // A more precise colWidth would require knowing current containerWidth and breakpoint.
    // For demo, let's estimate aspect ratio relative to a fixed width.
    const aspectRatio = image.width / image.height;
    const estimatedPixelWidth = DEFAULT_ITEM_WIDTH * (1200 / COLS.lg); // Approximate pixel width for 'lg'
    const estimatedPixelHeight = estimatedPixelWidth / aspectRatio;
    const h = Math.max(2, Math.ceil(estimatedPixelHeight / (DEFAULT_ROW_HEIGHT + 10 /* marginY */)));

    // Find the next available position (simple vertical stacking)
    let yPos = 0;
    if (existingLayout.length > 0) {
      yPos = Math.max(...existingLayout.map(item => item.y + item.h), 0);
    }
    const xPos = (existingLayout.filter(item => item.y === yPos).reduce((sum, item) => sum + item.w, 0)) % COLS.lg;


    return {
      i: image.id,
      x: xPos,
      y: yPos, // Place new items at the bottom
      w: DEFAULT_ITEM_WIDTH,
      h: h,
      minW: 2,
      minH: 2,
    };
  };


  const handleUploads = useCallback((newImages: UploadedImage[]) => {
    setImages(prevImages => {
      const updatedImages = [...prevImages];
      const newImageIds = new Set(newImages.map(img => img.id));
      // Filter out any images that might already exist by ID, though Uppy should provide unique IDs
      const uniqueNewImages = newImages.filter(img => !prevImages.some(pi => pi.id === img.id));
      updatedImages.push(...uniqueNewImages);
      return updatedImages;
    });

    setLayouts(prevLayouts => {
      const newLayoutItems: Layout[] = [];
      const currentLgLayout = prevLayouts.lg ? [...prevLayouts.lg] : [];
      
      newImages.forEach(img => {
        if (!currentLgLayout.find(item => item.i === img.id)) { // Avoid duplicates
            newLayoutItems.push(calculateInitialLayoutItem(img, currentLgLayout));
        }
      });

      const updatedLgLayout = [...currentLgLayout, ...newLayoutItems];
      
      return { ...prevLayouts, lg: updatedLgLayout };
    });
  }, []);

  const onLayoutChange = useCallback((currentLayout: Layout[], allLayouts: Layouts) => {
    // This callback provides layout for the current breakpoint.
    // We update allLayouts directly for ResponsiveGridLayout to manage.
    setLayouts(allLayouts);
  }, []);

  const handleImageRemove = useCallback((imageId: string) => {
    setImages(prevImages => prevImages.filter(img => img.id !== imageId));
    setLayouts(prevLayouts => {
      const newLgLayout = prevLayouts.lg?.filter(item => item.i !== imageId) || [];
      return { ...prevLayouts, lg: newLgLayout };
    });
  }, []);

  const handleRemoveAllImages = () => {
    setImages([]);
    setLayouts({ lg: [] });
  };

  if (!mounted) {
    // Avoid hydration mismatch by not rendering Uppy/RGL until client-side mounted
    return <div className="min-h-screen bg-background flex items-center justify-center"><p>Loading iGallery...</p></div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 md:p-8 transition-colors duration-300">
      <header className="w-full max-w-6xl mb-8 flex justify-between items-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary animate-fade-in-down">
          iGallery
        </h1>
        <Button onClick={toggleTheme} variant="ghost" size="icon" aria-label="Toggle theme">
          {theme === 'light' ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
        </Button>
      </header>

      <main className="w-full max-w-6xl flex flex-col gap-8">
        <section aria-labelledby="upload-heading" className="frosted-glass rounded-xl shadow-xl p-4 sm:p-6 animate-fade-in-up">
          <h2 id="upload-heading" className="text-2xl font-semibold mb-4 text-primary">
            Upload Your Masterpieces
          </h2>
          <ImageUploader onUploadComplete={handleUploads} />
        </section>

        <section aria-labelledby="gallery-heading" className="frosted-glass rounded-xl shadow-xl p-4 sm:p-6 min-h-[400px] animate-fade-in-up animation-delay-200">
          <div className="flex justify-between items-center mb-4">
            <h2 id="gallery-heading" className="text-2xl font-semibold text-primary">
              Your Collection
            </h2>
            {images.length > 0 && (
              <Button variant="destructive" onClick={handleRemoveAllImages} size="sm">
                <Trash2 className="mr-2 h-4 w-4" /> Clear All
              </Button>
            )}
          </div>
          {images.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">
              Your gallery is currently empty. Upload some images to see them here!
            </p>
          ) : (
            <ImageGrid 
              images={images} 
              layouts={layouts} 
              onLayoutChange={onLayoutChange} 
              onImageRemove={handleImageRemove} 
            />
          )}
        </section>
      </main>

      <footer className="w-full max-w-6xl mt-12 text-center text-sm text-muted-foreground animate-fade-in-up animation-delay-400">
        <p>&copy; {new Date().getFullYear()} iGallery. Inspired by Apple. Crafted with Next.js & Tailwind CSS.</p>
      </footer>
      <style jsx global>{`
        .animate-fade-in-down {
          animation: fadeInDown 0.5s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-400 { animation-delay: 0.4s; }
        
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
