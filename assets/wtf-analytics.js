/**
 * WTF Analytics - MAX
 * Multi-platform tracking (GA4, Meta, TikTok) + geo/context enrichment + advanced matching.
 * Backwards compatible with existing WTFAnalytics API and drink builder helpers.
 */

(function () {
  'use strict';

  // ---------------------------
  // Config and feature flags
  // ---------------------------
  const config = {
    ga4: {
      measurementId: window.WTF_GA4_ID || null,
      enabled: false
    },
    facebook: {
      pixelId: window.WTF_FB_PIXEL_ID || null,
      enabled: false
    },
    tiktok: {
      pixelId: window.WTF_TIKTOK_PIXEL_ID || null,
      enabled: false
    },
    debug: !!window.WTF_ANALYTICS_DEBUG
  };

  // read from meta tags (Shopify settings -> meta we emit in head)
  function initConfig() {
    const ga4Meta = document.querySelector('meta[name="ga4-measurement-id"]');
    const fbMeta = document.querySelector('meta[name="facebook-pixel-id"]');
    const tiktokMeta = document.querySelector('meta[name="tiktok-pixel-id"]');

    if (ga4Meta?.content) {
      config.ga4.measurementId = ga4Meta.content;
      config.ga4.enabled = true;
    }
    if (fbMeta?.content) {
      config.facebook.pixelId = fbMeta.content;
      config.facebook.enabled = true;
    }
    if (tiktokMeta?.content) {
      config.tiktok.pixelId = tiktokMeta.content;
      config.tiktok.enabled = true;
    }
    if (config.debug) console.log('[WTF] Analytics Config:', JSON.parse(JSON.stringify(config)));
  }

  // ---------------------------
  // Consent (Shopify Customer Privacy API if present)
  // ---------------------------
  function hasConsent() {
    try {
      // If Shopify privacy API exists, check analytics consent
      const api = window.Shopify && window.Shopify.customerPrivacy;
      if (api && typeof api.userConsentPreferences === 'function') {
        const prefs = api.userConsentPreferences();
        // Allow analytics when marketing or analytics consented (tune if needed)
        return !!(prefs?.marketing || prefs?.analytics);
      }
    } catch {}
    // Fallback: assume consent true (theme owners can override)
    return true;
  }

  // ---------------------------
  // Distance to store (geolocation)
  // ---------------------------
  const STORE = {
    lat: (window.WTFConfig?.store?.address?.latitude) || 26.5629,
    lng: (window.WTFConfig?.store?.address?.longitude) || -81.9495,
    city: window.WTFConfig?.store?.address?.city || 'Cape Coral',
    region: window.WTFConfig?.store?.address?.region || 'FL'
  };

  function toRad(d) { return d * Math.PI / 180; }
  function haversineKm(a, b) {
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const s1 = Math.sin(dLat / 2), s2 = Math.sin(dLng / 2);
    const c = 2 * Math.asin(Math.sqrt(s1 * s1 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * s2 * s2));
    return Math.round((R * c) * 10) / 10;
  }

  const PageContext = {
    page_type: (window.Shopify && Shopify.designMode) ? 'editor' : (document.body.dataset?.template || 'page'),
    template: document.body.className,
    city: STORE.city,
    region: STORE.region,
    distance_km: null
  };

  function requestGeo() {
    if (!('geolocation' in navigator)) return;
    if (!hasConsent()) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const you = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        PageContext.distance_km = haversineKm(you, { lat: STORE.lat, lng: STORE.lng });
        window.WTFGeo = { ok: true, lat: you.lat, lng: you.lng, distance_km: PageContext.distance_km };
        document.dispatchEvent(new CustomEvent('wtf:geo:ready', { detail: window.WTFGeo }));
        if (config.debug) console.log('[WTF] Geo resolved:', window.WTFGeo);
      },
      () => {
        window.WTFGeo = { ok: false, distance_km: null };
        if (config.debug) console.log('[WTF] Geo denied or failed');
      },
      { enableHighAccuracy: false, timeout: 3500, maximumAge: 600000 }
    );
  }

  // ---------------------------
  // Advanced Matching (hash PII)
  // ---------------------------
  async function sha256(str) {
    try {
      if (!window.crypto?.subtle) return null;
      const enc = new TextEncoder().encode(str.trim().toLowerCase());
      const buf = await crypto.subtle.digest('SHA-256', enc);
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch { return null; }
  }

  async function buildAdvancedMatching() {
    if (!hasConsent()) return null;
    // Use customer email if available
    const email =
      (window?.WTF_ENV?.customerEmail) ||
      (window?.WTFConfig?.store?.email) ||
      null;

    if (!email) return null;
    const em = await sha256(email);
    if (!em) return null;
    // Extendable: phone, first/last name, etc., when available & allowed
    return { em };
  }

  // ---------------------------
  // Queues + guards
  // ---------------------------
  const initState = {
    ga4: false,
    facebook: false,
    tiktok: false,
    initialized: false
  };
  const pendingEvents = [];

  function flushQueue() {
    while (pendingEvents.length) {
      const { name, params } = pendingEvents.shift();
      emitAll(name, params);
    }
  }

  // ---------------------------
  // GA4
  // ---------------------------
  const GA4 = {
    async init() {
      if (!config.ga4.enabled || !config.ga4.measurementId) return;
      if (typeof window.gtag === 'undefined') {
        const s = document.createElement('script');
        s.async = true;
        s.src = `https://www.googletagmanager.com/gtag/js?id=${config.ga4.measurementId}`;
        document.head.appendChild(s);
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { dataLayer.push(arguments); };
      }
      gtag('js', new Date());

      // Optional: preload web-vitals if not present
      if (!window.webVitals) {
        const v = document.createElement('script');
        v.src = 'https://unpkg.com/web-vitals/dist/web-vitals.iife.js';
        v.async = true;
        document.head.appendChild(v);
      }

      const am = await buildAdvancedMatching();
      if (am) {
        try { gtag('set', 'user_data', { email: am.em }); } catch {}
      }

      gtag('config', config.ga4.measurementId, {
        page_title: document.title,
        page_location: window.location.href
      });

      initState.ga4 = true;
      if (config.debug) console.log('[WTF] GA4 init');
    },
    track(eventName, parameters = {}) {
      if (!initState.ga4 || typeof gtag === 'undefined') return;
      gtag('event', eventName, parameters);
      if (config.debug) console.log('[WTF] GA4 event:', eventName, parameters);
    }
  };

  // ---------------------------
  // Facebook Pixel
  // ---------------------------
  const FacebookPixel = {
    async init() {
      if (!config.facebook.enabled || !config.facebook.pixelId) return;
      if (typeof fbq === 'undefined') {
        !function (f, b, e, v, n, t, s) {
          if (f.fbq) return; n = f.fbq = function () { n.callMethod ?
            n.callMethod.apply(n, arguments) : n.queue.push(arguments) };
          if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
          n.queue = []; t = b.createElement(e); t.async = !0;
          t.src = v; s = b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t, s)
        }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      }

      const am = await buildAdvancedMatching();
      if (am) fbq('init', config.facebook.pixelId, am);
      else fbq('init', config.facebook.pixelId);

      fbq('track', 'PageView', PageContext);
      initState.facebook = true;
      if (config.debug) console.log('[WTF] FB Pixel init');
    },
    track(eventName, parameters = {}) {
      if (!initState.facebook || typeof fbq === 'undefined') return;
      fbq('track', eventName, parameters);
      if (config.debug) console.log('[WTF] FB event:', eventName, parameters);
    }
  };

  // ---------------------------
  // TikTok Pixel
  // ---------------------------
  const TikTokPixel = {
    init() {
      if (!config.tiktok.enabled || !config.tiktok.pixelId) return;
      if (typeof ttq === 'undefined') {
        !function (w, d, t) {
          w.TiktokAnalyticsObject = t;
          var ttq = w[t] = w[t] || [];
          ttq.methods = ["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
          ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } };
          for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
          ttq.instance = function (t) { for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e };
          ttq.load = function (e, n) {
            var i = "https://analytics.tiktok.com/i18n/pixel/events.js";
            ttq._i = ttq._i || {}, ttq._i[e] = [], ttq._i[e]._u = i, ttq._t = ttq._t || {}, ttq._t[e] = +new Date, ttq._o = ttq._o || {}, ttq._o[e] = n || {};
            var o = document.createElement("script"); o.type = "text/javascript", o.async = !0, o.src = i + "?sdkid=" + e + "&lib=" + t;
            var a = document.getElementsByTagName("script")[0]; a.parentNode.insertBefore(o, a)
          }
        }(window, document, 'ttq');
      }
      ttq.load(config.tiktok.pixelId);
      ttq.page(PageContext);
      initState.tiktok = true;
      if (config.debug) console.log('[WTF] TikTok init');
    },
    track(eventName, parameters = {}) {
      if (!initState.tiktok || typeof ttq === 'undefined') return;
      ttq.track(eventName, parameters);
      if (config.debug) console.log('[WTF] TikTok event:', eventName, parameters);
    }
  };

  // ---------------------------
  // Unified emitter
  // ---------------------------
  function emitAll(eventName, payload = {}) {
    const params = Object.assign({}, payload, PageContext);
    GA4.track(eventName, params);
    FacebookPixel.track(mapToFBEvent(eventName), mapToFBParams(params));
    TikTokPixel.track(mapToTTEvent(eventName), mapToTTParams(params));
  }

  // Simple mappers (extend as needed)
  function mapToFBEvent(name) {
    const map = {
      'add_to_cart': 'AddToCart',
      'begin_checkout': 'InitiateCheckout',
      'purchase': 'Purchase',
      'page_view': 'PageView',
      'view_item': 'ViewContent'
    };
    return map[name] || name;
  }
  function mapToTTEvent(name) {
    const map = {
      'add_to_cart': 'AddToCart',
      'begin_checkout': 'InitiateCheckout',
      'purchase': 'CompletePayment',
      'page_view': 'ViewContent',
      'view_item': 'ViewContent'
    };
    return map[name] || name;
  }
  function mapToFBParams(p) {
    // FB prefers content_ids/content_type/value/currency
    const base = { ...p };
    if (!base.currency) base.currency = 'USD';
    return base;
  }
  function mapToTTParams(p) {
    const base = { ...p };
    if (!base.currency) base.currency = 'USD';
    return base;
  }

  // ---------------------------
  // E-commerce helpers (kept from your version, enriched)
  // ---------------------------
  const Ecommerce = {
    trackBeginCustomization(productData) {
      const eventData = {
        currency: 'USD',
        value: productData.price || 0,
        items: [{
          item_id: productData.id,
          item_name: productData.name || 'Custom Drink',
          item_category: productData.type || 'Beverages',
          price: productData.price || 0,
          quantity: 1
        }]
      };
      emitAll('begin_checkout', eventData);
    },

    trackAddToCart(productData, customizations = {}) {
      const eventData = {
        currency: 'USD',
        value: productData.price || 0,
        items: [{
          item_id: productData.id,
          item_name: productData.name || 'Custom Drink',
          item_category: productData.type || 'Beverages',
          item_variant: customizations.size || '',
          price: productData.price || 0,
          quantity: 1,
          custom_strain: customizations.strain || '',
          custom_flavors: customizations.flavors || '',
          custom_size: customizations.size || ''
        }]
      };
      emitAll('add_to_cart', eventData);
      document.dispatchEvent(new CustomEvent('wtf:cart:add', { detail: eventData }));
    },

    trackPurchase(orderData) {
      const eventData = {
        transaction_id: orderData.order_id,
        value: orderData.total,
        currency: 'USD',
        items: orderData.items || []
      };
      emitAll('purchase', eventData);
    }
  };

  // ---------------------------
  // Web Vitals -> GA4
  // ---------------------------
  function trackCoreWebVitals() {
    if (!config.ga4.enabled) return;
    function send(name, value) { GA4.track(name, { value }); }
    if (window.webVitals) {
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = window.webVitals;
      getCLS(m => send('CLS', m.value));
      getFID(m => send('FID', m.value));
      getFCP(m => send('FCP', m.value));
      getLCP(m => send('LCP', m.value));
      getTTFB(m => send('TTFB', m.value));
    } else {
      // basic fallback
      if ('performance' in window) {
        window.addEventListener('load', () => {
          setTimeout(() => {
            const nav = performance.getEntriesByType('navigation')[0];
            if (nav) GA4.track('page_load_time', {
              value: Math.round(nav.loadEventEnd - nav.fetchStart)
            });
          }, 0);
        });
      }
    }
  }

  // ---------------------------
  // Main controller
  // ---------------------------
  const WTFAnalytics = window.WTFAnalytics || {
    async init() {
      initConfig();

      // initialize pixels (consent-aware)
      await GA4.init();
      await FacebookPixel.init();
      TikTokPixel.init();

      // request geo only after consent is known
      requestGeo();

      // initial page view for GA4 (explicit) + context for others
      emitAll('page_view', {});

      // track vitals
      trackCoreWebVitals();

      // public API
      window.wtfTrack = this.track.bind(this);

      initState.initialized = true;
      flushQueue();
    },

    track(eventName, data = {}) {
      if (!initState.initialized) {
        pendingEvents.push({ name: eventName, params: data });
        return;
      }
      emitAll(eventName, data);
    },

    // Drink builder convenience API (unchanged names)
    trackDrinkBuilder: {
      sizeChange(size, price) {
        WTFAnalytics.track('drink_size_selected', {
          custom_size: size,
          value: price,
          fbEvent: 'ViewContent'
        });
      },
      strainChange(strains) {
        WTFAnalytics.track('drink_strain_selected', {
          custom_strains: Array.isArray(strains) ? strains.join(', ') : `${strains}`
        });
      },
      flavorChange(flavors, totalPumps) {
        WTFAnalytics.track('drink_flavors_selected', {
          custom_flavors: Array.isArray(flavors) ? flavors.join(', ') : `${flavors}`,
          pump_count: totalPumps
        });
      },
      customizationComplete(customizationData) {
        WTFAnalytics.track('drink_customization_complete', {
          custom_size: customizationData.size,
          custom_strain: customizationData.strain,
          custom_flavors: customizationData.flavors,
          total_pumps: customizationData.totalPumps,
          final_price: customizationData.price
        });
      }
    }
  };

  // ---------------------------
  // Event Router - listens for custom events and pipes to pixels
  // ---------------------------
  const EventRouter = {
    init() {
      // Listen for system ready event
      document.addEventListener('wtf:system:ready', (e) => {
        if (config.debug) console.log('[WTF] System ready event:', e.detail);
        emitAll('system_ready', e.detail || {});
      });

      // Listen for cart add event
      document.addEventListener('wtf:cart:add', (e) => {
        if (config.debug) console.log('[WTF] Cart add event:', e.detail);
        const detail = e.detail || {};
        emitAll('add_to_cart', detail);
      });

      // Listen for checkout begin event
      document.addEventListener('wtf:checkout:begin', (e) => {
        if (config.debug) console.log('[WTF] Checkout begin event:', e.detail);
        const detail = e.detail || {};
        emitAll('begin_checkout', detail);
      });

      // Listen for purchase complete event
      document.addEventListener('wtf:purchase:complete', (e) => {
        if (config.debug) console.log('[WTF] Purchase complete event:', e.detail);
        const detail = e.detail || {};
        emitAll('purchase', detail);
      });

      // Listen for geo ready and check for nearby users
      document.addEventListener('wtf:geo:ready', (e) => {
        if (config.debug) console.log('[WTF] Geo ready event:', e.detail);
        const geo = e.detail || {};
        
        // Fire custom event if user is within 25km
        if (geo.distance_km !== null && geo.distance_km <= 25) {
          this.fireUserNearby(geo);
        }
      });

      if (config.debug) console.log('[WTF] Event router initialized');
    },

    fireUserNearby(geoData) {
      const eventData = {
        distance_km: geoData.distance_km,
        city: PageContext.city,
        region: PageContext.region,
        page_type: PageContext.page_type
      };

      // Track as Lead in Meta
      if (initState.facebook && typeof fbq !== 'undefined') {
        fbq('track', 'Lead', eventData);
        if (config.debug) console.log('[WTF] FB Lead event (user nearby):', eventData);
      }

      // Track as generate_lead in GA4
      if (initState.ga4 && typeof gtag !== 'undefined') {
        gtag('event', 'generate_lead', {
          ...eventData,
          event_category: 'engagement',
          event_label: 'user_nearby'
        });
        if (config.debug) console.log('[WTF] GA4 generate_lead event (user nearby):', eventData);
      }

      // Track in TikTok as CompleteRegistration (closest equivalent to lead)
      if (initState.tiktok && typeof ttq !== 'undefined') {
        ttq.track('CompleteRegistration', eventData);
        if (config.debug) console.log('[WTF] TikTok CompleteRegistration event (user nearby):', eventData);
      }

      // Dispatch custom event for other listeners
      document.dispatchEvent(new CustomEvent('wtf:user:nearby', { detail: eventData }));
    }
  };

  // ---------------------------
  // Enhanced emitAll with debug output
  // ---------------------------
  function emitAllWithDebug(eventName, payload = {}) {
    const enrichedParams = Object.assign({}, payload, PageContext);
    
    // Debug output if enabled
    if (config.debug) {
      console.group(`[WTF Analytics] Event: ${eventName}`);
      console.log('Enriched Payload:', enrichedParams);
      console.log('GA4:', config.ga4.enabled ? 'enabled' : 'disabled');
      console.log('Meta:', config.facebook.enabled ? 'enabled' : 'disabled');
      console.log('TikTok:', config.tiktok.enabled ? 'enabled' : 'disabled');
      console.groupEnd();
    }
    
    // Call original emitAll
    emitAll(eventName, enrichedParams);
  }

  // Replace emitAll in WTFAnalytics.track
  const originalTrack = WTFAnalytics.track;
  WTFAnalytics.track = function(eventName, data = {}) {
    if (!initState.initialized) {
      pendingEvents.push({ name: eventName, params: data });
      return;
    }
    emitAllWithDebug(eventName, data);
  };

  // init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      WTFAnalytics.init();
      EventRouter.init();
      
      // Dispatch system ready event after initialization
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent('wtf:system:ready', {
          detail: {
            analytics_initialized: true,
            geo_available: !!window.WTFGeo,
            distance_km: PageContext.distance_km
          }
        }));
      }, 500);
    });
  } else {
    WTFAnalytics.init();
    EventRouter.init();
    
    // Dispatch system ready event after initialization
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('wtf:system:ready', {
        detail: {
          analytics_initialized: true,
          geo_available: !!window.WTFGeo,
          distance_km: PageContext.distance_km
        }
      }));
    }, 500);
  }

  // export
  window.WTFAnalytics = WTFAnalytics;
  window.WTFEventRouter = EventRouter;

})();
