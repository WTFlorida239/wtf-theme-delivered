/**
 * Script to create blog pages using Shopify Admin API
 * This script creates all the blog pages programmatically
 */

const fs = require('fs');
const path = require('path');

// You'll need to set these environment variables or replace with your actual values
const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL || 'wtfswag.myshopify.com';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN_HERE';

const blogPages = [
  {
    title: 'WTF Blog',
    handle: 'blog',
    body: `<div style="text-align: center; padding: 40px;">
      <h1 style="color: #ff6600; font-size: 3rem;">WTF Blog</h1>
      <p style="font-size: 1.2rem; margin-bottom: 40px;">Discover the world of kava, kratom, and wellness culture in Cape Coral.</p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; max-width: 1200px; margin: 0 auto;">
        <div style="background: white; padding: 25px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          <h3><a href="/pages/what-is-kava-beginners-guide" style="color: #ff6600; text-decoration: none;">What is Kava? A Beginner's Guide</a></h3>
          <p>Discover what kava is, how it's prepared, and why it's becoming a popular alcohol-free alternative in Cape Coral.</p>
        </div>
        <div style="background: white; padding: 25px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          <h3><a href="/pages/what-is-kratom-florida-botanical" style="color: #ff6600; text-decoration: none;">What is Kratom? Florida's Favorite Botanical</a></h3>
          <p>Learn about kratom tea, different strains, and why it's a staple at our Cape Coral kava bar.</p>
        </div>
        <div style="background: white; padding: 25px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          <h3><a href="/pages/kava-vs-kratom-comparison" style="color: #ff6600; text-decoration: none;">Kava vs Kratom: Botanical Comparison</a></h3>
          <p>Learn the key differences between these botanicals and discover which one might be right for you.</p>
        </div>
        <div style="background: white; padding: 25px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          <h3><a href="/pages/alcohol-free-date-ideas-cape-coral" style="color: #ff6600; text-decoration: none;">5 Alcohol-Free Date Ideas in Cape Coral</a></h3>
          <p>Creative ideas for memorable alcohol-free dates in Southwest Florida, from kava experiences to sunset adventures.</p>
        </div>
      </div>
    </div>`,
    templateSuffix: 'blog',
    seoTitle: 'WTF Blog | Kava, Kratom & Cape Coral Wellness',
    seoDescription: 'Discover the latest insights about kava, kratom, and wellness culture in Cape Coral from Southwest Florida\'s premier kava bar.'
  },
  {
    title: 'What is Kava? A Beginner\'s Guide to the South Pacific\'s Relaxation Root',
    handle: 'what-is-kava-beginners-guide',
    body: '', // Will be loaded from template file
    templateSuffix: 'what-is-kava-beginners-guide',
    seoTitle: 'What is Kava? A Beginner\'s Guide | WTF Cape Coral',
    seoDescription: 'Discover what kava is, how it\'s prepared, and why it\'s becoming a popular alcohol-free alternative in Cape Coral. Learn about kava\'s effects and benefits.'
  },
  {
    title: 'What is Kratom? Exploring Florida\'s Favorite Brewed Botanical',
    handle: 'what-is-kratom-florida-botanical',
    body: '', // Will be loaded from template file
    templateSuffix: 'what-is-kratom-florida-botanical',
    seoTitle: 'What is Kratom? Florida\'s Favorite Botanical | WTF Cape Coral',
    seoDescription: 'Learn what kratom tea is, the different strains we serve, and why it\'s a staple at our Cape Coral kava bar. Discover Green, Red, White, and Yellow strains.'
  },
  {
    title: 'Kava vs Kratom: How These Two Botanicals Compare',
    handle: 'kava-vs-kratom-comparison',
    body: '', // Will be loaded from template file
    templateSuffix: 'kava-vs-kratom-comparison',
    seoTitle: 'Kava vs Kratom: Botanical Comparison | WTF Cape Coral',
    seoDescription: 'Kava and kratom are popular at Florida kava bars — but they\'re not the same. Learn the differences and which one might be right for you.'
  },
  {
    title: '5 Alcohol-Free Date Ideas in Cape Coral',
    handle: 'alcohol-free-date-ideas-cape-coral',
    body: '', // Will be loaded from template file
    templateSuffix: 'alcohol-free-date-ideas-cape-coral',
    seoTitle: '5 Alcohol-Free Date Ideas in Cape Coral | WTF Southwest Florida',
    seoDescription: 'Looking for sober-curious or wellness-forward date night options in Cape Coral? Here are 5 creative ideas for memorable alcohol-free dates.'
  }
];

async function createPage(pageData) {
  const mutation = `
    mutation CreatePage($page: PageCreateInput!) {
      pageCreate(page: $page) {
        page {
          id
          title
          handle
        }
        userErrors {
          code
          field
          message
        }
      }
    }
  `;

  const variables = {
    page: {
      title: pageData.title,
      handle: pageData.handle,
      body: pageData.body,
      isPublished: true,
      templateSuffix: pageData.templateSuffix
    }
  };

  try {
    const response = await fetch(`https://${SHOPIFY_STORE_URL}/admin/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
      },
      body: JSON.stringify({
        query: mutation,
        variables: variables
      })
    });

    const result = await response.json();
    
    if (result.data?.pageCreate?.userErrors?.length > 0) {
      console.error(`Error creating page "${pageData.title}":`, result.data.pageCreate.userErrors);
      return false;
    }
    
    if (result.data?.pageCreate?.page) {
      console.log(`✅ Successfully created page: ${pageData.title} (${pageData.handle})`);
      return true;
    } else {
      console.error(`Failed to create page "${pageData.title}":`, result);
      return false;
    }
  } catch (error) {
    console.error(`Error creating page "${pageData.title}":`, error);
    return false;
  }
}

async function createAllBlogPages() {
  console.log('🚀 Starting blog page creation...\n');
  
  if (SHOPIFY_ACCESS_TOKEN === 'YOUR_ACCESS_TOKEN_HERE') {
    console.error('❌ Please set your SHOPIFY_ACCESS_TOKEN environment variable or update the script with your access token.');
    console.log('\nTo get an access token:');
    console.log('1. Go to your Shopify Admin → Apps and sales channels → Develop apps');
    console.log('2. Create a private app or use an existing one');
    console.log('3. Configure Admin API access scopes: write_content, write_online_store_pages');
    console.log('4. Install the app and copy the Admin API access token');
    return;
  }

  let successCount = 0;
  
  for (const pageData of blogPages) {
    const success = await createPage(pageData);
    if (success) successCount++;
    
    // Add a small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n🎉 Blog page creation complete!`);
  console.log(`✅ Successfully created: ${successCount}/${blogPages.length} pages`);
  
  if (successCount === blogPages.length) {
    console.log('\n🔗 Your blog pages are now accessible at:');
    blogPages.forEach(page => {
      console.log(`   • https://${SHOPIFY_STORE_URL.replace('.myshopify.com', '')}.com/pages/${page.handle}`);
    });
  }
}

// Run the script
if (require.main === module) {
  createAllBlogPages().catch(console.error);
}

module.exports = { createAllBlogPages, blogPages };
