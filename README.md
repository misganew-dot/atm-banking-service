# ATM Banking Service

A modular, responsive **ATM Banking Service** web application built with **HTML5**, **CSS3**, and **Vanilla JavaScript** (`localStorage`). Designed for self-service ATM simulation with account validation, PIN security, transaction receipts, and history filtering.

## Features

- **Deposit Money:** Create new accounts or deposit funds into existing accounts with 4-digit PIN setup/verification, quick-amount buttons (100, 500, 1,000, 5,000 ETB), and instant receipts.
- **Withdraw Money:** Validate account holder details, verify 4-digit PIN, check available balance, and generate withdrawal receipts.
- **Transfer Money:** Transfer funds between two 13-digit accounts with sender PIN verification and automatic balance updates.
- **PIN Lockout Protection:** Locks an account after **3 consecutive incorrect PIN attempts** (`LOCKED` status badge) until reset.
- **Account Balances:** View all created accounts, balances in ETB, and lock status.
- **Transaction History & Filtering:** Browse all transactions or filter by a **13-digit Account Number** with a one-click clear filter option.
- **Reset Data:** Clear all stored accounts and transaction history from `localStorage`.

## Project Structure

```text
atm-banking-service/
├── index.html   # User interface and multi-view ATM screens
├── style.css    # Layout, responsive styling, and named CSS colors
└── script.js    # Account state, validation, PIN lockout, and history logic
## How to Run Locally
Clone or download the repository
```bash
git clone [https://github.com/misganew-dot/atm-banking-service.git](https://github.com/misganew-dot/atm-banking-service.git)
Open index.html in any modern web browser.



## Live Demo
Hosted via GitHub Pages:'https://misganew-dot.github.io/atm-banking-service/'

## Author
misganew-dot
