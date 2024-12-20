import fs from 'node:fs';
import cors from 'cors';
import express from "express";
import axios from 'axios';
import * as cheerio from 'cheerio';
const app = express();
app.use(cors());
app.use(express.json());


app.get("/", function(req, res) {
    return res.send("Hello World");
});
app.get("/api/message", function(req, res) {
    return res.send("Hello yellow");
});

app.get("/sample", function(req, res) {
    fs.readFile('/opt/HumbleLibraryViewer/sampleData.json', 'utf8', (err, data) => {
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
        for (let item of json){
          if (skip) continue;
          let data = {};
          if (item.product.category=='storefront'){
          
            processStoreItem(item,gridData);
          }
          if (item.product.category=='bundle'){
            processBundleItem(item,gridData);
          }
          if (item.product.choice_url){
            processChoiceItem(item,gridData);
            skip=true
          }
        }
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
async function processChoiceItem(item,gridData){
  const scriptbody = fetchScriptContent('https://www.humblebundle.com/membership/'+item.product.choice_url,'webpack-monthly-product-data')
  console.log(scriptbody)
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
      console.log(`Contents of <script id="${scriptId}">:\n`, scriptContent);
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