# Rayls Airdrop Bulk Checker

A simple, safe, and automated Node.js script to check the eligibility of multiple wallet addresses for the Rayls (RLS) Airdrop. This script uses the public API to fetch allocation data without requiring private keys or wallet connection.

## 🚀 Features

- **Bulk Check:** Checks unlimited addresses from a text file (`wallet.txt`).
- **Safe:** **No Private Keys required.** It only uses Public Addresses.
- **Auto-Save:** Saves all eligible wallets and their amounts to `eligible.txt`.
- **Detailed Output:** Shows RLS token amount for eligible addresses.
- **Fast:** Checks addresses sequentially with a small delay to avoid rate limiting.

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) installed on your computer.

## 🛠️ Installation

1.  **Clone or Download** this project folder.
2.  Open your terminal/command prompt in the folder.
3.  Install the required dependencies:

```bash
npm install axios ethers colors
```
