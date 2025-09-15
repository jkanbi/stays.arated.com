# Stays Aggregator

A clean, mobile-friendly web application for aggregating property stays from various booking platforms.

## Quick Start

### Option 1: Simple File Opening (Limited)
1. Open `index.html` directly in your browser
2. The app will load embedded sample data automatically
3. You can upload custom CSV files using the upload button

### Option 2: Local Server (Recommended)
For full functionality including automatic CSV loading, run a local server:

#### Using Python (if installed):
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

#### Using Node.js (if installed):
```bash
npx serve .
```

#### Using PHP (if installed):
```bash
php -S localhost:8000
```

Then open: `http://localhost:8000`

## CSV Format

Your CSV file should have these columns:
- `name` (required) - Property name
- `url` (required) - Booking platform URL  
- `type` (required) - Property type
- `amenities` (optional) - Comma-separated amenities
- `description` (optional) - Property description
- `price` (optional) - Price information
- `location` (optional) - Property location

## Features

- 📱 Mobile-responsive design
- 🔍 Real-time search and filtering
- 📊 Property statistics
- 📁 CSV file upload support
- 🔗 Direct links to booking platforms
- 🏷️ Amenity tagging system

## Troubleshooting

**CSV not auto-loading?** 
- Use a local server instead of opening the HTML file directly
- Or click "Load Sample Data" button to load embedded data

**Upload not working?**
- Make sure your CSV has the required columns: name, url, type
- Check that the file is a valid CSV format
