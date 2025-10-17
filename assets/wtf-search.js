/**
 * WTF Smart Search - Enhanced
 * Predictive search with GA4 tracking, query suggestions, and improved UX
 */

class WTFSmartSearch {
  constructor() {
    this.searchInput = document.querySelector('[data-predictive-search-input]');
    this.searchResults = document.querySelector('[data-predictive-search-results]');
    this.searchForm = document.querySelector('[data-predictive-search-form]');
    this.debounceTimer = null;
    this.currentQuery = '';
    this.isLoading = false;
    this.lastResultsCount = 0;
    this.lastTrackedQuery = '';
    this.analyticsProductLimit = 10;
    this.lastAnalyticsItems = [];

    if (this.searchInput) {
      this.init();
    }
  }

  init() {
    this.searchInput.addEventListener('input', this.handleInput.bind(this));
    this.searchInput.addEventListener('focus', this.handleFocus.bind(this));
    this.searchInput.addEventListener('blur', this.handleBlur.bind(this));

    // Handle keyboard navigation
    this.searchInput.addEventListener('keydown', this.handleKeydown.bind(this));

    // Handle clicks outside to close results
    document.addEventListener('click', this.handleDocumentClick.bind(this));

    if (this.searchResults) {
      this.searchResults.addEventListener('click', this.handleResultClick.bind(this));
    }

    // Track search form submissions
    if (this.searchForm) {
      this.searchForm.addEventListener('submit', this.handleFormSubmit.bind(this));
    }
    
    console.log('[WTF Search] Smart search initialized');
  }

  handleInput(event) {
    const query = event.target.value.trim();
    
    if (query.length < 2) {
      this.hideResults();
      return;
    }

    if (query === this.currentQuery) {
      return;
    }

    this.currentQuery = query;
    
    // Debounce the search (300ms)
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.performSearch(query);
    }, 300);
  }

  handleFocus() {
    if (this.currentQuery.length >= 2 && this.searchResults && this.searchResults.innerHTML.trim() !== '') {
      this.showResults();
    } else if (this.searchInput) {
      this.searchInput.setAttribute('aria-expanded', 'false');
    }
  }

  handleBlur(event) {
    // Delay hiding to allow for clicks on results
    setTimeout(() => {
      if (!this.searchResults?.contains(document.activeElement)) {
        this.hideResults();
      }
    }, 150);
  }

  handleKeydown(event) {
    if (!this.searchResults || this.searchResults.style.display === 'none') {
      return;
    }

    const items = this.searchResults.querySelectorAll('[data-predictive-search-item]');
    const currentActive = this.searchResults.querySelector('.active');
    let activeIndex = currentActive ? Array.from(items).indexOf(currentActive) : -1;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        activeIndex = Math.min(activeIndex + 1, items.length - 1);
        this.setActiveItem(items, activeIndex);
        break;
      case 'ArrowUp':
        event.preventDefault();
        activeIndex = Math.max(activeIndex - 1, -1);
        this.setActiveItem(items, activeIndex);
        break;
      case 'Enter':
        if (currentActive) {
          event.preventDefault();
          currentActive.click();
        }
        break;
      case 'Escape':
        this.hideResults();
        this.searchInput.blur();
        break;
    }
  }

  handleDocumentClick(event) {
    if (!this.searchInput?.contains(event.target) && !this.searchResults?.contains(event.target)) {
      this.hideResults();
    }
  }

  handleFormSubmit(event) {
    // Track search form submission
    const query = this.searchInput?.value.trim() || '';
    if (query && query !== this.lastTrackedQuery) {
      const payload = {
        search_term: query,
        results_count: this.lastResultsCount,
        item_list_name: 'Predictive Search'
      };

      if (this.lastAnalyticsItems.length > 0) {
        payload.items = this.lastAnalyticsItems.map(item => ({ ...item }));
      }

      this.dispatchAnalyticsEvent('view_search_results', payload);
      this.lastTrackedQuery = query;
    }
  }

  async performSearch(query) {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.showLoading();

    try {
      // Request 3 products + 2 pages (5 total results)
      const response = await fetch(
        `${window.WTF_ENV?.routes?.predictive_search_url || '/search/suggest.json'}?q=${encodeURIComponent(query)}&resources[type]=product,page&resources[limit_scope][product]=3&resources[limit_scope][page]=2`
      );
      
      if (!response.ok) {
        throw new Error('Search request failed');
      }

      const data = await response.json();
      this.displayResults(data, query);
      
      // Track search event with results count
      const resultsCount = this.calculateResultsCount(data);
      this.lastResultsCount = resultsCount;
      this.trackSearchEvent(query, resultsCount, data.resources);
      
    } catch (error) {
      console.error('[WTF Search] Error:', error);
      this.hideResults();
    } finally {
      this.isLoading = false;
    }
  }

  calculateResultsCount(data) {
    const { resources } = data;
    let count = 0;
    if (resources.products) count += resources.products.length;
    if (resources.pages) count += resources.pages.length;
    if (resources.articles) count += resources.articles.length;
    return count;
  }

  displayResults(data, query) {
    if (!this.searchResults) {
      return;
    }

    const { resources } = data || {};
    let html = '';
    let hasResults = false;
    let uniqueIdIndex = 0;
    let productAnalyticsIndex = 0;

    if (resources?.products && resources.products.length > 0) {
      hasResults = true;
      html += '<div class="predictive-search-section">';
      html += '<h3 class="predictive-search-section-title">Products</h3>';
      resources.products.slice(0, 3).forEach(product => {
        const priceDisplay = product.price ? this.formatPrice(product.price) : '';
        const rawPrice = product.price ?? '';
        const imageUrl = product.featured_image?.url || product.image?.url || '';
        const itemId = `predictive-search-item-${uniqueIdIndex++}`;
        const analyticsIndex = productAnalyticsIndex++;
        const category = product.product_type || product.type || '';
        const variantTitle = product.variant_title || '';
        const brand = product.vendor || '';
        const attributes = [
          `href="${this.escapeAttribute(product.url)}"`,
          'class="predictive-search-item"',
          'data-predictive-search-item',
          'data-predictive-search-item-type="product"',
          `data-item-id="${this.escapeAttribute(this.extractProductId(product))}"`,
          `data-item-name="${this.escapeAttribute(product.title)}"`,
          `data-item-category="${this.escapeAttribute(category)}"`,
          `data-item-price="${this.escapeAttribute(rawPrice)}"`,
          `data-item-analytics-index="${analyticsIndex}"`,
          `id="${itemId}"`,
          'role="option"'
        ];
        if (variantTitle) {
          attributes.push(`data-item-variant="${this.escapeAttribute(variantTitle)}"`);
        }
        if (brand) {
          attributes.push(`data-item-brand="${this.escapeAttribute(brand)}"`);
        }

        html += `
          <a ${attributes.join(' ')}>
            <div class="predictive-search-item-content">
              ${imageUrl ? `<img src="${this.escapeAttribute(imageUrl)}" alt="${this.escapeHtml(product.title)}" class="predictive-search-image" loading="lazy">` : ''}
              <div class="predictive-search-text">
                <div class="predictive-search-title">${this.highlightQuery(product.title, query)}</div>
                ${priceDisplay ? `<div class="predictive-search-price">${priceDisplay}</div>` : ''}
              </div>
            </div>
          </a>
        `;
      });
      html += '</div>';
    }

    if (resources?.pages && resources.pages.length > 0) {
      hasResults = true;
      html += '<div class="predictive-search-section">';
      html += '<h3 class="predictive-search-section-title">Pages</h3>';
      resources.pages.slice(0, 2).forEach(page => {
        const itemId = `predictive-search-item-${uniqueIdIndex++}`;
        html += `
          <a href="${this.escapeAttribute(page.url)}" class="predictive-search-item" data-predictive-search-item data-predictive-search-item-type="page" data-item-id="${this.escapeAttribute(page.url)}" data-item-name="${this.escapeAttribute(page.title)}" data-item-category="Content" id="${itemId}" role="option">
            <div class="predictive-search-item-content">
              <div class="predictive-search-text">
                <div class="predictive-search-title">${this.highlightQuery(page.title, query)}</div>
              </div>
            </div>
          </a>
        `;
      });
      html += '</div>';
    }

    // View all results CTA
    if (hasResults) {
      html += `
        <div class="predictive-search-footer">
          <a href="/search?q=${encodeURIComponent(query)}" class="predictive-search-view-all">
            View all results for "<strong>${this.escapeHtml(query)}</strong>"
          </a>
        </div>
      `;
    } else {
      html = `
        <div class="predictive-search-no-results">
          <p>No results found for "<strong>${this.escapeHtml(query)}</strong>"</p>
          <p class="predictive-search-suggestions">Try searching for:</p>
          <div class="predictive-search-suggestions-list">
            <a href="/collections/kava-drinks" class="predictive-search-suggestion">Kava Drinks</a>
            <a href="/collections/kratom-teas" class="predictive-search-suggestion">Kratom Teas</a>
            <a href="/collections/thc-drinks" class="predictive-search-suggestion">THC Beverages</a>
          </div>
        </div>
      `;
    }

    this.searchResults.innerHTML = html;
    this.showResults();
  }

  showLoading() {
    if (this.searchResults) {
      this.searchResults.innerHTML = '<div class="predictive-search-loading"><span class="loading-spinner"></span> Searching...</div>';
      this.showResults();
    }
  }

  showResults() {
    if (this.searchResults) {
      this.searchResults.style.display = 'block';
      this.searchResults.setAttribute('aria-hidden', 'false');
    }
    if (this.searchInput) {
      this.searchInput.setAttribute('aria-expanded', 'true');
    }
  }

  hideResults() {
    if (this.searchResults) {
      this.searchResults.style.display = 'none';
      this.searchResults.setAttribute('aria-hidden', 'true');
    }
    if (this.searchInput) {
      this.searchInput.setAttribute('aria-expanded', 'false');
      this.searchInput.removeAttribute('aria-activedescendant');
    }
  }

  setActiveItem(items, activeIndex) {
    let activeId = '';
    items.forEach((item, index) => {
      if (index === activeIndex) {
        item.classList.add('active');
        item.setAttribute('aria-selected', 'true');
        item.scrollIntoView({ block: 'nearest' });
        if (item.id) {
          activeId = item.id;
        }
      } else {
        item.classList.remove('active');
        item.setAttribute('aria-selected', 'false');
      }
    });
    if (this.searchInput) {
      if (activeId) {
        this.searchInput.setAttribute('aria-activedescendant', activeId);
      } else {
        this.searchInput.removeAttribute('aria-activedescendant');
      }
    }
  }

  // Track search event to GA4
  trackSearchEvent(searchTerm, resultsCount, resources = {}) {
    const analyticsItems = this.buildAnalyticsItems(resources);
    this.lastAnalyticsItems = analyticsItems.map(item => ({ ...item }));

    const payload = {
      search_term: searchTerm,
      results_count: resultsCount,
      item_list_name: 'Predictive Search'
    };

    if (this.lastAnalyticsItems.length > 0) {
      payload.items = this.lastAnalyticsItems.map(item => ({ ...item }));
    }

    this.dispatchAnalyticsEvent('view_search_results', payload);
    this.lastTrackedQuery = searchTerm;

    console.log('[WTF Search] GA4 search event:', payload);
  }

  handleResultClick(event) {
    const target = event.target.closest('[data-predictive-search-item]');
    if (!target) {
      return;
    }

    const dataset = target.dataset || {};
    let analyticsItem = null;

    if (typeof dataset.itemAnalyticsIndex !== 'undefined') {
      const parsedIndex = parseInt(dataset.itemAnalyticsIndex, 10);
      if (!Number.isNaN(parsedIndex) && this.lastAnalyticsItems[parsedIndex]) {
        analyticsItem = { ...this.lastAnalyticsItems[parsedIndex] };
        if (typeof analyticsItem.index === 'undefined') {
          analyticsItem.index = parsedIndex;
        }
      }
    }

    if (!analyticsItem) {
      analyticsItem = this.buildAnalyticsItemFromElement(target);
    }

    if (analyticsItem) {
      if (!analyticsItem.quantity) {
        analyticsItem.quantity = 1;
      }
      this.trackSelectItem(analyticsItem);
    }
  }

  trackSelectItem(itemData) {
    if (!itemData || !itemData.item_id) {
      return;
    }

    const item = { ...itemData };
    if (!item.quantity) {
      item.quantity = 1;
    }

    const payload = {
      search_term: this.currentQuery,
      item_list_name: 'Predictive Search',
      items: [item]
    };

    this.dispatchAnalyticsEvent('select_item', payload);

    console.log('[WTF Search] GA4 select_item:', payload);
  }

  buildAnalyticsItems(resources) {
    if (!resources || !Array.isArray(resources.products)) {
      return [];
    }

    return resources.products.slice(0, this.analyticsProductLimit).map((product, index) => {
      const item = {
        item_id: this.extractProductId(product),
        item_name: product.title || '',
        index,
        quantity: 1
      };

      const category = product.product_type || product.type;
      if (category) {
        item.item_category = category;
      }

      const priceValue = this.parsePriceToNumber(product.price);
      if (priceValue !== null) {
        item.price = priceValue;
      }

      if (product.vendor) {
        item.item_brand = product.vendor;
      }

      if (product.variant_title) {
        item.item_variant = product.variant_title;
      }

      return item;
    });
  }

  buildAnalyticsItemFromElement(element) {
    if (!element) {
      return null;
    }

    const dataset = element.dataset || {};
    const item = {
      item_id: dataset.itemId || element.getAttribute('href') || '',
      item_name: dataset.itemName || element.textContent.trim() || '',
      quantity: 1
    };

    if (dataset.itemCategory) {
      item.item_category = dataset.itemCategory;
    }

    if (dataset.itemBrand) {
      item.item_brand = dataset.itemBrand;
    }

    if (dataset.itemVariant) {
      item.item_variant = dataset.itemVariant;
    }

    const priceValue = this.parsePriceToNumber(dataset.itemPrice);
    if (priceValue !== null) {
      item.price = priceValue;
    }

    if (typeof dataset.itemAnalyticsIndex !== 'undefined') {
      const parsedIndex = parseInt(dataset.itemAnalyticsIndex, 10);
      if (!Number.isNaN(parsedIndex)) {
        item.index = parsedIndex;
      }
    }

    return item;
  }

  dispatchAnalyticsEvent(eventName, payload) {
    try {
      if (window.WTFAnalytics && typeof window.WTFAnalytics.track === 'function') {
        window.WTFAnalytics.track(eventName, payload);
        return;
      }

      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, payload);
        return;
      }

      if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push({ event: eventName, ...payload });
      }
    } catch (error) {
      console.warn('[WTF Search] Analytics dispatch failed:', error);
    }
  }

  extractProductId(product) {
    if (!product) {
      return '';
    }

    if (product.id) {
      const idString = String(product.id);
      const match = idString.match(/Product\/(\d+)/);
      if (match && match[1]) {
        return match[1];
      }
      return idString;
    }

    if (product.product_id) {
      return String(product.product_id);
    }

    if (product.handle) {
      return product.handle;
    }

    return '';
  }

  parsePriceToNumber(price) {
    if (price === null || typeof price === 'undefined') {
      return null;
    }

    if (typeof price === 'number') {
      return price > 999 ? Math.round(price) / 100 : Number(price);
    }

    const normalized = String(price).replace(/[^0-9.,-]/g, '');
    if (!normalized) {
      return null;
    }

    const value = parseFloat(normalized.replace(',', '.'));
    if (Number.isNaN(value)) {
      return null;
    }

    return value;
  }

  escapeAttribute(value) {
    if (value === null || typeof value === 'undefined') {
      return '';
    }

    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Utility: Highlight query in text
  highlightQuery(text, query) {
    if (!query || query.length < 2) return this.escapeHtml(text);
    
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const escapedText = this.escapeHtml(text);
    
    return escapedText.replace(regex, '<mark>$1</mark>');
  }

  // Utility: Escape HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Utility: Format price
  formatPrice(price) {
    if (typeof price === 'string') return price;
    return `$${(price / 100).toFixed(2)}`;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new WTFSmartSearch();
  });
} else {
  new WTFSmartSearch();
}

// Export for potential external use
window.WTFSmartSearch = WTFSmartSearch;

