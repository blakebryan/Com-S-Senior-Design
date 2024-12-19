const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

// NOTE: these tests will not run properly on linux, and you must have a chrome driver set up.
// start up the server and frontend before running tests 

const options = new chrome.Options();
// options.addArguments('--headless');
options.addArguments('--no-sandbox');
options.addArguments('--disable-dev-shm-usage');
options.addArguments('--disable-gpu');

(async function checkNotams() {
    let driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    try {
        await driver.get('http://localhost:3000');
        
        await driver.findElement(By.id('notams')).click();

        // await driver.wait(until.titleIs('webdriver - Google Search'), 1000);

    } catch {
        console.log("TEST FAILED: checkNotams")
    } finally {
        driver.quit();
    }
})();


(async function clearAns() {
    let driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    try {
        await driver.get('http://localhost:3000');
        
        await driver.findElement(By.id('clear')).click();

        // await driver.wait(until.titleIs('webdriver - Google Search'), 1000);

    } catch {
        console.log("TEST FAILED: clearAns")
    } finally {
        driver.quit();
    }
})();

(async function adminLoads() {
    let driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    try {
        await driver.get('http://localhost:3000/admin');
        
        // await driver.wait(until.titleIs('webdriver - Google Search'), 1000);

    } catch {
        console.log("TEST FAILED: adminLoads")
    } finally {

    }
})();