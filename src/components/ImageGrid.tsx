"use client";

import React from 'react';
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout';
import Image from 'next/image';
import { XCircle } from 'lucide-react';
import type { UploadedImage, CustomLayoutItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Import react-grid-layout CSS
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface ImageGridProps {
  images: UploadedImage[];
  layouts: Layouts;
  onLayoutChange: (newLayout: Layout[], allLayouts: Layouts) => void;
  onImageRemove: (imageId: string) => void;
}

const ImageGrid: React.FC<ImageGridProps> = ({ images, layouts, onLayoutChange, onImageRemove }) => {
  if (images.length === 0) {
    return null; 
  }

  const imageMap = React.useMemo(() => 
    new Map(images.map(img => [img.id, img])),
    [images]
  );

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={30} // Adjust this value for finer control over item height
      margin={[10, 10]} // [marginX, marginY]
      containerPadding={[10, 10]} // [paddingX, paddingY]
      onLayoutChange={onLayoutChange}
      isDraggable
      isResizable
      draggableHandle=".draggable-handle"
      
    >
      {layouts.lg?.map((item: CustomLayoutItem) => { // Use lg layout for rendering, RGL will adapt
        const image = imageMap.get(item.i);
        if (!image) return null;

        return (
          <div key={item.i} data-grid={item} className="group relative overflow-hidden rounded-lg shadow-md bg-card cursor-grab draggable-handle">
            <Card className="w-full h-full flex flex-col overflow-hidden border-0 shadow-none">
              <CardContent className="p-0 flex-grow relative">
                <Image
                  src={image.src}
                  alt={image.name}
                  layout="fill"
                  objectFit="contain" // Preserves aspect ratio, fits within bounds
                  className="rounded-t-lg transition-transform duration-300 group-hover:scale-105"
                  unoptimized // If using data URLs frequently, to avoid Next.js optimization limits
                />
              </CardContent>
            </Card>
             <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 bg-background/70 hover:bg-destructive/80 hover:text-destructive-foreground text-destructive opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-1 h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent drag
                  onImageRemove(image.id);
                }}
                aria-label={`Remove ${image.name}`}
              >
                <XCircle className="h-5 w-5" />
              </Button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {image.name}
              </div>
          </div>
        );
      })}
    </ResponsiveGridLayout>
  );
};

export default ImageGrid;
