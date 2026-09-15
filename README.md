# SmartBudget — Personal Finance & Expense Tracker

A modern, highly interactive, and visually stunning personal finance dashboard built with vanilla web technologies (HTML5, modern CSS3, and JavaScript ES6+).

![SmartBudget Preview](index.html)

## ✨ Key Features

- 🎨 **Modern Design & Theming**:
  - Glassmorphic interface with vibrant accent gradients and ambient glowing backdrops.
  - Seamless **Dark & Light Mode** toggle with instant persistence via `localStorage`.
  - Fluid typography powered by Google Fonts (*Plus Jakarta Sans* and *Outfit*).

- 📊 **Interactive Data Analytics**:
  - Dynamic **Chart.js Doughnut Chart** showing expense breakdown by category.
  - Interactive tooltips with formatted currency and spending percentages.
  - Category breakdown bars showing exact share of expenditures.

- 💰 **Budget & Health Tracking**:
  - Real-time animated number counters for **Total Budget**, **Total Expenses**, and **Net Balance**.
  - Animated **Budget Utilization Progress Bar** with color transitions (Healthy Emerald &rarr; Caution Amber &rarr; Danger Rose).
  - Health status indicator badges: *On Track*, *Caution (>80%)*, and *Over Budget!*.

- 🏷️ **Categorized Expenses**:
  - 8 distinct categories with dedicated emoji badges and color schemes (Food & Dining, Shopping, Housing & Bills, Transportation, Entertainment, Healthcare, Education, Other).
  - Instant presets for 1-click expense logging (Coffee, Lunch, Groceries, Fuel).

- 🔍 **Live Search, Filter & Sort**:
  - Real-time instant search across expense titles.
  - Category filter dropdown.
  - Sort transactions by Date (Newest / Oldest), Amount (High to Low / Low to High), or Alphabetical order.

- 🌍 **Multi-Currency Support**:
  - Switch on-the-fly between **INR (₹)**, **USD ($)**, **EUR (€)**, **GBP (£)**, **JPY (¥)**, **CAD ($)**, and **AUD ($)**.
  - All metrics, charts, and transaction lists re-format instantly.

- 🔄 **Full CRUD with Safety & Undo**:
  - In-place editing mode with auto-focus and highlight.
  - Instant deletion with non-blocking **Undo Toast notification**.
  - Reset confirmation modal to prevent accidental data loss.

- 📂 **Export & Demo Data**:
  - **Export to CSV**: Download transaction history as a formatted `.csv` spreadsheet anytime.
  - **Load Demo Data**: 1-click button to populate sample realistic financial data.
  - Celebratory confetti effects when setting budget milestones.

## 🚀 Getting Started

Simply open `index.html` in any modern web browser:

```bash
# Double click index.html or open via terminal:
start index.html
```

Or serve with any static server:
```bash
npx serve .
# or
python -m http.server 8000
```

## 🛠️ Built With

- **HTML5 & CSS3**: Vanilla CSS with custom properties, glassmorphism, responsive grid & flexbox.
- **JavaScript (ES6+)**: Modular client-side state machine with `localStorage` persistence.
- **Libraries**:
  - [Chart.js](https://www.chartjs.org/) (Interactive analytics visualization)
  - [Canvas Confetti](https://www.kirilv.com/canvas-confetti/) (Celebration effects)
  - [Font Awesome 6](https://fontawesome.com/) (Icons)
  - [Google Fonts](https://fonts.google.com/) (Plus Jakarta Sans & Outfit)
