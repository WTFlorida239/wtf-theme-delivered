#!/usr/bin/env python3
"""
Publish THC Drinks Hub Page to Shopify
Creates metafield definitions and publishes page with SEO metafields
"""

import requests
import json
import os
from typing import Dict, Optional

# Configuration
SHOP_NAME = "accounts-wtfswag"
ACCESS_TOKEN = os.environ.get('SHOPIFY_ACCESS_TOKEN', 'your-access-token-here')
API_VERSION = "2024-10"
GRAPHQL_URL = f"https://{SHOP_NAME}.myshopify.com/admin/api/{API_VERSION}/graphql.json"

HEADERS = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": ACCESS_TOKEN
}

def execute_graphql(query: str, variables: Optional[Dict] = None) -> Dict:
    """Execute a GraphQL query"""
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    
    response = requests.post(GRAPHQL_URL, headers=HEADERS, json=payload)
    response.raise_for_status()
    return response.json()

def create_metafield_definitions():
    """Create PAGE metafield definitions (idempotent)"""
    print("=" * 70)
    print("Creating PAGE Metafield Definitions")
    print("=" * 70)
    
    definitions = [
        {
            "name": "SEO Title",
            "namespace": "seo",
            "key": "title",
            "description": "Custom SEO title for Online Store Pages",
            "type": "single_line_text_field"
        },
        {
            "name": "SEO Description",
            "namespace": "seo",
            "key": "description",
            "description": "Custom meta description for Online Store Pages",
            "type": "multi_line_text_field"
        },
        {
            "name": "Keyword Focus",
            "namespace": "article",
            "key": "keyword_focus",
            "description": "Primary/secondary keyword targets for the article",
            "type": "list.single_line_text_field"
        },
        {
            "name": "Location Targets",
            "namespace": "article",
            "key": "locations",
            "description": "Geo targets for local SEO",
            "type": "list.single_line_text_field"
        }
    ]
    
    for defn in definitions:
        query = """
        mutation CreateMetafieldDefinition($input: MetafieldDefinitionInput!) {
          metafieldDefinitionCreate(definition: $input) {
            createdDefinition {
              id
              name
              namespace
              key
            }
            userErrors {
              field
              message
            }
          }
        }
        """
        
        variables = {
            "input": {
                "name": defn["name"],
                "namespace": defn["namespace"],
                "key": defn["key"],
                "description": defn["description"],
                "ownerType": "PAGE",
                "type": defn["type"],
                "visibleToStorefrontApi": True
            }
        }
        
        try:
            result = execute_graphql(query, variables)
            
            if result.get("data", {}).get("metafieldDefinitionCreate", {}).get("createdDefinition"):
                created = result["data"]["metafieldDefinitionCreate"]["createdDefinition"]
                print(f"✅ Created: {defn['namespace']}.{defn['key']} (ID: {created['id']})")
            elif result.get("data", {}).get("metafieldDefinitionCreate", {}).get("userErrors"):
                errors = result["data"]["metafieldDefinitionCreate"]["userErrors"]
                # Check if it's "already exists" error (which is fine)
                if any("already exists" in err.get("message", "").lower() for err in errors):
                    print(f"⏭️  Already exists: {defn['namespace']}.{defn['key']}")
                else:
                    print(f"⚠️  Error creating {defn['namespace']}.{defn['key']}: {errors}")
        except Exception as e:
            print(f"❌ Exception creating {defn['namespace']}.{defn['key']}: {e}")
    
    print()

def find_page(handle: str) -> Optional[str]:
    """Find a page by handle"""
    print("\n" + "=" * 70)
    print("Checking for Existing Page")
    print("=" * 70)
    
    query = """
    query FindPages {
      pages(first: 250) {
        edges {
          node {
            id
            handle
            title
          }
        }
      }
    }
    """
    
    result = execute_graphql(query)
    
    pages = result.get("data", {}).get("pages", {}).get("edges", [])
    for page_edge in pages:
        page = page_edge.get("node", {})
        if page.get("handle") == handle:
            print(f"✅ Found existing page: {page['title']}")
            print(f"   ID: {page['id']}")
            return page["id"]
    
    print("⏭️  No existing page found")
    return None

def create_page(title: str, handle: str, body_html: str) -> Optional[str]:
    """Create a new page"""
    print("=" * 70)
    print("Creating Shopify Page")
    print("=" * 70)
    
    query = """
    mutation CreatePage($input: PageCreateInput!) {
      pageCreate(page: $input) {
        page {
          id
          handle
          title
        }
        userErrors {
          field
          message
        }
      }
    }
    """
    
    variables = {
        "input": {
            "title": title,
            "handle": handle,
            "body": body_html
        }
    }
    
    try:
        result = execute_graphql(query, variables)
        
        if result.get("data", {}).get("pageCreate", {}).get("page"):
            page = result["data"]["pageCreate"]["page"]
            print(f"✅ Page created: {page['title']}")
            print(f"   ID: {page['id']}")
            print(f"   Handle: {page['handle']}")
            print(f"   URL: https://{SHOP_NAME}.myshopify.com/pages/{page['handle']}")
            return page["id"]
        else:
            errors = result.get("data", {}).get("pageCreate", {}).get("userErrors", [])
            print(f"❌ Error creating page: {errors}")
            return None
    except Exception as e:
        print(f"❌ Exception creating page: {e}")
        return None

def populate_metafields(page_id: str):
    """Populate page metafields"""
    print()
    print("=" * 70)
    print("Populating Page Metafields")
    print("=" * 70)
    
    query = """
    mutation SetPageMetafields($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          namespace
          key
          value
        }
        userErrors {
          field
          message
        }
      }
    }
    """
    
    variables = {
        "metafields": [
            {
                "ownerId": page_id,
                "namespace": "seo",
                "key": "title",
                "type": "single_line_text_field",
                "value": "THC Drinks Near Me: The Florida Guide to Elevated, Alcohol-Free Vibes | WTF | Welcome To Florida"
            },
            {
                "ownerId": page_id,
                "namespace": "seo",
                "key": "description",
                "type": "multi_line_text_field",
                "value": "Discover THC drinks, seltzers, and hemp-derived beverages near Cape Coral. WTF | Welcome To Florida brings relaxing, alcohol-free vibes to Southwest Florida."
            },
            {
                "ownerId": page_id,
                "namespace": "article",
                "key": "keyword_focus",
                "type": "list.single_line_text_field",
                "value": json.dumps(["THC near me", "THC drinks near me", "THC seltzers", "hemp-derived THC", "alcohol-free drinks", "functional beverages"])
            },
            {
                "ownerId": page_id,
                "namespace": "article",
                "key": "locations",
                "type": "list.single_line_text_field",
                "value": json.dumps(["Cape Coral", "Fort Myers", "Naples", "SWFL"])
            }
        ]
    }
    
    try:
        result = execute_graphql(query, variables)
        
        if result.get("data", {}).get("metafieldsSet", {}).get("metafields"):
            metafields = result["data"]["metafieldsSet"]["metafields"]
            print(f"✅ {len(metafields)} metafields populated:")
            for mf in metafields:
                print(f"   • {mf['namespace']}.{mf['key']} (ID: {mf['id']})")
        else:
            errors = result.get("data", {}).get("metafieldsSet", {}).get("userErrors", [])
            print(f"❌ Error populating metafields: {errors}")
    except Exception as e:
        print(f"❌ Exception populating metafields: {e}")

def main():
    print("\n" + "=" * 70)
    print("WTF | Welcome To Florida")
    print("THC Drinks Hub Page Publisher")
    print("=" * 70 + "\n")
    
    # Step 1: Create metafield definitions
    create_metafield_definitions()
    
    # Step 2: Check if page already exists
    handle = "thc-drinks-near-me"
    existing_page_id = find_page(handle)
    
    if existing_page_id:
        print("⏭️  Page already exists")
        print(f"   ID: {existing_page_id}")
        print(f"   URL: https://wtfswag.com/pages/{handle}")
        print(f"   Skipping page creation, will update metafields only.\n")
        page_id = existing_page_id
    else:
        # Step 3: Create the page
        title = "THC Drinks Near Me: The Florida Guide to Elevated, Alcohol-Free Vibes"
        
        # Read the article content
        with open("/home/ubuntu/thc-drinks-hub-article.md", "r") as f:
            content = f.read()
        
        # Extract body content (skip meta tags and schema)
        body_start = content.find("## The Rise of the Social Seltzer")
        body_end = content.find("### JSON-LD Schema")
        
        if body_start != -1 and body_end != -1:
            body_content = content[body_start:body_end].strip()
        else:
            body_content = content
        
        # Convert markdown to HTML (simple conversion)
        body_html = body_content.replace("\n\n", "</p><p>")
        body_html = f"<p>{body_html}</p>"
        body_html = body_html.replace("## ", "<h2>").replace("\n", "</h2>\n", 1)
        body_html = body_html.replace("**", "<strong>").replace("**", "</strong>")
        
        page_id = create_page(title, handle, body_html)
        
        if not page_id:
            print("\n❌ Failed to create page. Exiting.")
            return
    
    # Step 4: Populate metafields
    populate_metafields(page_id)
    
    print("\n" + "=" * 70)
    print("✅ COMPLETE")
    print("=" * 70)
    print(f"\nPage URL: https://wtfswag.com/pages/{handle}")
    print(f"Admin URL: https://{SHOP_NAME}.myshopify.com/admin/pages")
    print("\nNext steps:")
    print("1. Visit the page and verify content displays correctly")
    print("2. Check SEO metafields in Shopify Admin")
    print("3. Test with Google Rich Results Test")
    print("4. Submit to Google Search Console for indexing")
    print()

if __name__ == "__main__":
    main()

