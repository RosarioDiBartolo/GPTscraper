import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import fs from 'fs/promises'; ;


puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin());


async function StealthBrowser(additional = {}, additionalArgs = []) {
  const browser = await puppeteer.launch({
    ...additional,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      ...additionalArgs,
    ],
    ignoreDefaultArgs: ['--enable-automation'],
    devtools: true,
    ignoreHTTPSErrors: true,
  });

  browser.StealthPage = async () => {
    const page = await browser.newPage();
    await page.setRequestInterception(true);

    // Add plugins
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
      delete window.chrome.runtime;
      delete window.chrome;
    });

    // Save cookies to a file
    
    page.saveCookies = async (path = './cookies.json') => {
      const cookies = await page.cookies();
      await fs.writeFile(path, JSON.stringify(cookies));
    };

    // Load cookies from a file
    page.loadCookies = async (path = './cookies.json') => { 
      const cookies = JSON.parse(await fs.readFile(path));
      await page.setCookie(...cookies);
    };

    // Wait for HTML to be fully rendered
    page.waitTillHTMLRendered = async (timeout = 30000) => {
      const checkDurationMsecs = 1000;
      const maxChecks = timeout / checkDurationMsecs;
      let lastHTMLSize = 0;
      let checkCounts = 1;
      let countStableSizeIterations = 0;
      const minStableSizeIterations = 3;

      while (checkCounts++ <= maxChecks) {
        const html = await page.content();
        const currentHTMLSize = html.length;

        const bodyHTMLSize = await page.evaluate(
          () => document.body.innerHTML.length
        );

        console.log(
          'last: ',
          lastHTMLSize,
          ' <> curr: ',
          currentHTMLSize,
          ' body html size: ',
          bodyHTMLSize
        );

        if (lastHTMLSize !== 0 && currentHTMLSize === lastHTMLSize) {
          countStableSizeIterations++;
        } else {
          countStableSizeIterations = 0;
        }

        if (countStableSizeIterations >= minStableSizeIterations) {
          console.log('Page rendered fully..');
          break;
        }

        lastHTMLSize = currentHTMLSize;
        await page.waitForTimeout(checkDurationMsecs);
      }
    };

  
    return page;
  };

  return browser;
}

export default StealthBrowser;