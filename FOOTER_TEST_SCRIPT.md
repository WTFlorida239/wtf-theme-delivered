# Footer Layout Regression Test Script

## Purpose
Verify that footer layout fixes resolve mobile overflow, CLS issues, and render correctly across all devices.

## Test Environment
- **URL**: https://wtfswag.com/
- **Browsers**: Chrome/Chromium (primary), Safari (iOS), Firefox (optional)
- **Test Date**: _[Fill in after running]_

---

## Pre-Test Checklist

- [ ] PR merged to main branch
- [ ] Changes deployed to live site
- [ ] Browser DevTools ready
- [ ] Screenshot tool ready

---

## Test Cases

### Test 1: Mobile Layout (375×667 - iPhone SE)

**Steps:**
1. Open https://wtfswag.com/ in Chrome
2. Open DevTools (F12)
3. Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
4. Select "iPhone SE" or set custom 375×667
5. Scroll to footer
6. Take screenshot

**Expected Results:**
- ✅ No horizontal scrollbar
- ✅ Footer sections stack vertically
- ✅ Logo displays at 60×60px
- ✅ All text is readable
- ✅ No content overflow
- ✅ Social icons display correctly

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _________________

---

### Test 2: Small Mobile (320×568 - iPhone 5/SE)

**Steps:**
1. In DevTools, set viewport to 320×568
2. Scroll to footer
3. Take screenshot
4. Check for horizontal scroll

**Expected Results:**
- ✅ No horizontal scrollbar (critical fix)
- ✅ Grid uses 200px minimum (not 250px)
- ✅ Footer sections stack properly
- ✅ Text wraps correctly

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _________________

---

### Test 3: Tablet Layout (768×1024 - iPad)

**Steps:**
1. Set viewport to 768×1024
2. Scroll to footer
3. Take screenshot

**Expected Results:**
- ✅ Footer sections stack vertically
- ✅ Logo and branding centered
- ✅ Proper spacing maintained
- ✅ No layout breaks

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _________________

---

### Test 4: Desktop Layout (1920×1080)

**Steps:**
1. Set viewport to 1920×1080 (or use full desktop browser)
2. Scroll to footer
3. Take screenshot

**Expected Results:**
- ✅ Footer sections display in grid (multiple columns)
- ✅ Maximum width constraint applied (400px per section)
- ✅ Content doesn't stretch too wide
- ✅ Proper alignment and spacing

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _________________

---

### Test 5: Cumulative Layout Shift (CLS) Check

**Steps:**
1. Open https://wtfswag.com/ in Chrome
2. Open DevTools → Lighthouse tab
3. Select "Performance" category
4. Select "Mobile" device
5. Click "Analyze page load"
6. Wait for report
7. Check CLS score in metrics

**Expected Results:**
- ✅ CLS score ≤ 0.1 (Good)
- ✅ No layout shift warnings for footer
- ✅ Logo has proper aspect-ratio (prevents shift)

**Actual Results:**
- CLS Score: _______
- [ ] Pass (≤0.1) / [ ] Needs Improvement (0.1-0.25) / [ ] Fail (>0.25)
- Notes: _________________

---

### Test 6: Liquid Syntax Validation

**Steps:**
1. Open https://wtfswag.com/ in Chrome
2. Open DevTools → Console tab
3. Scroll through entire page including footer
4. Check for any Liquid errors (red text)

**Expected Results:**
- ✅ No Liquid syntax errors
- ✅ No "undefined variable" errors
- ✅ No "invalid tag" errors
- ✅ Footer renders without warnings

**Actual Results:**
- [ ] Pass / [ ] Fail
- Errors found: _________________

---

### Test 7: Cross-Browser Check (Safari iOS)

**Steps:**
1. Open https://wtfswag.com/ on actual iPhone or iPad
2. Scroll to footer
3. Check layout and responsiveness
4. Take screenshot if possible

**Expected Results:**
- ✅ Footer displays correctly
- ✅ No overflow or layout issues
- ✅ Touch interactions work

**Actual Results:**
- [ ] Pass / [ ] Fail
- Notes: _________________

---

## Automated Test Script (Optional)

If you want to automate screenshot capture, save this as `test-footer.js`:

```javascript
// Run with: node test-footer.js
const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const viewports = [
    { name: 'mobile-320', width: 320, height: 568 },
    { name: 'mobile-375', width: 375, height: 667 },
    { name: 'tablet-768', width: 768, height: 1024 },
    { name: 'desktop-1920', width: 1920, height: 1080 }
  ];
  
  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto('https://wtfswag.com/', { waitUntil: 'networkidle2' });
    
    // Scroll to footer
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    await page.waitForTimeout(1000);
    
    // Take screenshot
    await page.screenshot({ 
      path: `footer-${vp.name}.png`,
      fullPage: false
    });
    
    console.log(`✓ Screenshot captured: footer-${vp.name}.png`);
  }
  
  // Check console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    }
  });
  
  await browser.close();
  console.log('✓ All tests complete');
})();
```

**To use:**
```bash
npm install puppeteer
node test-footer.js
```

---

## Summary Report Template

**Test Date**: _________________  
**Tester**: _________________  
**Browser**: _________________  

### Results Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| Mobile 375px | ☐ Pass ☐ Fail | |
| Mobile 320px | ☐ Pass ☐ Fail | |
| Tablet 768px | ☐ Pass ☐ Fail | |
| Desktop 1920px | ☐ Pass ☐ Fail | |
| CLS Score | ☐ Pass ☐ Fail | Score: _____ |
| Liquid Errors | ☐ Pass ☐ Fail | |
| Safari iOS | ☐ Pass ☐ Fail | |

### Overall Status
- [ ] ✅ All tests passed - Footer layout is fixed
- [ ] ⚠️ Some tests failed - See notes above
- [ ] ❌ Critical failures - Rollback required

### Screenshots Attached
- [ ] footer-mobile-375.png
- [ ] footer-mobile-320.png
- [ ] footer-tablet-768.png
- [ ] footer-desktop-1920.png
- [ ] lighthouse-report.png

---

## Acceptance Criteria Verification

✅ **Footer renders correctly on mobile/desktop**
- [ ] Verified on mobile (320px, 375px)
- [ ] Verified on tablet (768px)
- [ ] Verified on desktop (1920px)

✅ **No CLS increases (Lighthouse score unchanged or better)**
- [ ] CLS score ≤ 0.1
- [ ] No layout shift warnings

✅ **No Liquid errors in logs**
- [ ] Console clean (no errors)
- [ ] Footer renders without warnings

---

## Notes

_Add any additional observations, issues, or recommendations here._
