import {test,expect} from '@playwright/test';
test('homepage, navigation, accurate reading and bookmarks',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(`${page.url()}: ${error.message}`));
 await page.goto('/');await expect(page.getByRole('heading',{level:1})).toContainText('Make room');
 await page.screenshot({path:`test-results/home-${test.info().project.name}.png`,fullPage:true});
 await page.getByRole('link',{name:'Start reading',exact:false}).first().click();
 await expect(page.locator('.mushaf-page')).toBeVisible();await page.waitForFunction(()=>document.documentElement.classList.contains('quran-font-ready'));
 await expect(page.locator('.mushaf-line')).toHaveCount(7);
 await page.getByRole('button',{name:'Bookmark page',exact:true}).click();
 await page.getByRole('button',{name:'Next page',exact:true}).click();
 await expect(page.locator('.mushaf-page')).toHaveAttribute('aria-label','DigitalKhatt Indo-Pak Quran page 2');
 await page.locator('#page-input').fill('3');await page.getByRole('button',{name:'Go to page'}).click();
 await expect(page.locator('.mushaf-line')).toHaveCount(15);
 await page.screenshot({path:`test-results/reader-${test.info().project.name}.png`,fullPage:true});
 await page.goto('/bookmarks');await expect(page.locator('.bookmark-row')).toContainText('Page 1');
 await page.goto('/');await expect(page.locator('.continue-card')).toContainText('Page 3 of 610');
 expect(errors).toEqual([]);
});
test('translations, exact reference search, Surahs and Juz',async({page})=>{
 await page.goto('/surahs');await expect(page.locator('.surah-card')).toHaveCount(114);
 await page.getByRole('textbox',{name:'Search Surahs'}).fill('বাকারা');await expect(page.locator('.surah-card')).toHaveCount(1);
 await page.locator('.surah-card').click();await expect(page).toHaveURL(/\/surah\/2/);
 await page.getByRole('button',{name:'Reading display settings'}).click();
 await page.locator('.reader-settings select').first().selectOption('both');
 await expect(page.locator('.translation-panel')).toContainText('Pickthall');await expect(page.locator('.translation-panel')).toContainText('Abu Bakr Zakaria');
 await page.goto('/search?q=2%3A255');await page.getByRole('link',{name:/Go to Al-Baqara/}).click();
 await expect(page).toHaveURL(/ayah=2:255/);
 await page.goto('/juz');await expect(page.locator('.juz-card')).toHaveCount(30);
 await page.locator('.juz-card').nth(1).click();await expect(page.locator('.reader-heading')).toContainText('Para 2');
});
test('local keyword search and persistent settings',async({page})=>{
 await page.goto('/search?q=mercy');await expect(page.locator('.search-ayah').first()).toBeVisible({timeout:20000});
 await page.goto('/settings');await page.getByRole('button',{name:'Dark',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
 await page.locator('#setting-language').selectOption('bn');await expect(page.getByRole('heading',{level:1})).toHaveText('সেটিংস');
});
test('invalid saved data and invalid routes fail safely',async({page})=>{
 await page.goto('/');await page.evaluate(()=>localStorage.setItem('hafezi-quran-v1','{"version":1,"preferences":{"zoom":-900},"bookmarks":"broken","recent":null}'));
 await page.reload();await expect(page.getByRole('heading',{level:1})).toContainText('Make room');
 await page.goto('/read/999');await expect(page.getByRole('alert')).toContainText('does not exist');
});
