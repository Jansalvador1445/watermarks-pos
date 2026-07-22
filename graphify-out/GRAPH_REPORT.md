# Graph Report - .  (2026-07-21)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1200 nodes · 2256 edges · 131 communities (80 shown, 51 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7a9e49db`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Inventory
- dashboardRoutes.ts
- devDependencies
- customerRoutes.ts
- devDependencies
- migrateV2.ts
- compilerOptions
- types/index.ts
- dashboardService.ts
- verifyBusinessRules.ts
- Customer.ts
- react
- enums.ts
- schemas.ts
- compilerOptions
- inventoryRoutes.ts
- compilerOptions
- src/index.ts
- api.ts
- rbac.ts
- index.tsx
- userRoutes.ts
- dependencies
- GallonService
- productRoutes.ts
- seed.ts
- authService.ts
- constants.ts
- dependencies
- invoiceRoutes.ts
- app
- ProductService
- deliveryRoutes.ts
- backend/src/utils/permissions.ts
- ReportsPage.tsx
- web/src/utils/permissions.ts
- authRoutes.ts
- pricingTierRoutes.ts
- Program
- productStock.ts
- transactionRoutes.ts
- getPagination
- backend/package.json
- web/src/utils/productPricing.ts
- scripts
- plugins
- BaseTable.tsx
- AppLayout.tsx
- formatters.ts
- globalSearchHelpers.ts
- pkg
- invalidateKeys
- locationLink.ts
- ErrorBoundary.tsx
- CustomersPage.tsx
- PageHeader.tsx
- NotificationsPage.tsx
- ProductCatalog.tsx
- SalesHistory.tsx
- CustomerLocationFields.tsx
- StorageOverview.tsx
- DashboardPage.tsx
- web/src/utils/deliveryColor.ts
- InventoryPage.tsx
- InvoicesPage.tsx
- SettingsPage.tsx
- usePageRefresh.ts
- axios.ts
- SettingsService
- StartPosLauncher.csproj
- jspdf
- main.tsx
- BaseModal.tsx
- DeliveryColorDot.tsx
- PermissionGate.tsx
- ProductPricingFields.tsx
- StatCard.tsx
- StockChip.tsx
- AuthBrandPanel.tsx
- POSPage.tsx
- ProtectedRoute.tsx
- authStore.ts
- notificationStore.ts
- uiStore.ts
- config.ts
- web/tsconfig.json
- axios
- antd
- bcryptjs
- compression
- dayjs
- express
- jsonwebtoken
- mongoose
- node-cron
- socket.io
- winston
- framer-motion
- @hookform/resolvers
- jspdf-autotable
- react-hook-form
- socket.io-client
- @tanstack/react-query
- zod
- zustand
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
1. `react` - 37 edges
2. `Inventory` - 30 edges
3. `InventoryMovementService` - 24 edges
4. `AppError` - 22 edges
5. `DeliveryService` - 21 edges
6. `getPagination()` - 20 edges
7. `UserRole` - 19 edges
8. `compilerOptions` - 19 edges
9. `Log` - 17 edges
10. `GallonType` - 17 edges

## Surprising Connections (you probably didn't know these)
- `NotificationListener()` --references--> `app`  [EXTRACTED]
  web/src/components/NotificationListener.tsx → backend/src/index.ts
- `LoginPage()` --references--> `app`  [EXTRACTED]
  web/src/features/auth/LoginPage.tsx → backend/src/index.ts
- `OnboardingPage()` --references--> `app`  [EXTRACTED]
  web/src/features/auth/OnboardingPage.tsx → backend/src/index.ts
- `DashboardPage()` --references--> `app`  [EXTRACTED]
  web/src/features/dashboard/DashboardPage.tsx → backend/src/index.ts
- `useLogoutConfirm()` --references--> `app`  [EXTRACTED]
  web/src/hooks/useLogoutConfirm.ts → backend/src/index.ts

## Import Cycles
- None detected.

## Communities (131 total, 51 thin omitted)

### Community 0 - "Inventory"
Cohesion: 0.06
Nodes (15): Inventory, fail(), main(), pass(), DeliveryService, InventoryMovementService, isTransactionUnsupported(), InventoryService (+7 more)

### Community 1 - "dashboardRoutes.ts"
Cohesion: 0.06
Nodes (25): getActivity, getDeliveries, getInventory, getRecentDeliveries, getRecentTransactions, getSales, getStats, getSystemSummary (+17 more)

### Community 2 - "devDependencies"
Cohesion: 0.05
Nodes (36): eslint-plugin-react-hooks, eslint-plugin-react-refresh, oxlint, @types/react, @types/react-dom, vite, @vitejs/plugin-react, devDependencies (+28 more)

### Community 3 - "customerRoutes.ts"
Cohesion: 0.09
Nodes (20): createCustomer, deleteCustomer, deleteCustomerPhoto, enrichCustomer(), getCustomer, getCustomers, importCustomers, toggleCustomerStatus (+12 more)

### Community 4 - "devDependencies"
Cohesion: 0.06
Nodes (35): devDependencies, eslint, pkg, prettier, tsx, @types/bcryptjs, @types/compression, @types/cookie-parser (+27 more)

### Community 5 - "migrateV2.ts"
Cohesion: 0.18
Nodes (17): connectDB(), envSchema, parsed, logFormat, logger, start(), ensurePricingTiers(), linkProductsToInventory() (+9 more)

### Community 6 - "compilerOptions"
Cohesion: 0.08
Nodes (25): DOM, DOM.Iterable, vite/client, compilerOptions, allowImportingTsExtensions, forceConsistentCasingInFileNames, jsx, lib (+17 more)

### Community 7 - "types/index.ts"
Cohesion: 0.08
Nodes (25): ActivityLog, ApiResponse, Customer, CustomerContact, DailyCollection, DailyCollectionItem, DashboardStats, Delivery (+17 more)

### Community 8 - "dashboardService.ts"
Cohesion: 0.12
Nodes (20): gallonSchema, IGallon, IGallonHistory, IInventory, IInventoryHistory, inventorySchema, backupSchema, IBackup (+12 more)

### Community 9 - "verifyBusinessRules.ts"
Cohesion: 0.20
Nodes (16): Customer, Delivery, IInventoryMovement, InventoryMovement, inventoryMovementSchema, Log, results, DeliveryRecord (+8 more)

### Community 10 - "Customer.ts"
Cohesion: 0.11
Nodes (19): contactSchema, customerSchema, deliverySchema, ICustomer, ICustomerContact, IDelivery, IInvoice, IInvoiceItem (+11 more)

### Community 11 - "react"
Cohesion: 0.10
Nodes (5): react, RecordMode, useDebounce(), useSearchFromUrl(), OnboardingRouteProps

### Community 12 - "enums.ts"
Cohesion: 0.23
Nodes (15): IProduct, Product, productSchema, ITransaction, ITransactionItem, Transaction, transactionSchema, ResolvedTransactionItem (+7 more)

### Community 13 - "schemas.ts"
Cohesion: 0.09
Nodes (19): adjustmentSchema, catalogTransactionItemSchema, contactSchema, createGallonSchema, createInventorySchema, createUserSchema, customerFieldsSchema, gallonItemRefSchema (+11 more)

### Community 14 - "compilerOptions"
Cohesion: 0.09
Nodes (21): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, forceConsistentCasingInFileNames, lib, module, moduleDetection (+13 more)

### Community 15 - "inventoryRoutes.ts"
Cohesion: 0.18
Nodes (19): addProduction, createInventoryItem, deleteInventoryItem, getCustomerReport, getDeliveryReport, getGallonHistory, getGallonOverview, getInventory (+11 more)

### Community 16 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, lib, module, outDir (+12 more)

### Community 17 - "src/index.ts"
Cohesion: 0.11
Nodes (18): isSeedAdminOnly, server, staticPath, errorHandler(), notFoundHandler(), apiLimiter, authLimiter, router (+10 more)

### Community 18 - "api.ts"
Cohesion: 0.10
Nodes (19): authApi, backupApi, collectionApi, customerApi, dashboardApi, deliveryApi, gallonApi, healthApi (+11 more)

### Community 19 - "rbac.ts"
Cohesion: 0.17
Nodes (13): getDailyCollection, authenticate(), optionalAuth(), authorize(), getUserPermissions(), matchPermission(), router, CollectionService (+5 more)

### Community 20 - "index.tsx"
Cohesion: 0.11
Nodes (17): BackupPage, CustomersPage, DailyCollectionPage, DashboardPage, DeliveredHistoryPage, DeliveriesPage, InventoryPage, InvoicesPage (+9 more)

### Community 21 - "userRoutes.ts"
Cohesion: 0.22
Nodes (16): createBackup, createUser, deleteUser, downloadBackup, getBackups, getLogs, getNotifications, getSettings (+8 more)

### Community 22 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, cookie-parser, cors, dotenv, express-rate-limit, helmet, morgan, multer (+9 more)

### Community 23 - "GallonService"
Cohesion: 0.21
Nodes (6): Gallon, assert(), main(), GallonService, defaultLabelFromKey(), slugifyItemKey()

### Community 24 - "productRoutes.ts"
Cohesion: 0.22
Nodes (11): createProduct, deleteProduct, getActiveProducts, getProduct, getProducts, updateProduct, validateParamObjectId(), router (+3 more)

### Community 25 - "seed.ts"
Cohesion: 0.35
Nodes (7): normalizeMongoUri(), User, userSchema, main(), BACKUP_COLLECTIONS, UserRole, UserStatus

### Community 26 - "authService.ts"
Cohesion: 0.36
Nodes (7): IUser, AuthService, clearAuthCookies(), generateAccessToken(), generateRefreshToken(), setAuthCookies(), verifyRefreshToken()

### Community 27 - "constants.ts"
Cohesion: 0.12
Nodes (14): emptyPermissionState, PRESET_ROLES, ROLE_HINTS, TempCredentials, UsersPage(), MENU_GROUPS, MENU_ITEMS, MenuGroupDef (+6 more)

### Community 28 - "dependencies"
Cohesion: 0.13
Nodes (15): @ant-design/icons, @fontsource/inter, react, react-dom, react-router-dom, recharts, dependencies, @ant-design/icons (+7 more)

### Community 29 - "invoiceRoutes.ts"
Cohesion: 0.22
Nodes (12): convertInvoice, createInvoice, deleteInvoice, getInvoice, getInvoices, updateInvoice, auditLog(), sanitizeBody() (+4 more)

### Community 30 - "app"
Cohesion: 0.13
Nodes (10): app, NotificationListener(), typeLabels, LoginForm, LoginPage(), loginSchema, OnboardingForm, OnboardingPage() (+2 more)

### Community 31 - "ProductService"
Cohesion: 0.23
Nodes (3): ProductService, getProductPriceForTier(), TIER_DISPLAY

### Community 32 - "deliveryRoutes.ts"
Cohesion: 0.26
Nodes (11): createDelivery, deleteDelivery, getCalendarEvents, getDeliveredHistory, getDeliveries, getDelivery, resolveDeliveryDecision, updateDelivery (+3 more)

### Community 33 - "backend/src/utils/permissions.ts"
Cohesion: 0.21
Nodes (5): UserService, generateTempPassword(), ADMIN_ONLY_PERMISSIONS, ALL_ASSIGNABLE_PERMISSIONS, validateCustomPermissions()

### Community 34 - "ReportsPage.tsx"
Cohesion: 0.22
Nodes (12): buildCsvBlob(), COLORS, downloadBlob(), escapeCsvValue(), MOVEMENT_LABELS, PdfSection, ReportsPage(), SALES_PERIODS (+4 more)

### Community 35 - "web/src/utils/permissions.ts"
Cohesion: 0.22
Nodes (11): UserPermissionsEditor(), UserPermissionsEditorProps, ADMIN_ONLY_MODULES, buildPermissionsFromState(), buildStateFromPermissions(), countEnabledPermissions(), getRolePermissionSummary(), matchPermission() (+3 more)

### Community 36 - "authRoutes.ts"
Cohesion: 0.26
Nodes (9): completeOnboarding, getMe, login, logout, refresh, validate(), router, loginSchema (+1 more)

### Community 37 - "pricingTierRoutes.ts"
Cohesion: 0.20
Nodes (7): getPricingTiers, updatePricingTier, authorizeRoles(), router, PricingTierService, asyncHandler(), updatePricingTierSchema

### Community 38 - "Program"
Cohesion: 0.26
Nodes (5): StartPosLauncher, Program, Process, STAThread, string

### Community 39 - "productStock.ts"
Cohesion: 0.27
Nodes (10): buildInvoiceStockCredit(), cartExceedsStock(), getAvailableStock(), getProductStockInfo(), getProductStockLabel(), InventoryLookup, invoiceLinesExceedStock(), ProductStockInfo (+2 more)

### Community 40 - "transactionRoutes.ts"
Cohesion: 0.27
Nodes (9): createTransaction, deleteTransaction, getTransaction, getTransactions, updateTransaction, router, paginatedResponse(), createTransactionSchema (+1 more)

### Community 41 - "getPagination"
Cohesion: 0.18
Nodes (9): IPricingTier, PricingTier, PricingTierCode, pricingTierSchema, LogService, buildSearchQuery(), escapeRegex(), getPagination() (+1 more)

### Community 42 - "backend/package.json"
Cohesion: 0.20
Nodes (9): author, bin, description, keywords, license, main, name, type (+1 more)

### Community 43 - "web/src/utils/productPricing.ts"
Cohesion: 0.20
Nodes (3): ProductTierCode, TIER_DISPLAY, TIER_SELLING_LABELS

### Community 44 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, build, build:desktop, dev, lint, package:win, seed, seed:admin (+1 more)

### Community 45 - "plugins"
Cohesion: 0.22
Nodes (8): oxc, typescript, warn, plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 46 - "BaseTable.tsx"
Cohesion: 0.33
Nodes (7): BaseTable(), BaseTableProps, buildAutoMobileItem(), getColumnTitle(), getColumnValue(), MobileListCard(), MobileListCardProps

### Community 47 - "AppLayout.tsx"
Cohesion: 0.33
Nodes (5): AppHeader(), getCustomerName(), AppSidebar(), flattenMenuKeys(), iconMap

### Community 48 - "formatters.ts"
Cohesion: 0.25
Nodes (3): currencyFormatter, formatDate(), formatRelativeTime()

### Community 49 - "globalSearchHelpers.ts"
Cohesion: 0.28
Nodes (6): matchesMenuItem(), normalize(), SearchOption, SearchOptionGroup, SearchResultType, searchSidebarPages()

### Community 50 - "pkg"
Cohesion: 0.25
Nodes (8): pkg, assets, outputPath, scripts, targets, dist/**/*.js, node18-win-x64, ../web/dist/**/*

### Community 51 - "invalidateKeys"
Cohesion: 0.39
Nodes (6): queryClient, invalidateAfterCustomerChange(), invalidateAfterDeliveryChange(), invalidateAfterInvoiceChange(), invalidateAfterTransactionChange(), invalidateKeys()

### Community 52 - "locationLink.ts"
Cohesion: 0.36
Nodes (5): buildMapsUrl(), getCustomerMapsUrl(), hasValidCoordinates(), isNavigableLocationLink(), openLocationLink()

### Community 53 - "ErrorBoundary.tsx"
Cohesion: 0.29
Nodes (3): ErrorBoundary, Props, State

### Community 54 - "CustomersPage.tsx"
Cohesion: 0.43
Nodes (6): contactSchema, CustomerForm, customerSchema, CustomersPage(), getTierId(), getTierLabel()

### Community 55 - "PageHeader.tsx"
Cohesion: 0.40
Nodes (3): PageHeaderProps, PageRefreshButton(), PageRefreshButtonProps

### Community 56 - "NotificationsPage.tsx"
Cohesion: 0.40
Nodes (5): FilterKey, isActionRequired(), NotificationsPage(), typeColors, typeIcons

### Community 57 - "ProductCatalog.tsx"
Cohesion: 0.33
Nodes (4): CATEGORY_COLORS, CATEGORY_OPTIONS, defaultFormValues, ProductFormValues

### Community 58 - "SalesHistory.tsx"
Cohesion: 0.60
Nodes (5): formatPayment(), printReceipt(), SALE_TYPE_LABELS, SalesHistory(), stockImpactSummary()

### Community 59 - "CustomerLocationFields.tsx"
Cohesion: 0.50
Nodes (4): CustomerLocationFields(), CustomerLocationFieldsProps, inferInitialTab(), LocationTab

### Community 61 - "DashboardPage.tsx"
Cohesion: 0.60
Nodes (4): DashboardPage(), formatPayment(), formatTransactionType(), SALES_PERIODS

### Community 62 - "web/src/utils/deliveryColor.ts"
Cohesion: 0.50
Nodes (3): DeliveryColorCode, getDaysPastDue(), resolveDeliveryColorCode()

### Community 64 - "InvoicesPage.tsx"
Cohesion: 0.67
Nodes (3): calcLineSubtotal(), InvoicesPage(), STATUS_COLORS

### Community 66 - "usePageRefresh.ts"
Cohesion: 0.67
Nodes (3): PageRefreshTarget, refetchTarget(), usePageRefresh()

### Community 71 - "jspdf"
Cohesion: 0.67
Nodes (3): jspdf, jspdf, buildPdf()

## Knowledge Gaps
- **378 isolated node(s):** `name`, `version`, `description`, `main`, `bin` (+373 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **51 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `index.tsx`, `constants.ts`, `app`, `ReportsPage.tsx`, `plugins`, `AppLayout.tsx`, `ErrorBoundary.tsx`, `CustomersPage.tsx`, `NotificationsPage.tsx`, `ProductCatalog.tsx`, `SalesHistory.tsx`, `CustomerLocationFields.tsx`, `DashboardPage.tsx`, `InventoryPage.tsx`, `InvoicesPage.tsx`, `SettingsPage.tsx`, `usePageRefresh.ts`, `main.tsx`, `PermissionGate.tsx`, `StatCard.tsx`, `POSPage.tsx`, `useAuth.ts`, `ProtectedRoute.tsx`?**
  _High betweenness centrality (0.214) - this node is a cross-community bridge._
- **Why does `app` connect `app` to `src/index.ts`, `usePageRefresh.ts`, `DashboardPage.tsx`?**
  _High betweenness centrality (0.200) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`, `framer-motion`, `@hookform/resolvers`, `jspdf-autotable`, `jspdf`, `react-hook-form`, `socket.io-client`, `@tanstack/react-query`, `zod`, `zustand`, `axios`, `antd`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _378 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Inventory` be split into smaller, more focused modules?**
  _Cohesion score 0.05835010060362173 - nodes in this community are weakly interconnected._
- **Should `dashboardRoutes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05520614954577219 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._