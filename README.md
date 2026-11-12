# ExpenseSave

A small personal expense tracker for students and anyone living on a limited allowance.
Set a wallet balance, log expenses by category, and always see what is left.

Built with **Ionic 8 + Angular 20 (standalone components)** and **Capacitor 7** (Android).
Final case study – Mobile Application Technology.

## Backend (offline, XAMPP + MySQL)

The app talks to a small PHP REST API (now in the separate `backend/` folder of this delivery; copy it to htdocs as `expensesave-api/`) (structure follows the students API example).

1. Copy `expensesave-api/` to `C:\xampp\htdocs\`, start **Apache** and **MySQL** in XAMPP.
2. In phpMyAdmin, import `sql/expensesave_v2.sql` (fresh install) or `sql/migration_v2.sql` (you already have v1 data). Both are in the separate `sql/` folder.
3. Check http://localhost/expensesave-api/api/wallet.php -> `{"success":false,"message":"Please sign in again."}`.
4. `npm ci` then `npm start` (the app uses `apiUrl` from `src/environments/environment.ts`).

For a real phone, set `apiUrl` in both environment files to `http://<PC-LAN-IP>/expensesave-api/api`
(same Wi-Fi, Apache allowed in Windows Firewall). See `README-SETUP.md` and `expensesave-api/README.md`.
Note: `docs/` still describes the earlier local-storage version.

## What's new in v2
- **Undo delete**: deleting shows a "Deleted … · Undo" toast (5 s). The server soft-deletes, so Undo restores the expense and takes the refund back.
- **Edit profile / Change password / Dark mode** on the Account page (the dark-mode choice is remembered; it follows the phone until you flip it).
- **Photos**: up to 3 per expense, from the camera or gallery (Capacitor Camera), on New expense, Edit expense and the expense detail screen.
- **Connection banners**: "You're offline" while disconnected, then a green "Back online · Tap to refresh" banner at the top that reloads the current page.
- **Loading indicators**: splash, button spinners, list skeletons, photo "Uploading" tiles.
- **Splash screen** on every launch, plus the extra screens from the design: search, "Pick dates" calendar and the expense detail / edit screens.

### After copying this project, run once
```bash
npm install                 # installs the new @capacitor/camera, @capacitor/network and @ionic/pwa-elements
npx cap sync android        # registers the two new native plugins with the Android project
```
(`package-lock.json` is refreshed by `npm install`.) The unit tests were extended (`npm test`), but this delivery
was assembled without being able to run `ng build`, so run `ng build` / `npm test` once and tell me about any error.

## Features

| Feature | Details |
|---|---|
| Account | Sign up / sign in through the PHP API. Passwords are hashed on the server with `password_hash()` and stored in MySQL; a login token is kept on the device. |
| Wallet balance | Set the balance or top it up. |
| Add expense | Pick one of 7 categories, enter name / description / amount. Blocked if the amount is invalid or exceeds the balance. |
| Records | Expenses grouped by day with daily totals; filter by day / week / month / year (this & last). |
| Edit / Delete | Edit an amount (balance adjusts by the difference) or delete (amount is refunded). |
| **Capacitor Haptics** | Light tap on category select, success / warning / error vibration on save, delete-confirm and validation errors. |
| Data per account | Each account has its own expenses and balance, stored in the XAMPP MySQL database and reached with `HttpClient` (GET / POST / PUT / DELETE). |

## Run it

```bash
npm ci                 # install dependencies
npm start              # http://localhost:4200  (ionic/ng serve)
npm test               # unit tests (Karma + Jasmine, needs Chrome)
# no display / CI:
npx ng test --watch=false --browsers=ChromeHeadlessCI
```

## Build the Android APK

Requirements: Node 20+, JDK 17+, Android Studio (or the Android SDK command-line tools).

```bash
npm ci
npx ng build                 # production web build -> www/
npx cap sync android         # copies www/ + plugins into the android project
cd android
./gradlew assembleDebug      # Windows: gradlew.bat assembleDebug
```

The installable file is created at `android/app/build/outputs/apk/debug/app-debug.apk`.
Copy it to a phone (or `adb install app-debug.apk`) and allow "install unknown apps" if asked.
Alternatively: `npx cap open android` and use *Build > Build APK(s)* in Android Studio.

> The Android project in this repo is already synced with the current build, so `npx cap sync android` is only
> needed after you change the web code.

## How to use (for testers)

1. **Sign Up** with any name / email / password (min. 6 characters), then **Sign In**. No test credentials are needed or included.
2. On **Records**, tap the wallet icon, enter a balance in *Set Wallet Balance*, and press **SAVE**.
3. Open **Expenses**, choose a category, fill in the form and **SAVE**. Vibration feedback is felt on a real phone.
4. Back on **Records**: change the *Show* filter, tap the pencil to edit or the bin to delete.
5. **Account** shows the signed-in user and **Logout**.

## Project structure

```
src/app
├─ core/                    # no UI – the part worth explaining
│  ├─ models.ts             # Expense, categories, range options
│  ├─ expense-utils.ts      # pure functions: date-range filter, grouping, totals, money format
│  ├─ expense.service.ts    # CRUD + wallet rules (add / update / remove / topUp / setWallet)
│  ├─ auth.service.ts       # register / login / logout with hashed passwords
│  ├─ auth.guard.ts         # authGuard + guestGuard (functional route guards)
│  ├─ feedback.service.ts   # toast + Capacitor Haptics
│  ├─ storage.service.ts    # localStorage wrapper (easy to swap for Preferences / SQLite)
│  └─ *.spec.ts             # 23 unit tests
├─ shared/bottom-nav/       # footer navigation used by every signed-in page
├─ home/  sign-up/  records/  expenses/  expenses-input/  expenses-amount/  account/   # standalone pages
├─ app.component.ts         # ion-app + icon registration
└─ app.routes.ts            # lazy `loadComponent` routes + guards
```

## Migration notes (NgModule -> standalone)

* `AppModule`, all `*.module.ts` and `*-routing.module.ts` files were removed.
* `main.ts` uses `bootstrapApplication(AppComponent, { providers: [provideIonicAngular(), provideRouter(routes), ...] })`.
* Components import from `@ionic/angular/standalone` (`IonButton`, `IonInput`, …) and list them in `imports: []`.
* Icons are registered once with `addIcons()` in `AppComponent`.
* Templates use Angular control flow (`@if`, `@for`) instead of `*ngIf` / `*ngFor`.
* The expense category is now a route parameter (`/expenses-input/Food`) instead of router `state`, which was
  lost when Ionic re-used a cached page.

## Known limitations / ideas

* Data lives on the device only (no sync, no backup). Next step: export to CSV or an `HttpClient` POST to a small API.
* Accounts have no password recovery.
* Currency is fixed to PHP (₱).
* Ideas: Camera for receipt photos, spending-by-category chart, spending limit warnings, Capacitor Preferences/SQLite storage.

## AI assistance

See the *AI Usage Disclosure* section of the report. No secrets, passwords or API keys are present in this repository.
