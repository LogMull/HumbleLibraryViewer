# HumbleLibraryViewer

## Dev Notes

- Start sever + front end
- `npm run dev`
    -  this allows access via localhost:5173



Method to obtain file
https://www.reddit.com/r/humblebundles/comments/11kx7i8/comment/jb9qupl/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button

Referencing this for vue and express setup
https://medium.com/@hminnovance/create-a-modern-web-app-with-node-express-and-vue-js-a3e5f224d6d5


## TODO
    Determine how to handle titles that we can't do (Tiny and Bigs: Grandpa's Adventure vs Tiny and Bigs in ....)
    Tag prioritization -- Comes from steam spy, maybe give a threshhold when searching? Otherwise tags with 1/2 votes count, which is yuck.
    Improve UI layout
    Buttons in UI for
        purge data
        update games w/ no tags
        update ALL games (w/ 24hr cooldown)
    Rename UI component
    After pulling data from selenium, grid needs a refresh.
    Several TODOs in server code.
    Verify if node is required to run this
        If so, look into including it as a binary somehow so nothing needs installed
    How much of a pita would it be to run selenium in electron vs requiring chrome?
    Add searches for games w/ no known steam app id
    Document intall, run and compilation steps
    Add info page
        Include what the app does
        no data collection, no cloud stuff, all locally stored
        No ability to claim games, just simply reports it
        Why this may be useful, etc
        Where database file is stored.
        Include tools / libraries, etc used

        Give very detailed description of what it does and how.
    Compilation for Linux and mac
    Cleanup unused stuff
        Packages, vue.config.js?
    Ensure eslint actually works and enforces useful stuff.



## TODONE
    Retrieve games from Choice
    
    Somehow indicate if the game on choice is available or not - Mostly likely by verifying it is choice and there are 0 choices left and game in unclaimed.
        Maybe just skip it in this case?
    Add some theming and styling to make it look half decent

    See if we can dynamically determine the URL for the steam store from the steam app Id
        https://store.steampowered.com/app/957960 
        Maybe filter out things tat are not steam based?
    
    STEAM API
        Figure out how to look up the game
        Video on game stats - wonder if there is any clue to how the API was scraped?
            https://www.youtube.com/watch?v=qiNv3qv-YbU
        Look up tags for game, review score
        
        Set up DB to store these things so that it does not need run more than once
        Can use something like this to get data, gives a ton of info, limit of 1 per sec
        https://steamspy.com/api.php?request=appdetails&appid=730
    
    Add ability to upload a file to parse for people other than me to use lol

    Grid filtering
        By tag
        Hide claimed items
        Hide choice
    

    Some games are getting an ID of -1, despite appearing in the steam app list from the steam API - should look into this


    Endpoint to build grid data

    Tag retrieval 

    All games addeded need a uniqueness check, OR when data is loaded, it is first purged.

Dev Notes
    Start backend - `yarn dev`
    start UI - from client dir, `yarn serve`
    Build data sources 