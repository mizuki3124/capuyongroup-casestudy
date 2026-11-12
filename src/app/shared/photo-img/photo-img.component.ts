import { Component, Input, OnChanges } from '@angular/core';
import { IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { PhotoService } from '../../core/photo.service';

/**
 * Shows one picture. Give it `src` for a local preview (a picture that is not uploaded yet) or `file` for
 * a picture stored on the server. A small spinner shows while it downloads.
 */
@Component({
  selector: 'app-photo-img',
  imports: [IonIcon, IonSpinner],
  template: `
    @if (url) {
      <img [src]="url" alt="Expense photo" />
    } @else if (failed) {
      <ion-icon name="image-outline" class="fallback"></ion-icon>
    } @else {
      <ion-spinner name="crescent"></ion-spinner>
    }
  `,
  host: { '[class.contain]': 'contain' },
  styles: [`
    :host(.contain) img { object-fit: contain; }
    :host { display: grid; place-items: center; width: 100%; height: 100%; color: var(--es-muted); }
    img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .fallback { font-size: 28px; }
    ion-spinner { width: 24px; height: 24px; }
  `],
})
export class PhotoImgComponent implements OnChanges {
  /** Local preview (data: URL). */
  @Input() src: string | null = null;
  /** File name of a picture stored on the server. */
  @Input() file: string | null = null;
  /** Show the whole picture instead of cropping it to fill the tile. */
  @Input() contain = false;

  url: string | null = null;
  failed = false;

  constructor(private photos: PhotoService) {}

  async ngOnChanges(): Promise<void> {
    this.failed = false;
    if (this.src) {
      this.url = this.src;
      return;
    }
    this.url = null;
    if (!this.file) return;

    const wanted = this.file;
    const url = await this.photos.load(wanted);
    if (wanted !== this.file) return; // the input changed while we were downloading
    this.url = url;
    this.failed = url === null;
  }
}
