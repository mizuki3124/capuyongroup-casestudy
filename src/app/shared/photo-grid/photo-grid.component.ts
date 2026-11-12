import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { MAX_PHOTOS, PhotoItem } from '../../core/models';
import { PhotoImgComponent } from '../photo-img/photo-img.component';

/** The "Photos 1/3" row: thumbnails with a remove (x) button and a dashed "+" tile to add more. */
@Component({
  selector: 'app-photo-grid',
  templateUrl: './photo-grid.component.html',
  styleUrls: ['./photo-grid.component.scss'],
  imports: [IonIcon, IonSpinner, PhotoImgComponent],
})
export class PhotoGridComponent {
  @Input() items: PhotoItem[] = [];
  /** Disables adding / removing (while saving). */
  @Input() disabled = false;
  @Input() max = MAX_PHOTOS;

  @Output() add = new EventEmitter<void>();
  @Output() remove = new EventEmitter<PhotoItem>();

  get canAdd(): boolean {
    return !this.disabled && this.items.length < this.max;
  }
}
