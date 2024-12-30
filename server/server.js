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
// Dedicated endpoint that will handle getting all stored data.
app.get("/api/getGridData", (req,res) => {
    // Select * from game, left outer join bundle on game.bundle_id = bundle.id where game.steamAppId is not null and !=-1
    // This will make it easy to get everything without concern of where it game from, but also include everything we care about
});


app.get("/api/loadSampleData", (req,res) => {
  fs.readFile('/opt/HumbleLibraryViewer/sampleData.json', 'utf8',async (err, data) => {
    await getAllSteamApps();
    // TODO - Enable this, maybe add a check somehow
    if (err) {
      console.error(err);
      return;
    }
    // Parse it to a json for ease of use
    const json = JSON.parse(data);
    // Now build a list of things valid to show in the grid
    
    let skip=false;
    const gridData=[];
    const choiceRequests=[]
    for (let item of json){
      if (skip) continue;
      // Storefront are straight forward.
      if (item.product.category=='storefront'){
        processStoreItem(item);
      }
      else if (item.product.category=='bundle'){
        processBundleItem(item);
      }
      else if (item.product.choice_url){
        continue;
        // For each choice entry, we need to 
        //  1) Determine a list of all games included in the bundle
        //  2) Determine which games from that list have been included already

        // To handle this, for each choice url, query the database and see if we have an entry for this choice.
        // If so, move on
        // Otherwise, we will grab the contents of the corresponding page, parse out the content containing game data and build our structures.
        const stmt = db.prepare(queries.getBundleByChoiceUrl);
        const row = stmt.get(item.product.choice_url);
        // console.log('Row ');
        console.log(row);
        // If the row does not exist, grab data from the bundle page.
        if (row==undefined){
          choiceRequests.push(processChoiceItem(item,gridData));
        }else{
          // The above is async, so it will handle all of setting up the game data.
          // If we have the bundle data already, set the claimed status for what we can.
          const choice_id  = row.id;
          checkChoiceGamesClaimed(item,choice_id);
        }
    
        
        
        //console.log("Finished "+item.product.choice_url)
        //skip=true
      }else if (item.product.category=='subscriptioncontent' && item.product.machine_name.includes('monthly')){
        // Legacy monthly bundles seem to act the same as regular bundles, pass through the same handler.
        processBundleItem(item,gridData);
      }else{
        // if (item.product.category!='subscriptionplan')
        //console.log(item.product)
      }
    }
    // wait for any choice requests which may have gone async.
    await Promise.all(choiceRequests);
    return res.send(gridData)

  });
});
// Temp endpoint that half heartedly sets up DB and sends a result to the UI for the grid.
// TODO this needs split to upload/setup data and retrieve it.
app.get("/sample", function(req, res) {

  
});

// This function will look over the games in item.tpkd_dict.all_tpks and update the corresponding game, setting claimed=1
// Presence of the redeemed_key_val should be enough.
// If something does not represent a game on a steam (other platform, or a non-game) it can be a little screwy
function checkChoiceGamesClaimed(item,choice_id){
  for (let gameDef of item.tpkd_dict.all_tpks){
    if (gameDef.redeemed_key_val){ 
      // Update the key to be claimed.
      const stmt= db.prepare(queries.setGameClaimed);

      const info = stmt.run(choice_id,gameDef.steam_app_id);
    }
  }
  db.pragma('wal_checkpoint(TRUNCATE)');
}
// Handler for direct store items
// Not 100% certain what this means, direct store purchases for sure
// Maybe also gift purchases, promos and misc stuff?
function processStoreItem(item){

  const insert = db.prepare(queries.insertGame);
  let steamappId='-1';
  // Ensure the details exist before trying to access it  Mostly care about the steam app id

  if (item.tpkd_dict  && item.tpkd_dict.all_tpks){
    const details = item.tpkd_dict.all_tpks[0];
    // Only check steam keys that are not a gift to someone else.
    if ( details?.key_type!='steam' || (details?.is_gift && !item.is_giftee )){
      return;
    }
    if (details.steamAppId){
      steamappId = details.steam_app_id;
    }else{
      steamappId = getSteamAppIdByName(item.product.human_name);
    }
  }
  console.log(steamappId,item.product.human_name,null,item.claimed?1:0)
  insert.run(steamappId,item.product.human_name,null,item.claimed?1:0);
}
// Handler for items within bundles
function processBundleItem(item){
  // Grab list of items and the bundle name
  const bundleName = item.product.human_name;
  const bundleItems = item.tpkd_dict.all_tpks;
  // Check if this bundle exists in the db already or not.
  const bundleRow = db.prepare(queries.getBundleByUid).get(item.uid);
  let bundleId = '';
  let info;
  // If so, get the row id
  if (bundleRow){
    bundleId = bundleRow.id;
  }else{
    // Otherwise, insert the row and track the id
    const insertBundle = db.prepare(queries.insertBundle);
    info = insertBundle.run(bundleName,item.uid);
    bundleId = info.lastInsertRowid;
    //console.log(bundleName,item.uid,info)
  db.pragma('wal_checkpoint(TRUNCATE)'); 
  }
  
  
  const insert = db.prepare(queries.insertGame);
  for (const bundleItem of bundleItems){
    // Only care about steam tbh
    if (bundleItem.key_type != 'steam'){
      continue;
    }
    let steamAppId = bundleItem.steam_app_id
    // If the app is not around, look it up by name
    if (steamAppId == null){
      steamAppId = getSteamAppIdByName(bundleItem.human_name);
    }
    // If we still cannot find it, that is fine, it just means we can't get details about it.
    if (steamAppId==-1){
      console.log (steamAppId,bundleItem.human_name,bundleId,bundleItem.redeemed_key_val?1:0);
      // console.log(info)
      // console.log(bundleRow)

    }
    try{
      // TODO - Cleanup, should not need to be in a try/catch when it is finished.
      insert.run(steamAppId,bundleItem.human_name,bundleId,bundleItem.redeemed_key_val?1:0);
    }
    catch (ex){
      console.log(ex);
      console.log (steamAppId,bundleItem.human_name,bundleId,bundleItem.redeemed_key_val?1:0);
    }
    
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
  console.log('Checking '+item.product.choice_url)
  // Parse it to a json.
  const choiceJson = JSON.parse(scriptbody);
  // Create the bundle entry so that we can relate games to it.
  const stmt = db.prepare(queries.insertChoiceBundle);
  const info = stmt.run(item.product.human_name,item.product.choice_url);
  // Key to the insert is stored here
  const choice_id = info.lastInsertRowid
  // Force a write
  db.pragma('wal_checkpoint(TRUNCATE)');
  
  let rootObj = choiceJson.contentChoiceOptions.contentChoiceData;
  // 2020-2021 use ['initial-get-all-games']['content_choices']
  let tempObj = rootObj['initial-get-all-games']
  let gamesObj = tempObj?.content_choices;
  if (gamesObj){ // Aug2020-jan2021
    createChoiceGames(gamesObj,choice_id);
  }else if (rootObj.game_data){ // 2022-2024 use this.
    createChoiceGames(rootObj.game_data,choice_id);
  }else if (rootObj.initial?.content_choices){ // dec2019 + 2020-2021,
    createChoiceGames(rootObj.initial.content_choices,choice_id);
  }else{
    console.log('Did not match '+item.product.choice_url)
  }

  db.pragma('wal_checkpoint(TRUNCATE)');
  checkChoiceGamesClaimed(item,choice_id);

}
// Data is stored pretty consistently once we find the similar structure.
// This function will handle creating the database entry for this game.
// This will NOT handle the claimed flag, just the base frame of the game definition.
// This is so that we can consistently set the claimed state in a shared function.
function createChoiceGames(gamesObj,choice_id) {
  const insert = db.prepare(queries.insertGame);
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
      // If the steam app id isn't around, try to look it up
      if (!steamAppId && gameData.key_type=='steam'){
        getSteamAppIdByName(name);
        if (steamAppId == -1 ){
          steamAppId='';
        }
      }
      if(!steamAppId || gameData.key_type != 'steam'){
        //console.log(gameData)
        continue;
      }
    }
    // Insert the game definition. Name, steamappid and choice bundle id are included here.
    insert.run(steamAppId,name,choice_id,false);
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
// Some bundles games seem to have null steam app ids, so to remedy that, get a list of all apps on steam

// https://api.steampowered.com/ISteamApps/GetAppList/v2/ will do this
// See this for info - https://partner.steamgames.com/doc/webapi/ISteamApps#GetAppList
async function getAllSteamApps(){
  console.log('Pulling Steam AppId/Names');
  const allApps = await axios.get('https://api.steampowered.com/ISteamApps/GetAppList/v2/');
  //const allApps = JSON.parse(allAppsStr);
  //console.log(allApps)
  const insert = db.prepare(queries.insertSteamApp);
  let count=0;
  const appIds = new Set();
  console.log('Updating steamApp table');
  for (let app of allApps.data.applist.apps){
    const name = app.name.trim();
    
    if (appIds.has(app.appid)) continue;
    if (name=='') continue;
    try{
      let info = insert.run(app.appid,name);
      if (!info.changes){
        console.log(app);
      }
      appIds.add(app.appid)
    }catch(ex){
      console.log(ex);
      console.log(app);
    }
    count++;
    if (count%1000==0){
      db.pragma('wal_checkpoint(TRUNCATE)');
    }
  }
  db.pragma('wal_checkpoint(TRUNCATE)');
  console.log(`Added/updated ${count} entries.`);
}

function getSteamAppIdByName(name){
  let stmt = db.prepare(queries.getSteamAppByName);

  const row = stmt.get(name);
  // If a row is found, grab the id column
  if (row){
    return row.steam_app_id;
  }else{}
  // Otherwise, return a default value
  return -1;


}