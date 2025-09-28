#!/bin/bash

# WTF Theme Development Setup Script
# This script sets up the development environment for the WTF Shopify theme

set -e

echo "🚀 Setting up WTF Theme development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Check if we're in the right directory
if [ ! -f "layout/theme.liquid" ]; then
    print_status $RED "❌ Error: Not in a Shopify theme directory"
    exit 1
fi

print_status $BLUE "📁 Current directory: $(pwd)"

# 1. Install Git hooks
print_status $YELLOW "🔧 Setting up Git hooks..."
if [ -d ".git" ]; then
    # Create hooks directory if it doesn't exist
    mkdir -p .git/hooks
    
    # Copy pre-commit hook
    if [ -f ".githooks/pre-commit" ]; then
        cp .githooks/pre-commit .git/hooks/pre-commit
        chmod +x .git/hooks/pre-commit
        print_status $GREEN "✅ Pre-commit hook installed"
    else
        print_status $YELLOW "⚠️ Pre-commit hook not found in .githooks/"
    fi
else
    print_status $YELLOW "⚠️ Not a Git repository, skipping Git hooks setup"
fi

# 2. Check Node.js installation
print_status $YELLOW "🔧 Checking Node.js..."
if command -v node >/dev/null 2>&1; then
    node_version=$(node --version)
    print_status $GREEN "✅ Node.js found: $node_version"
    
    # Install npm dependencies if package.json exists
    if [ -f "package.json" ]; then
        print_status $YELLOW "📦 Installing npm dependencies..."
        npm install
        print_status $GREEN "✅ npm dependencies installed"
    fi
else
    print_status $RED "❌ Node.js not found"
    print_status $YELLOW "Please install Node.js 18+ from https://nodejs.org/"
fi

# 3. Check Ruby installation
print_status $YELLOW "🔧 Checking Ruby..."
if command -v ruby >/dev/null 2>&1; then
    ruby_version=$(ruby --version)
    print_status $GREEN "✅ Ruby found: $ruby_version"
    
    # Install theme-check
    print_status $YELLOW "💎 Installing theme-check..."
    if gem install theme-check --user-install 2>/dev/null; then
        print_status $GREEN "✅ theme-check installed"
    else
        print_status $YELLOW "⚠️ Could not install theme-check (may need sudo)"
        print_status $YELLOW "Try: sudo gem install theme-check"
    fi
else
    print_status $RED "❌ Ruby not found"
    print_status $YELLOW "Please install Ruby 3.0+ from https://www.ruby-lang.org/"
fi

# 4. Check Shopify CLI
print_status $YELLOW "🔧 Checking Shopify CLI..."
if command -v shopify >/dev/null 2>&1; then
    shopify_version=$(shopify version 2>/dev/null || echo "unknown")
    print_status $GREEN "✅ Shopify CLI found: $shopify_version"
else
    print_status $YELLOW "⚠️ Shopify CLI not found"
    print_status $YELLOW "Install with: npm install -g @shopify/cli @shopify/theme"
fi

# 5. Create development directories
print_status $YELLOW "📁 Creating development directories..."
mkdir -p docs/testing
mkdir -p docs/runbooks
mkdir -p backup
print_status $GREEN "✅ Development directories created"

# 6. Create .env.example if it doesn't exist
if [ ! -f ".env.example" ]; then
    print_status $YELLOW "📝 Creating .env.example..."
    cat > .env.example << 'EOF'
# WTF Theme Environment Variables
# Copy this file to .env and fill in your values

# Shopify Store Configuration
SHOPIFY_STORE=your-store.myshopify.com
SHOPIFY_CLI_THEME_TOKEN=your-theme-token

# Analytics IDs (optional)
GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
FACEBOOK_PIXEL_ID=your-pixel-id
TIKTOK_PIXEL_ID=your-tiktok-pixel

# Development Settings
NODE_ENV=development
DEBUG=false
EOF
    print_status $GREEN "✅ .env.example created"
fi

# 7. Validate theme structure
print_status $YELLOW "🔍 Validating theme structure..."
required_files=(
    "layout/theme.liquid"
    "config/settings_schema.json"
    "sections/header.liquid"
    "templates/index.json"
    "assets/base.css"
)

missing_files=0
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        print_status $RED "❌ Missing: $file"
        missing_files=1
    else
        print_status $GREEN "✅ Found: $file"
    fi
done

if [ $missing_files -eq 1 ]; then
    print_status $YELLOW "⚠️ Some required files are missing"
else
    print_status $GREEN "✅ Theme structure looks good"
fi

# 8. Run initial quality checks
print_status $YELLOW "🔍 Running initial quality checks..."

# Check JSON validity
json_errors=0
for json_file in config/*.json templates/*.json; do
    if [ -f "$json_file" ]; then
        if ! python3 -m json.tool "$json_file" > /dev/null 2>&1; then
            print_status $RED "❌ Invalid JSON: $json_file"
            json_errors=1
        fi
    fi
done

if [ $json_errors -eq 0 ]; then
    print_status $GREEN "✅ JSON files are valid"
else
    print_status $YELLOW "⚠️ Some JSON files have errors"
fi

# 9. Display next steps
print_status $BLUE "🎉 Development environment setup complete!"
print_status $BLUE ""
print_status $BLUE "Next steps:"
print_status $BLUE "1. Copy .env.example to .env and configure your settings"
print_status $BLUE "2. Run 'shopify theme dev' to start development server"
print_status $BLUE "3. Make your changes and test locally"
print_status $BLUE "4. Commit changes (pre-commit hooks will run automatically)"
print_status $BLUE ""
print_status $BLUE "Useful commands:"
print_status $BLUE "• shopify theme check          - Run theme validation"
print_status $BLUE "• shopify theme dev           - Start development server"
print_status $BLUE "• shopify theme push          - Deploy to theme"
print_status $BLUE "• npm run test               - Run custom tests (if available)"
print_status $BLUE ""
print_status $BLUE "Documentation:"
print_status $BLUE "• README.md                  - General information"
print_status $BLUE "• NAMING_CONVENTIONS.md     - Coding standards"
print_status $BLUE "• docs/                      - Detailed documentation"

exit 0
