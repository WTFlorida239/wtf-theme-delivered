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
    if (this.currentQuery.length >= 2 && this.searchResults) {
      this.showResults();
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
    if (query) {
      this.trackSearchEvent(query, this.lastResultsCount);
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
      this.trackSearchEvent(query, resultsCount);
      
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

    const { resources } = data;
    let html = '';
    let hasResults = false;

    // Products (limit to 3)
    if (resources.products && resources.products.length > 0) {
      hasResults = true;
      html += '<div class="predictive-search-section">';
      html += '<h3 class="predictive-search-section-title">Products</h3>';
      resources.products.slice(0, 3).forEach(product => {
        const price = product.price ? this.formatPrice(product.price) : '';
        const imageUrl = product.featured_image?.url || product.image?.url || '';
        
        html += `
          <a href="${product.url}" class="predictive-search-item" data-predictive-search-item>
            <div class="predictive-search-item-content">
              ${imageUrl ? `<img src="${imageUrl}" alt="${this.escapeHtml(product.title)}" class="predictive-search-image" loading="lazy">` : ''}
              <div class="predictive-search-text">
                <div class="predictive-search-title">${this.highlightQuery(product.title, query)}</div>
                ${price ? `<div class="predictive-search-price">${price}</div>` : ''}
              </div>
            </div>
          </a>
        `;
      });
      html += '</div>';
    }

    // Pages (limit to 2)
    if (resources.pages && resources.pages.length > 0) {
      hasResults = true;
      html += '<div class="predictive-search-section">';
      html += '<h3 class="predictive-search-section-title">Pages</h3>';
      resources.pages.slice(0, 2).forEach(page => {
        html += `
          <a href="${page.url}" class="predictive-search-item" data-predictive-search-item>
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
  }

  hideResults() {
    if (this.searchResults) {
      this.searchResults.style.display = 'none';
      this.searchResults.setAttribute('aria-hidden', 'true');
    }
  }

  setActiveItem(items, activeIndex) {
    items.forEach((item, index) => {
      if (index === activeIndex) {
        item.classList.add('active');
        item.setAttribute('aria-selected', 'true');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('active');
        item.setAttribute('aria-selected', 'false');
      }
    });
  }

  // Track search event to GA4
  trackSearchEvent(searchTerm, resultsCount) {
    if (typeof window.WTFAnalytics !== 'undefined') {
      window.WTFAnalytics.track('search', {
        search_term: searchTerm,
        results_count: resultsCount
      });
    }
    
    // Also track via gtag directly if available
    if (typeof gtag !== 'undefined') {
      gtag('event', 'search', {
        search_term: searchTerm,
        results_count: resultsCount
      });
    }
    
    console.log('[WTF Search] Tracked:', { search_term: searchTerm, results_count: resultsCount });
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

