# HerbLift - Supplement Affiliate Site

An eBay affiliate site for natural supplements and vitamins, built with vanilla HTML/CSS/JS and Netlify Functions.

## Features

- 🔍 **Keyword Search** - Search by supplement name, ingredient, or brand
- 📂 **Category Browsing** - 8 supplement categories (Vitamins, Protein, Herbal, etc.)
- 🏷️ **Brand Filtering** - Filter by popular supplement brands
- 📊 **Live Inventory Counts** - Real-time product counts from eBay
- 📱 **Responsive Design** - Works on desktop and mobile
- 🔗 **Deep Linking** - URL parameters for direct category/search links
- 📈 **Analytics Ready** - Google Analytics 4 integration
- 💰 **eBay Partner Network** - Affiliate tracking built-in

## Quick Start

### 1. Clone/Download

Download this folder to your local machine.

### 2. Get eBay API Credentials

1. Go to [eBay Developer Program](https://developer.ebay.com/)
2. Create an application (Production keys)
3. Note your **Client ID** and **Client Secret**
4. Join the [eBay Partner Network](https://partnernetwork.ebay.com/)
5. Get your **Campaign ID**

### 3. Deploy to Netlify

**Option A: Netlify Dashboard**
1. Push code to GitHub
2. Connect repo in [Netlify](https://app.netlify.com/)
3. Add environment variables in Site Settings → Environment Variables:
   - `EBAY_CLIENT_ID` - Your eBay Client ID
   - `EBAY_CLIENT_SECRET` - Your eBay Client Secret
   - `EPN_CAMPAIGN_ID` - Your eBay Partner Network Campaign ID

**Option B: Netlify CLI**
```bash
npm install -g netlify-cli
netlify init
netlify env:set EBAY_CLIENT_ID your_client_id
netlify env:set EBAY_CLIENT_SECRET your_client_secret
netlify env:set EPN_CAMPAIGN_ID your_campaign_id
netlify deploy --prod
```

### 4. Add Google Analytics (Optional)

Replace `G-XXXXXXXXXX` in `index.html` with your GA4 Measurement ID.

## File Structure

```
supplements/
├── index.html              # Main frontend
├── netlify.toml            # Netlify config
├── README.md               # This file
└── netlify/
    └── functions/
        └── search.js       # eBay API serverless function
```

## URL Parameters

Deep link to specific categories or searches:

```
?category=protein           # Open protein category
?category=vitamins&brand=NOW%20Foods  # Category + brand filter
?q=ashwagandha              # Direct search
```

## Categories

| Key | Name | eBay Category |
|-----|------|---------------|
| vitamins | Vitamins & Multivitamins | 180959 |
| protein | Protein & Fitness | 181337 |
| herbal | Herbal Supplements | 180962 |
| minerals | Minerals & Electrolytes | 180960 |
| weight | Weight Management | 181000 |
| immune | Immune Support | 180959 |
| probiotics | Probiotics & Digestive | 181001 |
| omega | Omega & Fish Oil | 180961 |

## Customization

### Change Colors

Edit the CSS variables in `index.html`:

```css
:root { 
  --primary: #2d6a4f;      /* Main green */
  --primary-light: #40916c;
  --accent: #95d5b2;       /* Light green accent */
  --warm: #f4a261;         /* Orange accent */
}
```

### Add Categories

1. Add to `CATEGORIES` object in both `index.html` and `search.js`
2. Add brands to `BRANDS` object in `index.html`
3. Find eBay category IDs at [eBay Category Tree](https://developer.ebay.com/api-docs/commerce/taxonomy/static/supportedmarketplaces.html)

### Change Branding

- Update the logo text in `<h1 class="logo">`
- Replace tagline in `<p class="tagline">`
- Update `<title>` tag

## Affiliate Disclosure

Remember to add an FTC-compliant affiliate disclosure to your site. Example:

> *As an eBay Partner, we earn from qualifying purchases.*

## License

MIT - Use freely for your own projects.

## Credits

Built with ❤️ following the JDM.Parts template pattern.
