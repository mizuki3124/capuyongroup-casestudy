import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonFooter, IonIcon, IonToolbar } from '@ionic/angular/standalone';

export type NavTab = 'records' | 'expenses' | 'account';

/** Footer navigation shared by every page after sign-in. */
@Component({
  selector: 'app-bottom-nav',
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.scss'],
  imports: [RouterLink, IonFooter, IonToolbar, IonButton, IonIcon],
})
export class BottomNavComponent {
  /** Which tab to highlight. */
  @Input() active: NavTab = 'records';

  tabs: { id: NavTab; label: string; icon: string; link: string }[] = [
    { id: 'records', label: 'Records', icon: 'document-text-outline', link: '/records' },
    { id: 'expenses', label: 'Expenses', icon: 'wallet-outline', link: '/expenses' },
    { id: 'account', label: 'Account', icon: 'person-outline', link: '/account' },
  ];
}
