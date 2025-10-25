#!/usr/bin/env python3
"""
WTF | Welcome To Florida - Webhook Handler
Phase 4.2: Inbound webhook processing with heuristic classification

This handler processes Shopify webhooks to automatically maintain
metafield and metaobject integrity for the dual-channel catalog strategy.

Deployment: Cloudflare Workers, AWS Lambda, or any Python-capable serverless platform
"""

import json
import hmac
import hashlib
import re
import os
from datetime import datetime
from typing import Dict, Optional, Tuple

# Configuration (set via environment variables in production)
SHOPIFY_WEBHOOK_SECRET = "your-webhook-secret-here"  # Set from Shopify Admin
SHOPIFY_API_KEY = "45e85cd35d398edb95907ef2b0828e72"
SHOPIFY_API_SECRET = "b6e2d95cfceef4a95c2d897be3d95a9a"
SHOPIFY_ACCESS_TOKEN = os.environ.get('SHOPIFY_ACCESS_TOKEN', 'your-access-token-here')
SHOP_NAME = "accounts-wtfswag"
API_VERSION = "2024-10"

# GraphQL endpoint
GRAPHQL_URL = f"https://{SHOP_NAME}.myshopify.com/admin/api/{API_VERSION}/graphql.json"

# Metaobject definition ID
BAR_MENU_ITEM_DEFINITION_ID = "gid://shopify/MetaobjectDefinition/4421157042"


class HeuristicClassifier:
    """
    Heuristic classification engine for automatic product categorization.
    
    Classifies products into:
    - Layer: 'bar' (on-premise consumption) or 'take-home' (e-commerce)
    - Ingredient: THC, Kratom, Kava, Mushroom, CBD, Caffeine, or 'needs_review'
    """
    
    # Ingredient detection patterns (order matters - most specific first)
    INGREDIENT_PATTERNS = [
        (r'\b(kava)\b', 'Kava'),
        (r'\b(kratom|mitragyna)\b', 'Kratom'),
        (r'\b(thc|delta-?9|delta-?8|cannabis|hemp living|mellow fellow)\b', 'THC'),
        (r'\b(mushroom|fungi|psilocybin|amanita|lion\'?s mane|reishi)\b', 'Mushroom'),
        (r'\b(cbd|cannabidiol)\b', 'CBD'),
        (r'\b(caffeine|coffee|energy)\b', 'Caffeine'),
    ]
    
    # Bar layer detection patterns
    BAR_PATTERNS = [
        r'\b(draft|keg|tap|on tap|pours?)\b',
        r'\b(shot|shots)\b',
        r'\b(can|canned|seltzer)\b',
        r'\b(beverage|drink|cocktail)\b',
    ]
    
    # Product type indicators for bar layer
    BAR_PRODUCT_TYPES = {
        'beverage', 'draft', 'shot', 'can', 'drink', 'seltzer', 
        'cocktail', 'pour', 'tap'
    }
    
    @classmethod
    def classify(cls, product: Dict) -> Tuple[str, str]:
        """
        Classify a product into layer and ingredient.
        
        Args:
            product: Product data from Shopify webhook
            
        Returns:
            Tuple of (layer, ingredient) where:
            - layer: 'bar' or 'take-home'
            - ingredient: 'THC', 'Kratom', 'Kava', 'Mushroom', 'CBD', 'Caffeine', or 'needs_review'
        """
        # Combine searchable text
        title = product.get('title', '').lower()
        product_type = product.get('product_type', '').lower()
        tags = ' '.join(product.get('tags', [])).lower()
        vendor = product.get('vendor', '').lower()
        
        search_text = f"{title} {product_type} {tags} {vendor}"
        
        # Detect ingredient
        ingredient = cls._detect_ingredient(search_text)
        
        # Detect layer
        layer = cls._detect_layer(search_text, product_type)
        
        return layer, ingredient
    
    @classmethod
    def _detect_ingredient(cls, text: str) -> str:
        """Detect active ingredient from text"""
        for pattern, ingredient in cls.INGREDIENT_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                return ingredient
        return 'needs_review'
    
    @classmethod
    def _detect_layer(cls, text: str, product_type: str) -> str:
        """Detect catalog layer (bar vs take-home)"""
        # Check product type first
        if product_type in cls.BAR_PRODUCT_TYPES:
            return 'bar'
        
        # Check text patterns
        for pattern in cls.BAR_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                return 'bar'
        
        return 'take-home'
    
    @classmethod
    def infer_card_type(cls, text: str) -> str:
        """Infer bar menu card type from text"""
        text = text.lower()
        if re.search(r'\b(draft|keg|tap|pour)\b', text):
            return 'draft'
        elif re.search(r'\b(can|canned|seltzer)\b', text):
            return 'can'
        elif re.search(r'\b(shot|shots)\b', text):
            return 'shot'
        elif re.search(r'\b(keg)\b', text):
            return 'keg'
        return 'draft'  # Default


class WebhookHandler:
    """Main webhook handler with idempotency and error handling"""
    
    def __init__(self):
        self.exec_log = []
    
    def verify_hmac(self, body: bytes, hmac_header: str) -> bool:
        """
        Verify Shopify webhook HMAC signature.
        
        Args:
            body: Raw request body bytes
            hmac_header: X-Shopify-Hmac-Sha256 header value
            
        Returns:
            True if signature is valid
        """
        computed_hmac = hmac.new(
            SHOPIFY_WEBHOOK_SECRET.encode('utf-8'),
            body,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(computed_hmac, hmac_header)
    
    def is_duplicate(self, gid: str, updated_at: str) -> bool:
        """
        Check if this webhook has already been processed.
        
        Uses (gid, updatedAt) as idempotency key.
        In production, check against Redis/DynamoDB/etc.
        """
        # TODO: Implement actual deduplication storage
        # For now, return False (process all)
        return False
    
    def log_action(self, operation: str, gid: str, result: str, details: Dict = None):
        """Log action to execution log"""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "operation": operation,
            "gid": gid,
            "result": result,
            "details": details or {}
        }
        self.exec_log.append(log_entry)
    
    def handle_products_create(self, product: Dict) -> Dict:
        """
        Handle PRODUCTS_CREATE webhook.
        
        Objective: Seed required metafields for new SKUs.
        """
        product_id = product['admin_graphql_api_id']
        updated_at = product.get('updated_at')
        
        # Idempotency check
        if self.is_duplicate(product_id, updated_at):
            self.log_action('products_create', product_id, 'skipped_duplicate')
            return {"status": "skipped", "reason": "duplicate"}
        
        # Classify product
        layer, ingredient = HeuristicClassifier.classify(product)
        
        self.log_action('products_create', product_id, 'classified', {
            "layer": layer,
            "ingredient": ingredient,
            "title": product.get('title')
        })
        
        actions = []
        
        # Set active_ingredient metafield
        if ingredient != 'needs_review':
            actions.append(self._set_active_ingredient(product_id, ingredient))
        else:
            # Queue for manual review
            actions.append({"action": "queue_review", "product_id": product_id})
        
        # Create bar menu item if bar layer
        if layer == 'bar':
            bar_item_id = self._create_bar_menu_item(product)
            if bar_item_id:
                actions.append(self._link_bar_menu_item(product_id, bar_item_id))
        
        return {
            "status": "processed",
            "layer": layer,
            "ingredient": ingredient,
            "actions": actions
        }
    
    def handle_products_update(self, product: Dict) -> Dict:
        """
        Handle PRODUCTS_UPDATE webhook.
        
        Objective: Re-evaluate classification as titles/tags/types change.
        """
        product_id = product['admin_graphql_api_id']
        updated_at = product.get('updated_at')
        
        # Idempotency check
        if self.is_duplicate(product_id, updated_at):
            self.log_action('products_update', product_id, 'skipped_duplicate')
            return {"status": "skipped", "reason": "duplicate"}
        
        # Re-classify product
        layer, ingredient = HeuristicClassifier.classify(product)
        
        self.log_action('products_update', product_id, 'reclassified', {
            "layer": layer,
            "ingredient": ingredient,
            "title": product.get('title')
        })
        
        actions = []
        
        # Update active_ingredient if changed
        current_ingredient = self._get_current_ingredient(product_id)
        if current_ingredient != ingredient and ingredient != 'needs_review':
            actions.append(self._set_active_ingredient(product_id, ingredient))
        
        # Handle bar layer changes
        current_layer = self._get_current_layer(product_id)
        
        if layer == 'bar' and current_layer != 'bar':
            # Product moved to bar layer - create bar menu item
            bar_item_id = self._create_bar_menu_item(product)
            if bar_item_id:
                actions.append(self._link_bar_menu_item(product_id, bar_item_id))
        
        elif layer != 'bar' and current_layer == 'bar':
            # Product moved out of bar layer - archive bar menu item
            actions.append(self._archive_bar_menu_item(product_id))
        
        return {
            "status": "processed",
            "layer": layer,
            "ingredient": ingredient,
            "actions": actions
        }
    
    def handle_metaobjects_create(self, metaobject: Dict) -> Dict:
        """Handle METAOBJECTS_CREATE webhook"""
        if metaobject.get('type') == 'bar_menu_item':
            # Trigger bar menu cache rebuild
            return {"status": "processed", "action": "rebuild_bar_menu_cache"}
        return {"status": "ignored"}
    
    def handle_metaobjects_update(self, metaobject: Dict) -> Dict:
        """Handle METAOBJECTS_UPDATE webhook"""
        if metaobject.get('type') == 'bar_menu_item':
            # Trigger bar menu cache rebuild
            return {"status": "processed", "action": "rebuild_bar_menu_cache"}
        return {"status": "ignored"}
    
    def handle_collections_update(self, collection: Dict) -> Dict:
        """Handle COLLECTIONS_UPDATE webhook"""
        # Check if collection uses inventory.active_ingredient in rules
        # If so, re-evaluate SKUs and backfill missing metafields
        return {"status": "processed", "action": "backfill_collection_metafields"}
    
    # Helper methods (GraphQL mutations)
    
    def _set_active_ingredient(self, product_id: str, ingredient: str) -> Dict:
        """Set inventory.active_ingredient metafield"""
        mutation = f"""
        mutation {{
          productUpdate(input: {{
            id: "{product_id}"
            metafields: [{{
              namespace: "inventory"
              key: "active_ingredient"
              type: "single_line_text_field"
              value: "{ingredient}"
            }}]
          }}) {{
            product {{ id }}
            userErrors {{ field message }}
          }}
        }}
        """
        # TODO: Execute GraphQL mutation
        return {"action": "set_active_ingredient", "ingredient": ingredient}
    
    def _create_bar_menu_item(self, product: Dict) -> Optional[str]:
        """Create bar_menu_item metaobject"""
        product_id = product['admin_graphql_api_id']
        title = product.get('title', '')
        
        # Infer card type
        search_text = f"{title} {product.get('product_type', '')}"
        card_type = HeuristicClassifier.infer_card_type(search_text)
        
        mutation = f"""
        mutation {{
          metaobjectCreate(metaobject: {{
            type: "bar_menu_item"
            fields: [
              {{ key: "product_reference", value: "{product_id}" }},
              {{ key: "menu_label", value: {json.dumps(title)} }},
              {{ key: "card_type", value: "{card_type}" }},
              {{ key: "display_order", value: "999" }},
              {{ key: "seasonal_flag", value: "false" }}
            ]
          }}) {{
            metaobject {{ id }}
            userErrors {{ field message }}
          }}
        }}
        """
        # TODO: Execute GraphQL mutation and return metaobject ID
        return "gid://shopify/Metaobject/PLACEHOLDER"
    
    def _link_bar_menu_item(self, product_id: str, bar_item_id: str) -> Dict:
        """Link product to bar_menu_item"""
        mutation = f"""
        mutation {{
          productUpdate(input: {{
            id: "{product_id}"
            metafields: [{{
              namespace: "bar"
              key: "menu_reference"
              type: "metaobject_reference"
              value: "{bar_item_id}"
            }}]
          }}) {{
            product {{ id }}
            userErrors {{ field message }}
          }}
        }}
        """
        # TODO: Execute GraphQL mutation
        return {"action": "link_bar_menu_item", "bar_item_id": bar_item_id}
    
    def _archive_bar_menu_item(self, product_id: str) -> Dict:
        """Archive (soft delete) bar_menu_item for product"""
        # First, get the bar_menu_item ID from product metafield
        # Then set it to DRAFT status
        mutation = f"""
        mutation {{
          metaobjectUpdate(
            id: "gid://shopify/Metaobject/METAOBJECT_ID"
            metaobject: {{
              capabilities: {{ publishable: {{ status: DRAFT }} }}
            }}
          ) {{
            metaobject {{ id }}
            userErrors {{ field message }}
          }}
        }}
        """
        # TODO: Execute GraphQL mutation
        return {"action": "archive_bar_menu_item"}
    
    def _get_current_ingredient(self, product_id: str) -> Optional[str]:
        """Get current active_ingredient value for product"""
        # TODO: Query product metafield
        return None
    
    def _get_current_layer(self, product_id: str) -> Optional[str]:
        """Determine current layer based on bar.menu_reference existence"""
        # TODO: Query product metafield
        return None


# Flask/FastAPI endpoint examples (choose your framework)

def flask_endpoint():
    """Example Flask endpoint"""
    from flask import Flask, request, jsonify
    
    app = Flask(__name__)
    handler = WebhookHandler()
    
    @app.route('/webhooks/products-create', methods=['POST'])
    def products_create():
        # Verify HMAC
        hmac_header = request.headers.get('X-Shopify-Hmac-Sha256')
        if not handler.verify_hmac(request.get_data(), hmac_header):
            return jsonify({"error": "Invalid HMAC"}), 401
        
        # Process webhook
        product = request.get_json()
        result = handler.handle_products_create(product)
        
        return jsonify(result), 200
    
    @app.route('/webhooks/products-update', methods=['POST'])
    def products_update():
        hmac_header = request.headers.get('X-Shopify-Hmac-Sha256')
        if not handler.verify_hmac(request.get_data(), hmac_header):
            return jsonify({"error": "Invalid HMAC"}), 401
        
        product = request.get_json()
        result = handler.handle_products_update(product)
        
        return jsonify(result), 200
    
    # Add other endpoints...
    
    return app


def cloudflare_worker():
    """
    Example Cloudflare Worker (JavaScript/Python)
    
    Deploy this to Cloudflare Workers for serverless webhook handling.
    """
    worker_code = """
    addEventListener('fetch', event => {
      event.respondWith(handleRequest(event.request))
    })

    async function handleRequest(request) {
      const url = new URL(request.url)
      
      // Route to appropriate handler
      if (url.pathname === '/webhooks/products-create') {
        return handleProductsCreate(request)
      }
      
      return new Response('Not Found', { status: 404 })
    }

    async function handleProductsCreate(request) {
      // Verify HMAC
      const hmac = request.headers.get('X-Shopify-Hmac-Sha256')
      const body = await request.text()
      
      if (!verifyHmac(body, hmac)) {
        return new Response('Unauthorized', { status: 401 })
      }
      
      // Process webhook
      const product = JSON.parse(body)
      // Call Python handler via fetch or implement logic here
      
      return new Response('OK', { status: 200 })
    }
    """
    return worker_code


if __name__ == "__main__":
    # Example usage
    handler = WebhookHandler()
    
    # Test product
    test_product = {
        "admin_graphql_api_id": "gid://shopify/Product/123456",
        "title": "Mitra 9 Draft Pour - Kratom",
        "product_type": "Beverage",
        "tags": ["kratom", "draft", "bar"],
        "vendor": "Mitra",
        "updated_at": "2025-10-24T12:00:00Z"
    }
    
    result = handler.handle_products_create(test_product)
    print(json.dumps(result, indent=2))

