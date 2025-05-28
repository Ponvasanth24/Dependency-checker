import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'highlight',
  standalone: true
})
export class HighlightPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) {}
  transform(text: string, search: string): any {
    if (!search || !text) return text;
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(${escapedSearch})`, 'gi');
    let highlighted = text.replace(re, `<span style="background-color: orange;" class="text-white rounded">$1</span>`);
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }
}
