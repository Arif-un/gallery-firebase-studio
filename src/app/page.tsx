
"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { UploadedImage } from '@/types';
import type { Layout, Layouts } from 'react-grid-layout';
import ImageUploader from '@/components/ImageUploader';
import ImageGrid from '@/components/ImageGrid';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Image from 'next/image';

const DEFAULT_ITEM_WIDTH = 4; 
const DEFAULT_ROW_HEIGHT = 30; 
const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }; 

const generateLayoutItem = (
  image: UploadedImage,
  existingLayout: Layout[] = []
): Layout => {
  const aspectRatio = image.width / image.height;
  const approximateColWidthLg = 1200 / COLS.lg; 
  const estimatedPixelWidth = DEFAULT_ITEM_WIDTH * approximateColWidthLg;
  const estimatedPixelHeight = estimatedPixelWidth / aspectRatio;
  const h = Math.max(2, Math.ceil(estimatedPixelHeight / (DEFAULT_ROW_HEIGHT + 10 )));

  let yPos = 0;
  if (existingLayout.length > 0) {
    yPos = Math.max(...existingLayout.map(item => item.y + item.h), 0);
  }
  
  const itemsInCurrentPotentialRow = existingLayout.filter(item => item.y === yPos);
  let xPos = 0;
  if(itemsInCurrentPotentialRow.length > 0){
    xPos = itemsInCurrentPotentialRow.reduce((sum, item) => sum + item.w, 0) % COLS.lg;
  }
 
  if (xPos + DEFAULT_ITEM_WIDTH > COLS.lg) {
    yPos = yPos + h; 
    xPos = 0;
  }

  return {
    i: image.id,
    x: xPos,
    y: yPos,
    w: DEFAULT_ITEM_WIDTH,
    h: h,
    minW: 2,
    minH: 2,
  };
};

const defaultImagesSeed: Omit<UploadedImage, 'id' | 'type'>[] = [
  { src: 'https://placehold.co/800x500.png', name: 'Mountain Vista', width: 800, height: 500, aiHint: 'mountain lake' },
  { src: 'https://placehold.co/400x600.png', name: 'Forest Trail', width: 400, height: 600, aiHint: 'deep forest' },
  { src: 'https://placehold.co/700x450.png', name: 'Sunset Beach', width: 700, height: 450, aiHint: 'tropical sunset' },
  { src: 'https://placehold.co/600x700.png', name: 'Desert Mirage', width: 600, height: 700, aiHint: 'sand dunes' },
];

const initialImages: UploadedImage[] = defaultImagesSeed.map((img, index) => ({
  ...img,
  id: `default-image-${index + 1}`,
  type: 'image/png', 
}));

let tempCurrentLayoutForInit: Layout[] = [];
const initialLayoutsLg: Layout[] = initialImages.map(img => {
  const layoutItem = generateLayoutItem(img, tempCurrentLayoutForInit);
  tempCurrentLayoutForInit.push(layoutItem);
  return layoutItem;
});


export default function IGalleryPage() {
  const [images, setImages] = useState<UploadedImage[]>(initialImages);
  const [layouts, setLayouts] = useState<Layouts>({ lg: initialLayoutsLg });
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const defaultsInitializedRef = useRef(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState<number | null>(null);


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

    if (images.length === 0 && (!layouts.lg || layouts.lg.length === 0) && !defaultsInitializedRef.current) {
        const derivedInitialImages: UploadedImage[] = defaultImagesSeed.map((img, index) => ({
            ...img,
            id: `default-image-reinit-${index + 1}`, 
            type: 'image/png',
        }));
        
        let tempLayout: Layout[] = [];
        const derivedInitialLayoutsLg: Layout[] = derivedInitialImages.map(img => {
            const layoutItem = generateLayoutItem(img, tempLayout);
            tempLayout.push(layoutItem);
            return layoutItem;
        });
        setImages(derivedInitialImages);
        setLayouts({ lg: derivedInitialLayoutsLg });
        defaultsInitializedRef.current = true;
    }
  }, []);


  const calculateInitialLayoutItem = useCallback((
    image: UploadedImage,
    existingLayout: Layout[] = []
  ): Layout => {
    return generateLayoutItem(image, existingLayout);
  }, []);


  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('igallery-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleUploads = useCallback((newImages: UploadedImage[]) => {
    setImages(prevImages => {
      const updatedImages = [...prevImages];
      const uniqueNewImages = newImages.filter(img => !prevImages.some(pi => pi.id === img.id));
      updatedImages.push(...uniqueNewImages);
      return updatedImages;
    });

    setLayouts(prevLayouts => {
      const newLayoutsState: Layouts = {};
      // Ensure all breakpoints are initialized as new arrays
      (Object.keys(COLS) as Array<keyof typeof COLS>).forEach(bk => {
        newLayoutsState[bk] = prevLayouts[bk] ? [...prevLayouts[bk]!] : [];
      });
      
      let currentLgLayoutForNewItemsCalculation = newLayoutsState.lg ? [...newLayoutsState.lg] : [];

      const itemsLayoutToAdd: Layout[] = [];
      newImages.forEach(img => {
        if (!currentLgLayoutForNewItemsCalculation.find(item => item.i === img.id)) {
            const newLayoutItem = calculateInitialLayoutItem(img, currentLgLayoutForNewItemsCalculation);
            itemsLayoutToAdd.push(newLayoutItem);
            currentLgLayoutForNewItemsCalculation.push(newLayoutItem); 
        }
      });
      
      newLayoutsState.lg = [...(newLayoutsState.lg || []), ...itemsLayoutToAdd];
      return newLayoutsState;
    });
  }, [calculateInitialLayoutItem]);

  const onLayoutChange = useCallback((currentLayout: Layout[], allLayouts: Layouts) => {
    const hasRelevantLayouts = Object.values(allLayouts).some(layoutArray => layoutArray.length > 0);
    if (images.length > 0 && hasRelevantLayouts) {
         setLayouts(allLayouts);
    } else if (images.length === 0) {
        setLayouts({ lg: [], md: [], sm: [], xs: [], xxs: [] });
    }
  }, [images.length]);

  const handleImageRemove = useCallback((imageId: string) => {
    setImages(prevImages => prevImages.filter(img => img.id !== imageId));
    setLayouts(prevLayouts => {
      const newLayoutsState: Layouts = {};
      (Object.keys(prevLayouts) as Array<keyof Layouts>).forEach(breakpointKey => {
        newLayoutsState[breakpointKey] = (prevLayouts[breakpointKey] || []).filter(
          (layoutItem: Layout) => layoutItem.i !== imageId
        );
      });
      // If lg becomes empty, reset all to ensure consistency, especially if other breakpoints might not have been explicitly cleared.
      if (newLayoutsState.lg && newLayoutsState.lg.length === 0 && images.filter(img => img.id !== imageId).length === 0) {
        return { lg: [], md: [], sm: [], xs: [], xxs: [] };
      }
      return newLayoutsState;
    });
  }, [images]);

  const handleRemoveAllImages = () => {
    setImages([]);
    setLayouts({ lg: [], md: [], sm: [], xs: [], xxs: [] });
  };

  const handleOpenPreview = useCallback((imageId: string) => {
      const imageIndex = images.findIndex(img => img.id === imageId);
      if (imageIndex !== -1) {
          setCurrentPreviewIndex(imageIndex);
      }
  }, [images]);

  const handleClosePreview = useCallback(() => {
      setCurrentPreviewIndex(null);
  }, []);

  const handleNextPreview = useCallback(() => {
      if (currentPreviewIndex !== null && images.length > 0) {
          setCurrentPreviewIndex((currentPreviewIndex + 1) % images.length);
      }
  }, [currentPreviewIndex, images]);

  const handlePrevPreview = useCallback(() => {
      if (currentPreviewIndex !== null && images.length > 0) {
          setCurrentPreviewIndex((currentPreviewIndex - 1 + images.length) % images.length);
      }
  }, [currentPreviewIndex, images]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (currentPreviewIndex === null) return;

        if (event.key === 'ArrowRight') {
            handleNextPreview();
        } else if (event.key === 'ArrowLeft') {
            handlePrevPreview();
        } else if (event.key === 'Escape') {
            handleClosePreview();
        }
    };

    if (currentPreviewIndex !== null) {
        window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPreviewIndex, handleNextPreview, handlePrevPreview, handleClosePreview]);

  const previewImage = currentPreviewIndex !== null ? images[currentPreviewIndex] : null;
  const nextImage = currentPreviewIndex !== null && images.length > 0 ? images[(currentPreviewIndex + 1) % images.length] : null;
  const prevImage = currentPreviewIndex !== null && images.length > 0 ? images[(currentPreviewIndex - 1 + images.length) % images.length] : null;


  if (!mounted) {
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
              onImagePreview={handleOpenPreview} 
            />
          )}
        </section>
      </main>

      {previewImage && (
        <Dialog open={currentPreviewIndex !== null} onOpenChange={(isOpen) => !isOpen && handleClosePreview()}>
          <DialogContent className="w-full max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-5xl p-0 bg-card/90 backdrop-blur-lg border-border rounded-xl overflow-hidden shadow-2xl">
            <DialogHeader className="p-4 border-b border-border">
              <DialogTitle className="text-lg font-medium text-foreground truncate">{previewImage.name}</DialogTitle>
            </DialogHeader>
            
            <div className="relative w-full aspect-video max-h-[calc(100vh-220px)] sm:max-h-[calc(100vh-250px)] flex items-center justify-center p-1 bg-black/5">
              <Image
                src={previewImage.src}
                alt={previewImage.name}
                fill
                className="object-contain"
                data-ai-hint={previewImage.aiHint}
                unoptimized
              />
            </div>

            <DialogFooter className="p-3 sm:p-4 flex justify-between items-center bg-background/70 backdrop-blur-sm rounded-b-xl border-t border-border">
              <div className="w-1/3 flex justify-start">
                {images.length > 1 && prevImage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevPreview}
                    aria-label={`Previous image: ${prevImage.name}`}
                    className="p-0 h-10 w-10 sm:h-12 sm:w-12 relative rounded-md overflow-hidden group border-2 border-transparent hover:border-primary focus-visible:border-primary transition-all"
                  >
                    <Image src={prevImage.src} alt={prevImage.name} layout="fill" objectFit="cover" className="group-hover:opacity-80 transition-opacity" unoptimized />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handlePrevPreview} disabled={images.length <= 1} aria-label="Previous image" className="rounded-full h-10 w-10 sm:h-12 sm:w-12">
                  <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
                <Button variant="outline" onClick={handleNextPreview} disabled={images.length <= 1} aria-label="Next image" className="rounded-full h-10 w-10 sm:h-12 sm:w-12">
                  <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              </div>

              <div className="w-1/3 flex justify-end">
                {images.length > 1 && nextImage && (
                   <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextPreview}
                    aria-label={`Next image: ${nextImage.name}`}
                    className="p-0 h-10 w-10 sm:h-12 sm:w-12 relative rounded-md overflow-hidden group border-2 border-transparent hover:border-primary focus-visible:border-primary transition-all"
                  >
                    <Image src={nextImage.src} alt={nextImage.name} layout="fill" objectFit="cover" className="group-hover:opacity-80 transition-opacity" unoptimized />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
