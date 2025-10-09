import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fileSize',
  standalone: true
})
export class FileSizePipe implements PipeTransform {
  private units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  transform(bytes: number = 0, precision: number = 2): string {
    if (isNaN(parseFloat(String(bytes))) || !isFinite(bytes)) return '?';
    
    let unit = 0;
    
    while (bytes >= 1024) {
      bytes /= 1024;
      unit++;
      
      // Prevent infinite loop in case of very large numbers
      if (unit >= this.units.length - 1) break;
    }
    
    // Handle very small numbers
    if (unit === 0 && bytes < 1) {
      return '< 1 ' + this.units[unit];
    }
    
    return bytes.toFixed(precision) + ' ' + this.units[unit];
  }
}
