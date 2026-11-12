import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'splash', pathMatch: 'full' },
  {
    path: 'splash',
    loadComponent: () => import('./splash/splash.page').then((m) => m.SplashPage),
  },
  {
    path: 'home',
    canActivate: [guestGuard],
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'sign-up',
    canActivate: [guestGuard],
    loadComponent: () => import('./sign-up/sign-up.page').then((m) => m.SignUpPage),
  },
  {
    path: 'records',
    canActivate: [authGuard],
    loadComponent: () => import('./records/records.page').then((m) => m.RecordsPage),
  },
  {
    path: 'expense/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./expense-detail/expense-detail.page').then((m) => m.ExpenseDetailPage),
  },
  {
    path: 'expense/:id/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./expense-edit/expense-edit.page').then((m) => m.ExpenseEditPage),
  },
  {
    path: 'expenses',
    canActivate: [authGuard],
    loadComponent: () => import('./expenses/expenses.page').then((m) => m.ExpensesPage),
  },
  {
    path: 'expenses-input/:category',
    canActivate: [authGuard],
    loadComponent: () => import('./expenses-input/expenses-input.page').then((m) => m.ExpensesInputPage),
  },
  {
    path: 'expenses-amount',
    canActivate: [authGuard],
    loadComponent: () => import('./expenses-amount/expenses-amount.page').then((m) => m.ExpensesAmountPage),
  },
  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () => import('./account/account.page').then((m) => m.AccountPage),
  },
  { path: '**', redirectTo: 'home' },
];
