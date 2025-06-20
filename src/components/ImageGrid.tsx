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
      className="layout parent-group"
      layouts={layouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 32, md: 32, sm: 32, xs: 32, xxs: 32 }}
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
          className: "rounded-lg transition-all duration-300 object-cover",
          unoptimized: true, 
        };

        if (image.aiHint) {
          imageProps['data-ai-hint'] = image.aiHint;
        }

        return (
          <div key={image.id} className="group relative overflow-hidden rounded-lg shadow-md bg-card">
            <Card className="w-full h-full flex flex-col overflow-hidden border-0 shadow-none">
              <div
                className="draggable-handle group-hover-elements absolute top-2 left-2 z-20 p-1.5 backdrop-blur-lg border-2 border-white/5 cursor-grab bg-black/30 hover:bg-black/50 rounded-full opacity-0 transition-opacity duration-300"
              >
                <Move className="size-4 text-white/80" />
              </div>
              <CardContent className="p-0 flex-grow relative">
                <NextImage {...imageProps} />
              </CardContent>
            </Card>
            <Button
              variant="ghost"
              size="icon"
              className="group-hover-elements absolute top-2 right-2 z-10 text-white/80 opacity-0 transition-opacity rounded-full p-2 h-8 w-8 flex items-center justify-center frosted-glass-dark"
              onClick={(e) => {
                e.stopPropagation(); 
                onImageRemove(image.id);
              }}
              aria-label={`Remove ${image.name}`}
            >
              <X className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="group-hover-elements absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 text-white/90 opacity-0 transition-all rounded-full p-3 h-12 w-12 flex items-center justify-center frosted-glass-dark"
              onClick={(e) => { e.stopPropagation(); onImagePreview(image.id); }}
              aria-label={`Preview ${image.name}`}
            >
              <Eye className="h-6 w-6" />
            </Button>

            <div className="group-hover-elements absolute bottom-2 left-2 opacity-0 transition-opacity duration-300 flex items-center gap-2 z-10">
              <div className="px-3 py-1 rounded-full frosted-glass-dark">
                <span className="text-white text-xs sm:text-sm font-semibold truncate">{image.name}</span>
              </div>
            </div>
          </div>
        );
      })}
    </ResponsiveGridLayout>
  );
};

export default ImageGrid;
    
