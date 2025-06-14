
"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { UploadedImage } from '@/types';
import type { Layout, Layouts } from 'react-grid-layout';
import ImageUploader from '@/components/ImageUploader';
import ImageGrid from '@/components/ImageGrid';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Dialog, DialogContent, DialogClose, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';
import { cn } from '@/lib/utils';

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
  { src: 'https://placehold.co/500x800.png', name: 'City Skyline', width: 500, height: 800, aiHint: 'city night' },
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
      if (images.filter(img => img.id !== imageId).length === 0) {
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


  const getThumbnailsForPreview = (): UploadedImage[] => {
    if (!images.length || currentPreviewIndex === null) return [];
    const totalThumbnails = 5; 
    const halfPoint = Math.floor(totalThumbnails / 2);

    if (images.length <= totalThumbnails) {
      return images;
    }

    let startIndex = currentPreviewIndex - halfPoint;
    let endIndex = currentPreviewIndex + halfPoint + 1; 

    if (startIndex < 0) {
      startIndex = 0;
      endIndex = totalThumbnails;
    } else if (endIndex > images.length) {
      endIndex = images.length;
      startIndex = images.length - totalThumbnails;
    }
    
    return images.slice(startIndex, endIndex);
  };

  const previewImage = currentPreviewIndex !== null ? images[currentPreviewIndex] : null;

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
          <DialogContent className={cn(
            "p-0 m-0 w-screen h-screen max-w-none border-none rounded-none flex items-center justify-center outline-none ring-0 focus:ring-0",
            "frosted-glass"
            )}>
            <DialogTitle className="sr-only">{previewImage.name}</DialogTitle>
            <div className="relative flex flex-col items-center justify-center w-full h-full p-4">
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full">
                  <X className="h-6 w-6" />
                </Button>
              </DialogClose>

              <div className="relative flex items-center justify-center w-full flex-grow mb-4">
                {images.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevPreview}
                    className="absolute left-2 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-all"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-8 w-8 sm:h-10 sm:w-10" />
                  </Button>
                )}

                <div className="relative w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl h-full max-h-[70vh] sm:max-h-[75vh] flex items-center justify-center">
                  <Image
                    src={previewImage.src}
                    alt={previewImage.name}
                    fill
                    className="object-contain rounded-lg shadow-2xl"
                    data-ai-hint={previewImage.aiHint}
                    unoptimized
                  />
                </div>

                {images.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextPreview}
                    className="absolute right-2 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-all"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-8 w-8 sm:h-10 sm:w-10" />
                  </Button>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex-shrink-0 w-full max-w-md sm:max-w-lg md:max-w-xl flex justify-center items-end gap-2 sm:gap-3 p-2 h-[100px] sm:h-[120px]">
                  {getThumbnailsForPreview().map((thumbImage) => (
                    <button
                      key={thumbImage.id}
                      onClick={() => setCurrentPreviewIndex(images.findIndex(img => img.id === thumbImage.id))}
                      className={cn(
                        "relative rounded-md overflow-hidden transition-all duration-200 ease-in-out aspect-square",
                        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black/50",
                        thumbImage.id === previewImage.id
                          ? "w-20 h-20 sm:w-24 sm:h-24 ring-2 ring-primary shadow-xl border-2 border-primary"
                          : "w-14 h-14 sm:w-16 sm:h-16 opacity-70 hover:opacity-100 hover:scale-105 border-2 border-transparent hover:border-gray-400"
                      )}
                      aria-label={`View image ${thumbImage.name}`}
                    >
                      <Image
                        src={thumbImage.src}
                        alt={thumbImage.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                       {thumbImage.id === previewImage.id && (
                         <div className="absolute inset-0 bg-primary/30" />
                       )}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
