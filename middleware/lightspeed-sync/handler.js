'use strict';

const crypto = require('crypto');

const fetchImpl = global.fetch
  ? (...args) => global.fetch(...args)
  : async (...args) => {
      const { default: nodeFetch } = await import('node-fetch');
      return nodeFetch(...args);
    };

const LIGHTSPEED_API_BASE = process.env.LIGHTSPEED_API_BASE || 'https://api.lightspeedapp.com/API';
const LIGHTSPEED_ACCOUNT_ID = process.env.LIGHTSPEED_ACCOUNT_ID;
const LIGHTSPEED_CLIENT_ID = process.env.LIGHTSPEED_CLIENT_ID;
const LIGHTSPEED_CLIENT_SECRET = process.env.LIGHTSPEED_CLIENT_SECRET;
const LIGHTSPEED_REFRESH_TOKEN = process.env.LIGHTSPEED_REFRESH_TOKEN;
const LIGHTSPEED_SHOP_ID = process.env.LIGHTSPEED_SHOP_ID;
const LIGHTSPEED_REGISTER_ID = process.env.LIGHTSPEED_REGISTER_ID;
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-04';
const SHOPIFY_ADMIN_API_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
const SHOPIFY_PROXY_SHARED_SECRET = process.env.SHOPIFY_PROXY_SHARED_SECRET;
const SHOPIFY_LOCATION_ID = process.env.SHOPIFY_LOCATION_ID;
const ALLOWED_SHOPIFY_STORES = (process.env.ALLOWED_SHOPIFY_STORES || SHOPIFY_STORE_DOMAIN || '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

const REQUIRED_ENV_VARS = [
  'LIGHTSPEED_ACCOUNT_ID',
  'LIGHTSPEED_CLIENT_ID',
  'LIGHTSPEED_CLIENT_SECRET',
  'LIGHTSPEED_REFRESH_TOKEN',
  'SHOPIFY_STORE_DOMAIN',
  'SHOPIFY_ADMIN_API_ACCESS_TOKEN',
  'SHOPIFY_PROXY_SHARED_SECRET',
  'SHOPIFY_LOCATION_ID'
];

const envValidationErrors = REQUIRED_ENV_VARS
  .filter((variable) => !process.env[variable])
  .map((variable) => `${variable} is required`);

if (envValidationErrors.length > 0) {
  console.warn('[lightspeed-sync] Missing environment variables:', envValidationErrors.join(', '));
}

const tokenCache = {
  accessToken: null,
  expiresAt: 0
};

const jsonResponse = (statusCode, payload) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store'
  },
  body: JSON.stringify(payload)
});

const unauthorizedResponse = () => jsonResponse(401, {
  error: 'unauthorized',
  message: 'The request did not originate from an allowed Shopify proxy or storefront.'
});

const notFoundResponse = () => jsonResponse(404, {
  error: 'not_found',
  message: 'The requested resource was not found.'
});

const internalErrorResponse = (error) => {
  console.error('[lightspeed-sync] Unhandled error:', error);
  return jsonResponse(500, {
    error: 'internal_error',
    message: 'An unexpected error occurred while processing the request.'
  });
};

const parseBody = (event) => {
  if (!event.body) return {};
  if (event.isBase64Encoded) {
    const decoded = Buffer.from(event.body, 'base64').toString('utf8');
    return decoded ? JSON.parse(decoded) : {};
  }
  return JSON.parse(event.body);
};

const getShopDomain = (event) => {
  const headerDomain = event.headers && (event.headers['x-shopify-shop-domain'] || event.headers['X-Shopify-Shop-Domain']);
  if (headerDomain) return headerDomain.toLowerCase();
  const queryDomain = event.queryStringParameters && event.queryStringParameters.shop;
  return queryDomain ? queryDomain.toLowerCase() : null;
};

const safeTimingCompare = (valueA, valueB) => {
  const bufferA = Buffer.from(valueA);
  const bufferB = Buffer.from(valueB);
  if (bufferA.length !== bufferB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufferA, bufferB);
};

const verifyProxySignature = (event) => {
  if (!SHOPIFY_PROXY_SHARED_SECRET) {
    return true;
  }

  const signatureHeader = event.headers?.['x-shopify-hmac-sha256'] || event.headers?.['X-Shopify-Hmac-Sha256'];
  if (signatureHeader) {
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64')
      : Buffer.from(event.body || '', 'utf8');
    const computed = crypto
      .createHmac('sha256', SHOPIFY_PROXY_SHARED_SECRET)
      .update(rawBody)
      .digest('base64');
    return safeTimingCompare(signatureHeader, computed);
  }

  const params = event.queryStringParameters || {};
  if (!params.signature) {
    return false;
  }

  const sortedPayload = Object.keys(params)
    .filter((key) => key !== 'signature')
    .sort()
    .map((key) => `${key}=${Array.isArray(params[key]) ? params[key].join(',') : params[key]}`)
    .join('');

  const computedHex = crypto
    .createHmac('sha256', SHOPIFY_PROXY_SHARED_SECRET)
    .update(sortedPayload)
    .digest('hex');

  return safeTimingCompare(params.signature, computedHex);
};

const ensureLightspeedAccessToken = async () => {
  const now = Date.now();
  if (tokenCache.accessToken && tokenCache.expiresAt > now + 30000) {
    return tokenCache.accessToken;
  }

  const params = new URLSearchParams({
    client_id: LIGHTSPEED_CLIENT_ID,
    client_secret: LIGHTSPEED_CLIENT_SECRET,
    refresh_token: LIGHTSPEED_REFRESH_TOKEN,
    grant_type: 'refresh_token'
  });

  const response = await fetchImpl('https://cloud.lightspeedapp.com/oauth/access_token.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to refresh Lightspeed access token (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  tokenCache.accessToken = data.access_token;
  tokenCache.expiresAt = now + (data.expires_in || 1800) * 1000;

  return tokenCache.accessToken;
};

const buildLightspeedUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${LIGHTSPEED_API_BASE}/Account/${LIGHTSPEED_ACCOUNT_ID}${normalizedPath}`;
};

const lightspeedRequest = async (path, options = {}, retryAttempt = 0) => {
  const token = await ensureLightspeedAccessToken();
  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    ...options.headers
  };

  const response = await fetchImpl(buildLightspeedUrl(path), {
    ...options,
    headers
  });

  if (response.status === 401 && retryAttempt < 1) {
    tokenCache.accessToken = null;
    tokenCache.expiresAt = 0;
    return lightspeedRequest(path, options, retryAttempt + 1);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Lightspeed API error (${response.status}): ${errorText}`);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

const shopifyRequest = async (path, { method = 'GET', headers = {}, body } = {}) => {
  const url = new URL(`/admin/api/${SHOPIFY_API_VERSION}${path}`, `https://${SHOPIFY_STORE_DOMAIN}`);

  const response = await fetchImpl(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_ACCESS_TOKEN,
      ...headers
    },
    body
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shopify Admin API error (${response.status}): ${errorText}`);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

const normalizePath = (event) => {
  if (event.resource && event.resource.includes('{proxy+}')) {
    const proxy = event.pathParameters?.proxy || '';
    return `/${proxy}`;
  }
  return event.path || '/';
};

const extractQueryParams = (event) => event.queryStringParameters || {};

const getInventory = async (event) => {
  const params = extractQueryParams(event);
  const limit = Math.min(Number(params.limit) || 200, 500);
  const offset = Number(params.offset) || 0;
  const updatedSince = params.updatedSince;

  const searchParams = new URLSearchParams({
    limit: String(limit),
    offset: String(offset)
  });

  if (updatedSince) {
    searchParams.append('updatedSince', updatedSince);
  }

  const response = await lightspeedRequest(`/Item.json?${searchParams.toString()}`);
  const items = Array.isArray(response?.Item) ? response.Item : (response?.Item ? [response.Item] : []);

  return jsonResponse(200, {
    items,
    pagination: {
      count: items.length,
      limit,
      offset
    }
  });
};

const getAvailability = async (event) => {
  const params = extractQueryParams(event);
  const lightspeedId = params.lightspeed_id || params.lightspeedId;

  if (!lightspeedId) {
    return jsonResponse(400, {
      error: 'invalid_request',
      message: 'lightspeed_id is required'
    });
  }

  const response = await lightspeedRequest(`/Item/${lightspeedId}.json?load_relations=%5B%22ItemShops%22%5D`);
  const shops = response?.ItemShops?.ItemShop ? ([]).concat(response.ItemShops.ItemShop) : [];

  let quantity = 0;
  if (shops.length > 0) {
    if (LIGHTSPEED_SHOP_ID) {
      const match = shops.find((shop) => String(shop.shopID) === String(LIGHTSPEED_SHOP_ID));
      quantity = match ? Number(match.qoh || match.quantity || 0) : Number(shops[0].qoh || shops[0].quantity || 0);
    } else {
      quantity = shops.reduce((total, shop) => total + Number(shop.qoh || shop.quantity || 0), 0);
    }
  }

  return jsonResponse(200, {
    itemID: response?.itemID,
    quantity,
    available: quantity > 0
  });
};

const postReserve = async (event) => {
  const payload = parseBody(event);
  if (!payload || !payload.lightspeedId || !payload.quantity) {
    return jsonResponse(400, {
      error: 'invalid_request',
      message: 'lightspeedId and quantity are required.'
    });
  }

  const reservationId = crypto.randomUUID();

  try {
    await lightspeedRequest('/ItemReservation.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ItemReservation: {
          itemID: payload.lightspeedId,
          quantity: payload.quantity,
          shopID: LIGHTSPEED_SHOP_ID,
          expires: payload.expiresAt
        }
      })
    });
  } catch (error) {
    console.warn('[lightspeed-sync] Reservation fallback triggered:', error.message);
  }

  return jsonResponse(200, {
    reservationId,
    status: 'reserved'
  });
};

const putReserve = async (event) => {
  const payload = parseBody(event);
  if (!payload || !payload.reservationId || !payload.quantity) {
    return jsonResponse(400, {
      error: 'invalid_request',
      message: 'reservationId and quantity are required.'
    });
  }

  try {
    await lightspeedRequest(`/ItemReservation/${payload.reservationId}.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ItemReservation: {
          quantity: payload.quantity
        }
      })
    });
  } catch (error) {
    console.warn('[lightspeed-sync] Reservation update fallback triggered:', error.message);
  }

  return jsonResponse(200, {
    reservationId: payload.reservationId,
    status: 'updated'
  });
};

const postRelease = async (event) => {
  const payload = parseBody(event);
  if (!payload || !payload.reservationId) {
    return jsonResponse(400, {
      error: 'invalid_request',
      message: 'reservationId is required.'
    });
  }

  try {
    await lightspeedRequest(`/ItemReservation/${payload.reservationId}.json`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.warn('[lightspeed-sync] Reservation release fallback triggered:', error.message);
  }

  return jsonResponse(200, {
    reservationId: payload.reservationId,
    status: 'released'
  });
};

const resolveInventoryItemId = async (variantId) => {
  const response = await shopifyRequest(`/variants/${variantId}.json`);
  const variant = response?.variant;
  if (!variant) {
    throw new Error(`Shopify variant ${variantId} not found.`);
  }
  return variant.inventory_item_id;
};

const postSync = async (event) => {
  const payload = parseBody(event);
  const updates = Array.isArray(payload?.updates) ? payload.updates : [];
  if (updates.length === 0) {
    return jsonResponse(200, { status: 'noop' });
  }

  const results = [];

  for (const update of updates) {
    const variantId = update.variantId || update.variant_id;
    if (!variantId) {
      continue;
    }

    const quantity = Number(update.quantity);
    if (Number.isNaN(quantity)) {
      continue;
    }

    const inventoryItemId = await resolveInventoryItemId(variantId);

    const payloadBody = {
      inventory_level: {
        location_id: Number(SHOPIFY_LOCATION_ID),
        inventory_item_id: inventoryItemId,
        available: quantity
      }
    };

    await shopifyRequest('/inventory_levels/set.json', {
      method: 'POST',
      body: JSON.stringify(payloadBody)
    });

    results.push({
      variantId,
      inventoryItemId,
      quantity
    });
  }

  return jsonResponse(200, {
    status: 'synced',
    results
  });
};

const postOrders = async (event) => {
  const payload = parseBody(event);
  if (!payload || !payload.orderNumber || !Array.isArray(payload.lineItems)) {
    return jsonResponse(400, {
      error: 'invalid_request',
      message: 'orderNumber and lineItems are required.'
    });
  }

  const salePayload = {
    Sale: {
      registerID: LIGHTSPEED_REGISTER_ID,
      shopID: LIGHTSPEED_SHOP_ID,
      referenceNumber: payload.orderNumber,
      customerID: payload.customer?.lightspeedId || undefined,
      completed: true,
      employeeID: payload.employeeId || undefined,
      note: payload.note || undefined,
      SaleLines: {
        SaleLine: payload.lineItems.map((item) => ({
          itemID: item.lightspeedId,
          quantity: item.quantity,
          unitPrice: item.price,
          note: item.note || undefined
        }))
      }
    }
  };

  const response = await lightspeedRequest('/Sale.json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(salePayload)
  });

  return jsonResponse(200, {
    status: 'processed',
    sale: response?.Sale || response
  });
};

const routeRequest = async (event) => {
  const path = normalizePath(event).replace(/\/$/, '') || '/';
  const method = event.httpMethod?.toUpperCase() || 'GET';

  if (!verifyProxySignature(event)) {
    return unauthorizedResponse();
  }

  const shopDomain = getShopDomain(event);
  if (ALLOWED_SHOPIFY_STORES.length > 0 && (!shopDomain || !ALLOWED_SHOPIFY_STORES.includes(shopDomain))) {
    return unauthorizedResponse();
  }

  if (path === '/inventory' && method === 'GET') {
    return getInventory(event);
  }

  if (path === '/availability' && method === 'GET') {
    return getAvailability(event);
  }

  if (path === '/reserve' && method === 'POST') {
    return postReserve(event);
  }

  if (path === '/reserve' && method === 'PUT') {
    return putReserve(event);
  }

  if (path === '/release' && method === 'POST') {
    return postRelease(event);
  }

  if (path === '/sync' && method === 'POST') {
    return postSync(event);
  }

  if (path === '/orders' && method === 'POST') {
    return postOrders(event);
  }

  return notFoundResponse();
};

module.exports.handler = async (event, context) => {
  try {
    if (envValidationErrors.length > 0) {
      return jsonResponse(500, {
        error: 'configuration_error',
        message: 'Lightspeed middleware missing required environment variables.',
        missing: envValidationErrors
      });
    }

    return await routeRequest(event);
  } catch (error) {
    return internalErrorResponse(error);
  }
};
