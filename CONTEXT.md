# SwiftPay

Fintech payment platform providing high-conversion checkouts, multi-acquirer payment gateway routing (Pix, Credit Card, Boleto), double-entry ledger accounting, merchant analytics, and automated payouts.

## Core Domain

**Merchant**:
An organization or business entity registered on the platform that sells products and receives payments.
_Avoid_: Store, shop, seller, client

**Customer**:
The end-buyer who performs payment on the checkout for products or services offered by a Merchant.
_Avoid_: Buyer, client, end-user

**User**:
An authenticated human with access to the platform (Merchant Member, Merchant Admin, or Platform God Admin).
_Avoid_: Account, customer, client

**Product**:
A physical or digital item configured by a Merchant with pricing, description, stock, and variations.
_Avoid_: Item, offer, listing

**Variant**:
A specific variation of a Product (e.g., size, color, digital item) with distinct inventory and SKU.
_Avoid_: Option, SKU item

## Payments & Checkout

**Checkout**:
The public payment interface presented to a Customer to finalize an Order, with customized themes, timers, and payment methods.
_Avoid_: Cart, payment page, sales page

**Order**:
The commercial agreement between a Customer and a Merchant encompassing selected items, total value, and shipping data.
_Avoid_: Purchase, sale, deal

**Payment**:
A monetary transaction attempt associated with an Order, processed via Pix, Credit Card, or Boleto.
_Avoid_: Charge, billing

**Acquirer**:
A financial institution, sub-acquirer, or banking partner (e.g., PixHub, Bankizi) that processes and settles transactions.
_Avoid_: Gateway, processor, bank partner

**Split / Dynamic Routing**:
The algorithm that distributes transactions across Acquirers based on fee optimization, health checks, or A/B testing.
_Avoid_: Failover, routing rules

## Accounting & Financials

**Ledger Entry**:
An immutable record in the double-entry accounting ledger documenting debits, credits, and exact monetary movements.
_Avoid_: Balance log, transaction history, statement item

**Merchant Balance**:
The aggregated financial position of a Merchant, broken into Available Balance, Pending Settlement, and Blocked Reserve.
_Avoid_: Wallet balance, funds

**Payout**:
A fund disbursement from the Merchant's available balance to an external verified bank account via Pix.
_Avoid_: Cashout, withdrawal, bank transfer

**KYC (Know Your Customer)**:
The regulatory compliance and identity verification workflow required before enabling payouts for a Merchant.
_Avoid_: Onboarding validation, document check

## Platform & Integrations

**API Credential**:
The secret API key and environment identifier generated for a Merchant to integrate external platforms with SwiftPay API.
_Avoid_: API token, app key

**Webhook**:
An HTTP notification dispatched to a Merchant or received from an Acquirer upon payment state transitions.
_Avoid_: Callback, push event

## Notifications

**Push Token**:
A device-specific FCM registration bound to a User, enabling push delivery to that device. Deactivated on logout or device revocation.
_Avoid_: Device key, FCM ID, subscription

**Notification Preference**:
A User's per-event configuration matrix that governs push delivery. Controls push only — in-app notifications are always delivered regardless of preferences.
_Avoid_: Notification settings, alert config

**Channel**:
The delivery medium of a notification: Push (device), In-App (SignalR/bell, always on), or Email (modeled, not yet sent).
_Avoid_: Medium, transport, method
