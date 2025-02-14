import cors from 'cors';
import express from "express";
import axios from 'axios';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import getHBData from './selenium.js';
const app = express();
app.use(cors());
app.use(express.json());

import WebSocket from 'ws';

/*
  TODOs for this file
  Remove express endpoints, use only websockets instead.
  Split into more meaningful modules, this is too large and varied
    Maybe do one for bundle/game parsing and one for metadata (steamspy) retrieval?
 
 */

const wss = new WebSocket.Server({ port: 8080 });
// TODO move all express apis to websocket connections
wss.on('connection', function connection(ws) {


  ws.on('message', async function incoming(message) {
    console.log("Got message... " + message)
    if (message == 'selenium'){
      let data = await getHBData(ws);
      console.log(data.length);
      ws.send(JSON.stringify({'type':'selenium', 'message':'Total Items: '+data.length}))
      loadHBData(data,ws)
      sendSocketMessage(ws,'selenium','done')
    }else if (message=='getGridData'){
      const returnResult={}
    // Select * from game, left outer join bundle on game.bundle_id = bundle.id where game.steamAppId is not null and !=-1
    // This will make it easy to get everything without concern of where it game from, but also include everything we care about
    const rows = db.prepare(`select game.name as 'game', game.claimed as 'claimed', game.steamAppId as 'appId', bundle.name as 'bundle', steamApp.tags as 'tags', steamApp.posReviews as 'positive', steamApp.negReviews as 'negative'
      FROM game 
	    left outer join bundle on game.bundle_id = bundle.id 
	    left outer join steamApp on game.steamAppId = steamApp.steam_app_id`).all()
    const gridData = [];
    const allTag = new Set();
    const uniqueList = new Set();
    for (let row of rows){
      if (uniqueList.has(`${row.game}${row.bundle}`)) continue;
      uniqueList.add(`${row.game}${row.bundle}`);
      let posPercent = row.positive/(row.positive+row.negative)*100
      row.positivePercent = Math.round(posPercent);
      gridData.push(row);
      //console.log(row)
      if (row.tags){
        let tags = JSON.parse(row.tags)
        for (let tag of tags){
          allTag.add(tag);
        }
        row.tags = tags
      }
    }
    returnResult.gridData = gridData;
    returnResult.allTags = [...allTag].sort();
    ws.send(JSON.stringify({type:'getGridData',
      'data':returnResult
    }));
    
    }else if (message=='metadata'){
      updateGameMetadata(ws);
    }
    // Handle incoming message
  });

  ws.on('close', function() {
    // Handle connection close
  });
});
import {db,queries} from './databaseManager.js'
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

async function updateGameMetadata(ws,mode) {
  const queryString = `SELECT distinct steamAppId from game inner join steamApp on game.steamAppId = steamApp.steam_app_id
  where game.steamAppId != -1 and (steamApp.updated is null or steamApp.updated <= DATE('now','-1 day'))`
  const rows = db.prepare(queryString).all(); // TODO move to queries
  // const rows = db.prepare(`SELECT distinct steamAppId FROM game where steamAppId != -1 and (updated is null or updated <= DATE('now', '-1 day'))`).all(); // TODO move to queries
  
  const update = db.prepare(`UPDATE steamApp SET tags = ?, posReviews = ?, negReviews = ?, updated = DATE('now') WHERE steam_app_id = ?`); 
  let cnt = 0;
  console.log(`Retrieving tags and reviews for ${rows.length} games.`);
  const requestDelay=1000;
  for (let row of rows){
    cnt++;
    let url = `https://steamspy.com/api.php?request=appdetails&appid=${row.steamAppId}`
    // const response = await fetch(url);
    // const data = await response.json();
    // const tags = Object.keys(data.tags)
    // const posRev = data.positive;
    // const negRev = data.negative;
    // update.run(JSON.stringify(tags),posRev,negRev, row.steamAppId);
    await delay(requestDelay); // Sleep for 1s to respect rate limit listed in API.
    ws.send(JSON.stringify({'type':'metadata','data':{
      'total':rows.length,
      'finished':cnt,
      requestDelay
      }}));

  }


}
// This endpoint will handle populating all tags, reviews, etc from SteamSpy for every game the user has access to.
app.get("/api/refreshAllGameData", async (req,res) => {
  const queryString = `SELECT distinct steamAppId from game inner join steamApp on game.steamAppId = steamApp.steam_app_id
  where game.steamAppId != -1 and (steamApp.updated is null or steamApp.updated <= DATE('now','-1 day'))`
  const rows = db.prepare(queryString).all(); // TODO move to queries
  // const rows = db.prepare(`SELECT distinct steamAppId FROM game where steamAppId != -1 and (updated is null or updated <= DATE('now', '-1 day'))`).all(); // TODO move to queries
  
  const update = db.prepare(`UPDATE steamApp SET tags = ?, posReviews = ?, negReviews = ?, updated = DATE('now') WHERE steam_app_id = ?`); 
  let cnt = 0;
  console.log(`Retrieving tags and reviews for ${rows.length} games.`);
  for (let row of rows){
    cnt++;
    let url = `https://steamspy.com/api.php?request=appdetails&appid=${row.steamAppId}`
    const response = await fetch(url);
    const data = await response.json();
    const tags = Object.keys(data.tags)
    const posRev = data.positive;
    const negRev = data.negative;
    update.run(JSON.stringify(tags),posRev,negRev, row.steamAppId);
    return; 
    await delay(300);
    if (cnt%50==0){
      console.log(`Updated ${cnt}/${rows.length} (${cnt/rows.length}%)`)
    }

  }

});

/// This will load the game data (either from sample file or result of selenium).
// Game and bundle tables will be purged, steamApp table will be updated
async function loadHBData(data,ws){
  // Clear the tables.
  try{
    db.prepare('DELETE FROM games').run();
    db.prepare('DELETE FROM bundles').run();
  }
  catch (ex){
     // Ignore this error for now, appears just to be due to the table not being around the first time
  }
  // Refresh steam data
  await getAllSteamApps();

  let skip=false;
  const choiceRequests=[];
  let count=0;
  sendSocketMessage(ws,'selenium',`Parsing Humble Bundle data (${data.length} entries`);
  for (let item of data){
    count++;
    if (skip) continue;
    // Storefront are straight forward.
    if (item.product.category=='storefront'){
      processStoreItem(item);
    }
    else if (item.product.category=='bundle'){
      processBundleItem(item);
    }
    else if (item.product.choice_url){
    
      // For each choice entry, we need to  
      //  1) Determine a list of all games included in the bundle
      //  2) Determine which games from that list have been included already

      // To handle this, for each choice url, query the database and see if we have an entry for this choice.
      // If so, move on
      // Otherwise, we will grab the contents of the corresponding page, parse out the content containing game data and build our structures.
      const stmt = db.prepare(queries.getBundleByChoiceUrl);
      const row = stmt.get(item.product.choice_url);
      // If the row does not exist, grab data from the bundle page.
      if (row==undefined){ 
        choiceRequests.push(processChoiceItem(item));
      }else{
        // The above is async, so it will handle all of setting up the game data.
        // If we have the bundle data already, set the claimed status for what we can.
        const choice_id  = row.id;
        checkChoiceGamesClaimed(item,choice_id);
      }

    }else if (item.product.category=='subscriptioncontent' && item.product.machine_name.includes('monthly')){
      // Legacy monthly bundles seem to act the same as regular bundles, pass through the same handler.
      processBundleItem(item);
    }else{
      // if (item.product.category!='subscriptionplan')
      //console.log(item.product)
    }
  }
  // wait for any choice requests which may have gone async.
  await Promise.all(choiceRequests);
  console.log("Done with all items!")

}
// This function will look over the games in item.tpkd_dict.all_tpks and update the corresponding game, setting claimed=1
// Presence of the redeemed_key_val should be enough.
// If something does not represent a game on a steam (other platform, or a non-game) it can be a little screwy
function checkChoiceGamesClaimed(item,choice_id){
  for (let gameDef of item.tpkd_dict.all_tpks){
    if (gameDef.redeemed_key_val){ 
      let appId = gameDef.steam_app_id
      if (!appId){
        appId = getSteamAppIdByName(gameDef.human_name);
      }
      // Update the key to be claimed.
      const stmt= db.prepare(queries.setGameClaimed);

      const info = stmt.run(choice_id,appId);
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
    let steamAppId = bundleItem.steam_app_id;
    // If the app is not around, look it up by name
    if (steamAppId == null){
      steamAppId = getSteamAppIdByName(bundleItem.human_name);
    }
    // If we still cannot find it, that is fine, it just means we can't get details about it.
    if (steamAppId==-1){
      console.log (steamAppId,bundleItem.human_name,bundleId,bundleItem.redeemed_key_val?1:0);

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
async function processChoiceItem(item){
  
  // Get the script content from the page.
  const scriptbody = await fetchScriptContent('https://www.humblebundle.com/membership/'+item.product.choice_url)
  console.log('Checking '+item.product.choice_url)
  // Parse it to a json.
  const choiceJson = JSON.parse(scriptbody);
  // Create the bundle entry so that we can relate games to it.
  const stmt = db.prepare(queries.insertChoiceBundle);
  const info = stmt.run(item.product.human_name,item.product.choice_url);
  // Key to the insert is stored here
  const choice_id = info.lastInsertRowid
  // Force a write -- bundles must be present before their games
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
    const gameBase = gamesObj[gameEntry];
    let steamAppId =-1;
    let name='';
    // Some games are not actually games, but may be a combo, such as 'Fallout1 + 76', in this case they dont have tpkds, so get data differently
    if (gameBase.tpkds){
      const gameData = gameBase.tpkds[0];
      steamAppId = gameData.steam_app_id;
      name = gameData.human_name;
      // If the steam app id isn't around, try to look it up
      if (!steamAppId && gameData.key_type=='steam'){ 
        steamAppId = getSteamAppIdByName(name);
      }
      // Ignore non-steam games
      if(gameData.key_type != 'steam'){
        continue;
      }
      // Ensure valid key is set.
      if (!steamAppId){ 
        steamAppId = -1;
      }
    }
    // Insert the game definition. Name, steamappid and choice bundle id are included here.
    insert.run(steamAppId,name,choice_id,0);
  }
}
/// Get a webpage and parse it to find a script tag. For example
//  https://www.humblebundle.com/membership/october-2022 id =webpack-monthly-product-data

async function fetchScriptContent(url, scriptId='webpack-monthly-product-data') {
  try {
    // Fetch the HTML content
    // TODO - use fetch here
    const response = await axios.get(url);

    // Load the HTML into cheerio
    const $ = cheerio.load(response.data);

    // Extract the contents of the script with the specified id
    const scriptContent = $(`script#${scriptId}`).html();

    if (scriptContent) {
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
function sendSocketMessage(ws, type, message){

  if (ws){
    ws.send(JSON.stringify({type,message}));
  }
}
// Some bundles games seem to have null steam app ids, so to remedy that, get a list of all apps on steam

// https://api.steampowered.com/ISteamApps/GetAppList/v2/ will do this
// See this for info - https://partner.steamgames.com/doc/webapi/ISteamApps#GetAppList
// Oddly enough, we get a ton of duplicate data, roughly 15k from previous tests. This function will not add duplicates from the data set.
// The query used tto insert data should ignore duplicate keys as well, so this is safe to run at any time.
async function getAllSteamApps(ws){
  console.log('Pulling Steam AppId/Names');

  const response = await fetch(`https://api.steampowered.com/ISteamApps/GetAppList/v2/`)
  const allApps = await response.json();

  const insert = db.prepare(queries.insertSteamApp);
  let count=0;
  const appIds = new Set(); // Keeps track of the games already processed from this batch.

  console.log(`Total apps received: ${allApps.applist.apps.length}`);
  
  let skippedIdCnt=0;
  let skippedNameCnt=0;
  for (let app of allApps.applist.apps){
    const name = app.name.trim();
    // Do not process duplicates
    if (appIds.has(app.appid)){
      skippedIdCnt++;
      continue
    } 
    // Ignore blank names, we don't care about those.
    if (name==''){ skippedNameCnt++; continue;}
    try{
      appIds.add(app.appid)
      // Query will prevent duplicate keys
      insert.run(app.appid,app.name)
    }catch(ex){
      console.log(ex);
      console.log(app);
    }
    count++;
  }
  
  db.pragma('wal_checkpoint(TRUNCATE)'); 
  console.log(`Unique AppIDs processed: ${appIds.size}`);
  console.log(`Skipped ${skippedIdCnt} ids and ${skippedNameCnt} names (${skippedIdCnt+skippedNameCnt}) Total processed = ${skippedIdCnt+skippedNameCnt + appIds.size}`)
  console.log(`Added/updated ${count} entries.`);
  
} 
// Some entries do not have valid steam app ids, but the name may match what is on steam.  In this case we can look up the app id to correctly
// associate the game to its entry.
function getSteamAppIdByName(name){
  let stmt = db.prepare(queries.getSteamAppByName);

  const row = stmt.get(name);
  // If a row is found, grab the id column
  if (row){
    return row.steam_app_id;
  }
  // Otherwise, return a default value
  return -1;


}