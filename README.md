# HumbleLibraryViewer

Method to obtain file
https://www.reddit.com/r/humblebundles/comments/11kx7i8/comment/jb9qupl/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button

Referencing this for vue and express setup
https://medium.com/@hminnovance/create-a-modern-web-app-with-node-express-and-vue-js-a3e5f224d6d5


## TODO
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
    