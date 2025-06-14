
"use client";

import React from 'react';
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout';
import NextImage from 'next/image';
import { X, Share, Eye, Move } from 'lucide-react';
import type { UploadedImage } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface ImageGridProps {
  images: UploadedImage[];
  layouts: Layouts;
  onLayoutChange: (newLayout: Layout[], allLayouts: Layouts) => void;
  onImageRemove: (imageId: string) => void;
  onImagePreview: (imageId: string) => void;
}

const ImageGrid: React.FC<ImageGridProps> = ({ images, layouts, onLayoutChange, onImageRemove, onImagePreview }) => {
  if (images.length === 0) {
    return null;
  }

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 32, md: 10, sm: 6, xs: 4, xxs: 2 }} // Updated lg cols to 32
      rowHeight={30}
      margin={[10, 10]}
      containerPadding={[10, 10]}
      onLayoutChange={onLayoutChange}
      isDraggable
      isResizable
      draggableHandle=".draggable-handle"
    >
      {images.map((image) => {
        const imageProps: Record<string, any> = {
          src: image.src,
          alt: image.name,
          fill: true,
          sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
          className: "rounded-lg transition-all duration-300 group-hover:blur-sm object-cover",
          unoptimized: true, // Assuming Pexels images are already optimized
        };

        if (image.aiHint) {
          imageProps['data-ai-hint'] = image.aiHint;
        }

        return (
          <div key={image.id} className="group relative overflow-hidden rounded-lg shadow-md bg-card">
            <Card className="w-full h-full flex flex-col overflow-hidden border-0 shadow-none">
              {/* Drag Handle - Centered at the top, appears on hover */}
              <div
                className="draggable-handle absolute top-2 left-1/2 transform -translate-x-1/2 z-20 p-1.5 backdrop-blur-lg border-2 border-white/20 cursor-grab bg-black/30 hover:bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                <Move className="size-4 text-white/80" />
              </div>
              <CardContent className="p-0 flex-grow relative">
                <NextImage {...imageProps} />
              </CardContent>
            </Card>
            {/* Remove Button - Top right, frosted glass, appears on hover */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-2 h-8 w-8 flex items-center justify-center bg-black/20 hover:bg-destructive/80 hover:text-destructive-foreground backdrop-blur-lg border-2 border-white/20"
              onClick={(e) => {
                e.stopPropagation(); // Prevent grid item click or drag
                onImageRemove(image.id);
              }}
              aria-label={`Remove ${image.name}`}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Preview Button - Centered, frosted glass, appears on hover */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 text-white/90 opacity-0 group-hover:opacity-100 transition-all rounded-full p-3 h-12 w-12 flex items-center justify-center bg-black/20 hover:bg-primary/80 backdrop-blur-lg border-2 border-white/20"
              onClick={(e) => { e.stopPropagation(); onImagePreview(image.id); }}
              aria-label={`Preview ${image.name}`}
            >
              <Eye className="h-6 w-6" />
            </Button>

            {/* Bottom Bar: Image Name (Caption) and Share Button - Aligned left */}
            <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 z-10">
              {/* Image Name / Caption Container */}
              <div className="p-2 bg-black/20 backdrop-blur-lg border border-white/20 rounded-md">
                <span className="text-white text-xs sm:text-sm font-semibold truncate">{image.name}</span>
              </div>
              {/* Share Button */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white/90 rounded-full p-1.5 h-7 w-7 flex items-center justify-center bg-black/20 hover:bg-black/30 backdrop-blur-lg border-2 border-white/20"
                aria-label={`Share ${image.name}`}
                onClick={(e) => e.stopPropagation()} // Prevent grid item click
              >
                <Share className='h-4 w-4' />
              </Button>
            </div>
          </div>
        );
      })}
    </ResponsiveGridLayout>
  );
};

export default ImageGrid;
    
