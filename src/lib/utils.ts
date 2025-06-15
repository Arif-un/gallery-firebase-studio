import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function validateAndFillGrid(items, gridWidth = 32) {
  // Create a copy of items to avoid mutating the original
  const validatedItems = JSON.parse(JSON.stringify(items));
  
  // Helper function to get the maximum Y coordinate (grid height)
  function getGridHeight(items) {
    return Math.max(...items.map(item => item.y + item.h));
  }
  
  // Helper function to create occupied spaces map
  function createOccupiedMap(items, width, height) {
    const occupied = Array(height).fill().map(() => Array(width).fill(false));
    
    items.forEach(item => {
      for (let y = item.y; y < item.y + item.h; y++) {
        for (let x = item.x; x < item.x + item.w; x++) {
          if (y < height && x < width) {
            occupied[y][x] = true;
          }
        }
      }
    });
    
    return occupied;
  }
  
  // Helper function to find blank spaces
  function findBlankSpaces(occupied) {
    const blankSpaces = [];
    const height = occupied.length;
    const width = occupied[0].length;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!occupied[y][x]) {
          blankSpaces.push({ x, y });
        }
      }
    }
    
    return blankSpaces;
  }
  
  // Helper function to find the item that can be expanded to fill a blank space
  function findExpandableItem(items, blankX, blankY) {
    // Look for items that can expand right to fill the blank space
    for (let item of items) {
      // Check if item is directly to the left of blank space
      if (item.x + item.w === blankX && 
          blankY >= item.y && 
          blankY < item.y + item.h) {
        return { item, direction: 'right' };
      }
      
      // Check if item is directly above blank space
      if (item.y + item.h === blankY && 
          blankX >= item.x && 
          blankX < item.x + item.w) {
        return { item, direction: 'down' };
      }
    }
    
    return null;
  }
  
  // Helper function to check if expansion is safe (won't overlap with other items)
  function canExpand(items, targetItem, direction, blankX, blankY) {
    const otherItems = items.filter(item => item !== targetItem);
    
    if (direction === 'right') {
      // Check if expanding right by 1 unit would cause overlap
      const newWidth = targetItem.w + 1;
      for (let item of otherItems) {
        if (targetItem.x < item.x + item.w && 
            targetItem.x + newWidth > item.x &&
            targetItem.y < item.y + item.h && 
            targetItem.y + targetItem.h > item.y) {
          return false;
        }
      }
      return targetItem.x + newWidth <= gridWidth;
    } else if (direction === 'down') {
      // Check if expanding down by 1 unit would cause overlap
      const newHeight = targetItem.h + 1;
      for (let item of otherItems) {
        if (targetItem.x < item.x + item.w && 
            targetItem.x + targetItem.w > item.x &&
            targetItem.y < item.y + item.h && 
            targetItem.y + newHeight > item.y) {
          return false;
        }
      }
      return true; // No height limit for grid
    }
    
    return false;
  }
  
  // Main validation and filling logic
  let maxIterations = 1000; // Prevent infinite loops
  let iteration = 0;
  
  while (iteration < maxIterations) {
    const gridHeight = getGridHeight(validatedItems);
    const occupied = createOccupiedMap(validatedItems, gridWidth, gridHeight);
    const blankSpaces = findBlankSpaces(occupied);
    
    if (blankSpaces.length === 0) {
      break; // No more blank spaces
    }
    
    let filled = false;
    
    // Try to fill each blank space
    for (let blank of blankSpaces) {
      const expandable = findExpandableItem(validatedItems, blank.x, blank.y);
      
      if (expandable && canExpand(validatedItems, expandable.item, expandable.direction, blank.x, blank.y)) {
        // Expand the item
        if (expandable.direction === 'right') {
          expandable.item.w += 1;
        } else if (expandable.direction === 'down') {
          expandable.item.h += 1;
        }
        filled = true;
        break; // Process one expansion at a time
      }
    }
    
    if (!filled) {
      // If no item can be expanded to fill gaps, break to avoid infinite loop
      console.warn('Could not fill all blank spaces. Some gaps may remain.');
      break;
    }
    
    iteration++;
  }
  
  return validatedItems;
}

// Additional utility function to get grid statistics
function getGridStats(items, gridWidth = 32) {
  const gridHeight = Math.max(...items.map(item => item.y + item.h));
  const occupied = Array(gridHeight).fill().map(() => Array(gridWidth).fill(false));
  
  items.forEach(item => {
    for (let y = item.y; y < item.y + item.h; y++) {
      for (let x = item.x; x < item.x + item.w; x++) {
        if (y < gridHeight && x < gridWidth) {
          occupied[y][x] = true;
        }
      }
    }
  });
  
  let totalCells = gridHeight * gridWidth;
  let occupiedCells = 0;
  let blankCells = [];
  
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      if (occupied[y][x]) {
        occupiedCells++;
      } else {
        blankCells.push({ x, y });
      }
    }
  }
  
  return {
    totalCells,
    occupiedCells,
    blankCells: blankCells.length,
    fillPercentage: ((occupiedCells / totalCells) * 100).toFixed(2),
    blankPositions: blankCells
  };
}

export   function generateBentoGrid(itemCount = 15) {
  const GRID_WIDTH = 32;
  const MIN_WIDTH = 10;
  const MIN_HEIGHT = 4;
  const MAX_WIDTH = 12;
  const MAX_HEIGHT = 8;
  
  const items = [];
  const occupiedSpaces = new Set();
  
  // Helper function to check if a space is occupied
  function isSpaceOccupied(x, y, w, h) {
      for (let i = x; i < x + w; i++) {
          for (let j = y; j < y + h; j++) {
              if (occupiedSpaces.has(`${i},${j}`)) {
                  return true;
              }
          }
      }
      return false;
  }
  
  // Helper function to mark space as occupied
  function markSpaceOccupied(x, y, w, h) {
      for (let i = x; i < x + w; i++) {
          for (let j = y; j < y + h; j++) {
              occupiedSpaces.add(`${i},${j}`);
          }
      }
  }
  
  // Helper function to find the next available position
  function findNextPosition(w, h) {
      let currentRow = 0;
      
      while (true) {
          // Try to place in current row from left to right
          for (let x = 0; x <= GRID_WIDTH - w; x++) {
              if (!isSpaceOccupied(x, currentRow, w, h)) {
                  return { x, y: currentRow };
              }
          }
          
          // Move to next row
          currentRow++;
          
          // Find the actual next available row by checking if any space is occupied
          while (currentRow < 1000) { // Safety limit
              let rowHasSpace = false;
              for (let x = 0; x <= GRID_WIDTH - w; x++) {
                  if (!isSpaceOccupied(x, currentRow, w, h)) {
                      rowHasSpace = true;
                      break;
                  }
              }
              if (rowHasSpace) break;
              currentRow++;
          }
      }
  }
  
  // Generate random dimensions within constraints
  function getRandomDimensions() {
      const w = Math.floor(Math.random() * (MAX_WIDTH - MIN_WIDTH + 1)) + MIN_WIDTH;
      const h = Math.floor(Math.random() * (MAX_HEIGHT - MIN_HEIGHT + 1)) + MIN_HEIGHT;
      return { w, h };
  }
  
  // Generate items
  for (let i = 1; i <= itemCount; i++) {
      const { w, h } = getRandomDimensions();
      
      // Ensure width doesn't exceed grid bounds
      const adjustedW = Math.min(w, GRID_WIDTH);
      
      // Find the best position for this item
      const position = findNextPosition(adjustedW, h);
      
      // Mark the space as occupied
      markSpaceOccupied(position.x, position.y, adjustedW, h);
      
      // Create the item object
      const item = {
          w: adjustedW,
          h: h,
          x: position.x,
          y: position.y,
          i: `default-image-${i}`,
          minW: MIN_WIDTH,
          minH: MIN_HEIGHT,
          moved: false,
          static: false
      };
      
      items.push(item);
  }
  
  return items;
}