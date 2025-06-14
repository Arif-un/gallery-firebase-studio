
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
const COLS = { lg: 32, md: 24, sm: 16, xs: 12, xxs: 10 };

const generateLayoutItem = (
  image: UploadedImage,
  existingLayout: Layout[] = []
): Layout => {
  const aspectRatio = image.width / image.height;
  const approximateColWidthLg = (1200 - (COLS.lg + 1) * 10) / COLS.lg; 
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
    yPos = yPos + Math.max(...itemsInCurrentPotentialRow.map(i => i.h), h); 
    xPos = 0; 
  }

  return {
    i: image.id,
    x: xPos,
    y: yPos,
    w: DEFAULT_ITEM_WIDTH,
    h: h,
    minW: 4, 
    minH: 2, 
  };
};

const defaultImagesSeed: Omit<UploadedImage, 'id' | 'type'>[] = [
  { src: 'https://images.pexels.com/photos/1172675/pexels-photo-1172675.jpeg?auto=compress&cs=tinysrgb&w=1200', name: 'Lakeside Forest', width: 1200, height: 800, aiHint: 'lake forest' },
  { src: 'https://images.pexels.com/photos/1662298/pexels-photo-1662298.jpeg?auto=compress&cs=tinysrgb&w=1200', name: 'Pine Tree Aerial', width: 1200, height: 674, aiHint: 'pine aerial' },
  { src: 'https://images.pexels.com/photos/1450360/pexels-photo-1450360.jpeg?auto=compress&cs=tinysrgb&w=1200', name: 'Beach Overhead', width: 1200, height: 800, aiHint: 'beach aerial' },
  { src: 'https://images.pexels.com/photos/1526713/pexels-photo-1526713.jpeg?auto=compress&cs=tinysrgb&w=1200', name: 'Coastal Trees', width: 1200, height: 800, aiHint: 'coast trees' },
  { src: 'https://images.pexels.com/photos/1809644/pexels-photo-1809644.jpeg?auto=compress&cs=tinysrgb&w=1200', name: 'River Bend Forest', width: 1200, height: 800, aiHint: 'river forest' },
];

const initialImages: UploadedImage[] = defaultImagesSeed.map((img, index) => ({
  ...img,
  id: `default-image-${index + 1}`,
  type: 'image/jpeg', 
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
            type: 'image/jpeg',
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
      const newLayoutsState: Layouts = { ...prevLayouts };
      let currentLgLayoutForNewItemsCalculation = newLayoutsState.lg ? [...newLayoutsState.lg] : [];
      const itemsLayoutToAdd: Layout[] = [];
      newImages.forEach(img => {
        if (!currentLgLayoutForNewItemsCalculation.find(item => item.i === img.id)) {
            const newLayoutItem = calculateInitialLayoutItem(img, currentLgLayoutForNewItemsCalculation);
            itemsLayoutToAdd.push(newLayoutItem);
            currentLgLayoutForNewItemsCalculation.push(newLayoutItem); 
        }
      });
      
      if (!newLayoutsState.lg) newLayoutsState.lg = [];
      newLayoutsState.lg = [...newLayoutsState.lg, ...itemsLayoutToAdd];
      return newLayoutsState;
    });
  }, [calculateInitialLayoutItem]);

  const onLayoutChange = useCallback((currentLayout: Layout[], allLayouts: Layouts) => {
    setLayouts(allLayouts);
  }, [setLayouts]); 

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
  }, [images, setImages, setLayouts]); 

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
    let endIndex = currentPreviewIndex + halfPoint + (images.length % 2 === 0 ? 0 : 1); 

    if (startIndex < 0) {
      endIndex -= startIndex; 
      startIndex = 0;
    }
    if (endIndex > images.length) {
      startIndex -= (endIndex - images.length); 
      endIndex = images.length;
    }
    
    startIndex = Math.max(0, startIndex);

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
              rowHeight={DEFAULT_ROW_HEIGHT}
              cols={COLS}
            />
          )}
        </section>
      </main>

      {previewImage && (
        <Dialog open={currentPreviewIndex !== null} onOpenChange={(isOpen) => !isOpen && handleClosePreview()}>
           <DialogTitle className="sr-only">{previewImage.name}</DialogTitle>
          <DialogContent className={cn(
            "p-0 m-0 w-screen h-screen max-w-none border-none rounded-none flex items-center justify-center outline-none ring-0 focus:ring-0",
            "frosted-glass shadow-2xl" 
            )}>
            <div className="relative flex flex-col items-center justify-center w-full h-full p-4">
              <DialogClose asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-4 right-4 z-50 text-white rounded-full p-2 bg-black/20 hover:bg-black/30 backdrop-blur-lg border-2 border-white/5"
                  aria-label="Close preview"
                >
                  <X className="h-6 w-6" />
                </Button>
              </DialogClose>

              <div className="relative flex items-center justify-center w-full flex-grow mb-4 overflow-hidden">
                {images.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevPreview}
                    className="absolute left-2 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full text-white transition-all bg-black/20 hover:bg-black/40 backdrop-blur-lg border-2 border-white/5"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-8 w-8 sm:h-10 sm:w-10" />
                  </Button>
                )}

                <div
                  className={cn(
                    "relative inline-block max-w-full max-h-[calc(100vh_-_12rem)]", // Adjust 12rem based on actual header/footer/thumbnail height
                    "bg-black/5 dark:bg-white/5 backdrop-blur-sm rounded-xl shadow-2xl p-3",
                    "border border-white/10 dark:border-black/10"
                  )}
                >
                  <Image
                    key={previewImage.id}
                    src={previewImage.src}
                    alt={previewImage.name}
                    width={previewImage.width}
                    height={previewImage.height}
                    className="block object-contain rounded-lg max-w-full max-h-full"
                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 70vw, 1000px"
                    data-ai-hint={previewImage.aiHint}
                    unoptimized 
                    priority={currentPreviewIndex === images.findIndex(img => img.id === previewImage.id)}
                  />
                </div>

                {images.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextPreview}
                    className="absolute right-2 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full text-white transition-all bg-black/20 hover:bg-black/40 backdrop-blur-lg border-2 border-white/5"
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
                          : "w-14 h-14 sm:w-16 sm:h-16 opacity-70 hover:opacity-100 hover:scale-105 border-2 border-white/5 hover:border-gray-400" 
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
    
