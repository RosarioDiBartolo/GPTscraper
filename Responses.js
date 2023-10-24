import StealthBrowser from './Core.js'; 
import readline from 'readline';
 
const textAreaSelector = "#prompt-textarea";
const BtnSelector = "#__next  div.flex.w-full.items-center > div > button"
const ResponseSelector = '.final-completion';
  
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
// Function to generate a random delay
function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
 
(async () => {
  const browser = await StealthBrowser();
  const page = await browser.StealthPage();
 
  async function typeWithRandomDelay(text) {
    for (const char of text) {
      await page.type(textAreaSelector, char, { delay: getRandomDelay(50, 150) }); // Adjust min and max delays as needed
    }
  }
  
  // Load cookies if available
  await page.loadCookies();
  await page.goto('https://chat.openai.com/?model=text-davinci-002-render-sha');

  await page.waitForFunction((targetURL) => {
    return location.href === targetURL;
  }, { timeout: 100000000 }, "https://chat.openai.com/?model=text-davinci-002-render-sha");
 
 
  await page.saveCookies();

  await page.waitTillHTMLRendered();
 
  await page.waitForSelector(textAreaSelector);
    
 
  await page.click(textAreaSelector);
  await typeWithRandomDelay( "Hello chat gpt" );
 
  
  await page.click(BtnSelector);
 
  
  const Response = await page.$eval(ResponseSelector, (e) => e.innerHTML );
  //waiting for someone to implement the logic of extraction of the text/code

   console.log( Response );
 
    
   await browser.close();
})();  