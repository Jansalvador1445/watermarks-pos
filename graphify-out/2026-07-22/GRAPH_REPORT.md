# Graph Report - .  (2026-07-22)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1317 nodes · 2239 edges · 132 communities (90 shown, 42 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e948ea8b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Notification.ts
- InventoryMovementService
- dependencies
- Water Refilling Station POS Desktop Deployment Guide
- devDependencies
- customerController.ts
- dependencies
- verifyBusinessRules.ts
- react
- inventoryRoutes.ts
- migrateV2.ts
- userRoutes.ts
- userService.ts
- compilerOptions
- types/index.ts
- schemas.ts
- compilerOptions
- enums.ts
- compilerOptions
- api.ts
- app
- index.tsx
- Gallon.ts
- DeliveryService
- devDependencies
- productRoutes.ts
- authService.ts
- constants.ts
- authRoutes.ts
- invoiceRoutes.ts
- rbac.ts
- ProductService
- deliveryRoutes.ts
- ReportsPage.tsx
- asyncHandler
- web/src/utils/permissions.ts
- invoiceService.ts
- Program
- productStock.ts
- transactionRoutes.ts
- Part 2 — Replication Guide
- Part 1 — Reference
- backend/package.json
- src/index.ts
- 5. Report Generation Logic (Per Type)
- web/src/utils/productPricing.ts
- scripts
- plugins
- BaseTable.tsx
- AppLayout.tsx
- formatters.ts
- globalSearchHelpers.ts
- pkg
- Customer.ts
- invalidateKeys
- locationLink.ts
- 4. Filter System (End-to-End)
- 6. Statement of Account (SOA) Special Mode
- ErrorBoundary.tsx
- 9. Export & Print
- CustomerFormModal.tsx
- PageHeader.tsx
- NotificationsPage.tsx
- ProductCatalog.tsx
- SalesHistory.tsx
- pricingTier.ts
- ReportService
- 7. On-Screen Display
- 8. Column Selection & Preferences
- CustomerLocationFields.tsx
- StorageOverview.tsx
- DashboardPage.tsx
- web/src/utils/deliveryColor.ts
- Changelog
- React + TypeScript + Vite
- InventoryPage.tsx
- InvoicesPage.tsx
- SettingsPage.tsx
- axios.ts
- SettingsService
- StartPosLauncher.csproj
- main.tsx
- BaseModal.tsx
- DeliveryColorDot.tsx
- ProductPricingFields.tsx
- StatCard.tsx
- StockChip.tsx
- AuthBrandPanel.tsx
- ItemTrackingPage.tsx
- ProtectedRoute.tsx
- authStore.ts
- notificationStore.ts
- uiStore.ts
- config.ts
- web/tsconfig.json
- pkg
- @types/bcryptjs
- @types/cookie-parser
- @types/cors
- eslint
- @types/morgan
- @types/multer
- @types/node-cron
- @typescript-eslint/parser
- loginCopy.ts
- convertWaterOrder
- createWaterOrder
- deleteWaterOrder
- getWaterOrder
- getWaterOrders
- updateWaterOrder
- createWaterOrderSchema
- updateWaterOrderSchema
- waterOrderApi
- invalidateAfterWaterOrderChange

## God Nodes (most connected - your core abstractions)
1. `react` - 39 edges
2. `InventoryMovementService` - 23 edges
3. `DeliveryService` - 21 edges
4. `AppError` - 21 edges
5. `Inventory` - 20 edges
6. `compilerOptions` - 19 edges
7. `UserRole` - 18 edges
8. `getPagination()` - 18 edges
9. `compilerOptions` - 17 edges
10. `Log` - 17 edges

## Surprising Connections (you probably didn't know these)
- `NotificationListener()` --references--> `app`  [EXTRACTED]
  web/src/components/NotificationListener.tsx → backend/src/index.ts
- `LoginPage()` --references--> `app`  [EXTRACTED]
  web/src/features/auth/LoginPage.tsx → backend/src/index.ts
- `OnboardingPage()` --references--> `app`  [EXTRACTED]
  web/src/features/auth/OnboardingPage.tsx → backend/src/index.ts
- `useLogoutConfirm()` --references--> `app`  [EXTRACTED]
  web/src/hooks/useLogoutConfirm.ts → backend/src/index.ts
- `DashboardPage()` --references--> `app`  [EXTRACTED]
  web/src/features/dashboard/DashboardPage.tsx → backend/src/index.ts

## Import Cycles
- None detected.

## Communities (132 total, 42 thin omitted)

### Community 0 - "Notification.ts"
Cohesion: 0.05
Nodes (33): getActivity, getDeliveries, getInventory, getRecentDeliveries, getRecentTransactions, getSales, getStats, getSystemSummary (+25 more)

### Community 1 - "InventoryMovementService"
Cohesion: 0.07
Nodes (19): Inventory, Log, assert(), main(), seed(), fail(), main(), pass() (+11 more)

### Community 2 - "dependencies"
Cohesion: 0.05
Nodes (37): @ant-design/icons, antd, axios, @fontsource/inter, framer-motion, @hookform/resolvers, jspdf, jspdf-autotable (+29 more)

### Community 3 - "Water Refilling Station POS Desktop Deployment Guide"
Cohesion: 0.05
Nodes (35): Architecture Overview, Build Steps, Building the Desktop Package, Changing Database Path, Changing Port, Customization, Data Backup, Distribution Folder Structure (+27 more)

### Community 4 - "devDependencies"
Cohesion: 0.05
Nodes (36): eslint-plugin-react-hooks, eslint-plugin-react-refresh, oxlint, @types/react, @types/react-dom, vite, @vitejs/plugin-react, devDependencies (+28 more)

### Community 5 - "customerController.ts"
Cohesion: 0.09
Nodes (20): createCustomer, deleteCustomer, deleteCustomerPhoto, enrichCustomer(), getCustomer, getCustomers, importCustomers, toggleCustomerStatus (+12 more)

### Community 6 - "dependencies"
Cohesion: 0.06
Nodes (35): dependencies, bcryptjs, compression, cookie-parser, cors, dayjs, dotenv, express (+27 more)

### Community 7 - "verifyBusinessRules.ts"
Cohesion: 0.14
Nodes (20): Customer, Delivery, IInventoryMovement, InventoryMovement, inventoryMovementSchema, IPricingTier, PricingTier, PricingTierCode (+12 more)

### Community 8 - "react"
Cohesion: 0.08
Nodes (6): react, PermissionGateProps, CartItem, useDebounce(), useSearchFromUrl(), OnboardingRouteProps

### Community 9 - "inventoryRoutes.ts"
Cohesion: 0.13
Nodes (24): addProduction, createInventoryItem, deleteInventoryItem, getCustomerReport, getDeliveryReport, getGallonHistory, getGallonOverview, getInventory (+16 more)

### Community 10 - "migrateV2.ts"
Cohesion: 0.15
Nodes (17): connectDB(), normalizeMongoUri(), envSchema, parsed, logFormat, logger, ensurePricingTiers(), linkProductsToInventory() (+9 more)

### Community 11 - "userRoutes.ts"
Cohesion: 0.13
Nodes (23): createBackup, createUser, deleteUser, downloadBackup, getBackups, getLogs, getNotifications, getSettings (+15 more)

### Community 12 - "userService.ts"
Cohesion: 0.13
Nodes (12): Notification, Settings, BACKUP_COLLECTIONS, UserService, generateTempPassword(), buildSearchQuery(), escapeRegex(), getPagination() (+4 more)

### Community 13 - "compilerOptions"
Cohesion: 0.08
Nodes (25): DOM, DOM.Iterable, vite/client, compilerOptions, allowImportingTsExtensions, forceConsistentCasingInFileNames, jsx, lib (+17 more)

### Community 14 - "types/index.ts"
Cohesion: 0.08
Nodes (25): ActivityLog, ApiResponse, Customer, CustomerContact, DailyCollection, DailyCollectionItem, DashboardStats, Delivery (+17 more)

### Community 15 - "schemas.ts"
Cohesion: 0.09
Nodes (20): adjustmentSchema, catalogTransactionItemSchema, contactSchema, createGallonSchema, createInventorySchema, createUserSchema, customerFieldsSchema, gallonItemRefSchema (+12 more)

### Community 16 - "compilerOptions"
Cohesion: 0.09
Nodes (21): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, forceConsistentCasingInFileNames, lib, module, moduleDetection (+13 more)

### Community 17 - "enums.ts"
Cohesion: 0.28
Nodes (13): ITransaction, ITransactionItem, Transaction, transactionSchema, User, userSchema, ColorCode, ContinuationDecision (+5 more)

### Community 18 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, lib, module, outDir (+12 more)

### Community 19 - "api.ts"
Cohesion: 0.10
Nodes (19): authApi, backupApi, collectionApi, customerApi, dashboardApi, deliveryApi, gallonApi, healthApi (+11 more)

### Community 20 - "app"
Cohesion: 0.11
Nodes (13): app, NotificationListener(), typeLabels, LoginForm, LoginPage(), loginSchema, OnboardingForm, OnboardingPage() (+5 more)

### Community 21 - "index.tsx"
Cohesion: 0.11
Nodes (17): BackupPage, CustomersPage, DailyCollectionPage, DashboardPage, DeliveredHistoryPage, DeliveriesPage, InventoryPage, InvoicesPage (+9 more)

### Community 22 - "Gallon.ts"
Cohesion: 0.16
Nodes (14): Gallon, gallonSchema, IGallon, IGallonHistory, IInventory, IInventoryHistory, inventorySchema, IProduct (+6 more)

### Community 24 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, prettier, tsx, @types/compression, @types/express, @types/jsonwebtoken, @types/node, typescript (+9 more)

### Community 25 - "productRoutes.ts"
Cohesion: 0.22
Nodes (11): createProduct, deleteProduct, getActiveProducts, getProduct, getProducts, updateProduct, validateParamObjectId(), router (+3 more)

### Community 26 - "authService.ts"
Cohesion: 0.36
Nodes (7): IUser, AuthService, clearAuthCookies(), generateAccessToken(), generateRefreshToken(), setAuthCookies(), verifyRefreshToken()

### Community 27 - "constants.ts"
Cohesion: 0.12
Nodes (14): emptyPermissionState, PRESET_ROLES, ROLE_HINTS, TempCredentials, UsersPage(), MENU_GROUPS, MENU_ITEMS, MenuGroupDef (+6 more)

### Community 28 - "authRoutes.ts"
Cohesion: 0.20
Nodes (11): completeOnboarding, getMe, login, logout, refresh, apiLimiter, authLimiter, validate() (+3 more)

### Community 29 - "invoiceRoutes.ts"
Cohesion: 0.22
Nodes (12): convertInvoice, createInvoice, deleteInvoice, getInvoice, getInvoices, updateInvoice, auditLog(), sanitizeBody() (+4 more)

### Community 30 - "rbac.ts"
Cohesion: 0.23
Nodes (11): authenticate(), optionalAuth(), authorize(), authorizeRoles(), getUserPermissions(), matchPermission(), router, ROLE_PERMISSIONS (+3 more)

### Community 31 - "ProductService"
Cohesion: 0.23
Nodes (3): ProductService, getProductPriceForTier(), TIER_DISPLAY

### Community 32 - "deliveryRoutes.ts"
Cohesion: 0.23
Nodes (12): createDelivery, deleteDelivery, getCalendarEvents, getDeliveredHistory, getDeliveries, getDelivery, resolveDeliveryDecision, updateDelivery (+4 more)

### Community 33 - "ReportsPage.tsx"
Cohesion: 0.21
Nodes (13): buildCsvBlob(), buildPdf(), COLORS, downloadBlob(), escapeCsvValue(), MOVEMENT_LABELS, PdfSection, ReportsPage() (+5 more)

### Community 34 - "asyncHandler"
Cohesion: 0.17
Nodes (7): getDailyCollection, getPricingTiers, updatePricingTier, CollectionService, PricingTierService, asyncHandler(), successResponse()

### Community 35 - "web/src/utils/permissions.ts"
Cohesion: 0.22
Nodes (11): UserPermissionsEditor(), UserPermissionsEditorProps, ADMIN_ONLY_MODULES, buildPermissionsFromState(), buildStateFromPermissions(), countEnabledPermissions(), getRolePermissionSummary(), matchPermission() (+3 more)

### Community 36 - "invoiceService.ts"
Cohesion: 0.21
Nodes (10): IInvoice, IInvoiceItem, Invoice, invoiceItemSchema, invoiceSchema, InvoiceStatus, IWaterOrder, InvoiceItemInput (+2 more)

### Community 37 - "Program"
Cohesion: 0.26
Nodes (5): StartPosLauncher, Program, Process, STAThread, string

### Community 38 - "productStock.ts"
Cohesion: 0.27
Nodes (10): buildInvoiceStockCredit(), cartExceedsStock(), getAvailableStock(), getProductStockInfo(), getProductStockLabel(), InventoryLookup, invoiceLinesExceedStock(), ProductStockInfo (+2 more)

### Community 39 - "transactionRoutes.ts"
Cohesion: 0.27
Nodes (9): createTransaction, deleteTransaction, getTransaction, getTransactions, updateTransaction, router, paginatedResponse(), createTransactionSchema (+1 more)

### Community 40 - "Part 2 — Replication Guide"
Cohesion: 0.18
Nodes (10): A. Minimum Viable Copy, Appendix — Response Shapes, B. Implementation Order, C. Patterns Worth Keeping, D. Patterns Worth Improving When Copying, E. Dependencies, F. Test Checklist, Financial Reports — Reference & Duplication Guide (+2 more)

### Community 41 - "Part 1 — Reference"
Cohesion: 0.18
Nodes (11): 10. Role-Based Variants, 11. Caching & Invalidation, 12. Key File Map, 1. Overview, 2. High-Level Architecture, 3. Report Types Catalog, Backend, Frontend (+3 more)

### Community 42 - "backend/package.json"
Cohesion: 0.20
Nodes (9): author, bin, description, keywords, license, main, name, type (+1 more)

### Community 43 - "src/index.ts"
Cohesion: 0.27
Nodes (7): isSeedAdminOnly, server, start(), staticPath, router, DEFAULT_TIERS, ensurePricingTiers()

### Community 44 - "5. Report Generation Logic (Per Type)"
Cohesion: 0.20
Nodes (10): 5.1 Standard fetch flow, 5.2 Payment Received, 5.3 Outstanding Balances, 5.4 Credit / Aging, 5.5 Invoice Summary, 5.6 Commission, 5.7 Expense Summary, 5.8 Profit & Loss (+2 more)

### Community 45 - "web/src/utils/productPricing.ts"
Cohesion: 0.20
Nodes (3): ProductTierCode, TIER_DISPLAY, TIER_SELLING_LABELS

### Community 46 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, build:desktop, dev, lint, package:win, seed, seed:admin (+1 more)

### Community 47 - "plugins"
Cohesion: 0.22
Nodes (8): oxc, typescript, warn, plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 48 - "BaseTable.tsx"
Cohesion: 0.33
Nodes (7): BaseTable(), BaseTableProps, buildAutoMobileItem(), getColumnTitle(), getColumnValue(), MobileListCard(), MobileListCardProps

### Community 49 - "AppLayout.tsx"
Cohesion: 0.33
Nodes (5): AppHeader(), getCustomerName(), AppSidebar(), flattenMenuKeys(), iconMap

### Community 50 - "formatters.ts"
Cohesion: 0.25
Nodes (3): currencyFormatter, formatDate(), formatRelativeTime()

### Community 51 - "globalSearchHelpers.ts"
Cohesion: 0.28
Nodes (6): matchesMenuItem(), normalize(), SearchOption, SearchOptionGroup, SearchResultType, searchSidebarPages()

### Community 52 - "pkg"
Cohesion: 0.25
Nodes (8): pkg, assets, outputPath, scripts, targets, dist/**/*.js, node18-win-x64, ../web/dist/**/*

### Community 53 - "Customer.ts"
Cohesion: 0.29
Nodes (7): contactSchema, customerSchema, deliverySchema, ICustomer, ICustomerContact, IDelivery, CustomerStatus

### Community 54 - "invalidateKeys"
Cohesion: 0.39
Nodes (6): queryClient, invalidateAfterCustomerChange(), invalidateAfterDeliveryChange(), invalidateAfterInvoiceChange(), invalidateAfterTransactionChange(), invalidateKeys()

### Community 55 - "locationLink.ts"
Cohesion: 0.36
Nodes (5): buildMapsUrl(), getCustomerMapsUrl(), hasValidCoordinates(), isNavigableLocationLink(), openLocationLink()

### Community 56 - "4. Filter System (End-to-End)"
Cohesion: 0.29
Nodes (7): 4.1 UI layer, 4.2 Which filters apply per report type, 4.3 Backend validation, 4.4 Payment status computation, 4.5 Status intersection (frontend + backend must stay in sync), 4.6 Company scoping, 4. Filter System (End-to-End)

### Community 57 - "6. Statement of Account (SOA) Special Mode"
Cohesion: 0.29
Nodes (7): 6. Statement of Account (SOA) Special Mode, Behavior differences, Context loading, PDF path, Print path, SOA document structure, Trigger

### Community 58 - "ErrorBoundary.tsx"
Cohesion: 0.29
Nodes (3): ErrorBoundary, Props, State

### Community 59 - "9. Export & Print"
Cohesion: 0.33
Nodes (6): 9. Export & Print, Backend export endpoint (audit only), Export entry point, Output paths summary, Payment Received special case, Print

### Community 60 - "CustomerFormModal.tsx"
Cohesion: 0.40
Nodes (5): contactSchema, CustomerForm, CustomerFormModal(), CustomerFormModalProps, customerSchema

### Community 61 - "PageHeader.tsx"
Cohesion: 0.40
Nodes (3): PageHeaderProps, PageRefreshButton(), PageRefreshButtonProps

### Community 62 - "NotificationsPage.tsx"
Cohesion: 0.40
Nodes (5): FilterKey, isActionRequired(), NotificationsPage(), typeColors, typeIcons

### Community 63 - "ProductCatalog.tsx"
Cohesion: 0.33
Nodes (4): CATEGORY_COLORS, CATEGORY_OPTIONS, defaultFormValues, ProductFormValues

### Community 64 - "SalesHistory.tsx"
Cohesion: 0.60
Nodes (5): formatPayment(), printReceipt(), SALE_TYPE_LABELS, SalesHistory(), stockImpactSummary()

### Community 65 - "pricingTier.ts"
Cohesion: 0.47
Nodes (4): buildTierOptions(), codeToCategoryLetter(), getTierLabel(), TIER_CODE_LETTERS

### Community 67 - "7. On-Screen Display"
Cohesion: 0.40
Nodes (5): 7. On-Screen Display, Financial reports, Payment reports, Report header block, Table columns

### Community 68 - "8. Column Selection & Preferences"
Cohesion: 0.40
Nodes (5): 8. Column Selection & Preferences, Column definitions, Export alignment, Persistence, UI component

### Community 69 - "CustomerLocationFields.tsx"
Cohesion: 0.50
Nodes (4): CustomerLocationFields(), CustomerLocationFieldsProps, inferInitialTab(), LocationTab

### Community 71 - "DashboardPage.tsx"
Cohesion: 0.60
Nodes (4): DashboardPage(), formatPayment(), formatTransactionType(), SALES_PERIODS

### Community 72 - "web/src/utils/deliveryColor.ts"
Cohesion: 0.50
Nodes (3): DeliveryColorCode, getDaysPastDue(), resolveDeliveryColorCode()

### Community 73 - "Changelog"
Cohesion: 0.50
Nodes (3): 2026-07-10, 2026-07-14, Changelog

### Community 74 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 76 - "InvoicesPage.tsx"
Cohesion: 0.67
Nodes (3): calcLineSubtotal(), InvoicesPage(), STATUS_COLORS

## Knowledge Gaps
- **488 isolated node(s):** `name`, `version`, `description`, `main`, `bin` (+483 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **42 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `app`, `index.tsx`, `constants.ts`, `ReportsPage.tsx`, `plugins`, `AppLayout.tsx`, `ErrorBoundary.tsx`, `CustomerFormModal.tsx`, `NotificationsPage.tsx`, `ProductCatalog.tsx`, `SalesHistory.tsx`, `CustomerLocationFields.tsx`, `DashboardPage.tsx`, `InventoryPage.tsx`, `InvoicesPage.tsx`, `SettingsPage.tsx`, `main.tsx`, `StatCard.tsx`, `ItemTrackingPage.tsx`, `useAuth.ts`, `ProtectedRoute.tsx`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `ProductService` connect `ProductService` to `productRoutes.ts`, `Gallon.ts`, `enums.ts`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `CustomerService` connect `customerController.ts` to `userService.ts`, `verifyBusinessRules.ts`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _488 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Notification.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05201266395296246 - nodes in this community are weakly interconnected._
- **Should `InventoryMovementService` be split into smaller, more focused modules?**
  _Cohesion score 0.06663141195134849 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._