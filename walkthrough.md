# Walkthrough - PRINT X POS System

We have successfully resolved compilation bugs, finalized dynamic branding configurations, and added workflow enhancements to the **PRINT X POS System**. Below is a summary of the accomplishments and verification outcomes.

---

## 1. Resolved Issues & New Accomplishments

* **Resolved JSX Compilation Fix (`/customers/page.js`):** Resolved the premature closing `</div>` tag at line 376 that was breaking build compilation. The entire page and right sidebar panel (Lifetime Deal statistics, Contact info, Billing history tabs) now render flawlessly.
* **Mock Database Client Builder Fix (`src/lib/supabaseClient.js`):** Resolved a critical builder pattern execution bug where updates to customer outstanding balances (and order updates) were running immediately on the mock table before filters (like `.eq("id", customerId)`) could be chained. This was causing all customer records to update to the same outstanding balance value. We deferred updates until execution (`execute()`), ensuring only targeted rows are modified.
* **Orders Page ReferenceError Fix (`/orders/page.js`):** Imported the `Receipt` icon from `lucide-react` to resolve a runtime ReferenceError.
* **Owner Account Bootstrapping & Sign Up (`/login` and `AuthGuard.js`):** Added support for direct onboarding of owner accounts. The system now automatically grants the `owner` role to the very first user who registers, or to any user signing up with an email containing "owner" (e.g., `owner@printx.lk`). We also added a **Sign Up** option to the login page to enable initial account creation in production.
* **Responsive Sidebar & Navigation Fix (`layout.js` and `globals.css`):** Fixed a layout bug where the sidebar container's responsive properties (like `left: -280px` on mobile) were written as inline React styles, overriding CSS media queries and causing the sidebar to be completely hidden off-screen (left: -280px) on desktop screens too. Moved the responsive rules (sidebar positions, main content padding shift, and mobile header displays) to standard CSS classes, making the sidebar and its **Log Out** button fully visible on desktop.
* **Dynamic Shop Branding on Customer Statements (`/customers/[id]/print/page.js`):** Modified the customer account statement print template to load configurations dynamically from `localStorage` (matching the invoice print page). The statement printout now dynamically renders:
    - **Invoice Print Integration:** The printed receipt slip now displays the actual percentage or cash discounts in its "Discount" column instead of a hardcoded `0.00%`.

---

## 5. Teacher Outstanding Balances Ledger (restricted to Owner/Manager)

We have built a dedicated **Outstanding Balances** ledger tab in the Reports Center and integrated it directly into the navigation:

1. **Direct Sidebar Navigation:** Added a dedicated **Teacher Balances** option to the left navigation panel (restricted exclusively to `owner` and `manager` profiles) pointing to `/reports?tab=outstanding`.
2. **Tab URL Syncing:** Updated `/reports` to read search parameters (`?tab=...`), ensuring direct links immediately select the requested view.
3. **Smart Active Highlights:** Configured layout navigation matching to correctly highlight "Teacher Balances" in the sidebar when visiting `/reports?tab=outstanding`, separating it from the general "Reports" sidebar highlight.
4. **Owner/Manager Access Control:** Only users with `owner` or `manager` roles can view and access this tab.
5. **Aggregated Financial Metrics:**
   - **Total Outstanding Debt:** Sum of all outstanding debts across all teacher/customer profile ledgers.
   - **Active Clients in Debt:** Total count of teachers/students currently carrying an unpaid balance.
6. **Ledger Table:**
   - Lists all teachers currently carrying debt.
   - Shows customer name, contact phone, current outstanding balance, and **Last Deal Date** (automatically calculated from the database as the timestamp of their most recent transaction).
   - Allows search filtering by teacher name or phone.
7. **Action Hooks:**
   - **View Statement:** Changes the active tab to *Customer Statements* and auto-selects that customer so the owner can instantly inspect their itemized billing timeline.
   - **Print Statement:** Opens their official statement print sheet in a new tab.
  - Shop Logo (loaded from owner settings)
  - Address Lines 1, 2, and 3
  - Shop Contact Phone, Email, and Footer Info
* **POS UX & Navigation Enhancements (`/pos/page.js`):**
  - **Client Selector Modal:** Automatically focuses the customer directory search box upon loading or resetting the screen. Added direct **Exit to Dashboard** and **Sign Out** buttons underneath the customer selection to prevent cashiers from getting locked inside the POS dialog when they want to change users or navigate away.
* **Inactivity Passcode Blocker:** Automatically focuses the passcode input field when the 2-minute lock screen triggers, and added a **Sign Out / Switch Account** shortcut button inside the locker overlay.
* **Owner Balancing Logs Tab (`src/app/(authenticated)/reports/page.js`):**
  - Added a **Day/Week Balancing Logs** tab restricted to owner/manager profiles.
  - Renders tables displaying all submitted Day End shift records and Week End Sunday audits.
* **Lock Global Name Collision Resolution (`src/app/(authenticated)/settings/page.js`):**
  - Resolved a runtime `Illegal constructor` error caused by a missing import of the `Lock` icon from `lucide-react`. The absence of this import caused React to resolve `<Lock>` to the browser's global Web Locks API constructor (`window.Lock`), which threw an illegal constructor exception when rendered.
* **Staff Full Name Option & Registry Overhaul (`settings/page.js` & `supabaseClient.js`):**
  - Added a **Staff Full Name** input field to the user registration card for owners.
  - Saves the full name to Supabase Auth metadata and profiles table.
  - Overhauled the User Registry table to display the staff full name and `@username` together.
  - Seeded initial profiles with names and added a dynamic caching migration system to auto-upgrade existing localStorage user records.
* **Google Sheets Balancing Audits Sync (`dashboard/page.js`):**
  - Automatically dispatches `DAY_END` and `WEEK_END` audit payloads to Google Sheets via `/api/sync-sheets` upon submission.
  - Includes the active auditor's full name and username in the sheets sync request to track authorizations and prevent spams or false results.
* **Automatic WhatsApp Bill Sharing (`pos/page.js` and `orders/page.js`):** Added a feature that automatically generates a formatted WhatsApp message when checking out a registered customer. It cleans and normalizes their database phone number to international format and redirects to WhatsApp Web or the WhatsApp client with the receipt invoice link, items list, and outstanding debt. Added a **Send WhatsApp** button to the Orders manager details panel as a manual fallback.
* **WhatsApp Link & PDF Sharing Workflow:** Web browsers cannot attach files directly to WhatsApp Web links for security reasons. To make this extremely smooth for the cashier, we developed a two-step flow:
  1. Triggering WhatsApp automatically opens the print layout in a new tab, prompting the print-to-PDF save dialog.
  2. A confirmation prompt guides the cashier to open WhatsApp Web next with pre-filled message text, so they can send the message link and easily drag/attach the saved PDF file.
* **Reports & Operations Center (`/reports/page.js`):** Implemented an interactive dashboard featuring date-range and time gap filtering. Supports:
  - **Profit & Financials:** Aggregates gross sales revenue, collections, outstanding credit, and estimated net profit (with 45% margin assumption) over custom date ranges, broken down in a daily summary log.
  - **Customer Statements:** Computes period sales, collections, and pending balance for a selected customer. Includes a **Print Statement Range** button that opens a printed A4 report filtered to the exact duration.
  - **Print Item Sales:** Computes sold units, transaction counts, and total revenue grouped by catalog print service items in the selected period.
* **Navigation Sidebar Addition (`layout.js`):** Added a link to the "Reports" page in the navigation sidebar (using the Lucide `BarChart2` icon), restricted exclusively to `owner` and `manager` roles (hidden from `staff`).
* **JSX Duplicate Styles Fix (`reports/page.js`):** Fixed duplicate style attribute syntax on table headers, merging them cleanly to preserve both base header styling and custom alignment overrides.
* **POS Item Catalog Settings (`/settings/page.js` and `/pos/page.js`):** Added a new tab "POS Catalog" in the settings center that allows owners and managers to add new items, modify existing items (price, name, category), and delete items. The POS billing interface now dynamically loads items from this list (saving changes in `localStorage`), and dynamically computes categories (so that user-added categories show up instantly on the POS filter bar).
* **Direct Logo File Upload (`/settings/page.js`):** Removed the manual text-link input for the shop logo. Added a direct file uploader with image preview. It reads the uploaded file as a base64 encoded data URL, storing it in the shop settings profile. This ensures all print templates (invoices and client statements) render the logo image without needing external links.
* **Resolved Styling Warnings (Rerender Conflicts):** Resolved Console style warnings regarding "Removing a style property during rerender (borderColor) when a conflicting property is set (border)". Replaced shorthand `border: "1px solid var(--border)"` with separate values (`borderWidth`, `borderStyle`, `borderColor`) in:
  - `src/app/(authenticated)/customers/page.js` (`custRow`)
  - `src/app/(authenticated)/orders/page.js` (`orderItem`)
  - `src/app/(authenticated)/quotations/page.js` (`quoteItem`)
  - `src/app/(authenticated)/pos/page.js` (`cartRow` and `methodBtn`)
  This prevents DOM layout engine warnings during React active/inactive style transitions.
* **POS Catalog Access for Staff:** Enabled users with the `staff` role to view the Settings page and add/manage POS catalog items:
  - Allowed `staff` to navigate to the Settings page from the sidebar menu.
  - Automatically redirects `staff` to the "POS Catalog" tab in Settings.
  - Completely hides and secures "Branding details" and "Staff management" configurations from `staff` role sessions.
* **Google Sheets Two-Way Lookup API (`/api/sync-sheets`):** Added an HTTP `GET` handler to the sync-sheets route. This allows the POS backend to call the Google Apps Script Web App on-demand, enabling real-time lookups of a teacher's/customer's current outstanding balance directly from the spreadsheet (if they perform manual edits or payments inside Google Sheets).
* **Automatic Customer Registration Sheet Sync:** Triggered the `/api/sync-sheets` endpoint when registering a new customer profile. When a client is created (either in the Customers directory or via the POS registration modal), it automatically posts a `"REGISTRATION"` payload to Google Sheets, adding the customer to the master directory and automatically creating their individual student/teacher sheet tab with a 0 outstanding balance. This prepares their profile on your Cloudflare website immediately.
* **Build Verification:** Verified the entire Next.js codebase builds cleanly under production conditions (`npm run build`).
* **Print Billing Invoice Styling Refinements (`/orders/[id]/print/page.js`):** Fully overhauled the printed invoice layout to match the provided invoice mockup with pixel-perfect accuracy.

---

## 2. Teacher / Customer Portal Integration

We have built a dedicated, secure, and real-time **Teacher / Customer Portal** inside the Next.js POS app at `/portal`:

1. **Passcode (PIN) Management**:
   - Added a `portal_passcode` field to the `customers` database schema.
   - Cashiers can view and set an optional passcode in the customer creation modal. Leaving it blank defaults to the standard default PIN `"1234"`.
   - Integrated an **Edit Passcode** section inside the Customer details sidebar in the registry view. Cashiers can change a customer's login PIN at any time.

2. **Customizable Statement Durations**:
   - Added a `portal_duration_limit` database column to the `customers` schema (defaults to `"2m"` / 2 months).
   - Cashiers can modify each customer's portal view limit individually from the Customer Registry view sidebar using a dropdown (Last 1 Month, Last 2 Months, Last 6 Months, or All Time).
   - Removed the duration filter select from the customer's portal view.
   - The portal dashboard dynamically applies the customer's assigned duration limit and displays a clean, read-only status badge showing the current view range.

3. **Public Portal Screen (`/portal`)**:
   - Built a public login interface requesting Phone Number and Portal PIN.
   - Uses local/live Supabase database queries to check credentials.
   - Saves customer session in `localStorage` for continuous log-in state.
   - **First Login PIN Change Enforcement**: Intercepts logins utilizing the default passcode `"1234"` and presents an automated **Change Passcode** screen. Teachers must choose a new PIN code (which cannot be `"1234"`) to unlock their statement dashboard, securing their account instantly.

4. **Stunning Dashboard Experience**:
   - Displays a custom welcome header.
   - Features a glassmorphic summary card showing their real-time **Outstanding Balance** (instant database query).
   - Lists their complete billing history (Orders, Invoices, Status, and Balances).
   - Features a **Print** action button for each order which opens the print receipt layout directly.

---

## 6. Staff & Owner Security Tab Fixes

We have resolved a set of issues that prevented the passcode security tab from working as expected, and extended its features to cover account password updates:

1. **Staff Tab Redirection Fix:** Adjusted the redirect condition in Settings' `useEffect` loop. Staff users are now allowed to access both `"catalog"` and `"security"` tabs in Settings, rather than being forcefully redirected to the catalog view.
2. **Reactive Profile Updates:** Introduced a new `refreshProfile()` function in the global authentication context (`AuthGuard.js`). When a user updates their passcode PIN in Settings, the context profile is re-fetched and updated reactively. This ensures components like warning banners immediately recognize the change without requiring a full page refresh.
3. **New User Default Passcode:** Configured the database profile creation to automatically assign a default fast unlock passcode PIN of `"1234"` to newly registered users during registration.
4. **Seed Owner Passcode Pad Compatibility:** Changed the owner profile's default fast unlock PIN in `supabaseClient.js` from `'owner123'` to `'1234'`, making it fully numeric and compatible with the touch screen keypad overlay.
5. **Login Password Change Support:** Added a new **Change login password** form panel right inside the "My Security" tab. This form integrates with `supabase.auth.updateUser` to allow cashiers, managers, and owners to change their main account login password securely, providing clear and separate fields for fast unlock PINs and main account passwords.

---

## 7. Database Reset (Customers & Bills)

We have built a secure database maintenance feature to allow clearing transaction logs:

1. **Danger Zone Panel:** Added a new panel at the bottom of the **Branding details** settings tab (restricted to `owner` and `manager` profiles).
2. **Bulk Deletion:** Executes a targeted delete query across `orders`, `quotations`, and `customers` tables (using a `.gte("created_at", "2000-01-01")` clause for cross-platform compatibility).
3. **Seed Recovery:** Automatically re-seeds default starting profiles (`John Doe` and `Jane Smith`) with zeroed balances after clearing the database so the system remains functional.
4. **Safety Prompts:** Configured a two-step verification workflow, requiring the user to confirm the alert and manually type the word `"RESET"` before initiating the deletion.

---

## 8. Redesigned Premium A4 Printed Invoice

We converted the invoice printed template into a modern, high-end A4 design:

1. **Micro-Typography:** Preserved clean, compact, print-friendly text sizes (9px - 11px) to fit all columns without upscaling or spilling onto unnecessary pages.
2. **Modern Layout:** 
   - Restructured the header with prominent uppercase document labels and clean contact line heights.
   - Wrapped customer profiles in a stylized **Bill To** info card (`#f8fafc` background with a solid left border band).
3. **Clean SaaS Table Design:** Removed thick, legacy black borders. Swapped them for a modern borderless style with a dark slate header accent (`#0f172a`), zebra-striping rows (`#f8fafc`), and thin light gray row dividers (`#e2e8f0`).
4. **Structured Totals Panel:** Enclosed total calculations and payment methods in an outlined, shaded summary card with clear bold pricing hierarchy.

---

## 3. Verification

### Build Success
```bash
npm run build
```
Result: **Compiled successfully** in 2.6s. All pages (including `/portal`) generated.
