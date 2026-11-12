import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonSpinner,
  IonToolbar,
} from '@ionic/angular/standalone';
import { formatMoney } from '../core/expense-utils';
import { ConnectivityService } from '../core/connectivity.service';
import { ExpenseService } from '../core/expense.service';
import { FeedbackService } from '../core/feedback.service';
import { CATEGORIES, MAX_PHOTOS, PhotoItem } from '../core/models';
import { PhotoDraft } from '../core/photo-draft';
import { PhotoService } from '../core/photo.service';
import { BottomNavComponent } from '../shared/bottom-nav/bottom-nav.component';
import { PhotoGridComponent } from '../shared/photo-grid/photo-grid.component';

@Component({
  selector: 'app-expenses-input',
  templateUrl: './expenses-input.page.html',
  styleUrls: ['./expenses-input.page.scss'],
  imports: [
    FormsModule,
    NgClass,
    RouterLink,
    BottomNavComponent,
    PhotoGridComponent,
    IonHeader,
    IonToolbar,
    IonContent,
    IonInput,
    IonButton,
    IonIcon,
    IonSpinner,
  ],
})
export class ExpensesInputPage implements OnInit {
  choice = '';
  content = '';
  descript = '';
  cash = '';
  attemptedSubmit = false;
  wallet = 0;
  saving = false;
  draft = new PhotoDraft();
  readonly max = MAX_PHOTOS;
  readonly formatMoney = formatMoney;

  constructor(
    private destroyRef: DestroyRef,
    private route: ActivatedRoute,
    private router: Router,
    private expenseService: ExpenseService,
    private feedback: FeedbackService,
    private photos: PhotoService,
    private net: ConnectivityService,
  ) {}

  ngOnInit() {
    // Back online -> refresh the balance shown under the amount.
    this.net.refresh$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.active)
          void this.expenseService.getWallet().then((w) => (this.wallet = w));
      });
  }

  private active = false;

  ionViewWillLeave() {
    this.active = false;
  }

  async ionViewWillEnter() {
    this.active = true;
    // The category comes from the URL (/expenses-input/Food) so it survives Ionic's page caching.
    const category = this.route.snapshot.paramMap.get('category') ?? '';
    if (!CATEGORIES.some((c) => c.name === category)) {
      void this.router.navigate(['/expenses']);
      return;
    }
    this.choice = category;
    this.content = this.descript = this.cash = '';
    this.attemptedSubmit = false;
    this.saving = false;
    this.draft = new PhotoDraft();
    this.wallet = await this.expenseService.getWallet();
  }

  /** Tint class and icon for the selected category (the same ones used in the menu and records). */
  get toneClass(): string {
    const index = CATEGORIES.findIndex((c) => c.name === this.choice);
    return index >= 0 ? `tone-${index}` : 'tone-x';
  }

  get categoryIcon(): string {
    return (
      CATEGORIES.find((c) => c.name === this.choice)?.icon ?? 'help-outline'
    );
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
    if (this.saving) return;
    this.attemptedSubmit = true;
    this.saving = true;

    try {
      const result = await this.expenseService.add({
        content: this.content,
        descript: this.descript,
        choice: this.choice,
        cash: Number(this.cash),
      });

      if (!result.ok) {
        await this.feedback.error(result.error);
        return;
      }

      // The expense now exists, so its pictures can be uploaded (one at a time, each tile shows "Uploading").
      let failed = 0;
      if (this.draft.items.length) {
        failed = result.expense
          ? await this.draft.commit(result.expense.id, this.expenseService)
          : this.draft.items.length;
      }

      if (failed > 0) {
        await this.feedback.error(
          `Expense saved, but ${failed} picture${failed === 1 ? '' : 's'} could not be uploaded. Open the expense and tap Edit to add ${failed === 1 ? 'it' : 'them'} again.`,
        );
      } else {
        await this.feedback.success('Expense Added Successfully!');
      }
      await this.router.navigate(['/records']);
    } finally {
      this.saving = false;
    }
  }
}
