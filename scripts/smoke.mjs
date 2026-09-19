import {chromium} from '@playwright/test';
import {mkdirSync} from 'node:fs';
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
  const page=await browser.newPage({viewport:{width:1440,height:960}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5173');
  await page.getByLabel('Tên đăng nhập').fill('admin');
  await page.getByLabel('Mật khẩu',{exact:true}).fill('Cafe@Admin2026');
  await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
  await page.getByRole('heading',{name:'Sơ đồ bàn'}).waitFor({timeout:30000});
  mkdirSync('test-results',{recursive:true});
  await page.screenshot({path:'test-results/pos-desktop.png',fullPage:true});
  console.log('POS ready; tables:',await page.locator('.table-card').count());
  for(const [path,title] of [['thuc-don','Thực đơn'],['khach-hang','Khách hàng'],['hoa-don','Hóa đơn'],['bao-cao','Báo cáo doanh thu'],['tat-toan','Tất toán ngày'],['nhan-vien','Nhân viên'],['phan-quyen','Phân quyền']]){
    await page.goto(`http://127.0.0.1:5173/${path}`);
    await page.getByRole('heading',{name:title,exact:true}).waitFor();
    console.log(path, 'ok');
  }
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:5173/ban-hang');
  await page.getByRole('heading',{name:'Sơ đồ bàn'}).waitFor();
  await page.screenshot({path:'test-results/pos-mobile.png',fullPage:true});
  console.log('overflow:',await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
  if(errors.length)throw new Error(errors.join('\n'));
} finally {await browser.close();}
