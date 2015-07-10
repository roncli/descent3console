# Descent 3 Console

A cross-platform utility for managing a Descent 3 server via remote console implemented in node.js.

## Usage

This is the minimum required code to connected to a Descent 3 server 

```
var Console = require("descent3console"),
    d3console = new Console();

d3console.options.server = "127.0.0.1";
d3console.options.port = 2093;
d3console.options.password = "testing";

d3console.connect();
```

Here are the steps required to connect to a Descent 3 server:

* First, you must require the descent3console module.
* Next, create a new console from the Console object.
* Set the server, port, and password required to connect to the server.
* Call the connect method to connect to the server.

This merely gets you connected to the server, which alone isn't very exciting.  The power of this module comes from the ability to listen to events and send commands to the server.  For instance, you could listen to the `kill` event and perform an action on the server based on that:

```
d3console.on("kill", function(killer, killed, weapon) {
    if (weapon === "lasers") {
        d3console.say("Wow, " + killed + ", you got wrecked by those blue lasers!");
    }
});
```

## Options

`d3console.options.server` - This is the IP address of the server you wish to connect to.

`d3console.options.port` - This is the port number of the server you wish to connect to, defaulting to 2092.

`d3console.options.password` - This is the password required to connect to the server.

## Events

The instantiated console object is an `EventEmitter`, and will emit events when it receives data from the server.  These are the events that you can listen to, along with the parameters sent with each event.

`balancing` - The server is forcefully balancing teams.

`banlist (banNum, player)` - An entry in the ban list.  `banNum` is the number of the banned player, and `player` is the name of the player.

`banned (player)` - A player got banned from the game.  `player` is the name of the player who got banned.

`banremoved (successful)` - The previous attempt to remove a ban was successful.  `successful` is a boolean that indicates a successful ban remove.

`close` - The connection was closed.

`command (command)` - A command that was sent.  `command` is the input that you sent.

`death (player)` - A player died to the environment, for instance to an exploding crate.  `player` is the name of the player who died.

`disconnected (player)` - A player disconnected from the game.  `player` is the name of the player who disconnected.

`end` - The server is closing the connection.

`endlevel` - The level has ended.

`entropybase (player, team, room)` - A player took over a base in entropy.  `player` is the name of the player who took over the base, `team` is the name of the team who lost the base (NOT the name of the team the player belongs to!), and `room` is the name of the room that was taken over.

`error (error)` - There was an error with the connection.  `error` indicates what the error was.

`flagpickup (player, team, flag)` - A player picked up a flag.  `player` is the name of the player who picked up the flag, `team` is the name of the team the player belongs to, and `flag` is the name of the team the flag belongs to.

`flagreturn (player, team)` - A player returned a flag.  `player` is the name of the player who returned the flag, and `team` is the nme of the team the player belongs to.

`flagscore (player, team, flag1, flag2, flag3)` - A player scored one or more flags.  `player` is the name of the player who scored, `team` is the name of the team the player belongs to, and `flag1`, `flag2`, and `flag3` is the name of the team each of the flags that got scored belong to, with `unknown` being sent for `flag2` and `flag3` if less than 2 or 3 flags respectively were scored.

`gameinfo (info)` - Game information was received.  `info` is an object that contains one or more key-value pairs.  See the Game Info section for more details.

`guidebot (text)` - The guidebot said something.  `text` is what the guidebot said.

`hattrick (player, first)` - A player scored a hat trick.  `player` is the name of the player who scored the hat trick, and `first` is a boolean that represents whether it was the game's first hat trick.

`hoardscore (player, score, totalScore)` - A player scored in a horde game.  `player` is the name of the player who scored, `score` is how many points they just scored, and `totalScore` is their total score.

`hyperorb (player)` - A player picked up the HyperOrb.  `player` is the name of the player who picked up the HyperOrb.

`hyperorblost (player)` - A player lost the HyperOrb.  `player` is the name of the player who lost the HyperOrb.

`hyperorbscore (player, points)` - A player gained extra points for making a kill with the HyperOrb.  `player` is the name of the player who gained the extra points, and `points` is the number of points they received in total.  Note that the `kill` event is still sent with this message, so if you see a player scored 2 bonus points and a kill message in roughly the same instant, they actually scored 2 points.

`invalid (error)` - Input that was recently sent to the server is invalid.  `error` is what about the input was invalid.

`invalidpassword (ip)` - An invalid password was sent to the server from another remote connection.  `ip` is the IP address of the remote user who attempted to login.  Note that this is not sent when you send an invalid password, only for other remote connections. 

`joined (player)` - A player joined the game.  `player` is the name of the player who joined.

`kicked (player)` - A player got kicked from the server.  `player` is the name of the player who got kicked.

`kill (killer, killed, weapon)` - A player was killed.  `killer` is the name of the player who got the kill, `killed` is the name of the player who was killed, and `weapon` is the weapon that got the killing blow.  Note the `weapon` argument is often not passed, so do not rely on this information being available.  It is only available, and even then only randomly, if the kill message filter is set to full.

`left (player)` - A player left the game.  `player` is the name of the player who left.

`loggedin (ip)` - A remote host has logged in.  `ip` is the IP address of the remote user who logged in.

`monsterballblunder (player, team)` - A player committed an own goal in monsterball.  `player` is the name of the player who committed the own goal, and `team` is the name of the team the player scored for (NOT the name of the team the player belongs to!).

`monsterballpoint (player, team)` - A player scored a goal in monsterball.  `player` is the name of the player who scored, and `team` is the name of the team the player scored for.

`monsterballscore (player, points, blunders, kills, deaths, suicides, ping)` - A player's current monsterball score.  `player` is the name of the player, `points` is the number of points they have, `blunders` is the number of blunders they have committed (unreliable when their blunders exceed 99), `kills` is the number of kills they have, `deaths` is the number of deaths they have, `suicides` is the number of suicides they have committed, and `ping` is their ping to the server in milliseconds.

`observing (player)` - A player began observing the game.  `player` is the name of the player observing.

`player (playerNum, name)` - A player and their player number.  `playerNum` is the number of the player, and `name` is the name of the player.

`playerinfo (info)` - Player information was received.  `info` is an object that contains one or more key-value pairs.  See the Player Info section for more details.

`playerscore (player, points, kills, deaths, suicides, ping)` - A player's current score.  `player` is the name of the player, `points` is the number of points they have, `kills` is the number of kills they have (unreliable in some modes when their kills exceed 9), `deaths` is the number of deaths they have (unreliable in some modes when their deaths exceed 9), `suicides` is the number of suicides they have (unreliable in some modes when their suicides exceed 9), and `ping` is their ping to the server in milliseconds.

`raw (line)` - Data was received from the server.  `line` is the data that was received.

`rehashed` - The hosts.allow and hosts.deny files were rehashed.

`remoteadmin (loginId, player)` - A player who is remotely logged in.  `loginId` indicates the login ID number of the player, and `player` is the name of the player who is remotely logged in.

`remoteadmincommand (player, command)` - A player has issued a command as a remote admin.  `player` is the name of the player who issued the command, and `command` is the input that was sent.

`remoteadminloggedin (player)` - A player has logged in as a remote admin.  `player` is the name of the player who logged in.

`remoteadminloggedout (player)` - A player has been logged out as a remote admin.  `player` is the name of the player who as logged out.

`remoteadminpasswordset` - The remote admin password was changed.

`remotecommand (ip, command)` - A command that was sent by a remote connection.  `ip` is the IP address of the remote user who issued the command, and `command` is the input that was sent.

`remoteconnection (ip)` - A remote connection was received by the server.  `ip` is the IP address of the remote user who connected.

`remoteconnectionclosed (ip)` - A remote connection was closed to the server.  `ip` is the IP address of the remote user that was disconnected.

`remoteinvalidpassword (ip)` - An invalid password was provided by a remote connection.  `ip` is the IP address of the remote user that sent the invalid password.

`robotdeath (player)` - A player died to a robot.  `player` is the name of the player who died.

`say (player, text)` - Someone said something.  `player` is who said it, and `text` was what they said.

`setteamname` (fromTeam, toTeam)` - A team name was changed.  `fromTeam` is the team's old name, and `toTeam` is the team's new name.

`setwait (time)` - The server will make clients wait in place for a set time before playing.  `time` is the amount of time in seconds after the level begins before players will be able to play.

`shutdown` - The server is shutting down.

`startlevel` - The level has started.

`statdeathinterval (killed, time)` - A player's first death in a while.  `killed` is the name of the player who got killed, and `time` is the amount of time since their last death in seconds.

`statdeathstreak (player, deaths)` - A player is on a dying streak.  `player` is the name of the player on the streak, and `deaths` is the number of deaths in the streak.

`statefficiency (player, efficiency)` - A player's efficiency.  `player` is the name of the player, and `efficiency` is their efficiency.

`statkillinterval (killer, time)` - A player's first kill in a while.  `killer` is the name of the player who got the kill, and `time` is the amount of time since their last kill in seconds.

`statkills (killer, killed, kills)` - A player has killed another player a number of times.  `killer` is the name of the player who got the kill, `killed` is the name of the player who was killed, and `kills` is the number of kills `killer` has gotten on `killed`.

`statkillstreak (player, kills)` - A player is on a killing streak.  `player` is the name of the player on the streak, and `kills` is the number of kills in the streak.

`statrevenge (killer, killed)` - A player got revenge on another player.  `killer` is the name of the player who got the kill, and `killed` is the name of the player who was killed.

`statssaved` - Stats have been saved to the `netgames` folder in the Descent 3 directory.

`suicide (player)` - A player killed themselves.  `player` is the name of the person who suicided.

`teamchange (player, team)` - A player changed teams.  `player` is the name of the player who changed teams, and `team` is the name of the team they changed to.

`teamplayerscore (player, teamName, points, kills, deaths, suicides, ping)` - A player's current score in a team game.  `player` is the name of the player, `teamName` is the name of the team, `kills` is the number of kills they have (unreliable in some modes when their kills exceed 9), `deaths` is the number of deaths they have (unreliable in some modes when their deaths exceed 9), `suicides` is the number of suicides they have (unreliable in some modes when their suicides exceed 9), and `ping` is their ping to the server in milliseconds.

`teamscore (teamName, score)` - A team's current score.  `teamName` is the name of the team and `score` is the team's score.

`timeout` - The connection to the server has timed out.

`unknown (line)` - descent3console could not determine the purpose of the data sent by the server.  `line` is the data that was sent by the server.

`unobserving (player)` - A player stopped observing.  `player` is the name of the player who stopped observing.

`waitexpired` - The server is no longer forcing clients to wait in place, because the wait time expired.

`waitoff` - The server is no longer forcing clients to wait in place.

`waiton` - The server is forcing clients to wait in place.

### Game Information

When the server sends game information, it does so via the `gameinfo` event, and includes an `info` parameter that is an object that contains the game information it is sending.  The keys and possible values this may contain include:

* `accurateCollisions` - A boolean indicating whether accurate weapon collisions are turned on.
* `allowTeamChange` - A boolean indicating whether players are allowed to change teams.
* `autoBalance` - A boolean indicating whether the server is assigning new players that join to teams in an effort to balance the teams.
* `autoSaveDisconnect` - A boolean indicating whether the server is saving stats to the `netgames` folder in the Descent 3 directory when the server disconnects.
* `autoSaveLevel` - A boolean indicating whether the server is saving stats to the `netgames` folder in the Descent 3 directory when the level ends.
* `gameName` - The name of the game.
* `killGoal` - The number of points required to end the level, or null if there is no kill goal.
* `killMsgFilter` - The kill message filter level.  Either "None", "Simple", or "Full".
* `maxPlayers` - The maximum number of players allowed in the game, including the server.
* `missionName` - The name of the mission.
* `networkModel` - The network model being used in the game.
* `pps` - The maximum PPS allowed by the server.
* `remoteAdmin` - A boolean indicating that remote administration is possible.
* `respawnTime` - The weapon respawn time in seconds.
* `scriptName` - The type of game being played, ie: "anarchy".
* `sendRotVel` - A boolean indicating whether rotational velocity is sent by the server.
* `serverHudNames` - The maximum HUD name level allowed in the game.
* `statMsgs` - A boolean indicating whether random statistical messages are displayed.
* `timeLeft` - The amount of time remaining in the game in seconds.
* `timeLimit` - The time limit of the game in minutes, or null if there is no time limit.

### Player Information

When the server sends player information, it does so via the `playerinfo` event, and includes an `info` parameter that is an object that contains the player information it is sending.  The keys and possible values this may contain include:

* `ip` - The IP address the player is playing from.
* `player` - The name of the player.
* `playerNum` - The number of the player.
* `port` - The port the player is connecting from.
* `role` - The role of the player, either "Client" or "Server".
* `ship` - The ship the player is flying.
* `team` - The team the player is on.
* `totalTimeInGame` - The amount of time the player has been in the game in seconds.

## Instance Methods

Note that all instance methods return nothing.  Any output from these methods is received via events.  See the Events section for a list of events that can be received.

`d3console.allowTeamChange(allowTeamChange)` - Changes the setting to allow team changes.  `allowTeamChange` is a boolean.

`d3console.autoBalance(autoBalance)` - Changes the setting to auto balance teams.  `autoBalance` is a boolean.

`d3console.autoSaveDisconnect(autoSaveDisconnect)` - Changes the setting to automatically save stats when the server is disconnected.  `autoSaveDisconnect` is a boolean.

`d3console.autoSaveLevel(autoSaveLevel)` - Changes the setting to automatically save stats when the level ends.  `autoSaveLevel` is a boolean.

`d3console.balance()` - Forces the server to balance teams immediately.

`d3console.ban(playerNum)` - Bans a player.  `playerNum` is a player number.  You can get a player's number using the `d3console.players()` command.

`d3console.banList()` - Retrieves the ban list from the server.

`d3console.changeTeam(playerNum, team)` - Force a player to change teams.  `playerNum` is a player number, and `team` is the name of the team to switch them to.  You can get a player's number using the `d3console.players()` command.

`d3console.close()` - Closes the connection.

`d3console.connect()` - Attempts to connect to the server.  See the Options section on how to set the server to connect to.

`d3console.isConnected(callback)` - Runs the `callback` function if you are connected to the server, but emits an `error` event if not.

`d3console.kick(playerNum)` - Kicks a player.  `playerNum` is a player number.  You can get a player's number using the `d3console.players()` command.

`d3console.killMsgFilter(killMsgFilter)` - Changes the setting for the kill message filter.  `killMsgFilter` is either "none", "simple", or "full".

`d3console.netgameInfo()` - Gets general game information.

`d3console.playerInfo(playerNum)` - Gets player information for a player.  `playerNum` is a player number.  You can get a player's number using the `d3console.players()` command.

`d3console.players()` - Gets the list of players.

`d3console.quit()` - Quits the server.

`d3console.rehash()` - Rehashes the hosts.allow and hosts.deny files.

`d3console.remoteAdmin(remoteAdmin)` - Changes the setting to allow remote administration.  `remoteAdmin` is a boolean.

`d3console.remoteAdminLogout()` - Sends the list of players logged in remotely.

`d3console.remoteAdminLogout(loginId)` - Logs out a remote player.  `loginId` is the player's login ID.  You can get a player's login ID using the `d3console.remoteAdminLogout()` command.

`d3console.remoteAdminPass(password)` - Changes the remote administration password.  `password` is the new password.

`d3console.removeBan(banNum)` - Removes a ban.  `banNum` is the player's ban number.  You can get a player's ban number using the `d3console.banList()` command.

`d3console.saveStats()` - Saves stats to the `netgames` folder off the server's Descent 3 directory.

`d3console.say(text)` - Makes the client say the `text`.

`d3console.scores()` - Gets the scores of the game.

`d3console.send(data, callback)` - Sends the string `data` to the server, and calls an optional `callback` function if completed successfully.

`d3console.serverHudNames(serverHudNames)` - Changes the setting for maximum server HUD names.  `serverHudNames` is either "none", "team", or "full".

`d3console.setGoalLimit(goalLimit)` - Changes the goal limit of the game.  `goalLimit` is the new goal limit in points, or null to disable the limit.

`d3console.setMaxPlayers(maxPlyers)` - Changes the maximum number of players allowed in the game, including the server.  `maxPlayers` is the maximum number of players.

`d3console.setPps(maxPps)` - Changes the maximum packets per second of the game.  `maxPps` is the maximum allowed packets per second.

`d3console.setRespawnTime(respawnTime)` - Changes the weapon respawn time.  `respawnTime` is the new weapon respawn time in seconds.

`d3console.setTeamName(teamNum, teamName)` - Sets the team name.  `teamNum` is the number of the team, and 'teamName' is the new name of the team.  Team numbers are 0 for the red team, 1 for the blue team, 2 for the green team, and 3 for the yello team.

`d3console.setTimeLimit(timeLimit)` - Changes the game's time limit.  `timeLimit` is the new time limit in minutes, or null to disable the limit.

`d3console.statMsgs(statMsgs)` - Changes the setting for random statistical messages.  `statMsgs` is a boolean.

`d3console.wait(time)` - Forces clients to wait.  `time` can be "on" to force clients to wait indefinitely, "off" to have clients stop waiting, or a time in seconds to force clients to wait for the specified amount of time from the start of the level.

`d3console.warp(level)` - Ends the level immediately and starts the specified `level` number.

## Static Methods

`Console.getColorString(red, green, blue)` - Get the four character string required to change the color of the console line.  `red`, `green`, and `blue` must each be an integer between 1 and 255. 

## History

### Version 0.1.7 - 7/9/2015

* Removed `playertotalscore` due to bugs with the display.
* Added documentation warnings about `playerscore` values for `kills`, `deaths`, and `suicides` being incorrect for values above 9.  Users should track these values on their own.

### Version 0.1.6 - 7/8/2015

* Fixed bug with anarchy scores being processed as monsterball scores.

### Version 0.1.5 - 7/7/2015

* Added `netgameinfo` method.
* Fixed a bug with the `safeexec` RegExp extension.
* Fixed a bug with `timeLimit` detection.
* Removed `setgaollimit`, `setmaxplayers`, `setpps`, `setrespawntime`, and `settimelimit` events in favor of `gameinfo` events.

### Version 0.1.4 - 7/6/2015

* Fixed a bug with trying to close a console that's not connected.

### Version 0.1.3 - 7/6/2015

* Added `invalidpassword` event.

### Version 0.1.2 - 7/1/2015

* Fixed memory leak with console routing.

### Version 0.1.1 - 6/24/2015

* Added documentation.
* Added the `players` method.
* Removed `serverhudnames` and `statmsgs` events in favor of `gameinfo` events.

### Version 0.1 - 6/22/2015

* Initial version.
