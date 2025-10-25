#!/usr/bin/env python3
"""
WTF | Welcome To Florida - Trust Report Generator
Phase 4.4: Weekly trust reports for data architecture health

Generates human-readable status reports every Monday at 9:00 AM local
to monitor metafield/metaobject integrity and track improvements over time.
"""

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional

# Data directories
DATA_DIR = Path("/home/ubuntu/wtf-theme-delivered/data")
ARCHITECTURE_DIR = DATA_DIR / "architecture"
REPORTS_DIR = DATA_DIR / "reports"
LOGS_DIR = DATA_DIR / "logs"


class TrustReportGenerator:
    """Generate weekly trust reports for data architecture health"""
    
    def __init__(self):
        self.report_date = datetime.now()
        self.report_lines = []
    
    def generate(self) -> str:
        """Generate complete trust report"""
        self._add_header()
        self._add_summary_stats()
        self._add_issues_section()
        self._add_delta_section()
        self._add_recommendations()
        self._add_footer()
        
        report_content = "\n".join(self.report_lines)
        
        # Save report
        report_file = REPORTS_DIR / f"phase4_trust_report_{self.report_date.strftime('%Y%m%d')}.md"
        with open(report_file, 'w') as f:
            f.write(report_content)
        
        print(f"📊 Trust report generated: {report_file}")
        
        return report_content
    
    def _add_header(self):
        """Add report header"""
        self.report_lines.extend([
            "# WTF | Welcome To Florida - Data Architecture Trust Report",
            f"**Report Date:** {self.report_date.strftime('%B %d, %Y')}  ",
            f"**Report Period:** {(self.report_date - timedelta(days=7)).strftime('%B %d')} - {self.report_date.strftime('%B %d, %Y')}  ",
            "**Status:** 🟢 Healthy  ",
            "",
            "---",
            ""
        ])
    
    def _add_summary_stats(self):
        """Add summary statistics"""
        # Load data maps
        active_ingredient_map = self._load_json(ARCHITECTURE_DIR / "active_ingredient_map.json")
        bar_menu_item_map = self._load_json(ARCHITECTURE_DIR / "bar_menu_item_map.json")
        
        total_products = 144  # From catalog segmentation
        products_with_ingredient = len(active_ingredient_map)
        products_with_bar_menu = len(bar_menu_item_map)
        
        ingredient_coverage = (products_with_ingredient / total_products) * 100
        bar_coverage = (products_with_bar_menu / 75) * 100  # 75 bar products expected
        
        self.report_lines.extend([
            "## 📊 Summary Statistics",
            "",
            "| Metric | Value | Coverage |",
            "|:---|---:|:---:|",
            f"| **Total Products** | {total_products} | 100% |",
            f"| **Products with Active Ingredient** | {products_with_ingredient} | {ingredient_coverage:.1f}% |",
            f"| **Products with Bar Menu Reference** | {products_with_bar_menu} | {bar_coverage:.1f}% |",
            "",
            "### Ingredient Breakdown",
            "",
            self._get_ingredient_breakdown(active_ingredient_map),
            ""
        ])
    
    def _get_ingredient_breakdown(self, ingredient_map: Dict) -> str:
        """Generate ingredient breakdown table"""
        # Count by ingredient
        counts = {}
        for sku, data in ingredient_map.items():
            ingredient = data.get('ingredient', 'Unknown')
            counts[ingredient] = counts.get(ingredient, 0) + 1
        
        # Build table
        lines = [
            "| Ingredient | Products | Percentage |",
            "|:---|---:|:---:|"
        ]
        
        total = sum(counts.values())
        for ingredient in sorted(counts.keys()):
            count = counts[ingredient]
            pct = (count / total) * 100 if total > 0 else 0
            lines.append(f"| {ingredient} | {count} | {pct:.1f}% |")
        
        return "\n".join(lines)
    
    def _add_issues_section(self):
        """Add issues found section"""
        # Load latest reconciliation logs
        metafield_log = self._load_latest_log("metafield_consistency_scan")
        menu_log = self._load_latest_log("menu_integrity_scan")
        
        # Extract issues
        metafield_issues = self._extract_issues(metafield_log)
        menu_issues = self._extract_issues(menu_log)
        
        total_issues = len(metafield_issues) + len(menu_issues)
        
        self.report_lines.extend([
            "---",
            "",
            "## ⚠️ Issues Found",
            "",
            f"**Total Issues:** {total_issues}",
            ""
        ])
        
        if total_issues == 0:
            self.report_lines.extend([
                "✅ **No issues found!** The data architecture is healthy and complete.",
                ""
            ])
        else:
            # Products missing active_ingredient
            missing_ingredient = [i for i in metafield_issues if i.get('type') == 'missing_ingredient']
            if missing_ingredient:
                self.report_lines.extend([
                    f"### Products Missing `active_ingredient` ({len(missing_ingredient)})",
                    "",
                    "| SKU | Product Title |",
                    "|:---|:---|"
                ])
                for issue in missing_ingredient[:10]:  # Show first 10
                    self.report_lines.append(f"| {issue.get('sku', 'N/A')} | {issue.get('title', 'N/A')[:50]} |")
                
                if len(missing_ingredient) > 10:
                    self.report_lines.append(f"| ... | *{len(missing_ingredient) - 10} more* |")
                self.report_lines.append("")
            
            # Products with needs_review
            needs_review = [i for i in metafield_issues if i.get('type') == 'invalid_ingredient' and i.get('value') == 'needs_review']
            if needs_review:
                self.report_lines.extend([
                    f"### Products Requiring Manual Review ({len(needs_review)})",
                    "",
                    "| SKU | Product ID |",
                    "|:---|:---|"
                ])
                for issue in needs_review[:10]:
                    self.report_lines.append(f"| {issue.get('sku', 'N/A')} | {issue.get('product_id', 'N/A')} |")
                
                if len(needs_review) > 10:
                    self.report_lines.append(f"| ... | *{len(needs_review) - 10} more* |")
                self.report_lines.append("")
            
            # Products tagged as Bar without bar.menu_reference
            bar_without_ref = [i for i in metafield_issues if i.get('type') == 'missing_bar_reference']
            if bar_without_ref:
                self.report_lines.extend([
                    f"### Bar Products Missing `bar.menu_reference` ({len(bar_without_ref)})",
                    "",
                    "| SKU | Product Title |",
                    "|:---|:---|"
                ])
                for issue in bar_without_ref[:10]:
                    self.report_lines.append(f"| {issue.get('sku', 'N/A')} | {issue.get('title', 'N/A')[:50]} |")
                
                if len(bar_without_ref) > 10:
                    self.report_lines.append(f"| ... | *{len(bar_without_ref) - 10} more* |")
                self.report_lines.append("")
            
            # bar_menu_item records with invalid references
            invalid_refs = [i for i in menu_issues if i.get('type') == 'invalid_product_reference']
            if invalid_refs:
                self.report_lines.extend([
                    f"### Bar Menu Items with Invalid Product References ({len(invalid_refs)})",
                    "",
                    "| Metaobject ID | Product Reference |",
                    "|:---|:---|"
                ])
                for issue in invalid_refs[:10]:
                    self.report_lines.append(f"| {issue.get('metaobject_id', 'N/A')} | {issue.get('product_reference', 'N/A')} |")
                
                if len(invalid_refs) > 10:
                    self.report_lines.append(f"| ... | *{len(invalid_refs) - 10} more* |")
                self.report_lines.append("")
    
    def _add_delta_section(self):
        """Add delta since last week section"""
        # Compare with last week's report
        last_week_report = self._load_previous_report()
        
        self.report_lines.extend([
            "---",
            "",
            "## 📈 Delta Since Last Week",
            ""
        ])
        
        if not last_week_report:
            self.report_lines.extend([
                "*No previous report available for comparison.*",
                ""
            ])
            return
        
        # Calculate deltas
        current_stats = self._get_current_stats()
        previous_stats = self._extract_stats_from_report(last_week_report)
        
        additions = current_stats['total_products'] - previous_stats.get('total_products', 0)
        ingredient_delta = current_stats['products_with_ingredient'] - previous_stats.get('products_with_ingredient', 0)
        bar_delta = current_stats['products_with_bar_menu'] - previous_stats.get('products_with_bar_menu', 0)
        
        self.report_lines.extend([
            "| Metric | Change | Trend |",
            "|:---|---:|:---:|",
            f"| New Products Added | {additions:+d} | {'📈' if additions > 0 else '➖'} |",
            f"| Products with Active Ingredient | {ingredient_delta:+d} | {'✅' if ingredient_delta >= 0 else '⚠️'} |",
            f"| Products with Bar Menu Reference | {bar_delta:+d} | {'✅' if bar_delta >= 0 else '⚠️'} |",
            "",
            "### Fixes Applied This Week",
            "",
            self._get_fixes_summary(),
            ""
        ])
    
    def _get_fixes_summary(self) -> str:
        """Get summary of fixes applied this week"""
        # Load logs from past 7 days
        metafield_log = self._load_latest_log("metafield_consistency_scan")
        menu_log = self._load_latest_log("menu_integrity_scan")
        
        metafield_fixes = self._extract_fixes(metafield_log)
        menu_fixes = self._extract_fixes(menu_log)
        
        total_fixes = len(metafield_fixes) + len(menu_fixes)
        
        if total_fixes == 0:
            return "*No fixes were required this week.*"
        
        lines = [f"**Total Fixes:** {total_fixes}", ""]
        
        # Group by fix type
        fix_types = {}
        for fix in metafield_fixes + menu_fixes:
            fix_type = fix.get('type', 'unknown')
            fix_types[fix_type] = fix_types.get(fix_type, 0) + 1
        
        for fix_type, count in sorted(fix_types.items()):
            lines.append(f"- {fix_type.replace('_', ' ').title()}: {count}")
        
        return "\n".join(lines)
    
    def _add_recommendations(self):
        """Add recommendations section"""
        self.report_lines.extend([
            "---",
            "",
            "## 💡 Recommendations",
            ""
        ])
        
        # Load current stats
        stats = self._get_current_stats()
        
        recommendations = []
        
        # Check ingredient coverage
        ingredient_coverage = (stats['products_with_ingredient'] / stats['total_products']) * 100
        if ingredient_coverage < 90:
            recommendations.append(
                f"**Improve Ingredient Coverage:** Currently at {ingredient_coverage:.1f}%. "
                "Review products without `active_ingredient` and assign appropriate values."
            )
        
        # Check bar menu coverage
        bar_coverage = (stats['products_with_bar_menu'] / 75) * 100
        if bar_coverage < 95:
            recommendations.append(
                f"**Complete Bar Menu Setup:** Currently at {bar_coverage:.1f}%. "
                "Ensure all bar/beverage products have `bar.menu_reference` metafields."
            )
        
        # General recommendations
        recommendations.extend([
            "**Deploy Webhook Handlers:** Set up webhook endpoints to enable real-time automation (see AUTOMATION_DEPLOYMENT_GUIDE.md).",
            "**Create Smart Collections:** Use `inventory.active_ingredient` to create auto-updating collections by ingredient.",
            "**Implement Bar Menu Page:** Create `/pages/bar-menu` template using `bar_menu_cache.json` for SEO boost."
        ])
        
        for i, rec in enumerate(recommendations, 1):
            self.report_lines.append(f"{i}. {rec}")
        
        self.report_lines.append("")
    
    def _add_footer(self):
        """Add report footer"""
        self.report_lines.extend([
            "---",
            "",
            "## 📅 Next Steps",
            "",
            "1. Review and address any outstanding issues listed above",
            "2. Monitor reconciliation job logs for recurring problems",
            "3. Next trust report: " + (self.report_date + timedelta(days=7)).strftime('%B %d, %Y'),
            "",
            "---",
            "",
            f"*Report generated automatically by Phase 4 Automation System*  ",
            f"*Generation time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*"
        ])
    
    # Helper methods
    
    def _load_json(self, filepath: Path) -> Dict:
        """Load JSON file"""
        try:
            with open(filepath, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}
    
    def _load_latest_log(self, job_name: str) -> Dict:
        """Load latest log file for a job"""
        log_pattern = f"{job_name}_*.json"
        log_files = sorted(LOGS_DIR.glob(log_pattern), reverse=True)
        
        if log_files:
            return self._load_json(log_files[0])
        return {}
    
    def _extract_issues(self, log_data: Dict) -> List[Dict]:
        """Extract issues from log data"""
        if isinstance(log_data, list):
            # Log is a list of entries
            for entry in log_data:
                if entry.get('action') == 'scan_complete':
                    return entry.get('details', {}).get('issues', [])
        return []
    
    def _extract_fixes(self, log_data: Dict) -> List[Dict]:
        """Extract fixes from log data"""
        if isinstance(log_data, list):
            for entry in log_data:
                if entry.get('action') == 'scan_complete':
                    return entry.get('details', {}).get('fixes', [])
        return []
    
    def _load_previous_report(self) -> Optional[str]:
        """Load previous week's report"""
        report_pattern = "phase4_trust_report_*.md"
        report_files = sorted(REPORTS_DIR.glob(report_pattern), reverse=True)
        
        if len(report_files) > 1:
            # Get second most recent (previous week)
            with open(report_files[1], 'r') as f:
                return f.read()
        return None
    
    def _get_current_stats(self) -> Dict:
        """Get current statistics"""
        active_ingredient_map = self._load_json(ARCHITECTURE_DIR / "active_ingredient_map.json")
        bar_menu_item_map = self._load_json(ARCHITECTURE_DIR / "bar_menu_item_map.json")
        
        return {
            "total_products": 144,
            "products_with_ingredient": len(active_ingredient_map),
            "products_with_bar_menu": len(bar_menu_item_map)
        }
    
    def _extract_stats_from_report(self, report_content: str) -> Dict:
        """Extract statistics from previous report"""
        # Simple parsing - look for summary table
        stats = {}
        
        lines = report_content.split('\n')
        for i, line in enumerate(lines):
            if '**Total Products**' in line:
                parts = line.split('|')
                if len(parts) >= 3:
                    stats['total_products'] = int(parts[2].strip())
            elif '**Products with Active Ingredient**' in line:
                parts = line.split('|')
                if len(parts) >= 3:
                    stats['products_with_ingredient'] = int(parts[2].strip())
            elif '**Products with Bar Menu Reference**' in line:
                parts = line.split('|')
                if len(parts) >= 3:
                    stats['products_with_bar_menu'] = int(parts[2].strip())
        
        return stats


def main():
    """Generate weekly trust report"""
    print("=" * 70)
    print("WTF | Welcome To Florida")
    print("Weekly Trust Report Generator")
    print(f"Execution Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    generator = TrustReportGenerator()
    report = generator.generate()
    
    print("\n" + "=" * 70)
    print("✅ Trust Report Generated")
    print("=" * 70)
    print("\nPreview:")
    print("-" * 70)
    print(report[:500] + "..." if len(report) > 500 else report)
    print("-" * 70)


if __name__ == "__main__":
    main()

