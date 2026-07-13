# Consumer Form & Admin Panel Mapping

## 1. Consumer Form Component

### File Location
- [app/premium-cards/page.tsx](app/premium-cards/page.tsx) (Lines 539-552)

### Form Fields
The consumer form contains the following fields:

```typescript
interface OrderForm {
  cardId: string;
  cardName: string;
  categoryName: string;
  price: number;
  userId?: string;
  userName?: string;      // "Your name"
  userEmail?: string;     // "Email"
  userWhatsApp?: string;  // "WhatsApp number (required)"
  paymentScreenshot?: string; // Google Drive link or uploaded screenshot
  utrNumber?: string;     // "UTR Number (required if Transaction ID not provided)"
  transactionId?: string; // "Transaction ID (required if UTR not provided)"
  remark?: string;        // "Remark" (textarea)
}
```

### Form UI Elements (Lines 539-552)
```tsx
<input value={orderForm.userName || ''} placeholder="Your name" />
<input value={orderForm.userEmail || ''} placeholder="Email" />
<input value={orderForm.userWhatsApp || ''} placeholder="WhatsApp number (required)" />
<input value={orderForm.utrNumber || ''} placeholder="UTR Number (required if Transaction ID not provided)" />
<input value={orderForm.transactionId || ''} placeholder="Transaction ID (required if UTR not provided)" />
<textarea value={orderForm.remark || ''} placeholder="Remark" />
```

---

## 2. Admin Panel - Orders View

### File Location
- [app/admin/premium-cards/page.tsx](app/admin/premium-cards/page.tsx) (Lines 327-380)

### Admin Order Details Displayed
Each order card shows:
- **Order ID** (e.g., `PC-1234567890`)
- **Consumer Information**
  - `userName` (or 'Guest')
  - `userEmail` (or 'No email')
- **Card Information**
  - `categoryName` (Normal Cards, Premium Cards, VIP Cards, etc.)
  - `cardName`
  - `price` (₹)
- **Payment Information**
  - `utrNumber` (if provided)
  - `transactionId` (if provided)
  - `remark` (if provided)
  - `paymentScreenshot` (clickable link to Drive or uploaded image)
- **Order Status**
  - `status` (pending, approved, rejected, released)
  - Color-coded: amber for pending, emerald for approved/released, rose for rejected
- **Timestamps**
  - `createdAt` - Order creation time
  - `approvedAt` - Payment verification time
  - `releasedAt` - Card details release time
- **Card Details** (shown after release)
  - Card number
  - Expiry date
  - CVV
  - Cardholder name

### Admin Actions
1. **Verify Payment** (when status = pending)
   - Updates `status` to "approved"
   - Sets `approvedAt` timestamp
2. **Reject** (when status = pending)
   - Updates `status` to "rejected"
   - Sets `rejectedAt` timestamp
3. **Release** (when status = approved)
   - Opens modal to fill card details
   - Updates `status` to "released"
   - Sets `releasedAt` timestamp
   - Decrements card inventory

---

## 3. Database Model

### File Location
- [models/PremiumCardOrder.ts](models/PremiumCardOrder.ts)

### Collection
- Database: MongoDB
- Collection: `card_orders`
- Model Name: `CardOrder`

### Schema Fields
```typescript
{
  orderId: String (unique),           // e.g., "PC-1234567890"
  userId: ObjectId (ref: 'User'),     // Optional - linked to User
  userName: String,                   // From form or user profile
  userEmail: String,                  // From form or user email
  cardId: ObjectId (ref: 'Card'),     // Card being ordered
  cardName: String,                   // Card name (e.g., "Visa 5K")
  categoryName: String,               // Card category
  price: Number,                      // Order price
  amountPaid: Number,                 // Amount actually paid (default: 0)
  paymentScreenshot: String,          // Google Drive link or uploaded image URL
  utrNumber: String,                  // UTR number from form
  transactionId: String,              // Transaction ID from form
  remark: String,                     // User's remark/note
  status: String (enum),              // 'pending' | 'approved' | 'rejected' | 'released'
  cardDetails: Object,                // Released card details (only set when status = 'released')
  {
    cardNumber: String,
    expiry: String,
    cvv: String,
    holderName: String,
    // ... other fields from card model
  }
  adminNote: String,                  // Admin's internal note
  viewedAt: Date,                     // When admin viewed the order
  approvedAt: Date,                   // When payment was verified
  releasedAt: Date,                   // When card details were released
  rejectedAt: Date,                   // When order was rejected
  createdAt: Date                     // Order creation timestamp
}
```

---

## 4. API Endpoints

### Submit Consumer Order
**POST** `/api/premium-cards/orders`

**Request Body:**
```json
{
  "cardId": "string",
  "cardName": "string",
  "categoryName": "string",
  "price": number,
  "userName": "string",
  "userEmail": "string",
  "userWhatsApp": "string",
  "paymentScreenshot": "string (URL)",
  "utrNumber": "string (optional)",
  "transactionId": "string (optional)",
  "remark": "string (optional)"
}
```

**Response:**
```json
{
  "_id": "ObjectId",
  "orderId": "PC-1234567890",
  "userId": "ObjectId or undefined",
  "userName": "string",
  "userEmail": "string",
  "cardId": "ObjectId",
  "cardName": "string",
  "categoryName": "string",
  "price": number,
  "paymentScreenshot": "string",
  "utrNumber": "string",
  "transactionId": "string",
  "remark": "string",
  "status": "pending",
  "createdAt": "2024-01-01T12:00:00Z"
}
```

**File:** [app/api/premium-cards/orders/route.ts](app/api/premium-cards/orders/route.ts) (Lines 18-44)

---

### Fetch All Orders (Admin)
**GET** `/api/premium-cards/orders?status=pending`

**Auth:** Admin or Staff role required

**Response:**
```json
[
  {
    "_id": "ObjectId",
    "orderId": "string",
    "userName": "string",
    "userEmail": "string",
    "cardName": "string",
    "categoryName": "string",
    "price": number,
    "status": "pending|approved|rejected|released",
    "utrNumber": "string",
    "transactionId": "string",
    "remark": "string",
    "paymentScreenshot": "string",
    "createdAt": "date",
    "approvedAt": "date",
    "releasedAt": "date"
  }
]
```

**File:** [app/api/premium-cards/orders/route.ts](app/api/premium-cards/orders/route.ts) (Lines 8-16)

---

### Fetch User's Orders
**GET** `/api/premium-cards/orders/me`

**Response:** Same as above, filtered by current user

**File:** [app/api/premium-cards/orders/me/route.ts](app/api/premium-cards/orders/me/route.ts)

---

### Update Order Status
**PUT** `/api/premium-cards/orders/[id]`

**Auth:** Admin or Staff role required

**Request Body:**
```json
{
  "status": "approved|rejected|released",
  "cardDetails": {
    "cardNumber": "string",
    "expiry": "string",
    "cvv": "string",
    "holderName": "string"
  },
  "adminNote": "string (optional)",
  "utrNumber": "string (optional)",
  "transactionId": "string (optional)",
  "remark": "string (optional)",
  "paymentScreenshot": "string (optional)"
}
```

**Status Transitions:**
1. `pending` → `approved`: Marks payment as verified, sets `approvedAt`
2. `pending` → `rejected`: Rejects payment, sets `rejectedAt`
3. `approved` → `released`: Releases card details, decrements inventory, sets `releasedAt`

**File:** [app/api/premium-cards/orders/[id]/route.ts](app/api/premium-cards/orders/[id]/route.ts) (Lines 10-66)

---

## 5. Current Issues with Visibility

### Issue 1: UserWhatsApp Field Not Displayed in Admin
The consumer's **WhatsApp number** is submitted in the form but **not visible** in the admin panel order details.

**Missing Display:** Line 365-367 in [app/admin/premium-cards/page.tsx](app/admin/premium-cards/page.tsx)

**Current Code:**
```tsx
{order.utrNumber ? <p className="text-sm text-slate-400">UTR: {order.utrNumber}</p> : null}
{order.transactionId ? <p className="text-sm text-slate-400">Transaction ID: {order.transactionId}</p> : null}
{order.remark ? <p className="text-sm text-slate-400">Remark: {order.remark}</p> : null}
```

**Missing:**
```tsx
{order.userWhatsApp ? <p className="text-sm text-slate-400">WhatsApp: {order.userWhatsApp}</p> : null}
```

### Issue 2: UserWhatsApp Not Stored in Database
The field is **not included** in the `PremiumCardOrder` schema in [models/PremiumCardOrder.ts](models/PremiumCardOrder.ts).

**Current Schema (Lines 3-23):**
```typescript
{
  orderId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, default: '' },
  userEmail: { type: String, default: '' },
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card', required: true },
  cardName: { type: String, default: '' },
  categoryName: { type: String, default: '' },
  price: { type: Number, required: true },
  // ... MORE FIELDS ...
  // MISSING: userWhatsApp
}
```

### Issue 3: UserWhatsApp Not Saved in API
The API endpoint doesn't save `userWhatsApp` when creating an order.

**File:** [app/api/premium-cards/orders/route.ts](app/api/premium-cards/orders/route.ts) (Line 36-43)

**Current Code:**
```typescript
const order = await CardOrder.create({
  orderId,
  userId: session?.user?.id || body.userId,
  userName: session?.user?.name || body.userName || '',
  userEmail: session?.user?.email || body.userEmail || '',
  cardId: body.cardId,
  // ... MORE FIELDS ...
  // MISSING: userWhatsApp: body.userWhatsApp
});
```

---

## 6. Summary Table

| Component | File | Status |
|-----------|------|--------|
| Consumer Form | `app/premium-cards/page.tsx` | ✅ Functional - accepts WhatsApp |
| Admin Panel - Display | `app/admin/premium-cards/page.tsx` | ❌ Missing WhatsApp display |
| Database Model | `models/PremiumCardOrder.ts` | ❌ Missing WhatsApp field |
| API - Create Order | `app/api/premium-cards/orders/route.ts` | ❌ Not saving WhatsApp |
| API - Update Order | `app/api/premium-cards/orders/[id]/route.ts` | ✅ Functional |

---

## 7. Recommended Fixes

### Step 1: Add WhatsApp to Database Model
Add field to `models/PremiumCardOrder.ts`:
```typescript
userWhatsApp: { type: String, default: '' }
```

### Step 2: Save WhatsApp in API
Update `app/api/premium-cards/orders/route.ts` line 36:
```typescript
userWhatsApp: session?.user?.phone || body.userWhatsApp || ''
```

### Step 3: Display WhatsApp in Admin Panel
Add display in `app/admin/premium-cards/page.tsx` after line 366:
```tsx
{order.userWhatsApp ? <p className="text-sm text-slate-400">WhatsApp: {order.userWhatsApp}</p> : null}
```

### Step 4: Update Admin Order Update Endpoint
Add to `app/api/premium-cards/orders/[id]/route.ts` if needed:
```typescript
order.userWhatsApp = body.userWhatsApp || order.userWhatsApp;
```
