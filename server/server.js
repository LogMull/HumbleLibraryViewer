import fs from 'node:fs';
import cors from 'cors';
import express from "express";
import axios from 'axios';
import * as cheerio from 'cheerio';
const app = express();
app.use(cors());
app.use(express.json());

import {db,queries} from './databaseManager.js'
import { json } from 'node:stream/consumers';
import e from 'cors';

//const db = require('./databaseManager')

app.get("/", function(req, res) {
    return res.send("Hello World"); 
});
app.get("/api/message", function(req, res) {
    return res.send("Hello yellow");
});

app.get("/sample", function(req, res) {
    fs.readFile('/opt/HumbleLibraryViewer/sampleData.json', 'utf8',async (err, data) => {
        if (err) {
          console.error(err);
          return;
        }
        const json = JSON.parse(data);
        // Experimental Data;
        const productCats={};
        const cats = json.map((obj) => {
          //console.log(obj)
          return obj.product.category;
        });
        const uniqueSet = new Set(cats);

        // Convert the Set back to an array (if needed)
        const uniqueCats = [...uniqueSet];

        console.log(uniqueCats)
        // Now build a list of things valid to show in the grid
        // Start with storefront, those are pretty easy.
        let skip=false;
        const gridData=[];
        const choiceRequests=[]
        for (let item of json){
          if (skip) continue;

          if (item.product.category=='storefront'){
          
            // processStoreItem(item,gridData);
          }
          else if (item.product.category=='bundle'){
            // processBundleItem(item,gridData);
          }
          else if (item.product.choice_url){
            // For each choice entry, we need to 
            //  1) Determine a list of all games included in the bundle
            //  2) Determine which games from that list have been included already

            // To handle this, for each choice url, query the database and see if we have an entry for this choice.
            // If so, move on
            // Otherwise, we will grab the contents of the corresponding page, parse out the content containing game data and build our structures.
            const stmt = db.prepare(queries.checkChoiceExists);
            const row = stmt.get(item.product.choice_url);
            // console.log('Row ');
            // console.log(row);
            // If the row does not exist, grab data from the bundle page.
            if (!row.row_exists){
              choiceRequests.push(processChoiceItem(item,gridData));
            }else{
              // The above is async, so it will handle all of setting up the game data.
              // If we have the bundle data already, set the claimed status for what we can.
            }
            
            
            //console.log("Finished "+item.product.choice_url)
            //skip=true
          }else if (item.product.category=='subscriptioncontent' && item.product.machine_name.includes('monthly')){
            // Lgeacy monthly bundles seem to act the same as regular bundles.  pog
            processBundleItem(item,gridData);
          }else{
            if (item.product.category!='subscriptionplan')
            console.log(item.product)
          }
        }
        await Promise.all(choiceRequests);
        return res.send(gridData)

      });
});
// Handler for direct store items
// Not 100% certain what this means, direct store purchases for sure
// Maybe also gift purchases, promos and misc stuff?
function processStoreItem(item,gridData){
  const data = {
    name: item.product.human_name,
    bundle: '',
    claimed: item.claimed
  }
  gridData.push(data)
}
// Handler for items within bundles
function processBundleItem(item,gridData){
  const bundleName = item.product.human_name;
  const bundleItems = item.tpkd_dict.all_tpks;
  for (const bundleItem of bundleItems){

    const data = {
      claimed: bundleItem.redeemed_key_val?true:false,
      name:bundleItem.human_name,
      bundle:bundleName
    }
    gridData.push(data);
  }


}
app.listen(3000, function(){
    console.log('Listening on port 3000');
});

// Processing choice items is a bit of a pain.
// The current approach is to curl the page and look for a specific script on the page
// That script has a dump of the data that we can use to build out our structures
// HOWEVER it appears that the form of that data has changed over time, which makes this messier.
// This function will handle building the DB of games included in the bundle.
async function processChoiceItem(item,gridData){
  // Get the script content from the page.
  const scriptbody = await fetchScriptContent('https://www.humblebundle.com/membership/'+item.product.choice_url,'webpack-monthly-product-data')
  // Parse it to a json.
  const choiceBody = JSON.parse(scriptbody);
  // Create the bundle entry so that we can relate games to it.
  const insert = db.prepare(queries.insertChoiceBundle);
  const info = insert.run(item.product.human_name,item.product.choice_url);
  // Key to the insert is stored here
  const choice_id = info.lastInsertRowid
  // Force a write
  db.pragma('wal_checkpoint(TRUNCATE)');
  
  let rootObj = choiceBody.contentChoiceOptions.contentChoiceData;
  // 2020-2021 use ['initial-get-all-games']['content_choices']
  let tempObj = rootObj['initial-get-all-games']
  let gamesObj = tempObj?.content_choices;
  if (gamesObj){ // Aug2020-jan2021
    createChoiceGame(gamesObj,choice_id);
  }else if (rootObj.game_data){ // 2022-2024 use this.
    createChoiceGame(rootObj.game_data,choice_id);
  }else if (rootObj.initial?.content_choices){ // dec2019 + 2020-2021,
    createChoiceGame(rootObj.initial.content_choices,choice_id);
  }else{
    console.log('Did not match '+item.product.choice_url)
  }

  db.pragma('wal_checkpoint(TRUNCATE)');
}
// Data is stored pretty consistently once we find the similar structure.
// This function will handle creating the database entry for this game.
// This will NOT handle the claimed flag, just the base frame of the game definition.
// This is so that we can consistently set the claimed state in a shared function.
function createChoiceGame(gamesObj,choice_id) {
  const insert = db.prepare(queries.insertChoiceGame);
  // Iterate over all games
  for (let gameEntry in gamesObj){
    // Some games are not actually games, but may be a combo, such as 'Fallout1 + 76', in this case they dont have tpkds, so get data differently
    const gameBase = gamesObj[gameEntry];
    let steamAppId ='-1';
    let name='';
    if (gameBase.tpkds){
      const gameData = gameBase.tpkds[0];
      steamAppId = gameData.steam_app_id;
      name = gameData.human_name;
    }
    // Insert the game definition. Name, steamappid and choice bundle id are included here.
    insert.run(steamAppId,name,choice_id);
  }
}
/// Get a webpage and parse it to find a script tag. For example
//  https://www.humblebundle.com/membership/october-2022 id =webpack-monthly-product-data

async function fetchScriptContent(url, scriptId) {
  try {
    // Fetch the HTML content
    const response = await axios.get(url);

    // Load the HTML into cheerio
    const $ = cheerio.load(response.data);

    // Extract the contents of the script with the specified id
    const scriptContent = $(`script#${scriptId}`).html();

    if (scriptContent) {
      //console.log(`Contents of <script id="${scriptId}">:\n`, scriptContent);
      return scriptContent;
    } else {
      console.log(`No <script id="${scriptId}"> found in the page.`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching the page:', error.message);
    return null;
  }
}