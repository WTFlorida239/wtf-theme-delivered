#!/bin/bash

# Weekly SEO Health Check Script
# Purpose: Run weekly SEO audits and generate reports
# Usage: ./scripts/weekly-seo-check.sh

set -e

SITE_URL="https://wtfswag.com"
REPORT_DIR="docs/seo-reports"
TIMESTAMP=$(date +%Y-%m-%d)
REPORT_FILE="$REPORT_DIR/seo-report-$TIMESTAMP.md"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Starting Weekly SEO Health Check for $SITE_URL"
echo "📅 Date: $TIMESTAMP"
echo ""

# Create report directory if it doesn't exist
mkdir -p "$REPORT_DIR"

# Initialize report
cat > "$REPORT_FILE" << EOF
# Weekly SEO Health Check - $TIMESTAMP

**Site**: $SITE_URL  
**Date**: $TIMESTAMP  
**Generated**: $(date)

---

## Executive Summary

EOF

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to add section to report
add_section() {
    echo "" >> "$REPORT_FILE"
    echo "## $1" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
}

# Function to add result to report
add_result() {
    echo "- $1" >> "$REPORT_FILE"
}

# 1. Check site accessibility
echo "1️⃣ Checking site accessibility..."
add_section "Site Accessibility"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Site is accessible (HTTP $HTTP_CODE)${NC}"
    add_result "✅ Site is accessible (HTTP $HTTP_CODE)"
else
    echo -e "${RED}❌ Site returned HTTP $HTTP_CODE${NC}"
    add_result "❌ Site returned HTTP $HTTP_CODE"
fi

# 2. Check HTTPS
echo "2️⃣ Checking HTTPS..."
add_section "HTTPS & Security"

if curl -s "$SITE_URL" | grep -q "https://"; then
    echo -e "${GREEN}✅ HTTPS is enabled${NC}"
    add_result "✅ HTTPS is enabled"
else
    echo -e "${YELLOW}⚠️ HTTPS check inconclusive${NC}"
    add_result "⚠️ HTTPS check inconclusive"
fi

# 3. Check robots.txt
echo "3️⃣ Checking robots.txt..."
add_section "Robots.txt"

ROBOTS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL/robots.txt")
if [ "$ROBOTS_CODE" = "200" ]; then
    echo -e "${GREEN}✅ robots.txt is accessible${NC}"
    add_result "✅ robots.txt is accessible"
    
    # Check for common issues
    ROBOTS_CONTENT=$(curl -s "$SITE_URL/robots.txt")
    
    if echo "$ROBOTS_CONTENT" | grep -q "Disallow: /"; then
        echo -e "${RED}❌ WARNING: robots.txt blocks all crawlers${NC}"
        add_result "❌ WARNING: robots.txt blocks all crawlers"
    fi
    
    if echo "$ROBOTS_CONTENT" | grep -q "Sitemap:"; then
        echo -e "${GREEN}✅ Sitemap declared in robots.txt${NC}"
        add_result "✅ Sitemap declared in robots.txt"
    else
        echo -e "${YELLOW}⚠️ No sitemap declared in robots.txt${NC}"
        add_result "⚠️ No sitemap declared in robots.txt"
    fi
else
    echo -e "${RED}❌ robots.txt not found (HTTP $ROBOTS_CODE)${NC}"
    add_result "❌ robots.txt not found (HTTP $ROBOTS_CODE)"
fi

# 4. Check sitemap
echo "4️⃣ Checking sitemap.xml..."
add_section "Sitemap"

SITEMAP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL/sitemap.xml")
if [ "$SITEMAP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ sitemap.xml is accessible${NC}"
    add_result "✅ sitemap.xml is accessible"
    
    # Count URLs in sitemap
    URL_COUNT=$(curl -s "$SITE_URL/sitemap.xml" | grep -o "<loc>" | wc -l)
    echo -e "${GREEN}✅ Sitemap contains $URL_COUNT URLs${NC}"
    add_result "✅ Sitemap contains $URL_COUNT URLs"
else
    echo -e "${RED}❌ sitemap.xml not found (HTTP $SITEMAP_CODE)${NC}"
    add_result "❌ sitemap.xml not found (HTTP $SITEMAP_CODE)"
fi

# 5. Check meta tags
echo "5️⃣ Checking meta tags..."
add_section "Meta Tags"

PAGE_CONTENT=$(curl -s "$SITE_URL")

# Check title
if echo "$PAGE_CONTENT" | grep -q "<title>"; then
    TITLE=$(echo "$PAGE_CONTENT" | grep -o "<title>[^<]*" | sed 's/<title>//')
    TITLE_LENGTH=${#TITLE}
    
    if [ $TITLE_LENGTH -le 60 ]; then
        echo -e "${GREEN}✅ Title tag present (${TITLE_LENGTH} chars)${NC}"
        add_result "✅ Title tag present (${TITLE_LENGTH} chars): \"$TITLE\""
    else
        echo -e "${YELLOW}⚠️ Title tag too long (${TITLE_LENGTH} chars, recommended: ≤60)${NC}"
        add_result "⚠️ Title tag too long (${TITLE_LENGTH} chars, recommended: ≤60)"
    fi
else
    echo -e "${RED}❌ Title tag missing${NC}"
    add_result "❌ Title tag missing"
fi

# Check meta description
if echo "$PAGE_CONTENT" | grep -q 'name="description"'; then
    DESC=$(echo "$PAGE_CONTENT" | grep -o 'name="description" content="[^"]*"' | sed 's/name="description" content="//' | sed 's/"$//')
    DESC_LENGTH=${#DESC}
    
    if [ $DESC_LENGTH -le 155 ]; then
        echo -e "${GREEN}✅ Meta description present (${DESC_LENGTH} chars)${NC}"
        add_result "✅ Meta description present (${DESC_LENGTH} chars)"
    else
        echo -e "${YELLOW}⚠️ Meta description too long (${DESC_LENGTH} chars, recommended: ≤155)${NC}"
        add_result "⚠️ Meta description too long (${DESC_LENGTH} chars, recommended: ≤155)"
    fi
else
    echo -e "${RED}❌ Meta description missing${NC}"
    add_result "❌ Meta description missing"
fi

# Check canonical
if echo "$PAGE_CONTENT" | grep -q 'rel="canonical"'; then
    echo -e "${GREEN}✅ Canonical tag present${NC}"
    add_result "✅ Canonical tag present"
else
    echo -e "${RED}❌ Canonical tag missing${NC}"
    add_result "❌ Canonical tag missing"
fi

# Check Open Graph
if echo "$PAGE_CONTENT" | grep -q 'property="og:'; then
    OG_COUNT=$(echo "$PAGE_CONTENT" | grep -o 'property="og:' | wc -l)
    echo -e "${GREEN}✅ Open Graph tags present ($OG_COUNT tags)${NC}"
    add_result "✅ Open Graph tags present ($OG_COUNT tags)"
else
    echo -e "${YELLOW}⚠️ Open Graph tags missing${NC}"
    add_result "⚠️ Open Graph tags missing"
fi

# Check Twitter Card
if echo "$PAGE_CONTENT" | grep -q 'name="twitter:'; then
    echo -e "${GREEN}✅ Twitter Card tags present${NC}"
    add_result "✅ Twitter Card tags present"
else
    echo -e "${YELLOW}⚠️ Twitter Card tags missing${NC}"
    add_result "⚠️ Twitter Card tags missing"
fi

# 6. Check structured data
echo "6️⃣ Checking structured data..."
add_section "Structured Data (Schema.org)"

if echo "$PAGE_CONTENT" | grep -q 'application/ld+json'; then
    SCHEMA_COUNT=$(echo "$PAGE_CONTENT" | grep -o 'application/ld+json' | wc -l)
    echo -e "${GREEN}✅ JSON-LD structured data found ($SCHEMA_COUNT blocks)${NC}"
    add_result "✅ JSON-LD structured data found ($SCHEMA_COUNT blocks)"
    
    # Check for specific schema types
    if echo "$PAGE_CONTENT" | grep -q '"@type".*"LocalBusiness"'; then
        echo -e "${GREEN}✅ LocalBusiness schema present${NC}"
        add_result "✅ LocalBusiness schema present"
    fi
    
    if echo "$PAGE_CONTENT" | grep -q '"@type".*"Organization"'; then
        echo -e "${GREEN}✅ Organization schema present${NC}"
        add_result "✅ Organization schema present"
    fi
    
    if echo "$PAGE_CONTENT" | grep -q '"@type".*"BreadcrumbList"'; then
        echo -e "${GREEN}✅ BreadcrumbList schema present${NC}"
        add_result "✅ BreadcrumbList schema present"
    fi
else
    echo -e "${YELLOW}⚠️ No JSON-LD structured data found${NC}"
    add_result "⚠️ No JSON-LD structured data found"
fi

# 7. Check mobile-friendliness
echo "7️⃣ Checking mobile-friendliness..."
add_section "Mobile Optimization"

if echo "$PAGE_CONTENT" | grep -q 'name="viewport"'; then
    echo -e "${GREEN}✅ Viewport meta tag present${NC}"
    add_result "✅ Viewport meta tag present"
else
    echo -e "${RED}❌ Viewport meta tag missing${NC}"
    add_result "❌ Viewport meta tag missing"
fi

# 8. Check page speed (basic)
echo "8️⃣ Checking page load time..."
add_section "Performance"

LOAD_TIME=$(curl -o /dev/null -s -w '%{time_total}\n' "$SITE_URL")
LOAD_TIME_MS=$(echo "$LOAD_TIME * 1000" | bc | cut -d. -f1)

if [ $LOAD_TIME_MS -lt 2000 ]; then
    echo -e "${GREEN}✅ Page load time: ${LOAD_TIME_MS}ms (Good)${NC}"
    add_result "✅ Page load time: ${LOAD_TIME_MS}ms (Good)"
elif [ $LOAD_TIME_MS -lt 3000 ]; then
    echo -e "${YELLOW}⚠️ Page load time: ${LOAD_TIME_MS}ms (Acceptable)${NC}"
    add_result "⚠️ Page load time: ${LOAD_TIME_MS}ms (Acceptable)"
else
    echo -e "${RED}❌ Page load time: ${LOAD_TIME_MS}ms (Slow)${NC}"
    add_result "❌ Page load time: ${LOAD_TIME_MS}ms (Slow)"
fi

# 9. Check for common SEO issues
echo "9️⃣ Checking for common SEO issues..."
add_section "Common SEO Issues"

# Check for noindex
if echo "$PAGE_CONTENT" | grep -q 'name="robots".*noindex'; then
    echo -e "${RED}❌ WARNING: Homepage has noindex tag${NC}"
    add_result "❌ WARNING: Homepage has noindex tag"
else
    echo -e "${GREEN}✅ No noindex tag on homepage${NC}"
    add_result "✅ No noindex tag on homepage"
fi

# Check for nofollow
if echo "$PAGE_CONTENT" | grep -q 'name="robots".*nofollow'; then
    echo -e "${YELLOW}⚠️ WARNING: Homepage has nofollow tag${NC}"
    add_result "⚠️ WARNING: Homepage has nofollow tag"
else
    echo -e "${GREEN}✅ No nofollow tag on homepage${NC}"
    add_result "✅ No nofollow tag on homepage"
fi

# 10. Summary
echo ""
echo "📊 Generating summary..."
add_section "Summary"

# Count issues
ERRORS=$(grep -c "❌" "$REPORT_FILE" || true)
WARNINGS=$(grep -c "⚠️" "$REPORT_FILE" || true)
SUCCESSES=$(grep -c "✅" "$REPORT_FILE" || true)

echo "- **Errors**: $ERRORS" >> "$REPORT_FILE"
echo "- **Warnings**: $WARNINGS" >> "$REPORT_FILE"
echo "- **Successes**: $SUCCESSES" >> "$REPORT_FILE"

# Calculate health score (simple formula)
TOTAL_CHECKS=$((ERRORS + WARNINGS + SUCCESSES))
HEALTH_SCORE=$(echo "scale=0; ($SUCCESSES * 100) / $TOTAL_CHECKS" | bc)

echo "" >> "$REPORT_FILE"
echo "**Overall SEO Health Score**: ${HEALTH_SCORE}/100" >> "$REPORT_FILE"

if [ $HEALTH_SCORE -ge 90 ]; then
    echo -e "${GREEN}✅ Overall SEO Health Score: ${HEALTH_SCORE}/100 (Excellent)${NC}"
elif [ $HEALTH_SCORE -ge 70 ]; then
    echo -e "${YELLOW}⚠️ Overall SEO Health Score: ${HEALTH_SCORE}/100 (Good)${NC}"
else
    echo -e "${RED}❌ Overall SEO Health Score: ${HEALTH_SCORE}/100 (Needs Improvement)${NC}"
fi

# Add recommendations
add_section "Recommendations"

if [ $ERRORS -gt 0 ]; then
    echo "1. **Fix critical errors** ($ERRORS found) - These directly impact SEO" >> "$REPORT_FILE"
fi

if [ $WARNINGS -gt 0 ]; then
    echo "2. **Address warnings** ($WARNINGS found) - These may impact SEO" >> "$REPORT_FILE"
fi

echo "3. **Run full Lighthouse audit** for detailed performance metrics" >> "$REPORT_FILE"
echo "4. **Check Google Search Console** for indexing issues" >> "$REPORT_FILE"
echo "5. **Review Core Web Vitals** in Google Search Console" >> "$REPORT_FILE"

# Footer
echo "" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "**Next Check**: $(date -d '+7 days' +%Y-%m-%d)" >> "$REPORT_FILE"
echo "**Generated by**: weekly-seo-check.sh" >> "$REPORT_FILE"

echo ""
echo "✅ Report saved to: $REPORT_FILE"
echo ""
echo "📧 To email this report:"
echo "   cat $REPORT_FILE | mail -s 'Weekly SEO Report - $TIMESTAMP' your@email.com"
echo ""
echo "🔗 To view in browser:"
echo "   markdown $REPORT_FILE > $REPORT_DIR/seo-report-$TIMESTAMP.html"
echo ""

exit 0
