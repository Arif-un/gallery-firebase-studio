"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { UploadedImage } from '@/types';
import type { Layout, Layouts } from 'react-grid-layout';
import ImageUploader from '@/components/ImageUploader';
import ImageGrid from '@/components/ImageGrid';
import { Button } from '@/components/ui/button';
import { Sun, Moon, ChevronLeft, ChevronRight, X, Shuffle as ShuffleIcon, Grid3X3, Grid2X2, Grid, Dot } from 'lucide-react';
import { Dialog, DialogContent, DialogClose, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';
import { cn, generateBentoGrid, validateAndFillGrid } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

const DEFAULT_ITEM_WIDTH = 4; 
const COLS = { lg: 32, md: 24, sm: 16, xs: 12, xxs: 10 };

const MIN_RANDOM_W = 4;
const MAX_RANDOM_W_FACTOR = 0.375; 
const MIN_RANDOM_H = 2;
const MAX_RANDOM_H = 8; 


const generateLayoutItem = (
  image: UploadedImage,
  _existingLayout: Layout[] = [], 
  _itemWidth: number = DEFAULT_ITEM_WIDTH, 
  colsForBreakpoint: number = COLS.lg
): Layout => {
  const maxW = Math.max(MIN_RANDOM_W, Math.floor(colsForBreakpoint * MAX_RANDOM_W_FACTOR));
  const w = Math.floor(Math.random() * (maxW - MIN_RANDOM_W + 1)) + MIN_RANDOM_W;
  const h = Math.floor(Math.random() * (MAX_RANDOM_H - MIN_RANDOM_H + 1)) + MIN_RANDOM_H;

  return {
    i: image.id,
    x: 0, 
    y: Infinity, 
    w: w,
    h: h,
    minW: MIN_RANDOM_W, 
    minH: MIN_RANDOM_H, 
  };
};

const defaultImagesSeed: Omit<UploadedImage, 'id' | 'type'>[] = [
  { src: 'https://images.pexels.com/photos/1172675/pexels-photo-1172675.jpeg?auto=compress&cs=tinysrgb&w=1200', name: 'Lakeside Forest', width: 1200, height: 800, aiHint: 'lake forest' },
  { src: 'https://images.pexels.com/photos/1662298/pexels-photo-1662298.jpeg?auto=compress&cs=tinysrgb&w=1200', name: 'Pine Tree Aerial', width: 1200, height: 674, aiHint: 'pine aerial' },
  { src: 'https://images.pexels.com/photos/1450360/pexels-photo-1450360.jpeg?auto=compress&cs=tinysrgb&w=1200', name: 'Beach Overhead', width: 1200, height: 800, aiHint: 'beach aerial' },
  { src: 'https://images.pexels.com/photos/1526713/pexels-photo-1526713.jpeg?auto=compress&cs=tinysrgb&w=1200', name: 'Coastal Trees', width: 1200, height: 800, aiHint: 'coast trees' },
  { src: 'https://images.pexels.com/photos/1809644/pexels-photo-1809644.jpeg?auto=compress&cs=tinysrgb&w=1200', name: 'River Bend Forest', width: 1200, height: 800, aiHint: 'river forest' },
  { src: 'https://images.pexels.com/photos/40465/pexels-photo-40465.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', name: 'Butterfly Flower', width: 1260, height: 750, aiHint: 'butterfly flower' },
  { src: 'https://images.pexels.com/photos/32289220/pexels-photo-32289220/free-photo-of-traditional-blue-door-in-tunisian-architecture.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', name: 'Blue Door Tunisia', width: 1260, height: 750, aiHint: 'blue door' },
  { src: 'https://images.pexels.com/photos/2884867/pexels-photo-2884867.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', name: 'Forest Path Sunlight', width: 1260, height: 750, aiHint: 'forest path' },
  { src: 'https://images.pexels.com/photos/1535162/pexels-photo-1535162.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', name: 'Mountain Starry Sky', width: 1260, height: 750, aiHint: 'mountain sky' },
  { src: 'https://images.pexels.com/photos/1226302/pexels-photo-1226302.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', name: 'Desert Dunes Sunset', width: 1260, height: 750, aiHint: 'desert dunes' },
  { src: 'https://images.pexels.com/photos/440731/pexels-photo-440731.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', name: 'Autumn Road', width: 1260, height: 750, aiHint: 'autumn road' },
  { src: 'https://images.pexels.com/photos/2144922/pexels-photo-2144922.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', name: 'City Night Lights', width: 1260, height: 750, aiHint: 'city lights' },
  { src: 'https://images.pexels.com/photos/4697568/pexels-photo-4697568.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', name: 'Vintage Car Street', width: 1260, height: 750, aiHint: 'vintage car' },
  { src: 'https://images.pexels.com/photos/1563356/pexels-photo-1563356.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', name: 'Forest Trail Autumn', width: 1260, height: 750, aiHint: 'forest trail' },
  { src: 'https://images.pexels.com/photos/3319815/pexels-photo-3319815.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', name: 'Lighthouse Coast', width: 1260, height: 750, aiHint: 'lighthouse coast' },
];

const initialImages: UploadedImage[] = defaultImagesSeed.map((img, index) => ({
  ...img,
  id: `default-image-${index + 1}`,
  type: 'image/jpeg', 
}));

let tempCurrentLayoutForInit: Layout[] = [];
const initialLayoutsLg: Layout[] =[
  {
      "w": 10,
      "h": 7,
      "x": 0,
      "y": 0,
      "i": "default-image-1",
      "minW": 10,
      "minH": 4,
      "moved": false,
      "static": false
  },
  {
      "w": 10,
      "h": 5,
      "x": 10,
      "y": 0,
      "i": "default-image-2",
      "minW": 10,
      "minH": 4,
      "moved": false,
      "static": false
  },
  {
      "w": 12,
      "h": 7,
      "x": 20,
      "y": 0,
      "i": "default-image-3",
      "minW": 10,
      "minH": 4,
      "moved": false,
      "static": false
  },
  {
      "w": 10,
      "h": 5,
      "x": 10,
      "y": 5,
      "i": "default-image-4",
      "minW": 10,
      "minH": 4,
      "moved": false,
      "static": false
  },
  {
      "w": 10,
      "h": 7,
      "x": 0,
      "y": 7,
      "i": "default-image-5",
      "minW": 10,
      "minH": 4,
      "moved": false,
      "static": false
  },
  {
      "w": 12,
      "h": 7,
      "x": 20,
      "y": 7,
      "i": "default-image-6",
      "minW": 10,
      "minH": 4,
      "moved": false,
      "static": false
  },
  {
      "w": 10,
      "h": 4,
      "x": 10,
      "y": 10,
      "i": "default-image-7",
      "minW": 10,
      "minH": 4,
      "moved": false,
      "static": false
  },
  {
      "w": 11,
      "h": 11,
      "x": 0,
      "y": 14,
      "i": "default-image-8",
      "minW": 10,
      "minH": 4,
      "moved": false,
      "static": false
  },
  {
      "w": 21,
      "h": 6,
      "x": 11,
      "y": 14,
      "i": "default-image-9",
      "minW": 10,
      "minH": 4,
      "moved": false,
      "static": false
  },
  {
      "w": 10,
      "h": 5,
      "x": 11,
      "y": 20,
      "i": "default-image-10",
      "minW": 10,
      "minH": 4,
      "moved": false,
      "static": false
  },
  {
      "w": 12,
      "h": 5,
      "x": 0,
      "y": 25,
      "i": "default-image-11",
      "minW": 10,
      "minH": 4,
      "moved": false,
      "static": false
  },
  {
      "w": 11,
      "h": 5,
      "x": 21,
      "y": 20,
      "i": "default-image-12",
      "minW": 10,
      "minH": 4,
      "moved": false,
      "static": false
  },
  {
      "w": 20,
      "h": 8,
      "x": 12,
      "y": 25,
      "i": "default-image-13",
      "minW": 10,
      "minH": 4,
      "moved": false,
      "static": false
  },
  {
      "w": 12,
      "h": 11,
      "x": 0,
      "y": 30,
      "i": "default-image-14",
      "minW": 10,
      "minH": 4,
      "moved": false,
      "static": false
  },
  {
      "w": 20,
      "h": 8,
      "x": 12,
      "y": 33,
      "i": "default-image-15",
      "minW": 10,
      "minH": 4,
      "moved": false,
      "static": false
  }
]


export default function GalleryPage() {
  const [images, setImages] = useState<UploadedImage[]>(initialImages);
  const [layouts, setLayouts] = useState<Layouts>({ lg: initialLayoutsLg });
  const [mounted, setMounted] = useState(false);
  const defaultsInitializedRef = useRef(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState<number | null>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    
    if (images.length === 0 && (!layouts.lg || layouts.lg.length === 0) && !defaultsInitializedRef.current) {
      const derivedInitialImages: UploadedImage[] = defaultImagesSeed.map((img, index) => ({
        ...img,
        id: `default-image-reinit-${index + 1}`, 
        type: 'image/jpeg',
      }));
      
      let tempLayout: Layout[] = [];
      const derivedInitialLayoutsLg: Layout[] = derivedInitialImages.map(img => {
        const layoutItem = generateLayoutItem(img, tempLayout, DEFAULT_ITEM_WIDTH, COLS.lg);
        tempLayout.push(layoutItem);
        return layoutItem;
      });
      setImages(derivedInitialImages);
      setLayouts({ lg: derivedInitialLayoutsLg });
      defaultsInitializedRef.current = true; 
    }
  }, []);   

  const handleUploads = useCallback((newImages: UploadedImage[]) => {
    setImages(prevImages => {
      const updatedImages = [...prevImages];
      const uniqueNewImages = newImages.filter(img => !prevImages.some(pi => pi.id === img.id));
      // Place new images at the beginning
      return [...uniqueNewImages, ...updatedImages].map((img, index) => ({...img, id: `default-image-${index + 1}`}));
    });

    setLayouts(prevLayouts => {
      const newLayoutsState: Layouts = { ...prevLayouts };
      const currentImages = [...newImages, ...images];
      
      // Generate new layout for all images
      let newLgLayout: Layout[] = generateBentoGrid(currentImages.length);
      newLgLayout = validateAndFillGrid(newLgLayout, 32);
      // Update the layouts state with the new layout
      newLayoutsState.lg = newLgLayout;
      return structuredClone( newLayoutsState);
    });
  }, [images]);

  const onLayoutChange = useCallback((currentLayout: Layout[], allLayouts: Layouts) => {
    if (JSON.stringify(allLayouts) !== JSON.stringify(layouts)) {
      setLayouts(allLayouts);
    }
  }, [layouts]); 

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


 const handleShuffle = useCallback(() => {
    if (images.length === 0) return;
    const shuffledImagesData = [...images].sort(() => Math.random() - 0.5).map((itm, i ) => ({...itm, id:`default-image-${i+1}`}))
    setImages(shuffledImagesData); 

    
    let  newLgLayout: Layout[] = generateBentoGrid(shuffledImagesData.length);
    newLgLayout = validateAndFillGrid(newLgLayout, 32)

    setLayouts({ lg: newLgLayout });
  }, [images]);


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
    let endIndex = currentPreviewIndex + halfPoint + (totalThumbnails % 2 !== 0 || images.length % 2 === 0 ? 1 : 0) ;


    if (startIndex < 0) {
      endIndex -= startIndex; 
      startIndex = 0;
    }
    if (endIndex > images.length) {
      startIndex -= (endIndex - images.length); 
      endIndex = images.length;
    }
    
    startIndex = Math.max(0, startIndex);
    endIndex = Math.min(images.length, endIndex);


    return images.slice(startIndex, endIndex);
  };

  const previewImage = currentPreviewIndex !== null ? images[currentPreviewIndex] : null;

  if (!mounted) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p>Loading Gallery...</p></div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 md:p-8 transition-colors duration-300">
      <header className="w-full max-w-7xl mb-8 flex justify-between items-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary animate-fade-in-down">
          
        </h1>
        <Button onClick={toggleTheme} variant="ghost" size="icon" aria-label="Toggle theme">
          {theme === 'light' ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
        </Button>
      </header>

      <main className="w-full max-w-7xl flex flex-col gap-8">
        <section aria-labelledby="upload-heading" className="p-4 sm:p-6 animate-fade-in-up">
          <h2 id="upload-heading" className="text-2xl font-semibold mb-4 text-slate-500">
            Upload Your Masterpieces
          </h2>
          <ImageUploader onUploadComplete={handleUploads} />
        </section>

        <section aria-labelledby="gallery-heading" className=" w-full min-h-[400px] animate-fade-in-up animation-delay-200">
          <div className="flex justify-between items-center mb-6 mx-2">
           <div className='flex gap-3 items-center'>
           <h2 id="gallery-heading" className="text-2xl font-semibold text-primary">
              Gallery
            </h2>
            <h6 className='flex items-center text-xs text-slate-500'><Dot className='size-9 text-green-500'/> Drag & Resize Enabled</h6>
           </div>
            {images.length > 0 && (
              <Button variant="outline" onClick={handleShuffle} size="sm">
                <ShuffleIcon className="mr-2 h-4 w-4" /> Shuffle
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
           <DialogTitle className="sr-only">{previewImage.name}</DialogTitle>
          <DialogContent className={cn(
            "p-0 m-0 w-screen h-screen max-w-none border-none rounded-none flex items-center justify-center outline-none ring-0 focus:ring-0",
            " shadow-2xl" 
          )}>
            <div className="relative flex flex-col items-center justify-center w-full h-full p-4">
              <DialogClose asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-4 right-4 z-50 text-white rounded-full p-2 frosted-glass-dark"
                  aria-label="Close preview"
                >
                  <X className="h-6 w-6" />
                </Button>
              </DialogClose>

              <div className="relative flex items-center justify-center w-full flex-grow mb-4 overflow-y-auto">
                {images.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevPreview}
                    className="absolute left-2 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full text-white transition-all frosted-glass-dark"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-8 w-8 sm:h-10 sm:w-10" />
                  </Button>
                )}
                
                <div className="relative w-1/2 max-h-[calc(100vh_-_10rem)]">
                  <div className={cn(
                    "relative w-full h-full p-3 rounded-3xl bg-black/20 dark:bg-white/20 overflow-hidden mt-10 backdrop-blur-lg",
                  )}>
                    <Image
                      key={previewImage.id}
                      src={previewImage.src}
                      alt={previewImage.name}
                      width={previewImage.width}
                      height={previewImage.height}
                      className="block object-contain rounded-2xl w-full h-auto" 
                      sizes="(max-width: 768px) 75vw, 75vw"
                      data-ai-hint={previewImage.aiHint}
                      unoptimized 
                      priority={currentPreviewIndex === images.findIndex(img => img.id === previewImage.id)}
                    />
                  </div>
                </div>
                
                {images.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextPreview}
                    className="absolute right-2 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full text-white transition-all frosted-glass-dark"
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
                          ? "w-20 h-20 sm:w-24 sm:h-24 ring-2 ring-primary shadow-xl frosted-glass-dark" 
                          : "w-14 h-14 sm:w-16 sm:h-16 opacity-70 hover:opacity-100 hover:scale-105 frosted-glass-dark" 
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
        <p>&copy; {new Date().getFullYear()} Gallery.</p>
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
    

    

    

