// Generate a random color with good contrast and saturation
export function randomColor(): string {
  // Generate a random hue (0-360)
  const hue = Math.floor(Math.random() * 360);
  
  // Keep saturation and lightness in ranges that ensure good visibility
  const saturation = 70 + Math.floor(Math.random() * 25); // 70-95%
  const lightness = 50 + Math.floor(Math.random() * 20);  // 50-70%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Calculate text color (black or white) based on background color
export function getContrastColor(bgColor: string): 'black' | 'white' {
  // Extract RGB values from the color string
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate relative luminance (perceived brightness)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for light colors, white for dark colors
  return luminance > 0.5 ? 'black' : 'white';
}

// Generate a set of distinct colors for user cursors
export function generateDistinctColors(count: number): string[] {
  const colors: string[] = [];
  const hueStep = 360 / count;
  
  for (let i = 0; i < count; i++) {
    const hue = Math.floor(i * hueStep) % 360;
    // Use fixed saturation and lightness for consistency
    colors.push(`hsl(${hue}, 80%, 60%)`);
  }
  
  return colors;
}
