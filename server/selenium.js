/*
  This file handles everything webdrive related
  In short, it launches a webdriver instance (TODO, add options later for other browsers / electron built-in)
  which then navigates to HumbleBundle and allows the user to log in. It will then gather bundle information
  Collection is based on this
  https://www.reddit.com/r/humblebundles/comments/11kx7i8/comment/jb9qupl/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button

*/
import {Builder, By,  until} from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

export default getHBData;

// Helper to consistently send messages over the socket
function sendSocketMessage(ws,message){
  ws.send(JSON.stringify({'type':'selenium', 'message':message}))
}
async function getHBData(ws){

let driver = await new Builder()
        .forBrowser('chrome')  // Must be Chrome
        .setChromeOptions(new chrome.Options()) // Required for Chrome-specific commands
        .build();
  // Simple wait function
  async function sleep(ms) {
    return await new Promise(resolve => setTimeout(resolve, ms));
  }
  let result = [];
  try {
    console.log("Opening Humble bundle");

    sendSocketMessage(ws,'Opening HumbleBundle');
    await driver.get('https://www.humblebundle.com/home/keys');
    console.log("Waiting for login");
    sendSocketMessage(ws,'Please log in to Humble Bundle');
    await driver.wait(until.elementLocated(By.className('js-navbar-logout')), 0); // No timeout, waits indefinitely
    console.log("Logged in!");
    sendSocketMessage(ws,'Please wait while data is fetched This may take a while if you have many purchases.  The browser window will reload and appear blank.');
    sleep(3000)
    console.log('Disabling.');
    await driver.sendDevToolsCommand('Emulation.setScriptExecutionDisabled', { value: true });
    sleep(3000)
    
    // Reload the page with JavaScript disabled
    console.log('Refreshing page');
    await driver.navigate().refresh();
    sleep(1000);        
    // Fetch game data
    result = await fetchGamesInSelenium(driver);
    
    //await writeFile('output.json', JSON.stringify(result, null, 2));
    console.log("Done reading from Humblebundle")

  } finally {
   
    await driver.quit()

  }
  return result;
}

  // function to pull games from humble. Returns an array of purchase objects, main app will filter these.
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