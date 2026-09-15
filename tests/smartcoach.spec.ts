import { test, expect } from '@playwright/test';

test.describe('SmartCoach Athlete E2E Test Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Seed authenticated mock user into localStorage using exact keys from authStore
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'mock_jwt_access_token_athlete');
      localStorage.setItem('refresh_token', 'mock_jwt_refresh_token_athlete');
      localStorage.setItem('user', JSON.stringify({
        _id: 'user_athlete_01',
        email: 'athlete@smartcoach.io',
        role: 'Customer',
        firstName: 'Marcus',
        lastName: 'Vance',
        gender: 'Male',
        height: 182,
        weight: 79.5,
        targetWeight: 83.0,
        fitnessGoal: 'Gain Muscle',
        fitnessLevel: 'Intermediate',
        dietaryPreference: 'High Protein',
        allergies: [],
        dailyCalorieTarget: 2750,
        dailyWaterTarget: 3500,
        onboardingCompleted: true,
      }));
    });
  });

  test('1. Dashboard renders KPI cards, streak banner, and hydration tracking with undo', async ({ page }) => {
    await page.goto('/dashboard');

    // Welcome Hero & Consistency streak
    await expect(page.locator('h1:has-text("Ready to crush today, Marcus?")')).toBeVisible();
    await expect(page.locator('text=12-Day Consistency Streak')).toBeVisible();

    // Top KPI Stat Cards
    await expect(page.locator('text=Current Weight')).toBeVisible();
    await expect(page.locator('text=Weekly Workouts')).toBeVisible();
    await expect(page.locator('text=Daily Calorie Burn')).toBeVisible();
    await expect(page.locator('text=Coach Adherence')).toBeVisible();

    // Hydration Tracker verification & Quick-add
    await expect(page.locator('text=Hydration Intake')).toBeVisible();
    const add250Btn = page.getByRole('button', { name: '250', exact: true });
    await expect(add250Btn).toBeVisible();
    await add250Btn.click();

    // Undo button verification
    const undoBtn = page.getByRole('button', { name: '-250', exact: true });
    await expect(undoBtn).toBeVisible();
    await undoBtn.click();

    // Profile Dropdown test (Avatar button in Navbar)
    const profileBtn = page.getByRole('button', { name: /Marcus/i }).first();
    await expect(profileBtn).toBeVisible();
    await profileBtn.click();

    // Dropdown menu appears
    await expect(page.locator('text=athlete@smartcoach.io')).toBeVisible();
    await expect(page.locator('text=My Profile & Metrics')).toBeVisible();

    // Click backdrop overlay to dismiss dropdown
    await page.locator('.fixed.inset-0.z-40').click({ force: true });
    await expect(page.locator('text=My Profile & Metrics')).not.toBeVisible();
  });

  test('2. AI Coach Hub - Gemini Chat, Routine Generator, and Meal Planner', async ({ page }) => {
    // 2a. APEX AI Chat
    await page.goto('/ai/chat');
    await expect(page.locator('h1:has-text("APEX AI Coach")')).toBeVisible();
    await expect(page.locator('text=Peak athletic performance')).toBeVisible();

    // Send a message in AI Chat
    const chatInput = page.getByPlaceholder('Ask anything about programming, lifting mechanics, or nutrition...');
    await expect(chatInput).toBeVisible();
    await chatInput.fill('What is optimal rest for hypertrophy?');
    await page.locator('form').getByRole('button').last().click();
    await expect(page.locator('text=What is optimal rest for hypertrophy?')).toBeVisible();

    // 2b. AI Routine Generator
    await page.goto('/ai/workout-plan');
    await expect(page.locator('h1:has-text("AI Workout Routine Generator")')).toBeVisible();
    const generateRoutineBtn = page.getByRole('button', { name: /Generate Custom Routine/i });
    await expect(generateRoutineBtn).toBeVisible();
    await generateRoutineBtn.click();

    // Verify generated workout card and Set as Today's Routine action
    const setRoutineBtn = page.getByRole('button', { name: /Set as Today's Routine/i });
    await expect(setRoutineBtn).toBeVisible({ timeout: 12000 });
    await setRoutineBtn.click();
    await expect(page.locator('text=Set as Today\'s Scheduled Routine on Dashboard!')).toBeVisible();

    // 2c. AI Meal Plan Generator
    await page.goto('/ai/meal-plan');
    await expect(page.locator('h1:has-text("AI Nutrition & Macro Generator")')).toBeVisible();
    const generateMealBtn = page.getByRole('button', { name: /Generate Nutritional Plan/i });
    await expect(generateMealBtn).toBeVisible();
    await generateMealBtn.click();
    await expect(page.locator('text=AI Nutrition Protocol')).toBeVisible({ timeout: 12000 });
  });

  test('3. Workout Catalog and Active Workout Player', async ({ page }) => {
    await page.goto('/workouts');

    // Verify workout catalog header & cards
    await expect(page.locator('h1:has-text("Curated Workout Routines")')).toBeVisible();

    // Launch active player
    const startWorkoutBtn = page.getByRole('button', { name: /Start Workout/i }).first();
    await expect(startWorkoutBtn).toBeVisible();
    await startWorkoutBtn.click();

    // Verify Active Player URL & UI
    await expect(page).toHaveURL('/workouts/play');
    await expect(page.getByRole('button', { name: /Finish Workout/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Form Video/i })).toBeVisible();

    // Check first set checkbox
    const setCheckbox = page.locator('button[aria-label^="Toggle set"]').first();
    await expect(setCheckbox).toBeVisible();
    await setCheckbox.click();

    // Finish / Complete workout
    const finishBtn = page.getByRole('button', { name: /Finish Workout/i });
    await expect(finishBtn).toBeVisible();
    await finishBtn.click();

    // Verify completion summary modal
    await expect(page.getByRole('heading', { name: 'Workout Crushed! ⚡' })).toBeVisible({ timeout: 5000 });
  });

  test('4. Nutrition Tracker and Log Food modal', async ({ page }) => {
    await page.goto('/nutrition');

    // Page title and macro summary cards
    await expect(page.locator('h1:has-text("Daily Nutrition & Food Logger")')).toBeVisible();
    await expect(page.locator('text=Energy Consumed')).toBeVisible();
    await expect(page.getByText('Protein', { exact: true })).toBeVisible();

    // Open Log Food Modal
    const logFoodBtn = page.getByRole('button', { name: /Log Meal/i });
    await expect(logFoodBtn).toBeVisible();
    await logFoodBtn.click();

    // Fill Log Food form
    await expect(page.locator('text=Log Food or Recipe')).toBeVisible();
    await page.fill('input[placeholder*="Grass-Fed Beef"]', 'Power Protein Oatmeal Bowl');

    // Submit form
    await page.getByRole('button', { name: /Save Food Entry/i }).click();

    // Verify entry logged in timeline
    await expect(page.locator('text=Power Protein Oatmeal Bowl')).toBeVisible();
  });

  test('5. Coach Marketplace and Booking flow', async ({ page }) => {
    await page.goto('/coaches');

    await expect(page.locator('h1:has-text("Coach Marketplace")')).toBeVisible();
    await expect(page.locator('text=Coach Elena Rostova')).toBeVisible();

    // Open Book Session Modal
    const bookBtn = page.getByRole('button', { name: /Book Session/i }).first();
    await expect(bookBtn).toBeVisible();
    await bookBtn.click();

    // Modal check
    await expect(page.locator('text=Book 1-on-1 Strategy Session')).toBeVisible();
    const confirmBookingBtn = page.getByRole('button', { name: /Confirm Session Booking/i });
    await expect(confirmBookingBtn).toBeVisible();
    await confirmBookingBtn.click();

    // Booking Success confirmation
    await expect(page.locator('text=Session Confirmed!')).toBeVisible();
  });

  test('6. Store Catalog, Cart Drawer, and Checkout flow', async ({ page }) => {
    await page.goto('/store');

    await expect(page.locator('h1:has-text("APEX Athletic Official Store")')).toBeVisible();

    // Add product to cart (automatically opens Cart Drawer in cartStore)
    const addToCartBtn = page.getByRole('button', { name: /Add to Cart/i }).first();
    await addToCartBtn.click();

    // Verify Cart Drawer opens with item
    await expect(page.locator('h2:has-text("Your Shopping Cart")')).toBeVisible();

    // Test Discount Code
    const discountInput = page.getByPlaceholder('Enter SMART20 or COACH15');
    await expect(discountInput).toBeVisible();
    await discountInput.fill('SMART20');
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.locator('text=Promo Applied: SMART20 (20% OFF)')).toBeVisible();

    // Proceed to Checkout
    const checkoutBtn = page.getByRole('button', { name: /Proceed to Checkout/i });
    await expect(checkoutBtn).toBeVisible();
    await checkoutBtn.click();

    // Verify checkout page
    await expect(page).toHaveURL('/checkout');
    await expect(page.locator('h1:has-text("Secure Checkout")')).toBeVisible();
    await expect(page.locator('text=Order Summary')).toBeVisible();
  });

  test('7. Mobile viewport responsiveness & bottom navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');

    // Verify mobile navigation bar
    const mobileNav = page.locator('nav[aria-label="Mobile Navigation"]');
    await expect(mobileNav).toBeVisible();

    // Check mobile navigation links
    await expect(mobileNav.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(mobileNav.getByRole('link', { name: 'AI Coach' })).toBeVisible();
    await expect(mobileNav.getByRole('link', { name: 'Workouts' })).toBeVisible();
    await expect(mobileNav.getByRole('link', { name: 'Coaches' })).toBeVisible();
    await expect(mobileNav.getByRole('link', { name: 'Chat' })).toBeVisible();

    // Check main container padding for bottom nav clearance
    const mainContainer = page.locator('main');
    await expect(mainContainer).toHaveClass(/pb-28/);
  });

  test('8. Chat navigation scroll behavior (window stays at top)', async ({ page }) => {
    await page.goto('/dashboard');
    // Scroll the window down past the hero and KPIs
    await page.evaluate(() => window.scrollTo(0, 600));
    const initialScrollY = await page.evaluate(() => window.scrollY);
    expect(initialScrollY).toBeGreaterThan(0);

    // Navigate to Coach Chat via link
    await page.click('nav a[href="/chat"]');
    await page.waitForURL('**/chat');
    await expect(page.locator('text=Coach Messages')).toBeVisible();

    // Verify window scroll position is reset to top (0)
    const chatScrollY = await page.evaluate(() => window.scrollY);
    expect(chatScrollY).toBe(0);

    // Scroll down again and navigate to AI Chat
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.click('nav a[href="/ai/chat"]');
    await page.waitForURL('**/ai/chat');
    await expect(page.locator('text=APEX AI Coach')).toBeVisible();

    // Verify window scroll position is reset to top (0)
    const aiChatScrollY = await page.evaluate(() => window.scrollY);
    expect(aiChatScrollY).toBe(0);
  });

  test('9. AI Chat Sessions - create new session, switch sessions, and persist across reload', async ({ page }) => {
    await page.goto('/ai/chat');
    await expect(page.locator('h1:has-text("APEX AI Coach")')).toBeVisible();

    // Verify Sessions sidebar is visible
    await expect(page.locator('text=/Sessions \\(\\d+\\)/')).toBeVisible();

    // Click "New Chat" button
    const newChatBtn = page.getByRole('button', { name: /New Chat/i });
    await expect(newChatBtn).toBeVisible();
    await newChatBtn.click();

    // Ask a question in the new session
    const chatInput = page.getByPlaceholder('Ask anything about programming, lifting mechanics, or nutrition...');
    await chatInput.fill('Best pre-workout fueling protocol?');
    await page.locator('form').getByRole('button').last().click();

    // Verify question is displayed
    await expect(page.locator('text=Best pre-workout fueling protocol?')).toBeVisible();

    // Reload the page and verify that the session persists in localStorage
    await page.reload();
    await expect(page.locator('h1:has-text("APEX AI Coach")')).toBeVisible();
    await expect(page.locator('text=Best pre-workout fueling protocol?')).toBeVisible();
  });

});
