/**
 * Blog Setup Script for WTF Shopify Store
 * This script helps set up the blog structure and posts
 */

const blogSetupInstructions = {
  "step1": "Create Blog in Shopify Admin",
  "instructions": [
    "1. Go to Shopify Admin → Online Store → Blog posts",
    "2. Click 'Manage blogs'",
    "3. Click 'Add blog'",
    "4. Set blog handle to 'wtf-blog'",
    "5. Set blog title to 'WTF Blog'",
    "6. Set SEO title to 'WTF Blog | Kava, Kratom & Cape Coral Wellness'",
    "7. Set meta description to 'Discover the latest insights about kava, kratom, and wellness culture in Cape Coral from Southwest Florida's premier kava bar.'",
    "8. Save the blog"
  ],
  "step2": "Add Blog Posts",
  "blogPosts": [
    {
      "title": "What is Kava? A Beginner's Guide to the South Pacific's Relaxation Root",
      "handle": "what-is-kava-beginners-guide",
      "content": "Use content from templates/article.what-is-kava-beginners-guide.liquid",
      "tags": "kava, education, cape coral, wellness",
      "seo_title": "What is Kava? A Beginner's Guide | WTF Cape Coral",
      "meta_description": "Discover what kava is, how it's prepared, and why it's becoming a popular alcohol-free alternative in Cape Coral. Learn about kava's effects and benefits."
    },
    {
      "title": "What is Kratom? Exploring Florida's Favorite Brewed Botanical",
      "handle": "what-is-kratom-florida-botanical",
      "content": "Use content from templates/article.what-is-kratom-florida-botanical.liquid",
      "tags": "kratom, education, tea, botanical",
      "seo_title": "What is Kratom? Florida's Favorite Botanical | WTF Cape Coral",
      "meta_description": "Learn what kratom tea is, the different strains we serve, and why it's a staple at our Cape Coral kava bar. Discover Green, Red, White, and Yellow strains."
    },
    {
      "title": "Kava vs Kratom: How These Two Botanicals Compare",
      "handle": "kava-vs-kratom-comparison",
      "content": "Use content from templates/article.kava-vs-kratom-comparison.liquid",
      "tags": "kava, kratom, comparison, education",
      "seo_title": "Kava vs Kratom: Botanical Comparison | WTF Cape Coral",
      "meta_description": "Kava and kratom are popular at Florida kava bars — but they're not the same. Learn the differences and which one might be right for you."
    },
    {
      "title": "5 Alcohol-Free Date Ideas in Cape Coral",
      "handle": "alcohol-free-date-ideas-cape-coral",
      "content": "Use content from templates/article.alcohol-free-date-ideas-cape-coral.liquid",
      "tags": "cape coral, date ideas, alcohol-free, entertainment",
      "seo_title": "5 Alcohol-Free Date Ideas in Cape Coral | WTF Southwest Florida",
      "meta_description": "Looking for sober-curious or wellness-forward date night options in Cape Coral? Here are 5 creative ideas for memorable alcohol-free dates."
    }
  ]
};

console.log("Blog Setup Instructions:", JSON.stringify(blogSetupInstructions, null, 2));
