#!/usr/bin/env python3
"""
WTF | Welcome To Florida - Reconciliation Jobs
Phase 4.3: Nightly reconciliation jobs for metafield consistency

These jobs run on a schedule to detect and fix data drift, ensuring
the metafield/metaobject architecture remains healthy and complete.

Schedule:
- Metafield Consistency Scan: 2:00 AM local (daily)
- Menu Integrity Scan: 2:30 AM local (daily)
"""

import requests
import json
import csv
import os
from datetime import datetime
from typing import List, Dict, Optional
from pathlib import Path

# Configuration
SHOP_NAME = "accounts-wtfswag"
ACCESS_TOKEN = os.environ.get('SHOPIFY_ACCESS_TOKEN', 'your-access-token-here')
API_VERSION = "2024-10"
GRAPHQL_URL = f"https://{SHOP_NAME}.myshopify.com/admin/api/{API_VERSION}/graphql.json"

HEADERS = {
    "X-Shopify-Access-Token": ACCESS_TOKEN,
    "Content-Type": "application/json"
}

# Data directories
DATA_DIR = Path("/home/ubuntu/wtf-theme-delivered/data")
ARCHITECTURE_DIR = DATA_DIR / "architecture"
RUNTIME_DIR = DATA_DIR / "runtime"
REPORTS_DIR = DATA_DIR / "reports"
LOGS_DIR = DATA_DIR / "logs"

# Ensure directories exist
for dir_path in [ARCHITECTURE_DIR, RUNTIME_DIR, REPORTS_DIR, LOGS_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)


class ReconciliationJob:
    """Base class for reconciliation jobs"""
    
    def __init__(self):
        self.exec_log = []
        self.fixes_applied = []
        self.issues_found = []
    
    def execute_graphql(self, query: str) -> Optional[Dict]:
        """Execute GraphQL query with error handling"""
        try:
            response = requests.post(GRAPHQL_URL, headers=HEADERS, json={"query": query})
            response.raise_for_status()
            result = response.json()
            
            if "errors" in result:
                self.log_error("GraphQL Error", result["errors"])
                return None
            
            return result.get("data")
        except Exception as e:
            self.log_error("Request Failed", str(e))
            return None
    
    def log_action(self, action: str, details: Dict):
        """Log action to execution log"""
        self.exec_log.append({
            "timestamp": datetime.utcnow().isoformat(),
            "action": action,
            "details": details
        })
    
    def log_error(self, error_type: str, details):
        """Log error"""
        self.exec_log.append({
            "timestamp": datetime.utcnow().isoformat(),
            "error": error_type,
            "details": details
        })
    
    def save_exec_log(self, job_name: str):
        """Save execution log to file"""
        log_file = LOGS_DIR / f"{job_name}_{datetime.now().strftime('%Y%m%d')}.json"
        with open(log_file, 'w') as f:
            json.dump(self.exec_log, f, indent=2)
        print(f"   📄 Execution log saved: {log_file}")


class MetafieldConsistencyScan(ReconciliationJob):
    """
    Nightly scan to validate metafield presence and value domains.
    
    Validates:
    - inventory.active_ingredient presence and valid values
    - bar.menu_reference points to live bar_menu_item
    - Detects orphaned or stale references
    """
    
    VALID_INGREDIENTS = {'THC', 'Kratom', 'Kava', 'Mushroom', 'CBD', 'Caffeine'}
    
    def run(self, fix_mode: bool = True):
        """
        Run metafield consistency scan.
        
        Args:
            fix_mode: If True, auto-repair obvious issues
        """
        print("=" * 70)
        print("Metafield Consistency Scan")
        print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Fix Mode: {'ENABLED' if fix_mode else 'DISABLED'}")
        print("=" * 70)
        
        # Fetch all products with metafields
        products = self._fetch_all_products()
        print(f"\n📦 Fetched {len(products)} products")
        
        # Validate each product
        active_ingredient_map = {}
        bar_menu_item_map = {}
        
        for product in products:
            product_id = product['id']
            variants = product.get('variants', {}).get('edges', [])
            sku = variants[0]['node'].get('sku', 'N/A') if variants else 'N/A'
            title = product['title']
            
            # Check active_ingredient
            active_ingredient = self._get_metafield(product, 'inventory', 'active_ingredient')
            
            if active_ingredient:
                if active_ingredient in self.VALID_INGREDIENTS:
                    active_ingredient_map[sku] = {
                        "product_id": product_id,
                        "title": title,
                        "ingredient": active_ingredient
                    }
                else:
                    # Invalid ingredient value
                    self.issues_found.append({
                        "type": "invalid_ingredient",
                        "product_id": product_id,
                        "sku": sku,
                        "value": active_ingredient
                    })
                    
                    if fix_mode and active_ingredient == 'needs_review':
                        # Queue for manual review (don't auto-fix)
                        pass
            else:
                # Missing active_ingredient
                self.issues_found.append({
                    "type": "missing_ingredient",
                    "product_id": product_id,
                    "sku": sku,
                    "title": title
                })
            
            # Check bar.menu_reference
            bar_menu_ref = self._get_metafield(product, 'bar', 'menu_reference')
            
            if bar_menu_ref:
                # Validate reference points to live metaobject
                if self._validate_metaobject_exists(bar_menu_ref):
                    bar_menu_item_map[sku] = {
                        "product_id": product_id,
                        "title": title,
                        "metaobject_id": bar_menu_ref
                    }
                else:
                    # Stale reference
                    self.issues_found.append({
                        "type": "stale_bar_reference",
                        "product_id": product_id,
                        "sku": sku,
                        "metaobject_id": bar_menu_ref
                    })
                    
                    if fix_mode:
                        # Clear stale reference
                        self._clear_bar_reference(product_id)
                        self.fixes_applied.append({
                            "type": "cleared_stale_reference",
                            "product_id": product_id
                        })
        
        # Save maps
        self._save_map(active_ingredient_map, "active_ingredient_map.json")
        self._save_map(bar_menu_item_map, "bar_menu_item_map.json")
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 SCAN SUMMARY")
        print("=" * 70)
        print(f"✅ Products with valid active_ingredient: {len(active_ingredient_map)}")
        print(f"✅ Products with valid bar.menu_reference: {len(bar_menu_item_map)}")
        print(f"⚠️  Issues found: {len(self.issues_found)}")
        print(f"🔧 Fixes applied: {len(self.fixes_applied)}")
        
        # Save execution log
        self.save_exec_log("metafield_consistency_scan")
        
        return {
            "active_ingredient_map": active_ingredient_map,
            "bar_menu_item_map": bar_menu_item_map,
            "issues": self.issues_found,
            "fixes": self.fixes_applied
        }
    
    def _fetch_all_products(self) -> List[Dict]:
        """Fetch all products using cursor pagination"""
        products = []
        cursor = None
        
        while True:
            after_clause = f', after: "{cursor}"' if cursor else ''
            
            query = f"""
            {{
              products(first: 50{after_clause}) {{
                edges {{
                  cursor
                  node {{
                    id
                    title
                    variants(first: 1) {{
                      edges {{
                        node {{
                          sku
                        }}
                      }}
                    }}
                    metafields(first: 10) {{
                      edges {{
                        node {{
                          namespace
                          key
                          value
                        }}
                      }}
                    }}
                  }}
                }}
                pageInfo {{
                  hasNextPage
                }}
              }}
            }}
            """
            
            data = self.execute_graphql(query)
            if not data:
                break
            
            edges = data['products']['edges']
            for edge in edges:
                products.append(edge['node'])
                cursor = edge['cursor']
            
            if not data['products']['pageInfo']['hasNextPage']:
                break
        
        return products
    
    def _get_metafield(self, product: Dict, namespace: str, key: str) -> Optional[str]:
        """Get metafield value from product"""
        metafields = product.get('metafields', {}).get('edges', [])
        for edge in metafields:
            mf = edge['node']
            if mf['namespace'] == namespace and mf['key'] == key:
                return mf['value']
        return None
    
    def _validate_metaobject_exists(self, metaobject_id: str) -> bool:
        """Check if metaobject exists and is published"""
        query = f"""
        {{
          metaobject(id: "{metaobject_id}") {{
            id
            capabilities {{
              publishable {{
                status
              }}
            }}
          }}
        }}
        """
        
        data = self.execute_graphql(query)
        if data and data.get('metaobject'):
            status = data['metaobject'].get('capabilities', {}).get('publishable', {}).get('status')
            return status == 'ACTIVE'
        return False
    
    def _clear_bar_reference(self, product_id: str):
        """Clear stale bar.menu_reference"""
        mutation = f"""
        mutation {{
          productUpdate(input: {{
            id: "{product_id}"
            metafields: [{{
              namespace: "bar"
              key: "menu_reference"
              type: "metaobject_reference"
              value: null
            }}]
          }}) {{
            product {{ id }}
            userErrors {{ field message }}
          }}
        }}
        """
        self.execute_graphql(mutation)
    
    def _save_map(self, data: Dict, filename: str):
        """Save data map to architecture directory"""
        filepath = ARCHITECTURE_DIR / filename
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"   💾 Saved: {filepath}")


class MenuIntegrityScan(ReconciliationJob):
    """
    Nightly scan to validate bar_menu_item integrity.
    
    Validates:
    - All bar_menu_item records have valid product_reference
    - card_type, keg_status, display_order are within valid domains
    - Rebuilds bar menu cache
    """
    
    VALID_CARD_TYPES = {'draft', 'can', 'shot', 'keg'}
    VALID_KEG_STATUSES = {'full', 'half', 'empty', None}
    
    def run(self, fix_mode: bool = True):
        """Run menu integrity scan"""
        print("\n" + "=" * 70)
        print("Menu Integrity Scan")
        print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Fix Mode: {'ENABLED' if fix_mode else 'DISABLED'}")
        print("=" * 70)
        
        # Fetch all bar_menu_item metaobjects
        bar_menu_items = self._fetch_all_bar_menu_items()
        print(f"\n🍺 Fetched {len(bar_menu_items)} bar menu items")
        
        valid_items = []
        
        for item in bar_menu_items:
            item_id = item['id']
            fields = self._parse_fields(item['fields'])
            
            # Validate product_reference
            product_ref = fields.get('product_reference')
            if not product_ref or not self._validate_product_exists(product_ref):
                self.issues_found.append({
                    "type": "invalid_product_reference",
                    "metaobject_id": item_id,
                    "product_reference": product_ref
                })
                continue
            
            # Validate card_type
            card_type = fields.get('card_type', 'draft')
            if card_type not in self.VALID_CARD_TYPES:
                self.issues_found.append({
                    "type": "invalid_card_type",
                    "metaobject_id": item_id,
                    "card_type": card_type
                })
                
                if fix_mode:
                    # Normalize to 'draft'
                    self._update_field(item_id, 'card_type', 'draft')
                    fields['card_type'] = 'draft'
                    self.fixes_applied.append({
                        "type": "normalized_card_type",
                        "metaobject_id": item_id
                    })
            
            # Validate keg_status
            keg_status = fields.get('keg_status')
            if keg_status and keg_status not in self.VALID_KEG_STATUSES:
                self.issues_found.append({
                    "type": "invalid_keg_status",
                    "metaobject_id": item_id,
                    "keg_status": keg_status
                })
                
                if fix_mode:
                    # Clear invalid status
                    self._update_field(item_id, 'keg_status', None)
                    fields['keg_status'] = None
                    self.fixes_applied.append({
                        "type": "cleared_invalid_keg_status",
                        "metaobject_id": item_id
                    })
            
            valid_items.append({
                "id": item_id,
                "fields": fields
            })
        
        # Rebuild bar menu cache
        self._rebuild_bar_menu_cache(valid_items)
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 SCAN SUMMARY")
        print("=" * 70)
        print(f"✅ Valid bar menu items: {len(valid_items)}")
        print(f"⚠️  Issues found: {len(self.issues_found)}")
        print(f"🔧 Fixes applied: {len(self.fixes_applied)}")
        
        # Save execution log
        self.save_exec_log("menu_integrity_scan")
        
        return {
            "valid_items": valid_items,
            "issues": self.issues_found,
            "fixes": self.fixes_applied
        }
    
    def _fetch_all_bar_menu_items(self) -> List[Dict]:
        """Fetch all bar_menu_item metaobjects"""
        items = []
        cursor = None
        
        while True:
            after_clause = f', after: "{cursor}"' if cursor else ''
            
            query = f"""
            {{
              metaobjects(type: "bar_menu_item", first: 50{after_clause}) {{
                edges {{
                  cursor
                  node {{
                    id
                    fields {{
                      key
                      value
                    }}
                  }}
                }}
                pageInfo {{
                  hasNextPage
                }}
              }}
            }}
            """
            
            data = self.execute_graphql(query)
            if not data:
                break
            
            edges = data['metaobjects']['edges']
            for edge in edges:
                items.append(edge['node'])
                cursor = edge['cursor']
            
            if not data['metaobjects']['pageInfo']['hasNextPage']:
                break
        
        return items
    
    def _parse_fields(self, fields: List[Dict]) -> Dict:
        """Parse metaobject fields into dict"""
        return {field['key']: field['value'] for field in fields}
    
    def _validate_product_exists(self, product_id: str) -> bool:
        """Check if product exists"""
        query = f"""
        {{
          product(id: "{product_id}") {{
            id
          }}
        }}
        """
        
        data = self.execute_graphql(query)
        return data and data.get('product') is not None
    
    def _update_field(self, metaobject_id: str, key: str, value):
        """Update metaobject field"""
        mutation = f"""
        mutation {{
          metaobjectUpdate(
            id: "{metaobject_id}"
            metaobject: {{
              fields: [{{
                key: "{key}"
                value: {json.dumps(str(value) if value else "")}
              }}]
            }}
          ) {{
            metaobject {{ id }}
            userErrors {{ field message }}
          }}
        }}
        """
        self.execute_graphql(mutation)
    
    def _rebuild_bar_menu_cache(self, items: List[Dict]):
        """Rebuild bar menu cache JSON"""
        # Group by card_type
        cache = {
            "timestamp": datetime.utcnow().isoformat(),
            "total_items": len(items),
            "by_card_type": {
                "draft": [],
                "can": [],
                "shot": [],
                "keg": []
            }
        }
        
        for item in items:
            fields = item['fields']
            card_type = fields.get('card_type', 'draft')
            
            cache["by_card_type"][card_type].append({
                "metaobject_id": item['id'],
                "product_id": fields.get('product_reference'),
                "menu_label": fields.get('menu_label'),
                "size_oz": fields.get('size_oz'),
                "keg_status": fields.get('keg_status'),
                "display_order": fields.get('display_order', 999),
                "seasonal_flag": fields.get('seasonal_flag') == 'true'
            })
        
        # Sort by display_order
        for card_type in cache["by_card_type"]:
            cache["by_card_type"][card_type].sort(key=lambda x: x['display_order'])
        
        # Save cache
        cache_file = RUNTIME_DIR / "bar_menu_cache.json"
        with open(cache_file, 'w') as f:
            json.dump(cache, f, indent=2)
        
        print(f"   💾 Bar menu cache rebuilt: {cache_file}")


def main():
    """Run all reconciliation jobs"""
    print("=" * 70)
    print("WTF | Welcome To Florida")
    print("Nightly Reconciliation Jobs")
    print(f"Execution Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    # Job 1: Metafield Consistency Scan (2:00 AM)
    metafield_scan = MetafieldConsistencyScan()
    metafield_results = metafield_scan.run(fix_mode=True)
    
    # Job 2: Menu Integrity Scan (2:30 AM)
    menu_scan = MenuIntegrityScan()
    menu_results = menu_scan.run(fix_mode=True)
    
    # Combined summary
    print("\n" + "=" * 70)
    print("🎉 ALL JOBS COMPLETE")
    print("=" * 70)
    print(f"Total Issues Found: {len(metafield_results['issues']) + len(menu_results['issues'])}")
    print(f"Total Fixes Applied: {len(metafield_results['fixes']) + len(menu_results['fixes'])}")
    print("\nNext run: Tomorrow at 2:00 AM local")
    print("=" * 70)


if __name__ == "__main__":
    main()

