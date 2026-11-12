import {test,expect} from '@playwright/test';

test('source Quran lines remain single rows on dense pages',async({page},info)=>{
 for(const number of [3,92,93,94,255,610]){
  await page.goto(`/read/${number}/`);
  await page.waitForFunction(()=>document.documentElement.classList.contains('quran-font-ready'));
  await page.evaluate(()=>document.fonts.ready);
  const source=await (await page.request.get(`/data/pages/${number}.json`)).json();
  const sourceLines=source.lines.filter((line:{type:string})=>line.type==='ayah');
  await expect(page.locator('.mushaf-line')).toHaveCount(sourceLines.length);
  expect((await page.locator('.mushaf-line-inner').allTextContents()).map(s=>s.trim())).toEqual(sourceLines.map((line:{text:string})=>line.text.trim()));
  const wrapped=await page.locator('.mushaf-line-inner').evaluateAll(lines=>lines.filter(line=>line.getBoundingClientRect().height>parseFloat(getComputedStyle(line).lineHeight)+1).length);
  expect(wrapped,`Page ${number} must not wrap source lines into neighboring rows`).toBe(0);
  if(number===93)await page.locator('.mushaf-page').screenshot({path:`test-results/page-93-${info.project.name}.png`});
 }
});
