/**
 * WTF Predictive Search
 * Handles search suggestions and autocomplete functionality
 */

class WTFPredictiveSearch {
  constructor() {
    this.searchInput = document.querySelector('[data-predictive-search-input]');
    this.searchResults = document.querySelector('[data-predictive-search-results]');
    this.searchForm = document.querySelector('[data-predictive-search-form]');
    this.debounceTimer = null;
    this.currentQuery = '';
    this.isLoading = false;

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
    
    // Debounce the search
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
    if (!this.searchResults || !this.searchResults.style.display !== 'none') {
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

  async performSearch(query) {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.showLoading();

    try {
      const response = await fetch(`${window.routes.predictive_search_url}?q=${encodeURIComponent(query)}&resources[type]=product,page,article&resources[limit]=6`);
      
      if (!response.ok) {
        throw new Error('Search request failed');
      }

      const data = await response.json();
      this.displayResults(data);
    } catch (error) {
      console.error('Predictive search error:', error);
      this.hideResults();
    } finally {
      this.isLoading = false;
    }
  }

  displayResults(data) {
    if (!this.searchResults) {
      return;
    }

    const { resources } = data;
    let html = '';

    // Products
    if (resources.products && resources.products.length > 0) {
      html += '<div class="predictive-search-section">';
      html += '<h3>Products</h3>';
      resources.products.forEach(product => {
        html += `
          <a href="${product.url}" class="predictive-search-item" data-predictive-search-item>
            <div class="predictive-search-item-content">
              ${product.featured_image ? `<img src="${product.featured_image.url}" alt="${product.title}" class="predictive-search-image">` : ''}
              <div class="predictive-search-text">
                <div class="predictive-search-title">${product.title}</div>
                ${product.price ? `<div class="predictive-search-price">${product.price}</div>` : ''}
              </div>
            </div>
          </a>
        `;
      });
      html += '</div>';
    }

    // Pages
    if (resources.pages && resources.pages.length > 0) {
      html += '<div class="predictive-search-section">';
      html += '<h3>Pages</h3>';
      resources.pages.forEach(page => {
        html += `
          <a href="${page.url}" class="predictive-search-item" data-predictive-search-item>
            <div class="predictive-search-item-content">
              <div class="predictive-search-text">
                <div class="predictive-search-title">${page.title}</div>
              </div>
            </div>
          </a>
        `;
      });
      html += '</div>';
    }

    // Articles
    if (resources.articles && resources.articles.length > 0) {
      html += '<div class="predictive-search-section">';
      html += '<h3>Articles</h3>';
      resources.articles.forEach(article => {
        html += `
          <a href="${article.url}" class="predictive-search-item" data-predictive-search-item>
            <div class="predictive-search-item-content">
              <div class="predictive-search-text">
                <div class="predictive-search-title">${article.title}</div>
                ${article.summary ? `<div class="predictive-search-summary">${article.summary}</div>` : ''}
              </div>
            </div>
          </a>
        `;
      });
      html += '</div>';
    }

    if (html) {
      html += `
        <div class="predictive-search-footer">
          <a href="/search?q=${encodeURIComponent(this.currentQuery)}" class="predictive-search-view-all">
            View all results for "${this.currentQuery}"
          </a>
        </div>
      `;
    } else {
      html = `
        <div class="predictive-search-no-results">
          <p>No results found for "${this.currentQuery}"</p>
          <a href="/search?q=${encodeURIComponent(this.currentQuery)}">Search anyway</a>
        </div>
      `;
    }

    this.searchResults.innerHTML = html;
    this.showResults();
  }

  showLoading() {
    if (this.searchResults) {
      this.searchResults.innerHTML = '<div class="predictive-search-loading">Searching...</div>';
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
      } else {
        item.classList.remove('active');
        item.setAttribute('aria-selected', 'false');
      }
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new WTFPredictiveSearch();
});

// Export for potential external use
window.WTFPredictiveSearch = WTFPredictiveSearch;
