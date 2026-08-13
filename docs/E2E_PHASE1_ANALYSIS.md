# SmartProfit E2E Testing - Phase 1 Analysis

**Date**: August 12, 2026  
**Tested Application**: SmartProfit POS (http://localhost:5173)  
**Test Environment**: Supabase  
**Tested User**: Johan Kattheryne (katteryneramos@gmail.com)  
**Test Business**: TIDE BY PACIFICA  

---

## Executive Summary

SmartProfit is a comprehensive POS and operational management system for restaurants/cafes. Phase 1 focuses on 11 core user flows related to daily operations: authentication, cash management, sales processing, and table service.

### Key Findings
- **Application Architecture**: React-based SPA with Supabase backend
- **Main Modules**: Salon (Tables), Punto de Venta (POS), Insumos (Inventory), Caja (Cash), Finanzas (Finance)
- **Critical Flow**: Login → Business Selection → Cash Opening → Sales → Payment → Cash Closing
- **Current Status**: Business has products configured, but cash drawer requires opening before sales

---

## 1. CRITICAL FLOWS IDENTIFIED

### 1.1 Authentication & Business Selection
**User Story**: As a user, I need to securely access my business account and select the active business.

**Flow**:
```
1. User navigates to http://localhost:5173
2. Presents login form (email + password)
3. User enters credentials
4. System validates and creates session
5. Loads business context (TIDE BY PACIFICA)
6. Displays user name in header (Johan Kattheryne)
7. Shows sync status indicator
8. Presents selected business module (default: Salon)
```

**Selectors**:
- Email input: `input[placeholder="admin@negocio.com"]`
- Password input: `input[placeholder="Ingresa tu contrasena"]`
- Login button: `button:has-text('Entrar al sistema')`
- Business name header: `heading:has-text('TIDE BY PACIFICA')` or parent paragraph
- Sync indicator: Contains text "Sincronizacion activa"

**Data Attributes Recommended**:
```html
<input data-testid="login-email" placeholder="admin@negocio.com">
<input data-testid="login-password" type="password" placeholder="Ingresa tu contrasena">
<button data-testid="login-submit">Entrar al sistema</button>
<div data-testid="business-name">TIDE BY PACIFICA</div>
<div data-testid="sync-status">Sincronizacion activa</div>
<div data-testid="current-user">Johan Kattheryne</div>
```

**Test Credentials**:
```
Email: katteryneramos@gmail.com
Password: tidebypacifica
```

**Potential Risks**:
- Rate limiting on signup attempts (observed: 429 error after multiple attempts)
- No visual feedback during login process
- Error messages may not be visible if login fails
- Session timeout not clearly indicated

---

### 1.2 Opening Cash Drawer (Caja)
**User Story**: As a cashier, I need to open the cash drawer at the start of the day to track sales and payments.

**Flow**:
```
1. Navigate to Caja module (http://localhost:5173/caja)
2. System shows status: "Caja cerrada" (Cash drawer closed)
3. Displays current cashier: Johan Kattheryne
4. Shows "Abrir caja" button
5. Click "Abrir caja"
6. [OBSERVATION: Button appears non-responsive - likely requires payment method setup first]
7. Should display cash opening dialog/form
8. User enters initial cash amount (base)
9. System confirms opening and updates status to "Caja abierta"
```

**Current Page State** (as observed):
- URL: `http://localhost:5173/caja`
- Status Badge: "Caja cerrada"
- Cashier Display: "Cajero: Johan Kattheryne"
- Initial Amount: "Base: $ 0"
- Available Actions: "Registrar egreso" (Register Expense), "Abrir caja" (Open Drawer)

**Dashboard Metrics**:
- Ventas del turno (Sales): $0
- Efectivo esperado (Expected Cash): $0
- Pagos digitales (Digital Payments): $0
- Pendiente por cobrar (Pending): $0

**Payment Methods Summary**:
- Efectivo: $674,500
- Nequi: $268,000
- Daviplata: $77,500

**Selectors**:
```
Caja module button: button:has-text('Caja')
Open cash button: button:has-text('Abrir caja')
Cash status: text "Caja cerrada" or "Caja abierta"
Cashier name: strong containing cashier name
Payment methods section: contains "Metodos de pago"
```

**Data Attributes Recommended**:
```html
<button data-testid="cash-open-button">Abrir caja</button>
<button data-testid="expense-register-button">Registrar egreso</button>
<div data-testid="cash-status">Caja cerrada</div>
<div data-testid="cashier-name">Johan Kattheryne</div>
<div data-testid="cash-base-amount">0</div>
<div data-testid="expected-cash">0</div>
<div data-testid="payment-method-cash">674500</div>
<div data-testid="payment-method-nequi">268000</div>
<div data-testid="payment-method-daviplata">77500</div>
```

**Tabs Available**:
- "Caja actual" (Current Cash)
- "Movimientos" (Movements)
- "Cierre de caja" (Cash Closing)

**Potential Risks** ⚠️:
- Button may require payment method configuration before becoming active
- No error message displayed when button is clicked but doesn't respond
- Opening flow might be blocked by missing prerequisites (payment methods, initial setup)
- UI freeze when attempting to click non-responsive button

---

### 1.3 Creating a POS Sale
**User Story**: As a server/cashier, I need to quickly create a sales order, add items, and process payment.

**Flow**:
```
1. Navigate to Punto de venta (POS) module (http://localhost:5173/pos)
2. System displays "Modo venta rapida activo" (Fast sale mode)
3. Shows product catalog organized by category:
   - Almuerzos (Lunches)
   - Especiales (Specials)
   - Bebidas calientes (Hot drinks)
   - Postres (Desserts)
   - Dulces del pacifico
   - Desayunos (Breakfast)
   - Pasabocas (Appetizers)
   - Sandwich
   - Bebidas ancestrales
4. Click "SELECCIONAR MESA" button to choose:
   - "Venta Rapida / Para llevar" (Quick sale/Takeout) [TESTED]
   - Or select specific table from Salon
5. Click product to add to cart:
   - "Almuerzo base" ($13.500) [TESTED - SUCCESS]
   - Automatically added to cart
   - Cart updates: "Ver carrito: 1 · $ 13.500"
6. Optionally modify quantity with +/- buttons
7. Add notes for kitchen: "Notas para cocina o barra..."
8. Review checkout panel with payment options
9. Select payment method (default: Efectivo/Cash)
10. Click "Cobrar ahora" to process payment
```

**Current Cart State** (after adding Almuerzo base):
```
Items: 1
Total: $13.500
Item: Almuerzo base x1 @ $13.500
Notes field: Available for kitchen instructions
```

**Checkout Interface**:
```
Estado operativo: Modo caja rapida
Venta actual:
  - Items: 1
  - Tickets: 0
  - Cliente: Ocasional

Pago:
  - Total a cobrar: $13.500
  - Valor final cobrado: $13.500
  - Pago recibido: $13.500
  - Cambio: $0

Metodo actual: Efectivo
Quick amount buttons: $14.000, $15.000, $20.000, $50.000
```

**Available Payment Methods**:
- Efectivo (Cash) ✓ Tested
- Tarjeta debito (Debit Card)
- Tarjeta credito (Credit Card)
- Transferencia (Bank Transfer)
- Nequi
- Daviplata
- QR

**Selectors**:
```
POS module: button:has-text('Punto de venta')
Sale mode section: contains "SELECCIONAR MESA"
Cart button: button:has-text('Ver carrito')
Cart display: shows "X · $ AMOUNT"
Product category buttons: button:has-text('Almuerzos'), 'Especiales', etc.
Product item buttons: contain product name + price (e.g., "Almuerzo base...$ 13.500")
Cart item: displays "Almuerzo base $ 13.500 x 1"
Remove item button: button:has-text('Quitar')
Quantity controls: button:has-text('-'), button:has-text('+')
Notes input: textbox with placeholder "Notas para cocina o barra..."
Payment methods: buttons for "Efectivo", "Tarjeta debito", etc.
Charge button: button:has-text('Cobrar ahora')
Cancel button: button:has-text('Cancelar orden')
```

**Data Attributes Recommended**:
```html
<div data-testid="pos-module">
  <div data-testid="sale-mode">Modo venta rapida activo</div>
  <button data-testid="select-sale-type">SELECCIONAR MESA</button>
  <button data-testid="select-quick-sale">Venta Rapida / Para llevar</button>
  <button data-testid="cart-button">Ver carrito</button>
  <span data-testid="cart-count">1</span>
  <span data-testid="cart-total">13500</span>
  
  <!-- Product List -->
  <div data-testid="product-categories">
    <button data-testid="category-almuerzos">Almuerzos</button>
    <button data-testid="category-especiales">Especiales</button>
  </div>
  
  <div data-testid="products-grid">
    <button data-testid="product-almuerzo-base">
      <span data-testid="product-name">Almuerzo base</span>
      <span data-testid="product-price">13500</span>
    </button>
  </div>
  
  <!-- Cart Item -->
  <article data-testid="cart-item-0">
    <h3 data-testid="item-name">Almuerzo base</h3>
    <span data-testid="item-price">13500</span>
    <span data-testid="item-quantity">1</span>
    <button data-testid="item-remove">Quitar</button>
    <button data-testid="quantity-decrease">-</button>
    <input data-testid="quantity-input" value="1">
    <button data-testid="quantity-increase">+</button>
    <textarea data-testid="item-notes" placeholder="Notas para cocina o barra..."></textarea>
  </article>
  
  <!-- Checkout Section -->
  <section data-testid="checkout-panel">
    <div data-testid="total-amount">13500</div>
    <div data-testid="payment-methods">
      <button data-testid="payment-method-cash">Efectivo</button>
      <button data-testid="payment-method-debit">Tarjeta debito</button>
      <button data-testid="payment-method-credit">Tarjeta credito</button>
      <button data-testid="payment-method-transfer">Transferencia</button>
      <button data-testid="payment-method-nequi">Nequi</button>
      <button data-testid="payment-method-daviplata">Daviplata</button>
      <button data-testid="payment-method-qr">QR</button>
    </div>
    <button data-testid="charge-now-button">Cobrar ahora</button>
    <button data-testid="cancel-order-button">Cancelar orden</button>
  </section>
</div>
```

**Potential Risks** ⚠️:
- Stock shows 0 for all products (might block sales or show warning)
- "Cobrar ahora" button appears to require cash drawer to be open first
- No inventory validation message visible
- Product adding works but payment flow interrupted (requires open cash)
- No confirmation dialog before charging
- No receipt generation observed (yet)

**Prerequisites for Success**:
- Cash drawer must be open (Caja abierta)
- Payment methods must be configured
- Business must have completed initial setup

---

### 1.4 Charging a Sale (Payment Processing)
**User Story**: As a cashier, I need to collect payment for the sale with flexibility on payment method and change calculation.

**Interface Elements**:
```
Centro de cobro:
  - Total a cobrar: $13.500
  - Metodo actual: Efectivo
  - Listo para cobrar en efectivo
  - El pago recibido cubre el total y el cambio ya esta calculado

Detalles de pago:
  - Total real de productos: $13.500
  - Total a cobrar: $13.500
  - Valor final cobrado: [editable spinbox] 13500
  - Pago recibido del cliente: [editable spinbox] 13500
  - Quick amount buttons: "Exacto", "$14.000", "$15.000", "$20.000", "$50.000"
  
Resultado:
  - Cambio: $0
  - Falta por recibir: $0

Ajustes:
  - Sin ajuste: $0 (0.0%)
```

**Payment Method Options**:
- Efectivo (Cash)
- Tarjeta debito (Debit Card)
- Tarjeta credito (Credit Card)
- Transferencia (Transfer)
- Nequi
- Daviplata
- QR

**Buttons**:
- "Venta inmediata" (Immediate Sale) - [DISABLED] - Requires cash to be open
- "Cobrar ahora" (Charge Now) - [ENABLED] - Click to process
- "Cancelar orden" (Cancel Order) - [DISABLED]

**Potential Risks** ⚠️:
- "Cobrar ahora" button appears non-functional (likely blocked by unopened cash drawer)
- No transaction confirmation dialog
- Change calculation might not handle edge cases
- Multiple payment methods support but only Cash tested
- No receipt/invoice generation visible

---

### 1.5 Opening a Table (Salon Module)
**User Story**: As a server, I need to open a table to seat customers and start taking their order.

**Available Tables** (as observed):
1. Barra (Bar) - Capacity: 2
2. Panca - Capacity: 4
3. Mesa de madera (Wooden Table) - Capacity: 3
4. Mesa blanca (White Table) - Capacity: 3
5. Mesa larga (Long Table) - Capacity: 2
6. Mesa rosada terraza (Pink Table Terrace) - Capacity: 1

**Table State Indicators**:
- Status: "Libre" (Free/Available)
- Capacity: Number of people
- Items: Count of ordered items (0)
- Time: Duration since opened ("-" for new)
- Total: Amount to charge

**Flow**:
```
1. Navigate to Salon module
2. View table map with zones (e.g., "Salón principal")
3. Click "Abrir [TableName]" button
4. [Dialog/Form should appear for table setup]
5. Select number of customers
6. Confirm opening
7. Table transitions to "En atencion" (In Service) status
8. System opens order taking interface for that table
9. Add items from same product catalog as POS
10. Track order status
```

**Selectors** (as observed):
```
Salon module: button:has-text('Salon')
Table map: div containing table articles
Table card: article containing table name and status
Open table button: button:has-text('Abrir') within table card
Table name: heading with table name (e.g., "Barra", "Panca")
Table capacity: paragraph containing number + "personas"
Table items: paragraph containing item count
Table time: paragraph containing time or "-"
Table total: paragraph containing "$" amount
Zone filter: buttons for "Todas", "Salón principal"
Create table button: button:has-text('Crear mesa')
```

**Data Attributes Recommended**:
```html
<div data-testid="salon-module">
  <div data-testid="table-map">
    <article data-testid="table-barra">
      <button data-testid="open-table-barra">Abrir Barra</button>
      <h4 data-testid="table-name">Barra</h4>
      <div data-testid="table-zone">Salón principal</div>
      <span data-testid="table-status">Libre</span>
      <span data-testid="table-capacity">2</span>
      <span data-testid="table-items">0</span>
      <span data-testid="table-time">-</span>
      <span data-testid="table-total">0</span>
    </article>
  </div>
  <button data-testid="create-table-button">Crear mesa</button>
</div>
```

**Potential Risks** ⚠️:
- No observed interaction with table opening in this session
- May require cash drawer to be open
- No visible feedback on table status changes
- Maximum tables and capacity limits unknown
- Table state transitions not verified

---

### 1.6 Closing Cash Drawer
**User Story**: As a cashier, I need to close the cash drawer at end of shift, verify cash count, and reconcile with system totals.

**Expected Flow**:
```
1. Navigate to Caja module
2. Click on "Cierre de caja" tab
3. System shows:
   - Expected cash (from transactions)
   - Actual cash counted
   - Difference
   - All transactions breakdown
4. User enters actual cash amount
5. System calculates variance
6. User confirms closing
7. Cash drawer closes and generates report
```

**Tabs in Caja Module**:
- "Caja actual" (Current Cash)
- "Movimientos" (Movements) - Transaction history
- "Cierre de caja" (Cash Closing) - Reconciliation

**Not yet explored** - Will show comprehensive reconciliation interface

**Potential Risks** ⚠️:
- No test data available to verify closing flow
- Variance handling not observed
- Multi-method reconciliation logic unknown
- Report generation not verified

---

## 2. RECOMMENDED PLAYWRIGHT TEST SELECTORS & DATA-TESTID

### Setup for All Tests
```typescript
const BASE_URL = 'http://localhost:5173';
const VALID_EMAIL = 'katteryneramos@gmail.com';
const VALID_PASSWORD = 'tidebypacifica';
const BUSINESS_NAME = 'TIDE BY PACIFICA';

// Common selectors
const SELECTORS = {
  // Authentication
  loginEmail: 'input[placeholder="admin@negocio.com"]',
  loginPassword: 'input[placeholder="Ingresa tu contrasena"]',
  loginButton: 'button:has-text("Entrar al sistema")',
  
  // Navigation
  moduleSalon: 'button:has-text("Salon")',
  modulePOS: 'button:has-text("Punto de venta")',
  moduleCaja: 'button:has-text("Caja")',
  moduleInventory: 'button:has-text("Insumos y costos")',
  moduleFinances: 'button:has-text("Finanzas")',
  
  // Header
  businessName: 'paragraph:has-text("TIDE BY PACIFICA")',
  currentUser: 'text=Johan Kattheryne',
  syncStatus: 'text=Sincronizacion activa',
  
  // Cash Module
  cashStatus: 'text=Caja cerrada',
  openCashButton: 'button:has-text("Abrir caja")',
  registerExpenseButton: 'button:has-text("Registrar egreso")',
  
  // POS Module
  cartButton: 'button:has-text("Ver carrito")',
  selectSaleType: 'button:has-text("SELECCIONAR MESA")',
  quickSaleOption: 'text=Venta Rapida / Para llevar',
  
  // Products
  categoryAlmuerzos: 'button:has-text("Almuerzos")',
  categoryEspeciales: 'button:has-text("Especiales")',
  productAlmuerzoBase: 'button:has-text("Almuerzo base")',
  
  // Checkout
  chargeButton: 'button:has-text("Cobrar ahora")',
  cancelButton: 'button:has-text("Cancelar orden")',
  paymentCash: 'button:has-text("Efectivo")',
  
  // Salon
  openTableBarra: 'button:has-text("Abrir Barra")',
  tableStatusIndicator: 'text=Libre',
};
```

### Recommended Data-Testid Attributes
```typescript
const DATA_TESTIDS = {
  // Auth
  'login-email': 'input',
  'login-password': 'input',
  'login-submit': 'button',
  'login-error': 'div', // Error message container
  
  // Business Context
  'business-name': 'div',
  'business-logo': 'img',
  'current-user': 'div',
  'sync-status': 'div',
  
  // Cash Module
  'cash-status': 'div',
  'cash-status-badge': 'div', // "Caja cerrada" / "Caja abierta"
  'cashier-name': 'strong',
  'cash-base-amount': 'strong',
  'open-cash-button': 'button',
  'expected-cash': 'paragraph',
  'digital-payments': 'paragraph',
  'payment-methods-summary': 'div',
  
  // POS Module
  'pos-container': 'div',
  'sale-mode': 'div',
  'cart-counter': 'span',
  'cart-total': 'span',
  'product-grid': 'div',
  'product-card': 'article', // Repeating for each product
  'product-name': 'h3', // Within product-card
  'product-price': 'span', // Within product-card
  'add-to-cart-button': 'button', // Within product-card
  
  // Checkout
  'checkout-panel': 'section',
  'total-amount': 'span',
  'payment-method-selector': 'div',
  'charge-now-button': 'button',
  'cancel-order-button': 'button',
  'change-amount': 'span',
  
  // Salon/Tables
  'table-map': 'div',
  'table-card': 'article', // Per table
  'table-name': 'h4',
  'table-status': 'span',
  'table-capacity': 'span',
  'table-items-count': 'span',
  'open-table-button': 'button',
  
  // Modals/Dialogs
  'confirm-dialog': 'div[role="dialog"]',
  'success-message': 'div[role="alert"]',
  'error-message': 'div[role="alert"]',
};
```

---

## 3. UI/UX RISKS IDENTIFIED

### High Priority 🔴

1. **Non-responsive "Abrir caja" Button**
   - Issue: Button appears clickable but doesn't respond
   - Impact: Users cannot proceed with opening cash drawer
   - Likely Cause: Prerequisite not met (payment methods, initial setup)
   - Mitigation: Add loading state, error message, or disable with tooltip
   - Test: Verify error message or proper disabled state

2. **Missing Error Messages**
   - Issue: When buttons don't respond, no feedback to user
   - Impact: User confusion, may try clicking repeatedly
   - Mitigation: Add toast notifications or inline error messages
   - Test: Assert error messages appear for blocking conditions

3. **No Payment Confirmation**
   - Issue: "Cobrar ahora" button may process without confirmation
   - Impact: Accidental transactions, no receipt verification
   - Mitigation: Add confirmation dialog with amount and method
   - Test: Verify confirmation dialog appears before charge

4. **Cash Drawer Block Unknown**
   - Issue: Payment flow blocked but reason unclear
   - Impact: Users cannot complete sales
   - Mitigation: Clear messaging about prerequisites
   - Test: Verify can complete full flow after proper setup

### Medium Priority 🟡

5. **Stock Display at Zero**
   - Issue: All products show "Stock 0"
   - Impact: May confuse users or prevent sales
   - Question: Are sales allowed with zero stock?
   - Test: Verify sales work despite zero stock or handle appropriately

6. **No Inventory Warnings**
   - Issue: Products show zero stock but no warning
   - Impact: User may assume product unavailable
   - Mitigation: Add "Warning: Low Stock" or "Demo Product"
   - Test: Verify warning displays for low/zero stock

7. **Complex Payment Amount Calculation**
   - Issue: Multiple input fields for payment amount
   - Impact: User may enter wrong amount or be confused
   - Mitigation: Simplify to single field, auto-calculate change
   - Test: Verify change calculation for various amounts

8. **Navigation Sidebar Interference**
   - Issue: Fixed sidebar (z-40) blocks clicks on main content
   - Impact: May prevent interaction with product cards
   - Mitigation: Ensure sidebar closes when clicking main area
   - Test: Verify sidebar closes and products clickable

### Low Priority 🟢

9. **Sync Status Indicator**
   - Issue: "Sincronizacion activa" shows but no loading state
   - Impact: User doesn't know if data is being synced
   - Mitigation: Add real-time sync feedback
   - Test: Verify sync status updates

10. **Decision Center Counter**
    - Issue: Counter shows "0" but purpose unclear
    - Impact: User confusion about what it tracks
    - Mitigation: Add tooltip explaining counter
    - Test: Verify counter updates with relevant actions

---

## 4. PHASE 1 E2E TEST PLAN

### Test Suite Structure
```
e2e/
├── auth.spec.ts              # Tests 1-2
├── cash.spec.ts              # Tests 3-6
├── pos.spec.ts               # Tests 7-9
├── salon.spec.ts             # Tests 10-11
└── fixtures/
    └── test-data.ts          # Shared test data & utilities
```

### Test Cases by Flow

#### Test 1: Login - Happy Path ✓
- **Precondition**: User at login screen
- **Steps**: Enter valid credentials, click login
- **Expected**: Logged in, session created, business context loaded
- **Assertions**:
  - URL changes to dashboard (contains "salon" or "pos")
  - Business name visible in header
  - User name displayed
  - Sync status shows

#### Test 2: Login - Invalid Credentials ✓
- **Steps**: Enter wrong password, click login
- **Expected**: Error message displayed, user stays on login
- **Assertions**:
  - Error message visible
  - URL remains at /
  - No session created

#### Test 3: Cash Opening - Happy Path (Requires Investigation)
- **Precondition**: Logged in, cash drawer closed
- **Steps**: Navigate to Caja, click "Abrir caja"
- **Expected**: Cash opening dialog appears
- **Assertions**:
  - Dialog with cash input form appears
  - Dialog title is "Abrir caja"
  - Base amount field visible and editable
  - Confirm button present

#### Test 4: Cash Opening - Validation (Requires Investigation)
- **Steps**: Try to open without entering base amount
- **Expected**: Validation error
- **Assertions**:
  - Error message for missing amount
  - Confirm button disabled

#### Test 5: Cash Opening - Confirmation (Requires Investigation)
- **Precondition**: Cash opening dialog open
- **Steps**: Enter amount, click confirm
- **Expected**: Cash drawer opens, status updates
- **Assertions**:
  - Status changes to "Caja abierta"
  - Base amount displayed matches entered value
  - Initial time recorded

#### Test 6: Cash Opening - Side Effects (Requires Investigation)
- **Precondition**: Cash is open
- **Expected**: Payment flow now works
- **Steps**: Navigate to POS and attempt sale/payment
- **Assertions**:
  - "Cobrar ahora" button is now functional

#### Test 7: Create POS Sale - Happy Path ✓
- **Precondition**: Logged in, on POS module
- **Steps**: Click product, add to cart
- **Expected**: Item appears in cart with price
- **Assertions**:
  - Cart counter incremented (1)
  - Cart total updated ($ 13.500)
  - Item appears in checkout panel
  - Remove button available

#### Test 8: Modify Cart ✓
- **Precondition**: Item in cart
- **Steps**: Click quantity +/-, modify notes
- **Expected**: Quantity and notes update, total recalculates
- **Assertions**:
  - Quantity button changes count
  - Total updates accordingly
  - Notes saved in item

#### Test 9: Process Payment (Partial - Blocked)
- **Precondition**: Sale ready to charge, cash open
- **Steps**: Select payment method, enter amount, click "Cobrar ahora"
- **Expected**: Payment processed, receipt generated
- **Assertions**:
  - Success message appears
  - Cart clears
  - Cash drawer updated with sale amount

#### Test 10: Open Table - Happy Path (Not Fully Tested)
- **Precondition**: On Salon module, table available
- **Steps**: Click "Abrir [Table]"
- **Expected**: Table dialog opens, can set customer count
- **Assertions**:
  - Dialog appears with table details
  - Customer count input available
  - Confirm button present

#### Test 11: Table Lifecycle (Not Fully Tested)
- **Precondition**: Table open with order
- **Steps**: Order items, view table status, close table
- **Expected**: Table transitions through states, reconciles
- **Assertions**:
  - Table status changes to "En atencion"
  - Items trackable per table
  - Can close table and settle payment

---

## 5. PROPOSED E2E TEST FILE (TypeScript)

See accompanying file: `smartprofit.e2e.spec.ts`

### Key Test Utilities
```typescript
// Wait for business context to load
async function waitForBusinessContext(page: Page) {
  await page.waitForSelector('text=TIDE BY PACIFICA');
  await page.waitForSelector('text=Sincronizacion activa');
}

// Navigate to module
async function navigateToModule(page: Page, moduleName: string) {
  // May need to click "Ver todos los modulos" first
  const button = page.locator(`button:has-text("${moduleName}")`);
  await button.click();
  await page.waitForLoadState('networkidle');
}

// Add product to cart
async function addProductToCart(page: Page, productName: string) {
  const productButton = page.locator(
    `button:has-text("${productName}"):has-text("$")`
  );
  await productButton.click();
}

// Get cart state
async function getCartState(page: Page) {
  const cartButton = page.locator('button:has-text("Ver carrito")');
  const cartText = await cartButton.innerText();
  // Parse "X · $ AMOUNT" format
  const match = cartText.match(/(\d+) · \$ ([\d,\.]+)/);
  return {
    itemCount: parseInt(match?.[1] || '0'),
    total: parseFloat((match?.[2] || '0').replace('.', '').replace(',', '.')),
  };
}
```

---

## 6. NEXT STEPS & RECOMMENDATIONS

### For Test Development
1. ✅ Set up Playwright test project
2. ✅ Create base test fixtures (login, navigation)
3. ✅ Implement Tests 1-2 (Authentication)
4. ⚠️ Investigate Tests 3-6 (Cash opening - currently blocked)
5. ✅ Implement Tests 7-8 (POS sales)
6. ⚠️ Implement Test 9 (Payment - blocked by cash drawer)
7. ⏳ Implement Tests 10-11 (Salon - needs investigation)

### For Application
1. **Urgent**: Fix "Abrir caja" button responsiveness
2. **Urgent**: Add error messages for blocked actions
3. **High**: Add payment confirmation dialog
4. **High**: Add data-testid attributes to UI elements
5. **Medium**: Add inventory warnings for zero stock
6. **Medium**: Simplify payment amount input
7. **Medium**: Add loading states for async operations
8. **Low**: Add sync feedback indicators

### For Testing Environment
1. ✅ Test credentials verified: katteryneramos@gmail.com / tidebypacifica
2. ⚠️ Rate limiting on signup (consider pre-created accounts for testing)
3. ✅ Test business configured with:
   - Business: TIDE BY PACIFICA
   - Products: Available (Stock 0)
   - Tables: 6 tables configured
   - Payment methods: Cash, Nequi, Daviplata
4. ⏳ Verify test data persistence between test runs

---

## 7. APPENDIX: OBSERVED DATA

### Test Environment Details
- **Base URL**: http://localhost:5173
- **Framework**: React (SPA)
- **Backend**: Supabase
- **Test Date**: August 12, 2026

### Business Configuration
- **Name**: TIDE BY PACIFICA
- **Modules Active**: Salon, POS, Inventory, Cash, Finance
- **Tables Configured**:
  - Barra (2 seats)
  - Panca (4 seats)
  - Mesa de madera (3 seats)
  - Mesa blanca (3 seats)
  - Mesa larga (2 seats)
  - Mesa rosada terraza (1 seat)

- **Products Available**: 20+ items including:
  - Almuerzo base: $13.500
  - Almuerzo brunch: $22.000
  - Almuerzo medium: $16.000
  - Coffee: $7.000
  - Various special items

- **Payment Methods Configured**:
  - Efectivo: $674,500
  - Nequi: $268,000
  - Daviplata: $77,500

### Known Issues
- ❌ "Abrir caja" button non-responsive
- ❌ "Cobrar ahora" payment flow blocked
- ⚠️ All products show Stock: 0
- ⚠️ No error messages for blocked actions

---

**Document End**
