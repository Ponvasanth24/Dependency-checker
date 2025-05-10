import { Directive, ElementRef, HostBinding, Input, OnInit } from '@angular/core';

@Directive({
  selector: 'a[appExternalLink]',
  standalone: true
})
export class ExternalLinkDirective implements OnInit {
  @Input() href = '';

  @HostBinding('attr.target') target: string | null = null;
  @HostBinding('attr.rel') rel: string | null = null;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    const url = this.href || this.el.nativeElement.getAttribute('href');
    if (url && this.isExternalLink(url)) {
      this.target = '_blank';
      this.rel = 'noopener';
    }
  }

  private isExternalLink(url: string): boolean {
    try {
      const link = new URL(url, window.location.origin);
      return link.origin !== window.location.origin;
    } catch {
      return false;
    }
  }
}
