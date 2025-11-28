# LLC & Rental Cash Flow Dashboard

This lightweight, client-side dashboard helps track income and expenses for multiple LLCs, personal spending, and rental properties. It ships with sample data, but everything persists to `localStorage` in your browser so you can keep adding entries without a backend.

## Features
- Track income/expense totals for LLCs, rental properties, and personal spending with filters by company, property, and month.
- See instant cash-flow, insights on tax set-asides, personal vs. LLC spending, and top categories.
- Add additional LLCs or rental properties on the fly.
- Intake CSV/PDF statements or receipt photos into a categorization queue.
- Route each upload to **American Home Buyers LLC**, **America Home Builders S-Corp**, personal, or **Ignore**; categorized items post to the ledger.
- Export a year-end CSV and open your local mail app with a ready-to-send draft for a tax professional.

## Usage
Open `index.html` in a browser. Use the **Add LLC** / **Add rental property** buttons to expand your list of entities. Filters in the snapshot panel let you drill into a specific company, property, or month.

Use the **Bulk uploads & receipt intake** panel to attach CSV/PDF statements or snap a receipt. Each upload lands in the categorization queue where you can assign it to a company (or personal) and property, or choose **Ignore**. Categorized items are posted to the ledger automatically.

Use the **Year-end CSV delivery** section to pick a tax year, download a clean ledger CSV, and launch an email draft through your default mail client so you can attach and send it to your CPA quickly.

The page stores all entries in your browser’s `localStorage` under the key `llc-rental-ledger-v1`. Clear that key to reset data.

## Chat widget
The included `chat-loader.js` file loads the n8n chat widget (if you host the HTML somewhere with internet access). Remove the script tag in `index.html` if you don’t want to display it.
