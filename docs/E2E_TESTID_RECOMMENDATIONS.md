# SmartProfit E2E Testing - Recommended Data Attributes & Selectors

This document contains recommended `data-testid` attributes, CSS selectors, and structural improvements for better E2E test coverage and maintainability.

## 1. PRIORITY: Critical for Phase 1 Testing

### 1.1 Authentication Form

**Current Selectors** (Working):
```typescript
const emailInput = 'input[placeholder="admin@negocio.com"]';
const passwordInput = 'input[placeholder="Ingresa tu contrasena"]';
const loginButton = 'button:has-text("Entrar al sistema")';
```

**Recommended Data Attributes to Add**:
```html
<!-- Login Form Container -->
<section data-testid="login-form">
  
  <!-- Email Field -->
  <div data-testid="login-email-field">
    <label data-testid="login-email-label" htmlFor="email">Correo</label>
    <input 
      data-testid="login-email-input"
      id="email"
      type="email"
      placeholder="admin@negocio.com"
      aria-label="Email"
      required
    />
    <span data-testid="login-email-error" role="alert"></span>
  </div>
  
  <!-- Password Field -->
  <div data-testid="login-password-field">
    <label data-testid="login-password-label" htmlFor="password">Contraseña</label>
    <input 
      data-testid="login-password-input"
      id="password"
      type="password"
      placeholder="Ingresa tu contrasena"
      aria-label="Password"
      required
    />
    <span data-testid="login-password-error" role="alert"></span>
  </div>
  
  <!-- Error Container -->
  <div data-testid="login-error-container" role="alert">
    <span data-testid="login-error-message"></span>
  </div>
  
  <!-- Submit Button -->
  <button 
    data-testid="login-submit-button"
    type="submit"
    disabled={isLoading}
    aria-busy={isLoading}
  >
    {isLoading ? 'Cargando...' : 'Entrar al sistema'}
  </button>
  
  <!-- Register Link -->
  <div data-testid="login-register-section">
    Si aun no tienes una cuenta,
    <button data-testid="login-register-link">registra tu negocio</button>.
  </div>
</section>
```

**Why These Changes**:
- Separates error messages for specific fields
- Adds aria-busy for async operations
- Provides specific testids for each element
- Allows testing of error states per field
- Enables accessibility testing

---

### 1.2 Business Context Header

**Current State**:
```typescript
const businessNameHeading = 'heading:has-text("TIDE BY PACIFICA")';
const currentUserButton = 'button:has-text("Johan Kattheryne")';
const syncStatus = 'text=Sincronizacion activa';
```

**Recommended Structure**:
```html
<header data-testid="app-header">
  
  <!-- Business Logo & Menu -->
  <button data-testid="menu-toggle">
    <img data-testid="business-logo" src="..." alt="SmartProfit" />
  </button>
  
  <!-- Business Info -->
  <div data-testid="business-context">
    <h1 data-testid="business-name">TIDE BY PACIFICA</h1>
    <p data-testid="module-name">Salon</p>
    <p data-testid="module-description">Mesas, ocupacion y flujo del salon.</p>
  </div>
  
  <!-- Decision Center -->
  <div data-testid="decision-center">
    <button data-testid="decision-center-button" aria-label="Open decision center">
      <span data-testid="decision-center-icon">📊</span>
      <span data-testid="decision-center-count">0</span>
    </button>
  </div>
  
  <!-- Date & Time -->
  <time data-testid="current-date">miércoles, 12 de agosto de 2026</time>
  
  <!-- User Menu -->
  <button data-testid="user-menu-button">
    <img data-testid="user-avatar" src="..." alt="User" />
    <span data-testid="user-name">Johan Kattheryne</span>
  </button>
  
  <!-- Sync Status -->
  <div data-testid="sync-status" aria-label="Sync status">
    <span data-testid="sync-status-icon">🔄</span>
    <span data-testid="sync-status-text">Sincronizacion activa</span>
  </div>
  
</header>
```

**Testing Benefits**:
- Can test each header component independently
- Can verify business context switches correctly
- Can test decision center counter updates
- Can test user menu functionality

---

### 1.3 Cash Drawer Module (Critical)

**Issue**: "Abrir caja" button is unresponsive - NEEDS TESTID ATTRIBUTES

**Recommended Structure**:
```html
<section data-testid="cash-module">
  
  <!-- Status Card -->
  <article data-testid="cash-status-card">
    <div data-testid="cash-status-badge" className="status-badge">
      <span data-testid="cash-status-label">Caja cerrada</span>
      <span data-testid="cash-status-icon">🔐</span>
    </div>
    
    <h3 data-testid="cash-reconciliation-title">Cuadre del turno</h3>
    
    <!-- Cashier Info -->
    <div data-testid="cashier-info">
      <label data-testid="cashier-label">Cajero:</label>
      <strong data-testid="cashier-name">Johan Kattheryne</strong>
    </div>
    
    <!-- Start Time -->
    <div data-testid="start-time-info">
      <label data-testid="start-time-label">Inicio:</label>
      <strong data-testid="start-time-value">-</strong>
    </div>
    
    <!-- Base Amount -->
    <div data-testid="base-amount-info">
      <label data-testid="base-amount-label">Base:</label>
      <strong data-testid="base-amount-value">$ 0</strong>
    </div>
  </article>
  
  <!-- Action Buttons -->
  <div data-testid="cash-actions">
    
    <!-- Register Expense Button -->
    <button 
      data-testid="register-expense-button"
      aria-label="Register expense"
      className="btn-secondary"
    >
      <span data-testid="expense-icon">💰</span>
      <span>Registrar egreso</span>
    </button>
    
    <!-- CRITICAL: Open Cash Button -->
    <button 
      data-testid="open-cash-button"
      aria-label="Open cash drawer"
      aria-busy={isLoading}
      disabled={!canOpenCash}
      title={!canOpenCash ? "Complete initial setup to open cash" : ""}
      className="btn-primary"
    >
      {isLoading ? (
        <>
          <span data-testid="loading-spinner">⏳</span>
          <span>Abriendo caja...</span>
        </>
      ) : (
        <>
          <span data-testid="cash-open-icon">🔓</span>
          <span>Abrir caja</span>
        </>
      )}
    </button>
    
    <!-- Error Message (if button disabled) -->
    {!canOpenCash && (
      <p data-testid="cash-open-error" role="alert" className="error-message">
        {errorReason || 'Complete business setup to open cash drawer'}
      </p>
    )}
  </div>
  
  <!-- Metrics Grid -->
  <section data-testid="cash-metrics">
    
    <!-- Sales Today -->
    <article data-testid="sales-metric">
      <p data-testid="sales-label">Ventas del turno</p>
      <p data-testid="sales-amount">$ 0</p>
      <p data-testid="sales-description">Recaudo asociado a la caja abierta.</p>
    </article>
    
    <!-- Expected Cash -->
    <article data-testid="expected-cash-metric">
      <p data-testid="expected-cash-label">Efectivo esperado</p>
      <p data-testid="expected-cash-amount">$ 0</p>
      <p data-testid="expected-cash-description">Base inicial mas efectivo real, menos egresos.</p>
    </article>
    
    <!-- Digital Payments -->
    <article data-testid="digital-payments-metric">
      <p data-testid="digital-payments-label">Pagos digitales</p>
      <p data-testid="digital-payments-amount">$ 0</p>
      <p data-testid="digital-payments-description">No mezclado con efectivo fisico.</p>
    </article>
    
    <!-- Pending -->
    <article data-testid="pending-metric">
      <p data-testid="pending-label">Pendiente por cobrar</p>
      <p data-testid="pending-amount">$ 0</p>
      <p data-testid="pending-description">No cuenta como dinero recibido.</p>
    </article>
  </section>
  
  <!-- Payment Methods Summary -->
  <section data-testid="payment-methods-section">
    <h3 data-testid="payment-methods-title">Metodos de pago</h3>
    <p data-testid="payment-methods-subtitle">Lectura rapida del recaudo por canal.</p>
    
    <div data-testid="payment-methods-grid">
      
      <!-- Cash -->
      <div data-testid="payment-method-cash">
        <span data-testid="payment-method-cash-label">Efectivo</span>
        <span data-testid="payment-method-cash-amount">$ 674.500</span>
      </div>
      
      <!-- Nequi -->
      <div data-testid="payment-method-nequi">
        <span data-testid="payment-method-nequi-label">Nequi</span>
        <span data-testid="payment-method-nequi-amount">$ 268.000</span>
      </div>
      
      <!-- Daviplata -->
      <div data-testid="payment-method-daviplata">
        <span data-testid="payment-method-daviplata-label">Daviplata</span>
        <span data-testid="payment-method-daviplata-amount">$ 77.500</span>
      </div>
      
    </div>
  </section>
  
  <!-- Tabs -->
  <nav data-testid="cash-tabs">
    <button data-testid="cash-tab-current" aria-selected="true">Caja actual</button>
    <button data-testid="cash-tab-movements">Movimientos</button>
    <button data-testid="cash-tab-closing">Cierre de caja</button>
  </nav>
  
</section>
```

**Why This is Critical**:
- Separates error state for "Abrir caja" button
- Adds clear disabled/error messaging
- Allows testing of each metric independently
- Enables debugging of why button is non-responsive
- Provides loading state feedback

---

### 1.4 POS Module - Product Catalog

**Current Issue**: Products are in nested buttons without unique identifiers

**Recommended Structure**:
```html
<section data-testid="pos-module">
  
  <!-- Sale Mode Indicator -->
  <div data-testid="sale-mode-indicator">
    <span data-testid="sale-mode-text">Modo venta rapida activo.</span>
  </div>
  
  <!-- Select Mode Section -->
  <div data-testid="select-sale-type-section">
    <button data-testid="select-sale-type-button">
      SELECCIONAR MESA
    </button>
    
    <!-- Quick Sale or Table Selection -->
    <div data-testid="sale-type-options">
      <button data-testid="select-quick-sale">
        Venta Rapida / Para llevar
      </button>
      <!-- Table options would appear here -->
    </div>
  </div>
  
  <!-- Cart Button (Top Right) -->
  <button data-testid="cart-button">
    <span data-testid="cart-icon">🛒</span>
    <span data-testid="cart-label">Ver carrito</span>
    <span data-testid="cart-count">0</span> · 
    <span data-testid="cart-total">$ 0</span>
  </button>
  
  <!-- Quick Navigation Bar -->
  <nav data-testid="category-navigation">
    <button data-testid="category-all">Todas</button>
    <button data-testid="category-almuerzos">Almuerzos</button>
    <button data-testid="category-especiales">Especiales</button>
    <button data-testid="category-bebidas-calientes">Bebidas calientes</button>
    <button data-testid="category-postres">Postres</button>
    <button data-testid="category-dulces-pacifico">Dulces del pacifico</button>
    <button data-testid="category-desayuno">Desayuno</button>
    <button data-testid="category-pasabocas">Pasabocas</button>
    <button data-testid="category-sandwich">Sandwich</button>
    <button data-testid="category-bebidas-ancestrales">Bebidas ancestrales</button>
  </nav>
  
  <!-- Products Grid -->
  <div data-testid="products-grid">
    
    {/* Product Item - Repeat for each */}
    <article 
      data-testid="product-item"
      data-product-id="almuerzo-base"
      data-category="almuerzos"
      data-price="13500"
    >
      <!-- Category Label -->
      <span data-testid="product-category">ALMUERZOS</span>
      
      <!-- Product Info -->
      <div data-testid="product-info">
        <h4 data-testid="product-name">Almuerzo base</h4>
        
        <!-- Technical Sheet Badge -->
        <span data-testid="product-has-recipe" className="badge">
          FICHA
        </span>
      </div>
      
      <!-- Price -->
      <div data-testid="product-pricing">
        <span data-testid="product-price-label">PRECIO</span>
        <span data-testid="product-price-amount">$ 13.500</span>
      </div>
      
      <!-- Description -->
      <p data-testid="product-description">
        Producto conectado a fichas tecnicas.
      </p>
      
      <!-- Stock Status -->
      <div data-testid="product-stock">
        <span data-testid="product-stock-label">Stock</span>
        <span data-testid="product-stock-value">0</span>
        {stockValue === 0 && (
          <span data-testid="stock-warning" className="warning">
            ⚠️ No disponible
          </span>
        )}
      </div>
      
      <!-- Add to Cart Button -->
      <button 
        data-testid="add-to-cart-button"
        data-product-id="almuerzo-base"
        disabled={stockValue === 0 && !allowZeroStock}
        onClick={() => addToCart('almuerzo-base')}
      >
        Agregar al carrito
      </button>
    </article>
    
  </div>
</section>
```

**Benefits**:
- Each product has unique testid for reliable selection
- Can test products by category filter
- Can verify stock status affects add button
- Can test price calculations
- Supports dynamic product lists

---

### 1.5 POS Checkout Panel

**Critical for Payment Flow Testing**

```html
<section data-testid="checkout-panel">
  
  <!-- Header -->
  <header data-testid="checkout-header">
    <h2 data-testid="checkout-title">Carrito de pedido</h2>
    <p data-testid="checkout-subtitle">Venta rapida lista para pago inmediato.</p>
    
    <!-- Close Button -->
    <button data-testid="checkout-close">×</button>
  </header>
  
  <!-- Customer Selection -->
  <div data-testid="customer-section">
    <button data-testid="select-customer-button">
      <span data-testid="customer-label">Cliente</span>
      <span data-testid="customer-value">Cliente ocasional</span>
    </button>
  </div>
  
  <!-- Items List -->
  <section data-testid="cart-items">
    
    {/* Cart Item - Repeat for each */}
    <article 
      data-testid="cart-item"
      data-item-id="almuerzo-base"
    >
      <!-- Item Header -->
      <div data-testid="item-header">
        <h3 data-testid="item-name">Almuerzo base</h3>
        <button data-testid="item-remove-button">Quitar</button>
      </div>
      
      <!-- Item Price -->
      <p data-testid="item-price">
        <span data-testid="item-unit-price">$ 13.500</span>
        <span data-testid="item-multiplier"> x </span>
        <span data-testid="item-quantity">1</span>
      </p>
      
      <!-- Quantity Controls -->
      <div data-testid="quantity-controls">
        <button data-testid="quantity-decrease">-</button>
        <input 
          data-testid="quantity-input"
          type="number"
          value="1"
          readOnly
        />
        <button data-testid="quantity-increase">+</button>
      </div>
      
      <!-- Notes for Kitchen -->
      <textarea
        data-testid="item-notes"
        placeholder="Notas para cocina o barra..."
        defaultValue=""
      />
    </article>
    
  </section>
  
  <!-- Payment Section -->
  <section data-testid="payment-section">
    
    <!-- Total Amount -->
    <div data-testid="total-section">
      <p data-testid="total-label">Centro de cobro</p>
      <p data-testid="total-amount">$ 13.500</p>
      <p data-testid="total-description">
        Listo para cobrar en efectivo
      </p>
    </div>
    
    <!-- Current Payment Method -->
    <div data-testid="current-payment-method">
      <label data-testid="payment-method-label">Metodo actual</label>
      <span data-testid="payment-method-value">Efectivo</span>
    </div>
    
    <!-- Payment Breakdown -->
    <div data-testid="payment-breakdown">
      
      <div data-testid="line-subtotal">
        <span data-testid="line-subtotal-label">Total real de productos</span>
        <span data-testid="line-subtotal-value">$ 13.500</span>
      </div>
      
      <div data-testid="line-to-charge">
        <span data-testid="line-to-charge-label">Total a cobrar</span>
        <span data-testid="line-to-charge-value">$ 13.500</span>
      </div>
      
      <div data-testid="line-final-charged">
        <span data-testid="line-final-charged-label">Valor final cobrado</span>
        <input 
          data-testid="line-final-charged-input"
          type="number"
          value="13500"
          onChange={handleChargeAmountChange}
        />
      </div>
      
      <div data-testid="line-received">
        <span data-testid="line-received-label">Pago recibido del cliente</span>
        <input 
          data-testid="line-received-input"
          type="number"
          value="13500"
          onChange={handlePaymentReceived}
        />
      </div>
      
      <!-- Quick Amount Buttons -->
      <div data-testid="quick-amounts">
        <button data-testid="exact-amount">Exacto</button>
        <button data-testid="amount-14000">$ 14.000</button>
        <button data-testid="amount-15000">$ 15.000</button>
        <button data-testid="amount-20000">$ 20.000</button>
        <button data-testid="amount-50000">$ 50.000</button>
      </div>
      
      <!-- Change Calculation -->
      <div data-testid="change-section">
        <div data-testid="change-display">
          <span data-testid="change-label">Cambio</span>
          <span data-testid="change-amount">$ 0</span>
        </div>
        
        <div data-testid="missing-section">
          <span data-testid="missing-label">Falta por recibir</span>
          <span data-testid="missing-amount">$ 0</span>
        </div>
      </div>
      
      <!-- Adjustments -->
      <div data-testid="adjustments-section">
        <span data-testid="adjustments-label">Sin ajuste</span>
        <span data-testid="adjustments-value">$ 0 (0.0%)</span>
      </div>
      
    </div>
    
    <!-- Payment Method Selector -->
    <div data-testid="payment-methods">
      <p data-testid="payment-methods-label">Metodo de pago</p>
      
      <div data-testid="payment-methods-grid">
        <button data-testid="payment-method-cash">Efectivo</button>
        <button data-testid="payment-method-debit">Tarjeta debito</button>
        <button data-testid="payment-method-credit">Tarjeta credito</button>
        <button data-testid="payment-method-transfer">Transferencia</button>
        <button data-testid="payment-method-nequi">Nequi</button>
        <button data-testid="payment-method-daviplata">Daviplata</button>
        <button data-testid="payment-method-qr">QR</button>
      </div>
    </div>
    
    <!-- Action Buttons -->
    <div data-testid="checkout-actions">
      
      <!-- CRITICAL: Charge Button -->
      <button 
        data-testid="charge-now-button"
        disabled={!canCharge}
        aria-busy={isProcessing}
        onClick={processPayment}
      >
        {isProcessing ? 'Procesando...' : 'Cobrar ahora'}
      </button>
      
      <!-- Cancel Button -->
      <button 
        data-testid="cancel-order-button"
        disabled={!canCancel}
        onClick={cancelOrder}
      >
        Cancelar orden
      </button>
      
      <!-- Immediate Sale (Alternative) -->
      <button 
        data-testid="immediate-sale-button"
        disabled={!canUseFastMode}
      >
        Venta inmediata
      </button>
      
    </div>
    
    <!-- Error Message -->
    {error && (
      <div data-testid="checkout-error" role="alert">
        <span data-testid="error-message">{error}</span>
        <span data-testid="error-reason">{errorReason}</span>
      </div>
    )}
  </section>
  
</section>
```

---

### 1.6 Salon Module - Table Management

```html
<section data-testid="salon-module">
  
  <!-- Module Header with Stats -->
  <header data-testid="salon-header">
    <h2 data-testid="salon-title">Salon / Mesas / Pedidos</h2>
    <p data-testid="salon-description">
      Centro operativo para abrir mesas, comandar productos, seguir cocina, 
      cobrar y liberar con trazabilidad.
    </p>
    
    <!-- New Table Button -->
    <button data-testid="new-table-button">Nueva mesa</button>
  </header>
  
  <!-- Table Statistics -->
  <section data-testid="table-stats">
    <article data-testid="stat-total">
      <p data-testid="stat-total-label">Total</p>
      <p data-testid="stat-total-value">6</p>
    </article>
    
    <article data-testid="stat-free">
      <p data-testid="stat-free-label">Libres</p>
      <p data-testid="stat-free-value">6</p>
    </article>
    
    <article data-testid="stat-in-service">
      <p data-testid="stat-in-service-label">En atencion</p>
      <p data-testid="stat-in-service-value">0</p>
    </article>
    
    <article data-testid="stat-to-pay">
      <p data-testid="stat-to-pay-label">Por cobrar</p>
      <p data-testid="stat-to-pay-value">0</p>
    </article>
    
    <article data-testid="stat-cleaning">
      <p data-testid="stat-cleaning-label">Limpieza</p>
      <p data-testid="stat-cleaning-value">0</p>
    </article>
  </section>
  
  <!-- Zone Filter -->
  <nav data-testid="zone-filter">
    <h3 data-testid="zone-filter-title">Mapa operativo</h3>
    <p data-testid="zone-filter-description">
      Filtra por zona y toca una mesa para operar.
    </p>
    
    <div data-testid="zone-buttons">
      <button data-testid="zone-all">Todas</button>
      <button data-testid="zone-main-salon">Salón principal</button>
      {/* Additional zones */}
    </div>
  </nav>
  
  <!-- Table Map -->
  <section data-testid="table-map">
    
    {/* Table Card - Repeat for each table */}
    <article 
      data-testid="table-card"
      data-table-id="barra"
      data-table-status="libre"
      data-table-zone="salon-principal"
    >
      <!-- Open Table Button -->
      <button 
        data-testid="open-table-button"
        data-table-name="Barra"
        onClick={() => openTable('barra')}
      >
        Abrir Barra
      </button>
      
      <!-- Table Info -->
      <div data-testid="table-info">
        <div data-testid="table-zone-info">
          <h4 data-testid="table-name">Barra</h4>
          <p data-testid="table-zone">Salón principal</p>
        </div>
        
        <!-- Status Badge -->
        <div data-testid="table-status-badge">
          <span data-testid="table-status">Libre</span>
        </div>
      </div>
      
      <!-- Table Details -->
      <div data-testid="table-details">
        
        <!-- Capacity -->
        <div data-testid="table-capacity-info">
          <span data-testid="capacity-icon">👥</span>
          <span data-testid="table-capacity">2</span>
          <span data-testid="capacity-label">personas</span>
        </div>
        
        <!-- Items -->
        <div data-testid="table-items-info">
          <span data-testid="items-icon">🍽️</span>
          <span data-testid="table-items">0</span>
          <span data-testid="items-label">items</span>
        </div>
        
        <!-- Time -->
        <div data-testid="table-time-info">
          <span data-testid="time-icon">⏱️</span>
          <span data-testid="table-time">-</span>
          <span data-testid="time-label">tiempo</span>
        </div>
      </div>
      
      <!-- Description & Total -->
      <p data-testid="table-description">Disponible para abrir atencion.</p>
      <p data-testid="table-total">$ 0</p>
    </article>
    
  </section>
  
  <!-- Create Table Button -->
  <button data-testid="create-table-button">
    Crear mesa
  </button>
  
</section>
```

---

## 2. SECONDARY PRIORITY: Improved Error Handling

### 2.1 Generic Error/Alert Container

```html
<!-- Use throughout app for alerts/errors/success messages -->
<div 
  data-testid="alert-container"
  role="alert"
  data-testid-type="error|success|warning|info"
  aria-live="polite"
>
  <span data-testid="alert-icon"></span>
  <span data-testid="alert-title"></span>
  <span data-testid="alert-message"></span>
  <button data-testid="alert-close"></button>
</div>
```

### 2.2 Loading State Indicators

```html
<!-- Use for async operations -->
<div data-testid="loading-state" aria-busy="true">
  <span data-testid="spinner"></span>
  <span data-testid="loading-message">Loading...</span>
</div>
```

---

## 3. TESTING UTILITIES

### 3.1 Recommended Playwright Fixtures

```typescript
// fixtures/test-setup.ts
import { test as base, expect, Page } from '@playwright/test';

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    // Auto-login before each test
    await loginWithValidCredentials(page);
    await use(page);
    // Auto-logout after each test
    await logout(page);
  },
  
  posPage: async ({ authenticatedPage: page }, use) => {
    // Navigate to POS module
    await navigateToModule(page, 'Punto de venta');
    await use(page);
  },
  
  cajaPage: async ({ authenticatedPage: page }, use) => {
    // Navigate to Cash module
    await navigateToModule(page, 'Caja');
    await use(page);
  },
});

export { expect };
```

### 3.2 Helper Functions for Data-Testid

```typescript
// helpers/selector-helpers.ts
export const byTestId = (id: string) => `[data-testid="${id}"]`;

export const selectors = {
  // Auth
  loginEmail: byTestId('login-email-input'),
  loginPassword: byTestId('login-password-input'),
  loginSubmit: byTestId('login-submit-button'),
  loginError: byTestId('login-error-message'),
  
  // Cash
  openCashButton: byTestId('open-cash-button'),
  cashStatus: byTestId('cash-status-value'),
  cashError: byTestId('cash-open-error'),
  
  // POS
  cartButton: byTestId('cart-button'),
  cartCount: byTestId('cart-count'),
  cartTotal: byTestId('cart-total'),
  
  // Products
  productItem: (productId: string) => byTestId('product-item') + `[data-product-id="${productId}"]`,
  addToCartButton: (productId: string) => byTestId('add-to-cart-button') + `[data-product-id="${productId}"]`,
  
  // Checkout
  chargeButton: byTestId('charge-now-button'),
  changeAmount: byTestId('change-amount'),
  paymentMethod: (method: string) => byTestId(`payment-method-${method}`),
};

export async function getCartState(page: Page) {
  return {
    count: await page.locator(selectors.cartCount).innerText(),
    total: await page.locator(selectors.cartTotal).innerText(),
  };
}

export async function addProduct(page: Page, productId: string) {
  await page.locator(selectors.addToCartButton(productId)).click();
}

export async function selectPaymentMethod(page: Page, method: string) {
  await page.locator(selectors.paymentMethod(method)).click();
}

export async function chargePayment(page: Page) {
  await page.locator(selectors.chargeButton).click();
  // Wait for success or error
  await page.waitForLoadState('networkidle');
}
```

---

## 4. MIGRATION ROADMAP

### Phase 1 (Immediate)
- [ ] Add data-testid to auth form elements
- [ ] Add data-testid to business context header
- [ ] Add data-testid to "Abrir caja" button and error states
- [ ] Add aria-busy and disabled states where applicable

### Phase 2 (Week 1)
- [ ] Add data-testid to all POS product items
- [ ] Add data-testid to checkout panel
- [ ] Add data-testid to payment method buttons
- [ ] Implement error message containers with testid

### Phase 3 (Week 2)
- [ ] Add data-testid to salon table cards
- [ ] Add loading states with testid
- [ ] Implement alert/notification system with testid
- [ ] Add state attributes (aria-busy, aria-selected, etc.)

### Phase 4 (Week 3)
- [ ] Create Playwright fixture files
- [ ] Create selector helper utilities
- [ ] Migrate all tests to use data-testid
- [ ] Document test patterns and best practices

---

## 5. RECOMMENDATIONS FOR DEVELOPERS

### Do's ✅
- Use `data-testid` for every interactive element
- Keep testid names short and descriptive: `add-to-cart-button`, not `btn-add-item-to-shopping-cart-action`
- Prefix related testid: `payment-method-cash`, `payment-method-debit`
- Use `aria-label` for accessibility AND testability
- Add `aria-busy` to async operations
- Add `disabled` attribute with clear reason in title attribute

### Don'ts ❌
- Don't rely on text content for complex selectors
- Don't change CSS classes frequently (they may affect :has-text selectors)
- Don't use index-based selectors (`nth-child`, `nth-of-type`)
- Don't create testid for every single element (only interactive/important ones)
- Don't couple CSS and test selectors

### Best Practice Example

```html
<!-- BAD ❌ -->
<button className="btn-primary-lg pd-4">Cobrar ahora</button>

<!-- GOOD ✅ -->
<button 
  data-testid="charge-now-button"
  disabled={!canCharge}
  aria-busy={isProcessing}
  title={!canCharge ? "Abre caja para cobrar" : ""}
  className="btn-primary-lg pd-4"
  onClick={processPayment}
>
  {isProcessing ? 'Procesando...' : 'Cobrar ahora'}
</button>
```

---

**Document Version**: 1.0  
**Last Updated**: August 12, 2026  
**Author**: E2E Testing Analysis
