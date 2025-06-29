import { Directive, ElementRef, Input, OnInit, OnDestroy, inject } from '@angular/core';

@Directive({
  selector: '[appLazyLoad]',
  standalone: true
})
export class LazyLoadDirective implements OnInit, OnDestroy {
  @Input() appLazyLoad!: string;
  @Input() placeholder?: string;
  @Input() errorImage?: string;

  private elementRef = inject(ElementRef);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupIntersectionObserver(): void {
    if (!('IntersectionObserver' in window)) {
      // Fallback for browsers without IntersectionObserver
      this.loadImage();
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage();
            this.observer?.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px'
      }
    );

    this.observer.observe(this.elementRef.nativeElement);
  }

  private loadImage(): void {
    const img = this.elementRef.nativeElement as HTMLImageElement;
    
    if (this.placeholder) {
      img.src = this.placeholder;
    }

    const imageLoader = new Image();
    
    imageLoader.onload = () => {
      img.src = this.appLazyLoad;
      img.classList.add('loaded');
    };

    imageLoader.onerror = () => {
      if (this.errorImage) {
        img.src = this.errorImage;
      }
      img.classList.add('error');
    };

    imageLoader.src = this.appLazyLoad;
  }
}