
"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { UploadedImage } from '@/types';
import type { Layout, Layouts } from 'react-grid-layout';
import ImageUploader from '@/components/ImageUploader';
import ImageGrid from '@/components/ImageGrid';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Trash2 } from 'lucide-react';

const DEFAULT_ITEM_WIDTH = 4; // In grid units
const DEFAULT_ROW_HEIGHT = 30; // In pixels, ensure this matches ImageGrid's rowHeight
const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }; // Match ImageGrid's cols

// Helper function to generate layout items, can be used for initial state and dynamic additions
const generateLayoutItem = (
  image: UploadedImage,
  existingLayout: Layout[] = []
): Layout => {
  const aspectRatio = image.width / image.height;
  // Estimate width based on a typical large screen scenario for column calculation
  const approximateColWidthLg = 1200 / COLS.lg; // Assuming 1200px container for 'lg'
  const estimatedPixelWidth = DEFAULT_ITEM_WIDTH * approximateColWidthLg;
  const estimatedPixelHeight = estimatedPixelWidth / aspectRatio;
  const h = Math.max(2, Math.ceil(estimatedPixelHeight / (DEFAULT_ROW_HEIGHT + 10 /* marginY, from RGL config */)));

  let yPos = 0;
  if (existingLayout.length > 0) {
    // Find the maximum y + h to place the new item below others
    yPos = Math.max(...existingLayout.map(item => item.y + item.h), 0);
  }
  // Calculate x position to wrap items in rows
  const itemsInCurrentPotentialRow = existingLayout.filter(item => item.y === yPos);
  let xPos = 0;
  if(itemsInCurrentPotentialRow.length > 0){
    xPos = itemsInCurrentPotentialRow.reduce((sum, item) => sum + item.w, 0) % COLS.lg;
  }
   // If xPos + new item width exceeds COLS.lg, move to next row
  if (xPos + DEFAULT_ITEM_WIDTH > COLS.lg) {
    yPos = yPos + h; // Or some minimum height if h is too large for a new row start
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
  { src: 'https://placehold.co/800x500.png', name: 'Mountain Vista', width: 800, height: 500, aiHint: 'mountain vista' },
  { src: 'https://placehold.co/400x600.png', name: 'Forest Trail', width: 400, height: 600, aiHint: 'forest trail' },
  { src: 'https://placehold.co/700x450.png', name: 'Sunset Beach', width: 700, height: 450, aiHint: 'sunset beach' },
  { src: 'https://placehold.co/600x700.png', name: 'Desert Mirage', width: 600, height: 700, aiHint: 'desert mirage' },
];

const initialImages: UploadedImage[] = defaultImagesSeed.map((img, index) => ({
  ...img,
  id: `default-image-${index + 1}`,
  type: 'image/png',
}));

const initialLayoutsLg: Layout[] = [];
let tempCurrentLayoutForInit: Layout[] = [];
initialImages.forEach(img => {
  const layoutItem = generateLayoutItem(img, tempCurrentLayoutForInit);
  initialLayoutsLg.push(layoutItem);
  // Add to temp layout for correct yPos calculation for subsequent items
  // This ensures items are stacked correctly initially
  tempCurrentLayoutForInit.push(layoutItem);
});


export default function IGalleryPage() {
  const [images, setImages] = useState<UploadedImage[]>(initialImages);
  const [layouts, setLayouts] = useState<Layouts>({ lg: initialLayoutsLg });
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
   const defaultsInitializedRef = useRef(false);


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

    // Check if defaults need to be initialized (e.g. if localStorage was empty or cleared)
    // This is a simplified check; a more robust solution might involve checking if `initialImages` were truly the source
    if (images.length === 0 && (!layouts.lg || layouts.lg.length === 0) && !defaultsInitializedRef.current) {
        const derivedInitialImages: UploadedImage[] = defaultImagesSeed.map((img, index) => ({
            ...img,
            id: `default-image-${index + 1}`, // ensure unique IDs if this runs multiple times
            type: 'image/png',
        }));
        
        const derivedInitialLayoutsLg: Layout[] = [];
        let tempLayout: Layout[] = [];
        derivedInitialImages.forEach(img => {
            const layoutItem = calculateInitialLayoutItem(img, tempLayout); // Use the hook here
            derivedInitialLayoutsLg.push(layoutItem);
            tempLayout.push(layoutItem);
        });
        setImages(derivedInitialImages);
        setLayouts({ lg: derivedInitialLayoutsLg });
        defaultsInitializedRef.current = true;
    }

  }, []); // Empty dependency array for one-time mount effects


  const calculateInitialLayoutItem = useCallback((
    image: UploadedImage,
    existingLayout: Layout[] = []
  ): Layout => {
    // This is the hook version, can be kept if dynamic additions need it,
    // but initial state uses generateLayoutItem. For consistency, it uses the same logic.
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
      // Deep copy all existing breakpoint layouts
      for (const bk in prevLayouts) {
        if (Object.prototype.hasOwnProperty.call(prevLayouts, bk)) {
          newLayoutsState[bk as keyof Layouts] = prevLayouts[bk as keyof Layouts] ? [...prevLayouts[bk as keyof Layouts]!] : [];
        }
      }
      
      if (!newLayoutsState.lg) {
        newLayoutsState.lg = [];
      }
      // Use a mutable copy for calculating positions of new items within this batch
      const currentLgLayoutForNewItemsCalculation = [...newLayoutsState.lg!]; 

      const itemsLayoutToAdd: Layout[] = [];
      newImages.forEach(img => {
        if (!currentLgLayoutForNewItemsCalculation.find(item => item.i === img.id)) {
            const newLayoutItem = calculateInitialLayoutItem(img, currentLgLayoutForNewItemsCalculation);
            itemsLayoutToAdd.push(newLayoutItem);
            currentLgLayoutForNewItemsCalculation.push(newLayoutItem); // Add to temp layout for next item
        }
      });
      
      newLayoutsState.lg = [...newLayoutsState.lg!, ...itemsLayoutToAdd];
      return newLayoutsState;
    });
  }, [calculateInitialLayoutItem]);

  const onLayoutChange = useCallback((currentLayout: Layout[], allLayouts: Layouts) => {
    // Only update if allLayouts actually contains data.
    // This check prevents resetting layouts if `allLayouts` is empty during an intermediate state.
    const hasRelevantLayouts = Object.values(allLayouts).some(layoutArray => layoutArray.length > 0);
    if (images.length > 0 && hasRelevantLayouts) {
         setLayouts(allLayouts);
    } else if (images.length === 0) {
        // If all images are removed, layouts should be empty
        setLayouts({ lg: [] });
    }
  }, [images.length]);

  const handleImageRemove = useCallback((imageId: string) => {
    setImages(prevImages => prevImages.filter(img => img.id !== imageId));
    setLayouts(prevLayouts => {
      const newLayoutsState: Layouts = {};
      for (const breakpointKey in prevLayouts) {
        if (Object.prototype.hasOwnProperty.call(prevLayouts, breakpointKey)) {
          const castedBreakpointKey = breakpointKey as keyof Layouts;
          newLayoutsState[castedBreakpointKey] = (prevLayouts[castedBreakpointKey] || []).filter(
            (layoutItem: Layout) => layoutItem.i !== imageId
          );
        }
      }
      // If after removal, lg is empty, ensure other breakpoints are also cleared or consistent
      if (newLayoutsState.lg && newLayoutsState.lg.length === 0) {
        return { lg: [] }; // Reset all if the primary layout (lg) becomes empty
      }
      return newLayoutsState;
    });
  }, []);

  const handleRemoveAllImages = () => {
    setImages([]);
    setLayouts({ lg: [] });
  };

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
