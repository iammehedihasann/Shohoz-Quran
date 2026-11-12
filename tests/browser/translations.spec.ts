import {test,expect} from '@playwright/test';

test('Bengali edition selection is honest, persisted and shared by settings and reader',async({page})=>{
 await page.goto('/settings/');const select=page.getByLabel('Bengali translation edition',{exact:true});
 await expect(select).toHaveValue('bn-zakaria');await expect(select.locator('option:not([disabled])')).toHaveCount(1);
 await expect(select.locator('option[value="bn-islamic-foundation"]')).toBeDisabled();await expect(select.locator('option[value="bn-taqi-usmani-bashar"]')).toBeDisabled();
 await page.getByText('Why are the requested editions unavailable?',{exact:true}).click();await expect(page.getByText('An official government PDF download is available,',{exact:false})).toBeVisible();await expect(page.getByText('The Bengali Tafseer-e-Tawzeehul Quran is a published book.',{exact:false})).toBeVisible();
 await page.locator('#setting-translation').selectOption('bn');await select.selectOption('bn-zakaria');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('hafezi-quran-v1')!).preferences.bengaliTranslation)).toBe('bn-zakaria');
 await page.goto('/read/1/');await page.getByRole('button',{name:'Reading display settings'}).click();await expect(page.locator('#reader-bengali-edition')).toHaveValue('bn-zakaria');
 const panel=page.locator('.translation-panel');await expect(panel).toContainText('Abu Bakr Zakaria · QuranEnc 1.1.1');await expect(panel).not.toContainText('Islamic Foundation Bangladesh');
 const response=await page.request.get('/data/translations/bn/1.json');const source=await response.json();const first=panel.locator('.translated-ayah').first();await expect(first.locator('.translation-copy > p')).toHaveText(source.verses[0].translation);
 await page.reload();await expect(page.locator('.translation-panel')).toContainText(source.verses[0].translation);
});

test('a pending saved Bengali edition cannot be mislabeled as an available translation',async({page})=>{
 await page.goto('/');await page.evaluate(()=>localStorage.setItem('hafezi-quran-v1',JSON.stringify({version:1,preferences:{translation:'bn',bengaliTranslation:'bn-taqi-usmani-bashar'}})));
 await page.goto('/read/1/');await expect(page.locator('.translation-panel')).toContainText('Abu Bakr Zakaria · QuranEnc 1.1.1');await expect(page.locator('.translation-panel')).not.toContainText('Taqi Usmani');
});
