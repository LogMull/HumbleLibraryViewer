import fs from 'node:fs';
import cors from 'cors';
import express from "express";
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

        return res.send(json)

      });
});


app.listen(3000, function(){
    console.log('Listening on port 3000');
});