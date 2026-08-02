# Database Schema Map

**Database:** mfvpos_test
**Generated:** 2026-08-01T13:05:38.577Z

---

##  printers

- **Documents:** 1
- **Fields:**

| Field | Type | Sample |
|-------|------|--------|
| `_id` | object | "object" |
| `email` | string | "ab@gmail.com" |
| `serviceUUID` | string | "e7810a71-73ae-499d-8c15-faa9aef0c3f2" |
| `characteristicUUID` | string | "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f" |
| `__v` | number | 0 |

---

## sales

- **Documents:** 42939
- **Fields:**

| Field | Type | Sample |
|-------|------|--------|
| `_id` | object | "object" |
| `productname` | string | "PANLA PP SMALL" |
| `productprice` | string | "38000.00" |
| `productquantity` | string | "2" |
| `producttotal` | string | "76000.00" |
| `paymentmethod` | string | "cash" |
| `saledate` | string | "3-7-2025" |
| `seller` | string | "ish@gpower.com" |
| `sharedid` | string | "fce8ioispa940" |
| `datentime` | string | Thursday, July 3, 2025 at 12:16:42 AM UT... |
| `saletype` | string | "Cartons" |
| `regtime` | object | "2025-07-03T00:16:42.441Z" |
| `__v` | number | 0 |

---

## wallets

- **Documents:** 4
- **Fields:**

| Field | Type | Sample |
|-------|------|--------|
| `_id` | object | "object" |
| `userId` | object | "object" |
| `balance` | number | 0 |
| `currency` | string | "NGN" |
| `isActive` | boolean | true |
| `transactions` | array | "[0 items]" |
| `createdAt` | object | "2026-07-29T20:00:39.247Z" |
| `updatedAt` | object | "2026-07-29T20:00:39.247Z" |
| `__v` | number | 0 |

---

## settings

- **Documents:** 1
- **Fields:**

| Field | Type | Sample |
|-------|------|--------|
| `_id` | object | "object" |
| `storeName` | string | "GPOWER FROZERN FOODS " |
| `receiptFooter` | string | "thank you for your patronage" |
| `lowStockThreshold` | number | 10 |
| `inventoryAlertsEnabled` | boolean | false |
| `saleAlertsEnabled` | boolean | false |
| `createdAt` | object | "2026-04-20T11:18:19.837Z" |
| `updatedAt` | object | "2026-05-14T21:30:07.353Z" |
| `__v` | number | 0 |
| `receiptDisclaimer` | string | No refunds for goods bought in good cond... |
| `storeAddress` | string | "" |
| `addressSize` | number | 0 |
| `autoCut` | boolean | true |
| `footerSize` | number | 0 |
| `headerTextSize` | number | 1 |
| `itemsSize` | number | 0 |
| `lineSpacing` | number | 1 |
| `paperWidth` | number | 58 |
| `priceSize` | number | 0 |
| `showCustomer` | boolean | true |
| `showDateTime` | boolean | true |
| `showSeller` | boolean | true |
| `storeNameSize` | number | 1 |
| `totalSize` | number | 1 |

---

## businesstypeconfigs

- **Documents:** 5
- **Fields:**

| Field | Type | Sample |
|-------|------|--------|
| `_id` | object | "object" |
| `defaultSettings` | object | "object" |
| `templates` | object | "object" |
| `workflows` | object | "object" |
| `integrations` | object | "object" |
| `isActive` | boolean | true |
| `businessType` | string | "frozen_foods" |
| `displayName` | string | "Frozen Foods" |
| `description` | string | "Frozen food distribution and retail" |
| `createdAt` | object | "2025-08-07T14:08:31.816Z" |
| `updatedAt` | object | "2025-08-07T14:08:31.816Z" |
| `__v` | number | 0 |

---

## tenants

- **Documents:** 0
---

## categories

- **Documents:** 1
- **Fields:**

| Field | Type | Sample |
|-------|------|--------|
| `_id` | object | "object" |
| `name` | string | "Uncategorized" |
| `slug` | string | "uncategorized" |
| `description` | string | "Products pending categorization" |
| `status` | string | "active" |
| `productCount` | number | 21 |
| `createdAt` | object | "2026-07-22T17:22:17.816Z" |
| `updatedAt` | object | "2026-07-22T17:22:17.816Z" |

---

## products

- **Documents:** 23
- **Fields:**

| Field | Type | Sample |
|-------|------|--------|
| `_id` | object | "object" |
| `__v` | number | 0 |
| `email` | string | "recovered@gpower.com" |
| `password` | string | "recovered" |
| `productname` | string | "Kg Panla" |
| `productprice` | number | 2500 |
| `productweight` | number | 1 |
| `unique_id` | number | 1 |

---

## users

- **Documents:** 13
- **Fields:**

| Field | Type | Sample |
|-------|------|--------|
| `_id` | object | "object" |
| `unique_id` | number | 1 |
| `email` | string | "ish@gpower.com" |
| `emailconfirmation` | string | "ish@gpower.com" |
| `password` | string | $2b$10$OzFBNz9FTY0Ii1V0VERyTOjE1OU6u7MFc... |
| `birthday` | number | 4 |
| `birthmonth` | number | 5 |
| `birthyear` | number | 2008 |
| `city` | string | "Lagos" |
| `lastname` | string | "abraham" |
| `passwordconfirmation` | string | "@Mexteller0" |
| `phonenumber` | string | "8158979285" |
| `firstname` | string | "ishmeal" |
| `eventorganizer` | string | "data" |
| `gender` | string | "male" |
| `countrycode` | string | "NG" |
| `country` | string | "NG" |
| `ref` | string | "" |
| `utf8` | string | "✓" |
| `role` | string | "sadmin" |
| `regtime` | object | "2024-10-25T10:53:00.649Z" |
| `__v` | number | 2 |
| `addresses` | array | "[1 items]" |
| `authProvider` | string | "local" |
| `emailVerified` | boolean | false |
| `isActive` | boolean | true |
| `isBlocked` | boolean | false |
| `permissions` | object | "object" |
| `phoneVerified` | boolean | false |
| `walletBalance` | number | 0 |
| `lastLogin` | object | "2026-08-01T12:59:41.432Z" |

---

## printers

- **Documents:** 0
---

## sessions

- **Documents:** 0
---

## adminusers

- **Documents:** 0
---

## expenses

- **Documents:** 0
---

## reviews

- **Documents:** 1
- **Fields:**

| Field | Type | Sample |
|-------|------|--------|
| `_id` | object | "object" |
| `productId` | string | "carton-6a6a370ebc7d59b354c98821" |
| `customerId` | object | "object" |
| `customerName` | string | "ishmeal abraham" |
| `rating` | number | 5 |
| `title` | string | "hi" |
| `comment` | string | "this is a great product" |
| `images` | array | "[0 items]" |
| `helpful` | number | 1 |
| `notHelpful` | number | 0 |
| `helpfulVotes` | array | "[2 items]" |
| `verified` | boolean | false |
| `status` | string | "approved" |
| `createdAt` | object | "2026-07-31T21:04:41.196Z" |
| `updatedAt` | object | "2026-07-31T21:04:50.822Z" |
| `__v` | number | 2 |

---

## stocks

- **Documents:** 94
- **Fields:**

| Field | Type | Sample |
|-------|------|--------|
| `_id` | object | "object" |
| `stockname` | string | "PANLA PP SMALL" |
| `email` | string | "ish@gpower.com" |
| `stockprice` | number | 56000 |
| `stockquantity` | number | 0 |
| `stockweight` | number | 10 |
| `regtime` | object | "2025-03-25T15:33:39.838Z" |
| `__v` | number | 0 |

---

## orders

- **Documents:** 4
- **Fields:**

| Field | Type | Sample |
|-------|------|--------|
| `_id` | object | "object" |
| `orderNumber` | string | "GPO-1785446948289-V4TV6FPU2" |
| `customerId` | object | "object" |
| `customerName` | string | "Judi McConaughey" |
| `customerEmail` | string | "judidiezvwl13@gmail.com" |
| `customerPhone` | string | "54556565656" |
| `items` | array | "[1 items]" |
| `subtotal` | number | 30000 |
| `deliveryFee` | number | 2000 |
| `total` | number | 32000 |
| `deliveryOption` | string | "home" |
| `deliveryAddress` | object | "object" |
| `deliveryDate` | object | "2026-07-30T00:00:00.000Z" |
| `paymentMethod` | string | "paystack" |
| `paymentStatus` | string | "paid" |
| `status` | string | "processing" |
| `statusHistory` | array | "[1 items]" |
| `createdAt` | object | "2026-07-30T21:29:08.301Z" |
| `updatedAt` | object | "2026-07-30T21:29:10.159Z" |
| `__v` | number | 0 |
| `paymentReference` | string | "PAY-GPO-1785446948289-V4TV6FPU2" |

---

## customers

- **Documents:** 121
- **Fields:**

| Field | Type | Sample |
|-------|------|--------|
| `_id` | object | "object" |
| `name` | string | "IYA AYO" |
| `totalPurchases` | number | 32509500 |
| `lastPurchaseDate` | object | "2026-06-03T16:53:47.651Z" |
| `createdAt` | object | "2026-04-20T14:07:05.178Z" |
| `__v` | number | 0 |
| `address` | string | "" |
| `email` | string | "" |
| `phone` | string | "07039370751" |

---

## credits

- **Documents:** 589
- **Fields:**

| Field | Type | Sample |
|-------|------|--------|
| `_id` | object | "object" |
| `customerId` | string | "69e6330949e1a62b1a63cd9b" |
| `customerName` | string | "iya ayo" |
| `saleId` | string | "1mtkzyok2ptml" |
| `amount` | number | 85000 |
| `amountPaid` | number | 85000 |
| `amountRemaining` | number | 0 |
| `status` | string | "paid" |
| `saleDate` | string | "20-4-2026" |
| `payments` | array | "[1 items]" |
| `createdAt` | object | "2026-04-20T14:07:05.239Z" |
| `updatedAt` | object | "2026-04-20T14:07:47.100Z" |
| `__v` | number | 1 |

---

## wishlists

- **Documents:** 1
- **Fields:**

| Field | Type | Sample |
|-------|------|--------|
| `_id` | object | "object" |
| `userId` | object | "object" |
| `customerEmail` | string | "ish@gpower.com" |
| `items` | array | "[2 items]" |
| `createdAt` | object | "2026-07-31T22:51:40.516Z" |
| `updatedAt` | object | "2026-07-31T22:51:53.151Z" |
| `__v` | number | 1 |

---

## riders

- **Documents:** 0
---

## verificationtokens

- **Documents:** 0
---

