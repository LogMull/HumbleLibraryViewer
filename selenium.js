//const webdriver = require('selenium-webdriver')
import {Builder, Browser, By, Key, until} from 'selenium-webdriver';
import { writeFile,readFile } from 'fs/promises';
import chrome from 'selenium-webdriver/chrome.js';
//import chrome from selen
//const chrome = require('selenium-webdriver/chrome')
//const firefox = require('selenium-webdriver/firefox')


//   let driver = new Builder()
//   .forBrowser(Browser.CHROME)
//   .usingServer('http://localhost:4444/wd/hub')
//   .build()
let driver = await new Builder()
        .forBrowser('chrome')  // Must be Chrome
        .setChromeOptions(new chrome.Options()) // Required for Chrome-specific commands
        .build();
  async function sleep(ms) {
    return await new Promise(resolve => setTimeout(resolve, ms));
  }
  try {
    console.log("Opening Humble bundle");
    await driver.get('https://www.humblebundle.com/home/keys');
    console.log("Waiting for login");
    await driver.wait(until.elementLocated(By.className('js-navbar-logout')), 0); // No timeout, waits indefinitely
    console.log("Logged in!");
    // Access the Chrome DevTools Protocol
    let devTools = await driver.createCDPConnection('page');
   // Disable JavaScript on the page
    // sleep(5000)
    // console.log('Freezing.');
    //await driver.sendDevToolsCommand('Page.setWebLifecycleState', { state: 'frozen' });
    sleep(5000)
    console.log('Disabling.');
    await driver.sendDevToolsCommand('Emulation.setScriptExecutionDisabled', { value: true });
    
    sleep(5000)

    console.log('JavaScript has been disabled on the target page.');
    sleep(5000);
    // Reload the page with JavaScript disabled
    console.log('Refreshing page');
    await driver.navigate().refresh();
    sleep(5000);        
    // Fetch game data
    const result = await fetchGamesInSelenium(driver);
    // console.log('Reading helper script');
    // const script = await readFile('seleniumDownloadRawData.js', 'utf-8');
    // // Write output to a file for debugging
    // // Execute the script in the browser context
    // console.log('Runnig helper script');
    // const result = await driver.executeScript(script);            
    // console.log("Script executed successfully! , writing results")
    
    await writeFile('output.json', JSON.stringify(result, null, 2));
    console.log("D O N E")

    //await driver.findElement(By.name('q')).sendKeys('webdriver', Key.RETURN)
    //await driver.wait(until.titleIs('webdriver - Google Search'), 1000)
  } finally {
    await sleep(12000)
    await driver.quit()

  }

  async function fetchGamesInSelenium(driver) {
    return await driver.executeAsyncScript(`
        const callback = arguments[0];

        async function fetchOrder(bundle) {
            try {
                const response = await fetch(\`/api/v1/order/\${bundle}?all_tpkds=true\`);
                if (!response.ok) {
                    throw new Error(\`HTTP error! Status: \${response.status}\`);
                }
                return await response.json();
            } catch (error) {
                console.error('Error fetching order:', error);
                return null;  // Return null on failure
            }
        }

        async function getGames() {
            const bundles = JSON.parse(document.getElementById('user-home-json-data').innerText).gamekeys;
            const results = await Promise.all(bundles.map(bundle => fetchOrder(bundle)));
            callback(results.filter(r => r !== null)); // Remove null values and return data
        }

        getGames();
    `);
}