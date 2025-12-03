const https = require('https');

// eBay Production Credentials
const EBAY_APP_ID = process.env.EBAY_CLIENT_ID || 'YOUR_EBAY_CLIENT_ID';
const EBAY_CERT_ID = process.env.EBAY_CLIENT_SECRET || 'YOUR_EBAY_CLIENT_SECRET';
const EPN_CAMPAIGN_ID = process.env.EPN_CAMPAIGN_ID || 'YOUR_EPN_CAMPAIGN_ID';

// Category mappings for supplements
const CATEGORIES = {
  vitamins: {
    categoryId: '180959',
    searchTerms: ['vitamin', 'multivitamin'],
    excludeTerms: ['holder', 'case', 'organizer', 'bottle empty', 'dispenser']
  },
  protein: {
    categoryId: '181337',
    searchTerms: ['protein powder', 'whey protein'],
    excludeTerms: ['shaker only', 'bottle empty', 'scoop', 'container empty']
  },
  herbal: {
    categoryId: '180962',
    searchTerms: ['herbal supplement', 'botanical'],
    excludeTerms: ['tea only', 'empty bottle', 'dropper only']
  },
  minerals: {
    categoryId: '180960',
    searchTerms: ['mineral supplement', 'magnesium', 'zinc'],
    excludeTerms: ['rock', 'stone', 'specimen', 'crystal decor']
  },
  weight: {
    categoryId: '181000',
    searchTerms: ['weight loss supplement', 'fat burner'],
    excludeTerms: ['scale', 'tracker', 'book', 'guide', 'program']
  },
  immune: {
    categoryId: '180959',
    searchTerms: ['immune support', 'vitamin c immune'],
    excludeTerms: ['book', 'guide']
  },
  probiotics: {
    categoryId: '181001',
    searchTerms: ['probiotic supplement', 'digestive enzyme'],
    excludeTerms: ['pet', 'dog', 'cat', 'animal']
  },
  omega: {
    categoryId: '180961',
    searchTerms: ['fish oil', 'omega 3'],
    excludeTerms: ['pet', 'dog', 'cat', 'bait', 'fishing']
  }
};

const QUALITY_BRANDS = [
  'nature made', 'now foods', 'garden of life', 'thorne', 'pure encapsulations',
  'life extension', 'optimum nutrition', 'dymatize', 'nordic naturals', 'carlson',
  'gaia herbs', 'solaray', 'jarrow formulas', 'doctor\'s best', 'solgar',
  'naturelo', 'sports research', 'viva naturals', 'nutricost', 'bulk supplements'
];

let cachedToken = null;
let tokenExpiry = 0;

async function getOAuthToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const auth = Buffer.from(`${EBAY_APP_ID}:${EBAY_CERT_ID}`).toString('base64');
  const postData = 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope';

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.ebay.com',
      path: '/identity/v1/oauth2/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
        'Content-Length': postData.length
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.access_token) {
            cachedToken = parsed.access_token;
            tokenExpiry = Date.now() + ((parsed.expires_in || 7200) * 1000) - 60000;
            resolve(cachedToken);
          } else {
            reject(new Error('No token in response'));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function searchEbay(query, categoryId, limit = 60, offset = '', condition = '') {
  const token = await getOAuthToken();

  let path = `/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  
  if (categoryId) {
    path += `&category_ids=${categoryId}`;
  }
  
  if (offset && offset.trim() !== '' && !isNaN(Number(offset))) {
    path += `&offset=${offset}`;
  }
  
  if (condition === 'new') {
    path += '&filter=conditionIds:{1000}';
  }

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.ebay.com',
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          let items = parsed.itemSummaries || [];
          
          let nextOffset = '';
          if (parsed.next) {
            try {
              const nextUrl = new URL(parsed.next);
              nextOffset = nextUrl.searchParams.get('offset') || '';
            } catch (urlError) {}
          }

          resolve({
            items,
            total: parsed.total || items.length,
            next: nextOffset
          });
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

function filterAndScoreItems(items, type, excludeTerms = []) {
  return items
    .filter(item => {
      const titleLower = (item.title || '').toLowerCase();
      
      const defaultExcludes = [
        'book', 'dvd', 'cd', 'poster', 'sticker', 'shirt', 't-shirt', 'hat', 'cap',
        'keychain', 'magnet', 'mug', 'cup', 'empty bottle', 'container only',
        'sample', 'trial', 'expired', 'vintage label', 'collectible'
      ];
      
      const allExcludes = [...defaultExcludes, ...excludeTerms];
      if (allExcludes.some(term => titleLower.includes(term))) {
        return false;
      }
      
      const supplementIndicators = [
        'capsule', 'tablet', 'softgel', 'gummy', 'powder', 'serving',
        'count', 'ct', 'caps', 'tabs', 'mg', 'mcg', 'iu', 'ml', 'oz',
        'supply', 'bottle', 'container'
      ];
      
      return supplementIndicators.some(ind => titleLower.includes(ind));
    })
    .map(item => {
      const titleLower = (item.title || '').toLowerCase();
      let qualityScore = 0;
      
      QUALITY_BRANDS.forEach(brand => {
        if (titleLower.includes(brand)) qualityScore += 3;
      });
      
      if (titleLower.includes('organic')) qualityScore += 1;
      if (titleLower.includes('non-gmo')) qualityScore += 1;
      if (titleLower.includes('vegan')) qualityScore += 1;
      if (titleLower.includes('usa')) qualityScore += 1;
      if (titleLower.includes('gmp')) qualityScore += 1;
      if (item.condition === 'New') qualityScore += 2;
      if (item.shippingOptions?.[0]?.shippingCostType === 'FREE') qualityScore += 1;
      
      return { ...item, qualityScore };
    })
    .sort((a, b) => b.qualityScore - a.qualityScore);
}

function enrichItems(items) {
  return items.map(item => {
    const title = item.title || '';
    const price = item.price?.value || '';
    const currency = item.price?.currency || 'USD';
    const image = item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl || '';
    const itemUrl = item.itemWebUrl || '';
    const condition = item.condition || 'New';
    const location = item.itemLocation?.city || item.itemLocation?.country || 'USA';

    let shippingText = '';
    if (item.shippingOptions && item.shippingOptions[0]) {
      const ship = item.shippingOptions[0];
      if (ship.shippingCostType === 'FREE') {
        shippingText = '🚚 FREE Shipping';
      } else if (ship.shippingCost) {
        shippingText = `🚚 +$${ship.shippingCost.value} shipping`;
      }
    }

    const epnUrl = itemUrl + (itemUrl.includes('?') ? '&' : '?') + 
      `mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=${EPN_CAMPAIGN_ID}&toolid=10001&mkevt=1`;

    return {
      title,
      price,
      currency,
      image,
      itemUrl,
      epn_url: epnUrl,
      condition,
      location,
      shipping_text: shippingText
    };
  });
}

// Vercel serverless function handler
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const params = req.query || {};
    const customQuery = params.query || '';
    const type = params.type || 'vitamins';
    const brand = params.brand || '';
    const condition = params.condition || '';
    const limit = parseInt(params.limit) || 60;
    const offset = params.offset || '';

    const catConfig = CATEGORIES[type] || CATEGORIES.vitamins;
    
    let query = customQuery;
    if (!query) {
      query = catConfig.searchTerms[0];
    }
    
    if (brand) {
      query = `${brand} ${query}`;
    }
    
    if (!query.toLowerCase().includes('supplement') && 
        !query.toLowerCase().includes('vitamin') && 
        !query.toLowerCase().includes('protein')) {
      query += ' supplement';
    }

    const results = await searchEbay(query, catConfig.categoryId, limit, offset, condition);
    const filtered = filterAndScoreItems(results.items, type, catConfig.excludeTerms || []);
    const enriched = enrichItems(filtered);

    return res.status(200).json({
      items: enriched,
      total: results.total,
      next: results.next
    });

  } catch (error) {
    console.error('SEARCH ERROR:', error);
    
    return res.status(200).json({
      items: [],
      total: 0,
      next: '',
      error: error.message
    });
  }
};
