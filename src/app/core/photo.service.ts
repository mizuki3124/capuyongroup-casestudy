import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { environment } from '../../environments/environment';
import { ApiService } from './api.service';

/** A picture the user just chose, not uploaded yet. */
export interface PickedPhoto {
  blob: Blob;
  /** data: URL, used to show a preview right away. */
  preview: string;
}

/**
 * Picking pictures (camera or gallery, through the Capacitor Camera plugin) and showing the pictures
 * that are stored on the server.
 */
@Injectable({ providedIn: 'root' })
export class PhotoService {
  /** server file name -> blob: URL, so every picture is downloaded only once per session. */
  private urls = new Map<string, string>();
  private pending = new Map<string, Promise<string | null>>();

  constructor(private api: ApiService) {}

  /**
   * Opens the "Take a photo / Choose from gallery" sheet. Returns null when the user cancels.
   * Photos are shrunk (max 1280 px, JPEG quality 70) so uploads stay small and fast.
   */
  async pick(): Promise<PickedPhoto | null> {
    try {
      const photo = await Camera.getPhoto({
        source: CameraSource.Prompt,
        resultType: CameraResultType.DataUrl,
        quality: 70,
        width: 1280,
        correctOrientation: true,
        promptLabelHeader: 'Add a photo',
        promptLabelPhoto: 'Choose from gallery',
        promptLabelPicture: 'Take a photo',
        promptLabelCancel: 'Cancel',
      });
      if (!photo.dataUrl) return null;
      const blob = await (await fetch(photo.dataUrl)).blob();
      return { blob, preview: photo.dataUrl };
    } catch {
      return null; // the user closed the picker (or denied the camera permission)
    }
  }

  /** Full URL of a stored picture (served by the API so the browser's CORS rules are satisfied). */
  urlFor(file: string): string {
    return `${environment.apiUrl}/photos.php?file=${encodeURIComponent(file)}`;
  }

  /**
   * A URL that an <img> can show. The picture is downloaded with the ngrok header (an <img> tag cannot send
   * headers) and kept as a blob: URL. Resolves to null when the picture could not be loaded.
   */
  load(file: string): Promise<string | null> {
    const cached = this.urls.get(file);
    if (cached) return Promise.resolve(cached);

    const running = this.pending.get(file);
    if (running) return running;

    const job = this.api.blob(this.urlFor(file)).then((blob) => {
      this.pending.delete(file);
      if (!blob || blob.size === 0) return null;
      const url = URL.createObjectURL(blob);
      this.urls.set(file, url);
      return url;
    });
    this.pending.set(file, job);
    return job;
  }
}
