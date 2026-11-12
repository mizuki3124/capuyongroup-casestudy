import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonButton, IonContent, IonHeader, IonIcon, IonInput, IonSpinner, IonToolbar, NavController,
} from '@ionic/angular/standalone';
import { ExpenseService } from '../core/expense.service';
import { FeedbackService } from '../core/feedback.service';
import { Expense, MAX_PHOTOS, PhotoItem } from '../core/models';
import { PhotoDraft } from '../core/photo-draft';
import { PhotoService } from '../core/photo.service';
import { BottomNavComponent } from '../shared/bottom-nav/bottom-nav.component';
import { PhotoGridComponent } from '../shared/photo-grid/photo-grid.component';

@Component({
  selector: 'app-expense-edit',
  templateUrl: './expense-edit.page.html',
  styleUrls: ['./expense-edit.page.scss'],
  imports: [
    FormsModule, BottomNavComponent, PhotoGridComponent,
    IonHeader, IonToolbar, IonContent, IonInput, IonButton, IonIcon, IonSpinner,
  ],
})
export class ExpenseEditPage {
  content = '';
  descript = '';
  cash = '';
  draft = new PhotoDraft();
  saving = false;
  attemptedSubmit = false;
  readonly max = MAX_PHOTOS;

  private id = '';
  private loaded: Expense | null = null;

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private expenses: ExpenseService,
    private photos: PhotoService,
    private feedback: FeedbackService,
  ) {}

  async ionViewWillEnter() {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    this.saving = false;
    this.attemptedSubmit = false;

    const expense = await this.expenses.getById(this.id);
    if (!expense) {
      void this.feedback.error('That expense could not be found.');
      void this.navCtrl.navigateBack('/records');
      return;
    }
    this.loaded = expense;
    this.content = expense.content;
    this.descript = expense.descript;
    this.cash = String(expense.cash);
    this.draft = new PhotoDraft(expense.photos);
  }

  cancel() {
    void this.navCtrl.navigateBack(['/expense', this.id]);
  }

  async addPhoto() {
    if (this.draft.isFull) {
      void this.feedback.error(`You can add up to ${this.max} pictures.`);
      return;
    }
    const picked = await this.photos.pick();
    if (picked) this.draft.addNew(picked);
  }

  removePhoto(item: PhotoItem) {
    this.draft.remove(item);
  }

  async save() {
    if (this.saving || !this.loaded) return;
    this.attemptedSubmit = true;
    this.saving = true;

    try {
      const result = await this.expenses.update(this.id, {
        content: this.content,
        descript: this.descript,
        cash: Number(this.cash),
      });
      if (!result.ok) {
        await this.feedback.error(result.error);
        return;
      }

      const failed = await this.draft.commit(this.id, this.expenses);
      if (failed > 0) {
        void this.feedback.error(`Saved, but ${failed} picture change${failed === 1 ? '' : 's'} did not go through.`);
      } else {
        void this.feedback.success('Expense updated.');
      }
      await this.expenses.list(); // refresh the shared copy so the detail page shows the new data
      await this.navCtrl.navigateBack(['/expense', this.id]);
    } finally {
      this.saving = false;
    }
  }
}
