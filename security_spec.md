# Security Specification & Threat Model - The Fry Factory

## 1. Data Invariants & Zero-Trust Rules

*   **Configs**: Anyone can read the kitchen config `/configs/kitchen` to view the shop name, WhatsApp, delivery charges, and minimum order. Only authenticated admins or validated write permissions can modify configuration settings. Since our system uses unauthenticated PIN verified requests, we validate updates strictly:
    *   No empty strings for `name`, `whatsappNumber`, or `adminPin`.
    *   Positive numbers for `deliveryCharge` and `minOrder`.
*   **Categories**: Read-only for customers; editable from Dashboard.
    *   Category IDs must be alphanumeric (`^[a-zA-Z0-9_\-]+$`) and less than 128 chars.
    *   Label is string between 1 and 100 characters.
*   **Menu**: Read-only for customers; editable from Dashboard.
    *   Price must be positive (`price > 0`).
    *   Name and Description must be within reasonable bounds (name <= 100, desc <= 300).
*   **Orders**: Create-only for storefront users. Read & update for Dashboard.
    *   Status states transitions must be valid, protecting outcomes.
    *   Grand total must equal items subtotal + delivery charges.

---

## 2. The "Dirty Dozen" Threat Vectors (Failing Payloads)

Here are the 12 specific payloads designed to break our data:

| ID | Collection | Intent | Exploit Description | Expected |
|:---|:---|:---|:---|:---|
| D01 | `/configs/kitchen` | Privilege Escalation | Attempt to clear the `adminPin` of the global settings document. | **DENIED** |
| D02 | `/configs/kitchen` | Value Poisoning | Attempt to set a negative `deliveryCharge` or `-100` min order. | **DENIED** |
| D03 | `/categories` | Resource Poisoning | Insert a category ID with huge junk strings (e.g. 5000 characters). | **DENIED** |
| D04 | `/categories` | State Overwrite | Create category with empty labels. | **DENIED** |
| D05 | `/menu` | Value Poisoning | Add menu item with `price: -450` or `price: 0`. | **DENIED** |
| D06 | `/menu` | Data Injection | Inject cross-site scripting strings or ghost fields (e.g., `isAdminCreator: true`). | **DENIED** |
| D07 | `/menu` | Orphaned Records | Modifying category references for an item to non-existent ones. | **DENIED** |
| D08 | `/orders` | Fraudulent Price | Create order with arbitrary subtotal or total zero billing. | **DENIED** |
| D09 | `/orders` | Identity Spoofing | Spoof customer email address or setting illegal statuses like `status: "delivered"` initially. | **DENIED** |
| D10 | `/orders` | State Shortcut | Transition order status directly from `new` to `delivered` bypassing ready state. | **DENIED** |
| D11 | `/orders` | Terminal Modification | Edit or delete a completed or cancelled order record (Outcome status locking). | **DENIED** |
| D12 | `/orders` | Denial of Wallet | Flood batch with huge 10MB payloads. | **DENIED** |

---

## 3. Test Cases Draft

A simple testing script will verify permissions are denied for any unverified schema manipulations.
