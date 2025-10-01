# Blog Setup Guide

## 🎯 Quick Setup Instructions

Your blog posts are ready! You just need to create the pages in Shopify. Here are two ways to do it:

### Option 1: Automatic Setup (Recommended)

1. **Get your Shopify Admin API access token:**
   - Go to **Shopify Admin → Apps and sales channels → Develop apps**
   - Click **"Create an app"** or use an existing private app
   - Configure **Admin API access scopes**: `write_content`, `write_online_store_pages`
   - Install the app and copy the **Admin API access token**

2. **Run the setup script:**
   ```bash
   cd scripts
   SHOPIFY_ACCESS_TOKEN="your_token_here" node create-blog-pages.js
   ```

### Option 2: Manual Setup

Create each page manually in Shopify Admin:

1. Go to **Shopify Admin → Online Store → Pages**
2. Click **"Add page"** for each blog post
3. Use these exact settings:

#### Main Blog Page
- **Title:** `WTF Blog`
- **Handle:** `blog`
- **Template:** `page.blog`
- **SEO Title:** `WTF Blog | Kava, Kratom & Cape Coral Wellness`
- **Meta Description:** `Discover the latest insights about kava, kratom, and wellness culture in Cape Coral from Southwest Florida's premier kava bar.`

#### Blog Post 1: Kava Guide
- **Title:** `What is Kava? A Beginner's Guide to the South Pacific's Relaxation Root`
- **Handle:** `what-is-kava-beginners-guide`
- **Template:** `page.what-is-kava-beginners-guide`
- **SEO Title:** `What is Kava? A Beginner's Guide | WTF Cape Coral`
- **Meta Description:** `Discover what kava is, how it's prepared, and why it's becoming a popular alcohol-free alternative in Cape Coral. Learn about kava's effects and benefits.`

#### Blog Post 2: Kratom Guide
- **Title:** `What is Kratom? Exploring Florida's Favorite Brewed Botanical`
- **Handle:** `what-is-kratom-florida-botanical`
- **Template:** `page.what-is-kratom-florida-botanical`
- **SEO Title:** `What is Kratom? Florida's Favorite Botanical | WTF Cape Coral`
- **Meta Description:** `Learn what kratom tea is, the different strains we serve, and why it's a staple at our Cape Coral kava bar. Discover Green, Red, White, and Yellow strains.`

#### Blog Post 3: Kava vs Kratom
- **Title:** `Kava vs Kratom: How These Two Botanicals Compare`
- **Handle:** `kava-vs-kratom-comparison`
- **Template:** `page.kava-vs-kratom-comparison`
- **SEO Title:** `Kava vs Kratom: Botanical Comparison | WTF Cape Coral`
- **Meta Description:** `Kava and kratom are popular at Florida kava bars — but they're not the same. Learn the differences and which one might be right for you.`

#### Blog Post 4: Date Ideas
- **Title:** `5 Alcohol-Free Date Ideas in Cape Coral`
- **Handle:** `alcohol-free-date-ideas-cape-coral`
- **Template:** `page.alcohol-free-date-ideas-cape-coral`
- **SEO Title:** `5 Alcohol-Free Date Ideas in Cape Coral | WTF Southwest Florida`
- **Meta Description:** `Looking for sober-curious or wellness-forward date night options in Cape Coral? Here are 5 creative ideas for memorable alcohol-free dates.`

## 🔗 Adding Blog Navigation

To add a "Blog" link to your main navigation:

1. Go to **Shopify Admin → Online Store → Navigation**
2. Click on your main menu
3. Add a new menu item:
   - **Label:** `Blog`
   - **Link:** `/pages/blog`

## 📈 SEO Benefits

Once live, these blog posts will help you rank for:
- "What is kava" + Cape Coral variations
- "What is kratom" + Florida/Cape Coral terms
- "Kava vs kratom" comparison searches
- "Cape Coral date ideas" + alcohol-free variations
- Local search terms for kava bars in Southwest Florida

## 🎉 After Setup

Your blog will be accessible at:
- Main blog: `https://wtfswag.com/pages/blog`
- Individual posts: `https://wtfswag.com/pages/[handle]`

Each post includes:
- ✅ SEO-optimized content with local keywords
- ✅ Internal links to your product pages
- ✅ Professional styling matching your brand
- ✅ Schema markup for rich snippets
- ✅ Mobile-responsive design
