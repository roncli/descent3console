var events = require("events"),
    util = require("util"),
    net = require("net"),
    route;

// A safe regexp exec method that does not leak memory.
RegExp.prototype.safeexec = function(string) {
    "use strict";

    var result = this.exec(string);

    if (result) {
        result.forEach(function(item, index) {
            result[index] = item.split("").join("");
        });
    }

    return result;
};

// Function to more easily route lines.
route = function(data, regex, callback) {
    "use strict";

    var matches = regex.safeexec(data);
    if (matches) {
        return callback.apply(null, matches.slice(1));
    }

    return false;
};

/**
 * Constructor for the console object.
 * @returns {Console} The new console.
 * @constructor
 */
function Console() {
    "use strict";

    events.EventEmitter.call(this);

    return this;
}

util.inherits(Console, events.EventEmitter);

Console.prototype.options = {
    server: null,
    port: 2092,
    password: null
};

Console.prototype.connected = false;

Console.prototype.connect = function() {
    "use strict";

    var d3console = this,
        dataBuffer = "";

    if (this.client) {
        this.emit("error", "There is already an active connection.  Create a new instance of the descent3console to connect to another server.");
        return;
    }

    if (typeof this.options.server !== "string" || this.options.server.length === 0) {
        this.emit("error", "Invalid option server.  Set this to the hostname or IP of the Descent 3 server you wish to connect to.");
        return;
    }

    if (typeof this.options.port !== "number" || this.options.port < 0 || this.options.port > 65535 || this.options.port % 1 !== 0) {
        this.emit("error", "Invalid option port.  Set this to the port number of the Descent 3 server you wish to connect to.");
        return;
    }

    if (typeof this.options.password !== "string" || this.options.password.length === 0) {
        this.emit("error", "Invalid option password.  Set this to the password required to connect to the Descent 3 server you wish to connect to.");
        return;
    }

    this.client = net.connect(this.options.port, this.options.server, function() {
        d3console.connected = true;
        d3console.emit("connected");
    });

    this.client.on("data", function(buffer) {
        var data = "", index, lines;
        for (index = 0; index < buffer.length; index++) {
            data += String.fromCharCode(buffer[index]);
        }

        lines = data.toString().replace(/[\r\n\x00]+/g, "\x00").split("\x00");
        lines.forEach(function(line, index) {
            // Handle lines that are split.
            if (index === lines.length - 1 && lines.length > 0) {
                dataBuffer += line;
                return;
            }
            line = dataBuffer + line;
            dataBuffer = "";

            // Send the raw line.
            d3console.emit("raw", line);

            // If the line is blank, we don't care about it, so just bail.
            if (line.length === 0) {
                return;
            }

            // If we just sent the password, just bail.
            if (line === d3console.options.password) {
                return;
            }

            // Lines to ignore.
            if (route(line, /^(?:NetGame Information|PNum Name|Packet Loss: N\/A|Mission over\. {2}Looping back to first level in mission file\.|Opening level .*\.\.\.|Downloading mission data\.\.\..* level [1-9][0-9]* [0-9]+ Percent Complete|Analyzing data\.\.\..* level [1-9][0-9]* [0-9]+ Percent Complete|\x08+|Input Command List:|Prefix a '\$' before the commands listed below. {2}To get more detailed help|about a command, type '\$help <command>'|allowteamchange +autobalance|autosavedisconnect +autosavelevel|balance +ban|banlist +changeteam|endlevel +help|hudnames +kick|killmsgfilter +netgameinfo|observer +piggyback|playerinfo +players|rehash +remote|remoteadmin +remoteadminlogout|remoteadminpass +removeban|savestats +scores|serverhudnames +setgoallimit|setmaxplayers +setpps|setrespawntime +setteamname|settimelimit +statmsgs|team +wait|warp +|quit|allowteamchange:|\[(?:Dedicated )?(?:Server|Client) Only\]|Turns off\/on allowing clients to change their team\.|Usage: "\$allowteamchange <off\/on>"|autobalance:|Turns off\/on allowing the automatic team placement of new players by the server\.|Usage: "\$autobalance <off\/on>"|autosavedisconnect:|Enables\/Disables the automatic saving of the game stats if you disconnect from the server\.|Usage: "\$autosavedisconnect <on\/off>"|autosavelevel:|Enables\/Disables the automatic saving of the game stats when the level ends\.|Usage: "\$autosavelevel <on\/off>"|balance:|Automatically balances the teams, based on senority\.|Usage: "\$balance"|\*Balancing Teams|\*Ending the level|ban:|Bans a player from the game\.|Usage: "\$ban <pnum>"|Banning .*|banlist:|Lists the players banned from the game along with their ban number, which can be used to remove the ban\.|Usage: "\$banlist"|changeteam:|Forces a player to a team\.|Usage: "\$changeteam <pnum> <team_name>"|\*Attempting to change .* to .* team|endlevel:|Ends the level\.|Usage: "\$endlevel"|help:|Displays help information for the input commands.|Usage: "\$help \[command\]"|hudnames:|Sets your personal level for the HUD name filter\.|Usage: "\$hudnames <full\/team\/none>"|NOTE: You can only set your HUD Callsign level up to the level that the server is\. {2}So if the server is only allowing up to teammates, you won't be able to set to full|\*Personal HUD Name Level: .*|kick:|Kicks a player from the game\.|Usage: "\$kick <pnum>"|killmsgfilter:|Sets the kill message filter, for what style of messages you want\.|Usage: "\$killmsgfilter <full\/simple\/none>"|netgameinfo:?|observer:|If you pass specify 'on', it puts you into observer mode, else it will return you back to normal mode\.|Usage: "\$observer <on\/off>"|piggyback:|Puts you into Piggyback Observer mode."\$piggyback <pnum>"|playerinfo:|Displays information about a player\.|Usage: "\$playerinfo <pnum>"|\*Getting Playerinfo for .*|players:|Displays a list of the players in the game, with their player numbers\.|Usage: "\$players"|rehash:|Rehashes the hosts\.allow and hosts\.deny files\. {2}First it flushes the old, and reloads them\.|Usages: "\$rehash"|remote:|handles a remote admin command|Usage: "\$remote <command> <option parms> <\.\.\.>"|remoteadmin:|handles enable\/disable remote administration|Usage: "\$remoteadmin <on\/off>"{2}|remoteadminlogout:|handles seeing who is logged in, and allows the server to log them out|If no parameter is given it lists all the players logged in\.|To log out a player give the login-id as a parameter|Usage: "\$remoteadminlogout \[login-id\]"|remoteadminpass:|handles setting\/changing the remote administration password|Usage: "\$remoteadminpass <password>"|removeban:|Removes a ban from a player, given the number associated with them from \$banlist\.|Usage: "\$removeban <player>"|\*Ban Removed|\*Couldn't remove ban|savestats:|Saves the game stats to file immediatly\.|Usage: "\$savestats"|scores:|Displays the scores or stats of the game\.|Usage: "\$scores"|Pilot +(?:Points|Score) +K(?:ills)? +D(?:eaths)? +S(?:uicides)? +Ping *|Pilot +Points BlKillDeaSuicidPing *|serverhudnames:|Sets the highest HUD name filter permitted for the clients\.|Usage: "\$serverhudnames <full\/team\/none>"|setgoallimit:|Changes the goal limit for the level\.|Usage: "\$setgoallimit <points>"|setmaxplayers:|Sets the maximum number of players allowed in the game\.|Usage: "\$setmaxplayers <count>"|setpps:|Changes the Packets Per Second \(PPS\) threshold of the game|Usage: "\$setpps <pps>"|setrespawntime:|Changes the respawn time of the powerups in the level\.|Usage: "\$setrespawntime <seconds>"|setteamname:|Changes the name of a team\.|Usage: "\$setteamname <team_num> <new_team_name>"|settimelimit:|Changes the time limit for the level\.|Usage: "\$settimelimit <minutes>"|statmsgs:|Enables\/Disables random statistical messages\.|Usage: "\$statmsgs <on\/off>"|team:|Change teams for yourself\.|Usage: "\$team <team_name>"|wait:|handles a request to make all clients wait\/or stop waiting\. {2}If a time is giving, the server will wait that long each level until it lets clients to play\.|Usage: "\$wait <on\/off or time-in-seconds>"|warp:|Changes the current level to another level in the mission\.|Usage: "\$warp <level>")$/, function() {
                return true;
            })) {
                return;
            }

            // On login, you are required to enter your password.
            if (route(line, /^Enter Password:$/, function() {
                d3console.send(d3console.options.password);
                return true;
            })) {
                return;
            }

            // Unrecognized command.
            if (route(line, /^Unrecognized command or bad format\.$/, function() {
                d3console.emit("invalid", "Unrecognized command or bad format.");
                return true;
            })) {
                return;
            }

            // Command not available.
            if (route(line, /^Command Not Available To Dedicated Server$/, function() {
                d3console.emit("invalid", "Command not available to dedicated server.");
                return true;
            })) {
                return;
            }

            // Command not found.
            if (route(line, /^Command not found$/, function() {
               d3console.emit("invalid", "Command not found.");
                return true;
            })) {
                return;
            }

            // A successful login results in a remote host logged in.
            if (route(line, /^Remote host ([0-9.]+) logged in\.$/, function(ip) {
                d3console.emit("loggedin", ip);
                return true;
            })) {
                return;
            }

            // A command you sent.
            if (route(line, /^((?:\$|say ).*|quit)$/, function(command) {
                d3console.emit("command", command);
                return true;
            })) {
                return;
            }

            // Something was said.
            if (route(line, /^\*(.*) (?:says|sagt|dit|types): (.*)$/, function(player, text) {
                d3console.emit("say", player, text);
                return true;
            })) {
                return;
            }

            // Guidebot said something.
            if (route(line, /^\*\x01\xad\xad\x01GB:\x01\x01\xad\x01 (.*)$/, function(text) {
                d3console.emit("guidebot", text);
                return true;
            })) {
                return;
            }

            // New connection.
            if (route(line, /^New connection \(((?:[0-9]+\.){3}[0-9]+)\)$/, function(ip) {
                d3console.emit("remoteconnection", ip);
                return true;
            })) {
                return;
            }

            // Invalid password from another remote connection.
            if (route(line, /^Invalid login password from ((?:[0-9]+\.){3}[0-9]+)\.$/, function(ip) {
                d3console.emit("invalidpassword", ip);
                return true;
            })) {
                return;
            }

            // Closed connection.
            if (route(line, /^Remote host ((?:[0-9]+\.){3}[0-9]+) closed the connection\.$/, function(ip) {
                d3console.emit("remoteconnectionclosed", ip);
                return true;
            })) {
                return;
            }

            // Invalid login password.
            if (route(line, /^Invalid login password from ((?:[0-9]+\.){3}[0-9]+)\.$/, function(ip) {
                d3console.emit("remoteinvalidpassword", ip);
                return true;
            })) {
                return;
            }

            // A command sent by a remote IP address.
            if (route(line, /^\[([0-9.]+)\] (.*)$/, function(ip, command) {
                d3console.emit("remotecommand", ip, command);
                return true;
            })) {
                return;
            }

            // Remote admin logged in.
            if (route(line, /^\*==(.*) is remote administrating==$/, function(player) {
                d3console.emit("remoteadminloggedin", player);
                return true;
            })) {
                return;
            }

            // Remote admin command.
            if (route(line, /^\*==(.*) executed "(.*)"$/, function(player, command) {
                d3console.emit("remoteadmincommand", player, command);
                return true;
            })) {
                return;
            }

            // Player joined.
            if (route(line, /^\*(.*) has joined (?:the )?(?:Anarchy|Hoard|Hyper Anarchy|CTF|Co-op)!?$/, function(player) {
                d3console.emit("joined", player);
                return true;
            })) {
                return;
            }

            if (route(line, /^\*(.*) [hH]as [jJ]oined [tT]he (.*) Team$/, function(player, team) {
                d3console.emit("joined", player, team);
                return true;
            })) {
                return;
            }

            // Player left.
            if (route(line, /^\*(.*) has left the game$/, function(player) {
                d3console.emit("left", player);
                return true;
            })) {
                return;
            }

            // Player disconnected.
            if (route(line, /^\*(.*) disconnected!$/, function(player) {
                d3console.emit("disconnected", player);
                return true;
            })) {
                return;
            }

            // Player observing.
            if (route(line, /^\*(.*) starts observing\.$/, function(player) {
                d3console.emit("observing", player);
                return true;
            })) {
                return;
            }

            // Player unobserving.
            if (route(line, /^\*(.*) stops observing\.$/, function(player) {
                d3console.emit("unobserving", player);
                return true;
            })) {
                return;
            }

            // Server shutting down.
            if (route(line, /^Shutting down server.$/, function() {
                d3console.emit("shutdown");
                return true;
            })) {
                return;
            }

            // $allowteamchange reply
            if (route(line, /^\*Allow Team Changing: (On|Off)$/, function(allowTeamChange) {
                d3console.emit("gameinfo", {allowTeamChange: allowTeamChange === "On"});
                return true;
            })) {
                return;
            }

            // $autobalance reply
            if (route(line, /^\*Auto Team Balance: (On|Off)$/, function(autoBalance) {
                d3console.emit("gameinfo", {autoBalance: autoBalance === "On"});
                return true;
            })) {
                return;
            }

            // $autosavedisconnect reply
            if (route(line, /^\*AutoSave Stats on Disconnect: (On|Off)$/, function(autoSaveDisconnect) {
                d3console.emit("gameinfo", {autoSaveDisconnect: autoSaveDisconnect === "On"});
                return true;
            })) {
                return;
            }

            // $autosavelevel reply
            if (route(line, /^\*AutoSave Stats on Level End: (On|Off)$/, function(autoSaveLevel) {
                d3console.emit("gameinfo", {autoSaveLevel: autoSaveLevel === "On"});
                return true;
            })) {
                return;
            }

            // $balance reply
            if (route(line, /^Balancing Teams$/, function() {
                d3console.emit("balancing");
                return true;
            })) {
                return;
            }

            // $ban reply
            if (route(line, /^\*Banning (.*) from game$/, function(player) {
                d3console.emit("banned", player);
                return true;
            })) {
                return;
            }

            if (route(line, /^\*Server can't ban themself$/, function() {
                d3console.emit("invalid", "Server can't ban themself.");
                return true;
            })) {
                return;
            }

            // $banlist reply
            if (route(line, /^\[([1-9]?[0-9]+)\](.*)$/, function(banNum, player) {
                d3console.emit("banlist", +banNum, player);
                return true;
            })) {
                return;
            }

            // $changeteam reply
            if (route(line, /^\*(.*) changes teams to the (.*) team$/, function(player, team) {
                d3console.emit("teamchange", player, team);
                return true;
            })) {
                return;
            }

            // $endlevel reply
            if (route(line, /^Ending level\.$/, function() {
                d3console.emit("endlevel");
                return true;
            })) {
                return;
            }

            if (route(line, /^\*Stats saved to file$/, function() {
                d3console.emit("statssaved");
                return true;
            })) {
                return;
            }

            if (route(line, /^\*Entering observer mode.$/, function() {
                d3console.emit("startlevel");
                return true;
            })) {
                return;
            }

            // $kick reply
            if (route(line, /^\*Kicking (.*) from game$/, function(player) {
                d3console.emit("kicked", player);
                return true;
            })) {
                return;
            }

            if (route(line, /^\*Server can't kick themself$/, function() {
                d3console.emit("invalid", "Server can't kick themself");
                return true;
            })) {
                return;
            }

            // $killmsgfilter reply
            if (route(line, /^\*Kill Message Filter: (None|Simple|Full)$/, function(killMsgFilter) {
                d3console.emit("gameinfo", {killMsgFilter: killMsgFilter});
                return true;
            })) {
                return;
            }

            // $netgameinfo reply
            if (route(line, /^Game Name: (.*)$/, function(gameName) {
                d3console.emit("gameinfo", {gameName: gameName});
                return true;
            })) {
                return;
            }

            if (route(line, /^Mission Name: (.*)$/, function(missionName) {
                d3console.emit("gameinfo", {missionName: missionName});
                return true;
            })) {
                return;
            }

            if (route(line, /^Script Name: (.*)$/, function(scriptName) {
                d3console.emit("gameinfo", {scriptName: scriptName});
                return true;
            })) {
                return;
            }

            if (route(line, /^PPS: ([1-9][0-9]*)$/, function(pps) {
                d3console.emit("gameinfo", {pps: +pps});
                return true;
            })) {
                return;
            }

            if (route(line, /^Max Players: ([1-9][0-9]*)$/, function(maxPlayers) {
                d3console.emit("gameinfo", {maxPlayers: +maxPlayers});
                return true;
            })) {
                return;
            }

            if (route(line, /^Accurate Weapon Collisions: (On|Off)$/, function(accurateCollisions) {
                d3console.emit("gameinfo", {accurateCollisions: accurateCollisions === "On"});
                return true;
            })) {
                return;
            }

            if (route(line, /^Send Rotational Velocity: (On|Off)$/, function(sendRotVel) {
                d3console.emit("gameinfo", {sendRotVel: sendRotVel === "On"});
                return true;
            })) {
                return;
            }

            if (route(line, /^Time Limit: (None|([1-9][0-9]*)) minutes?$/, function(timeLimit, minutes) {
                d3console.emit("gameinfo", {timeLimit: timeLimit === "None" ? null : +minutes});
                return true;
            })) {
                return;
            }

            if (route(line, /^Time Left: (?:(?:([1-9][0-9]+):)?([0-5][0-9]?):)?([0-5][0-9]?) (?:hours?|minutes?|seconds?)$/, function(hours, minutes, seconds) {
                if (!hours) {
                    hours = 0;
                }
                if (!minutes) {
                    minutes = 0;
                }
                d3console.emit("gameinfo", {timeLeft: (+hours) * 3600 + (+minutes) * 60 + (+seconds)});
                return true;
            })) {
                return;
            }

            if (route(line, /^Goal: (None|([1-9][0-9]*) points)$/, function(killGoal, points) {
                d3console.emit("gameinfo", {killGoal: killGoal === "None" ? null : +points});
                return true;
            })) {
                return;
            }

            if (route(line, /^Respawn Time: ([1-9][0-9]*) seconds?$/, function(respawnTime) {
                d3console.emit("gameinfo", {respawnTime: +respawnTime});
                return true;
            })) {
                return;
            }

            if (route(line, /^Network Model: (.*)$/, function(networkModel) {
                d3console.emit("gameinfo", {networkModel: networkModel});
                return true;
            })) {
                return;
            }

            // $playerinfo reply
            if (route(line, /^(.*) \((Server|Client)\)$/, function(player, role) {
                d3console.emit("playerinfo", {player: player, role: role});
                return true;
            })) {
                return;
            }

            if (route(line, /^Team: (.*)$/, function(team) {
                d3console.emit("playerinfo", {team: team});
                return true;
            })) {
                return;
            }

            if (route(line, /^PlayerNum: ([1-9]?[0-9]+)$/, function(playerNum) {
                d3console.emit("playerinfo", {playerNum: +playerNum});
                return true;
            })) {
                return;
            }

            if (route(line, /^IP: ((?:[0-9]{1,3}\.){3}[0-9]{1,3}):([1-9]?[0-9]+)$/, function(ip, port) {
                d3console.emit("playerinfo", {ip: ip, port: +port});
                return true;
            })) {
                return;
            }

            if (route(line, /^Ship: (.*)$/, function(ship) {
                d3console.emit("playerinfo", {ship: ship});
                return true;
            })) {
                return;
            }

            if (route(line, /^Total Time In Game: (?:(?:([1-9][0-9]+):)?([0-5][0-9]?):)?([0-5][0-9]?) (?:hours?|minutes?|seconds?)$/, function(hours, minutes, seconds) {
                if (!hours) {
                    hours = 0;
                }
                if (!minutes) {
                    minutes = 0;
                }
                d3console.emit("playerinfo", {totalTimeInGame: (+hours) * 3600 + (+minutes) * 60 + (+seconds)});
                return true;
            })) {
                return;
            }

            // $players reply
            if (route(line, /^([0-9]{2}): (.*)$/, function(playerNum, name) {
                d3console.emit("player", +playerNum, name);
                return true;
            })) {
                return;
            }

            // $rehash reply
            if (route(line, /^\*Rehashing Hosts\.allow and Hosts\.deny$/, function() {
                d3console.emit("rehashed");
                return true;
            })) {
                return;
            }

            // $remoteadmin reply
            if (route(line, /^\*Remote Administration: (On|Off)$/, function(remoteAdmin) {
                d3console.emit("gameinfo", {remoteAdmin: remoteAdmin === "On"});
                return true;
            })) {
                return;
            }

            // Hoard score - Has to come before remoteadmin to match.
            if (route(line, /^\*(.*) scores ([1-9][0-9]*) points? \[([1-9][0-9]*)\]$/, function(player, score, totalScore) {
                d3console.emit("hoardscore", player, +score, +totalScore);
                return true;
            })) {
                return;
            }

            // $remoteadminlogout reply
            if (route(line, /^\*(.*)\[([0-9]+)\]$/, function(player, loginId) {
                d3console.emit("remoteadmin", +loginId, player);
                return true;
            })) {
                return;
            }

            if (route(line, /^\*==(.*) has logged out==$/, function(player) {
                d3console.emit("remoteadminloggedout", player);
                return true;
            })) {
                return;
            }

            // $remoteadminpass reply
            if (route(line, /^\*Remote Administration Password Set$/, function() {
                d3console.emit("remoteadminpasswordset");
                return true;
            })) {
                return;
            }

            // $removeban reply
            if (route(line, /^Ban Removed$/, function() {
                d3console.emit("banremoved", true);
                return true;
            })) {
                return;
            }

            if (route(line, /^Couldn't remove ban$/, function() {
                d3console.emit("banremoved", false);
                return true;
            })) {
                return;
            }

            // $savestats reply
            if (route(line, /^\*Stats saved$/, function() {
                d3console.emit("statssaved");
                return true;
            })) {
                return;
            }

            // $scores reply

            // Monsterball - Needs to come before others due to the odd formatting.
            if (route(line, /^(.*): +([0-9 ]{7})([0-9 ]{2})([0-9 ]{4})([0-9 ]{3})([0-9 ]{6})([1-9]?[0-9]+) *$/, function(player, points, blunders, kills, deaths, suicides, ping) {
                    d3console.emit("monsterballscore", player, +(points.replace(" ", "")), +(blunders.replace(" ", "")), +(kills.replace(" ", "")), +(deaths.replace(" ", "")), +(suicides.replace(" ", "")), +ping);
                    return true;
                })) {
                return;
            }

            // Anarchy, Co-op, Robo-Anarchy
            if (route(line, /^(.*): +(-?[1-9]?[0-9]+) +([1-9]?[0-9]+) +([1-9]?[0-9]+) +([1-9]?[0-9]+) +([1-9]?[0-9]+) *$/, function(player, points, kills, deaths, suicides, ping) {
                d3console.emit("playerscore", player, +points, +kills, +deaths, +suicides, +ping);
                return true;
            })) {
                return;
            }

            // CTF, Entropy, Team Anarchy
            if (route(line, /^(.*):(-?[1-9]?[0-9]+)$/, function(teamName, score) {
                d3console.emit("teamscore", teamName, +score);
                return true;
            })) {
                return;
            }

            if (route(line, /^(.*): (.*[^ ]) +(-?[1-9]?[0-9]+) +([1-9]?[0-9]+) +([1-9]?[0-9]+) +([1-9]?[0-9]+) +([1-9]?[0-9]+) *$/, function(player, teamName, points, kills, deaths, suicides, ping) {
                d3console.emit("teamplayerscore", player, teamName, +points, +kills, +deaths, +suicides, +ping);
                return true;
            })) {
                return;
            }

            // Hoard, Hyper-Anarchy
            if (route(line, /^(.*): +(-?[1-9]?[0-9]+)\[(-?[1-9]?[0-9]+)\] +([1-9]?[0-9]+)\[([1-9]?[0-9]+)\] +([1-9]?[0-9]+)\[([1-9]?[0-9]+)\] +([1-9]?[0-9]+)\[([1-9]?[0-9]+)\] +([1-9]?[0-9]+) *$/, function(player, points, totalPoints, kills, totalKills, deaths, totalDeaths, suicides, totalSuicides, ping) {
                d3console.emit("playertotalscore", player, +points, +totalPoints, +kills, +totalKills, +deaths, +totalDeaths, +suicides, +totalSuicides, +ping);
                return true;
            })) {
                return;
            }

            // $serverhudnames reply
            if (route(line, /^\*Server Max HUD Name Level: (.*)$/, function(serverHudNames) {
                d3console.emit("gameinfo", {serverHudNames: serverHudNames === "Team Only" ? "Team" : serverHudNames});
                return true;
            })) {
                return;
            }

            // $setgoallimit reply
            if (route(line, /^\*Goal Limit: (None|[1-9][0-9]*)$/, function(goalLimit) {
                d3console.emit("setgoallimit", goalLimit === "None" ? null : +goalLimit);
                return true;
            })) {
                return;
            }

            // $setmaxplayers reply
            if (route(line, /^\*Max Players: ([1-9][0-9]*)$/, function(maxPlayers) {
                d3console.emit("setmaxplayers", +maxPlayers);
                return true;
            })) {
                return;
            }

            // $setpps reply
            if (route(line, /^\*Max PPS: ([1-9][0-9]*)$/, function(maxPps) {
                d3console.emit("setpps", +maxPps);
                return true;
            })) {
                return;
            }

            // $setrespawntime reply
            if (route(line, /^\*Respawn Time: ([1-9][0-9]*)$/, function(respawnTime) {
                d3console.emit("setrespawntime", +respawnTime);
                return true;
            })) {
                return;
            }

            // $setteamname reply
            if (route(line, /^(.*) changed team name to (.*)$/, function(fromTeam, toTeam) {
                d3console.emit("setteamname", fromTeam, toTeam);
                return true;
            })) {
                return;
            }

            // $settimelimit reply
            if (route(line, /^\*Time Limit: (Off|[1-9][0-9]*)$/, function(timeLimit) {
                d3console.emit("settimelimit", timeLimit === "Off" ? null : +timeLimit);
                return true;
            })) {
                return;
            }

            // $statmsgs reply
            if (route(line, /^\*Statistical Messages: (On|Off)$/, function(statMsgs) {
                d3console.emit("gameinfo", {statMsgs: statMsgs === "On"});
                return true;
            })) {
                return;
            }

            // $wait reply
            if (route(line, /^Making Clients Wait$/, function() {
                d3console.emit("waiton");
                return true;
            })) {
                return;
            }

            if (route(line, /^No Longer Making Clients Wait$/, function() {
                d3console.emit("waitoff");
                return true;
            })) {
                return;
            }

            if (route(line, /^Making Clients Wait ([1-9]?[0-9]+\.[0-9]{2}) seconds$/, function(time) {
                d3console.emit("setwait", +time);
                return true;
            })) {
                return;
            }

            if (route(line, /^Turning Off Client Wait Time$/, function() {
                d3console.emit("setwait", 0);
                return true;
            })) {
                return;
            }

            if (route(line, /^Allowing Clients To Play$/, function() {
                d3console.emit("waitexpired");
                return true;
            })) {
                return;
            }

            // Generic kill messages, killer first.
            if (route(line, /^\*\x01\x64\xff\x64(.*)\x01\x01\xff\x01 (?:tags|downs|takes out) \x01\x64\xff\x64(.*)\x01\x01\xff\x01(?:'s toe|!)?$/, function(killer, killed) {
                d3console.emit("kill", killer, killed);
                return true;
            })) {
                return;
            }

            // Generic kill messages, killed first.
            if (route(line, /^\*\x01\x64\xff\x64(.*)\x01\x01\xff\x01 (?:wishes he was as good as|can't outmaneuver|gets shot down by|gets destroyed by|was no match for|is out-gunned by|becomes another statistic for|was killed by) \x01\x64\xff\x64(.*)\x01\x01\xff\x01!?$/, function(killed, killer) {
                d3console.emit("kill", killer, killed);
                return true;
            })) {
                return;
            }

            // Generic death message.
            if (route(line, /^\*\x01\x64\xff\x64(.*)\x01\x01\xff\x01 was killed$/, function(player) {
                d3console.emit("death", player);
                return true;
            })) {
                return;
            }

            // Robot death message.
            if (route(line, /^\*\x01\x64\xff\x64(.*)\x01\x01\xff\x01 was killed by a robot$/, function(player) {
                d3console.emit("robotdeath", player);
                return true;
            })) {
                return;
            }

            // Non-standard generic kill messages, killed first.
            if (route(line, /^\*\x01\x64\xff\x64(.*)\x01\x01\xff\x01 (?:knows|got blasted by|got messed up by|got killed by|got butchered by|begs for) \x01\x64\xff\x64(.*)\x01\x01\xff\x01(?: is his god|'s mercy)?$/, function(killed, killer) {
                d3console.emit("kill", killer, killed);
                return true;
            })) {
                return;
            }

            // Non-standard generic kill messages, killer first.  Some of these are broken, but this regex recognizes that.
            if (route(line, /^\*\x01\x64\xff\x64(.*)\x01\x01\xff\x01 (?:sucks|realizes) \x01\x64\xff\x64(.*)\x01\x01\xff\x01(?:'s milk|'s power| is a better player)$/, function(killer, killed) {
                d3console.emit("kill", killer, killed);
                return true;
            })) {
                return;
            }

            // Suicide
            if (route(line, /^\*\x01\x64\xff\x64(.*)\x01\x01\xff\x01 (?:experiences technical difficulties|spins out of control!|pushes the envelope!|pushes the red button!|has a major malfunction!|fumbles for the pilots manual!|killed himself)$/, function(player) {
                d3console.emit("suicide", player);
                return true;
            })) {
                return;
            }

            // Non-standard suicide
            if (route(line, /^\*\x01\x64\xff\x64(.*)\x01\x01\xff\x01(?: blasts himself| Bursts his own bubble| doesn't know his own strength| doesn't wish to live anymore| SUCKS!| shags himself)$/, function(player) {
                d3console.emit("suicide", player);
                return true;
            })) {
                return;
            }

            if (route(line, /^\*No prize for \x01\x64\xff\x64(.*)\x01\x01\xff\x01$/, function(player) {
                d3console.emit("suicide", player);
                return true;
            })) {
                return;
            }

            // Lasers
            if (route(line, /^\*\x01\x64\xff\x64(.*)\x01\x01\xff\x01's Laser blasts \x01\x64\xff\x64(.*)\x01\x01\xff\x01 to smithereens$/, function(killer, killed) {
                d3console.emit("kill", killer, killed, "lasers");
                return true;
            })) {
                return;
            }

            // Super Lasers
            if (route(line, /^\*\x01\x64\xff\x64(.*)\x01\x01\xff\x01's Super Laser blasts \x01\x64\xff\x64(.*)\x01\x01\xff\x01 to smithereens$/, function(killer, killed) {
                d3console.emit("kill", killer, killed, "super lasers");
                return true;
            })) {
                return;
            }

            // Vauss
            if (route(line, /^\*\x01\x64\xff\x64(.*)\x01\x01\xff\x01 punctures \x01\x64\xff\x64(.*)\x01\x01\xff\x01's ship with the Vauss$/, function(killer, killed) {
                d3console.emit("kill", killer, killed, "vauss");
                return true;
            })) {
                return;
            }

            // Mass Driver
            if (route(line, /^\*\x01\x64\xff\x64(.*)\x01\x01\xff\x01 targets \x01\x64\xff\x64(.*)\x01\x01\xff\x01 for Mass destruction$/, function(killer, killed) {
                d3console.emit("kill", killer, killed, "mass driver");
                return true;
            })) {
                return;
            }

            // Microwave
            if (route(line, /^\*\x01\x64\xff\x64(.*)\x01\x01\xff\x01 is vaporized by \x01\x64\xff\x64(.*)\x01\x01\xff\x01's Microwave beam$/, function(killed, killer) {
                d3console.emit("kill", killer, killed, "microwave");
                return true;
            })) {
                return;
            }

            // Napalm
            if (route(line, /^\*\x01\x64\xff\x64(.*)\x01\x01\xff\x01's Napalm burns \x01\x64\xff\x64(.*)\x01\x01\xff\x01 beyond recognition$/, function(killer, killed) {
                d3console.emit("kill", killer, killed, "napalm");
                return true;
            })) {
                return;
            }

            // Plasma
            if (route(line, /^\*\x01\x64\xff\x64(.*)\x01\x01\xff\x01 pulverizes \x01\x64\xff\x64(.*)\x01\x01\xff\x01 with Plasma power$/, function(killer, killed) {
                d3console.emit("kill", killer, killed, "plasma");
                return true;
            })) {
                return;
            }

            // EMD - I do not believe there is a custom string for EMD kills.

            // Fusion
            if (route(line, /^\*\x01\x64\xff\x64(.*)\x01\x01\xff\x01 disintigrates \x01\x64\xff\x64(.*)\x01\x01\xff\x01's hull with the fusion$/, function(killer, killed) {
                d3console.emit("kill", killer, killed, "fusion");
                return true;
            })) {
                return;
            }

            // Omega
            if (route(line, /^\*\x01\x64\xff\x64(.*)\x01\x01\xff\x01's Omega peels off \x01\x64\xff\x64(.*)\x01\x01\xff\x01's shields$/, function(killer, killed) {
                d3console.emit("kill", killer, killed, "omega");
                return true;
            })) {
                return;
            }

            // Flare
            if (route(line, /^\*\x01\x64\xff\x64(.*)\x01\x01\xff\x01's Flare ignites \x01\x64\xff\x64(.*)\x01\x01\xff\x01's fuel leak$/, function(killer, killed) {
                d3console.emit("kill", killer, killed, "flare");
                return true;
            })) {
                return;
            }

            // Concussion
            if (route(line, /^\*\x01\x64\xff\x64(.*)\x01\x01\xff\x01 takes a pounding from \x01\x64\xff\x64(.*)\x01\x01\xff\x01's Concussion$/, function(killed, killer) {
                d3console.emit("kill", killer, killed, "concussion");
                return true;
            })) {
                return;
            }

            // Frag
            if (route(line, /^\*\x01\x64\xff\x64(.*)\x01\x01\xff\x01 catches shrapnel from \x01\x64\xff\x64(.*)\x01\x01\xff\x01's Frag$/, function(killed, killer) {
                d3console.emit("kill", killer, killed, "frag");
                return true;
            })) {
                return;
            }

            // Homer
            if (route(line, /^\*\x01\x64\xff\x64(.*)\x01\x01\xff\x01's Homer swoops down on \x01\x64\xff\x64(.*)\x01\x01\xff\x01 for the kill$/, function(killer, killed) {
                d3console.emit("kill", killer, killed, "homer");
                return true;
            })) {
                return;
            }

            // Guided
            if (route(line, /^\*\x01\x64\xff\x64(.*)\x01\x01\xff\x01's Guided hunts down \x01\x64\xff\x64(.*)\x01\x01\xff\x01$/, function(killer, killed) {
                d3console.emit("kill", killer, killed, "guided");
                return true;
            })) {
                return;
            }

            // Napalm Rocket
            if (route(line, /^\*\x01\x64\xff\x64(.*)\x01\x01\xff\x01 is incinerated by \x01\x64\xff\x64(.*)\x01\x01\xff\x01's Napalm Rocket$/, function(killed, killer) {
                d3console.emit("kill", killer, killed, "napalm rocket");
                return true;
            })) {
                return;
            }

            // Impact - I do not believe there is a custom string for impact mortar kills.

            // Smart
            if (route(line, /^\*\x01\x64\xff\x64(.*)\x01\x01\xff\x01 can't shake \x01\x64\xff\x64(.*)\x01\x01\xff\x01's Smart missile$/, function(killed, killer) {
                d3console.emit("kill", killer, killed, "smart");
                return true;
            })) {
                return;
            }

            // Cyclone
            if (route(line, /^\*\x01\x64\xff\x64(.*)\x01\x01\xff\x01's Cyclone overwhelms \x01\x64\xff\x64(.*)\x01\x01\xff\x01's defenses$/, function(killer, killed) {
                d3console.emit("kill", killer, killed, "cyclone");
                return true;
            })) {
                return;
            }

            // Mega
            if (route(line, /^\*\x01\x64\xff\x64(.*)\x01\x01\xff\x01's Mega reduces \x01\x64\xff\x64(.*)\x01\x01\xff\x01 to smoldering scrap$/, function(killer, killed) {
                d3console.emit("kill", killer, killed, "mega");
                return true;
            })) {
                return;
            }

            // Black Shark - I do not believe there is a custom string for black shark kills.

            // HyperOrb
            if (route(line, /^\*(.*) Has The HyperOrb!!!$/, function(player) {
                d3console.emit("hyperorb", player);
                return true;
            })) {
                return;
            }

            // HyperOrb lost
            if (route(line, /^\*(.*) Lost The HyperOrb!!!$/, function(player) {
                d3console.emit("hyperorblost", player);
                return true;
            })) {
                return;
            }

            // HyperOrb score
            if (route(line, /^\*(.*) racks up another ([2-5]) points!$/, function(player, points) {
                d3console.emit("hyperorbscore", player, +points);
                return true;
            })) {
                return;
            }

            // CTF Flag pickup
            if (route(line, /^\*(.*) \((.*)\) (?:picks up the|finds the) (.*) Flag(?: among some debris!)?$/, function(player, team, flag) {
                d3console.emit("flagpickup", player, team, flag);
                return true;
            })) {
                return;
            }

            // CTF Flag score
            if (route(line, /^\*(.*) \((.*)\) captures the (.*), (.*) and (.*) Flags!$/, function(player, team, flag1, flag2, flag3) {
                d3console.emit("flagscore", player, team, flag1, flag2, flag3);
                return true;
            })) {
                return;
            }

            if (route(line, /^\*(.*) \((.*)\) captures the (.*) and (.*) Flags!$/, function(player, team, flag1, flag2) {
                d3console.emit("flagscore", player, team, flag1, flag2);
                return true;
            })) {
                return;
            }

            if (route(line, /^\*(.*) \((.*)\) captures the (.*) Flag!$/, function(player, team, flag) {
                d3console.emit("flagscore", player, team, flag);
                return true;
            })) {
                return;
            }

            // CTF Flag return
            if (route(line, /^\*(.*) \((.*)\) returns the .* Flag!$/, function(player, team) {
                d3console.emit("flagreturn", player, team);
                return true;
            })) {
                return;
            }

            // First hat trick
            if (route(line, /^\*(.*) is the first to get a Hat Trick!!!$/, function(player) {
                d3console.emit("hattrick", player, true);
                return true;
            })) {
                return;
            }

            // Hat trick
            if (route(line, /^\*(.*) has achieved a Hat Trick!!!$/, function(player) {
                d3console.emit("hattrick", player, false);
                return true;
            })) {
                return;
            }

            // Monsterball point
            if (route(line, /^\*(.*) \((.*)\) knocks the ball in for a point!$/, function(player, team) {
                d3console.emit("monsterballpoint", player, team);
                return true;
            })) {
                return;
            }

            // Monsterball blunder
            if (route(line, /^\*(.*) accidently scores a point for the (.*) team!$/, function(player, team) {
                d3console.emit("monsterballblunder", player, team);
                return true;
            })) {
                return;
            }

            // Entropy base takeover
            if (route(line, /^\*(.*) Took Over A (.*) Team's (.*) Room$/, function(player, team, room) {
                d3console.emit("entropybase", player, team, room);
                return true;
            })) {
                return;
            }

            // Stat messages
            if (route(line, /^\*(.*) got revenge on (.*)!$/, function(killer, killed) {
                d3console.emit("statrevenge", killer, killed);
                return true;
            })) {
                return;
            }

            if (route(line, /^\*That's ([1-9][0-9]*) kills in a row for (.*)!$/, function(kills, player) {
                d3console.emit("statkillstreak", player, +kills);
                return true;
            })) {
                return;
            }

            if (route(line, /^\*That's ([1-9][0-9]*) deaths in a row for (.*)!$/, function(deaths, player) {
                d3console.emit("statdeathstreak", player, +deaths);
                return true;
            })) {
                return;
            }

            if (route(line, /^\*(.*) has an (?:awesome )?efficiency of ([1-9][0-9]*\.[0-9]{2})(?:!!)?$/, function(player, efficiency) {
                d3console.emit("statefficiency", player, +efficiency);
                return true;
            })) {
                return;
            }

            if (route(line, /^\*(.*) has killed (.*) ([1-9][0-9]*) times!$/, function(killer, killed, kills) {
                d3console.emit("statkills", killer, killed, +kills);
                return true;
            })) {
                return;
            }

            if (route(line, /^\*It's (.*)'s first kill in ([1-9][0-9]*):([0-5][0-9]) minutes?$/, function(killer, minutes, seconds) {
                d3console.emit("statkillinterval", killer, (+minutes * 60) + (+seconds));
                return true;
            })) {
                return;
            }

            if (route(line, /^\*(.*) lasted ([1-9][0-9]*):([0-5][0-9]) minutes? without being killed!$/, function(killed, minutes, seconds) {
                d3console.emit("statdeathinterval", killed, (+minutes * 60) + (+seconds));
                return true;
            })) {
                return;
            }

            // We don't know what this is yet, so just emit the raw data.
            d3console.emit("unknown", line);
        });
    });

    this.client.on("end", function() {
        d3console.emit("end");
    });

    this.client.on("timeout", function() {
        d3console.emit("timeout");
    });

    this.client.on("error", function(err) {
        d3console.emit("error", err);
    });

    this.client.on("close", function(hadError) {
        d3console.connected = false;
        d3console.emit("close", hadError);
    });
};

Console.prototype.isConnected = function(callback) {
    "use strict";

    if (!this.connected) {
        this.emit("error", "You are not connected to the server.");
        return;
    }

    callback();
};

Console.prototype.send = function(data, callback) {
    "use strict";

    var d3console = this;

    this.isConnected(function() {
        var buffer = new Buffer(data.length + 2),
            index;

        for (index = 0; index < data.length; index++) {
            if (data.charCodeAt(index) === 0) {
                d3console.emit("error", "You cannot send a string with a char code of 0.  If you are trying to send a colorized string, you must use a char code of 1 instead.");
                return;
            }
            buffer[index] = data.charCodeAt(index);
        }
        buffer[data.length] = 13;
        buffer[data.length + 1] = 10;

        d3console.client.write(buffer, function() {
            if (typeof callback === "function") {
                callback();
            }
        });
    });
};

Console.prototype.close = function() {
    "use strict";

    var d3console = this;

    this.isConnected(function() {
        d3console.client.end();
        d3console.client.destroy();
    });
};

Console.prototype.allowTeamChange = function(allowTeamChange) {
    "use strict";

    if (typeof allowTeamChange !== "boolean") {
        this.emit("error", "Invalid setting for allowTeamChange.  Valid values are true and false.");
        return;
    }
    this.send("$allowteamchange " + (allowTeamChange ? "on" : "off"));
};

Console.prototype.autoBalance = function(autoBalance) {
    "use strict";

    if (typeof autoBalance !== "boolean") {
        this.emit("error", "Invalid setting for autoBalance.  Valid values are true and false.");
        return;
    }
    this.send("$autobalance " + (autoBalance ? "on" : "off"));
};

Console.prototype.autoSaveDisconnect = function(autoSaveDisconnect) {
    "use strict";

    if (typeof autoSaveDisconnect !== "boolean") {
        this.emit("error", "Invalid setting for autoSaveDisconnect.  Valid values are true and false.");
        return;
    }
    this.send("$autosavedisconnect " + (autoSaveDisconnect ? "on" : "off"));
};

Console.prototype.autoSaveLevel = function(autoSaveLevel) {
    "use strict";

    if (typeof autoSaveLevel !== "boolean") {
        this.emit("error", "Invalid setting for autoSaveLevel.  Valid values are true and false.");
        return;
    }
    this.send("$autosavelevel " + (autoSaveLevel ? "on" : "off"));
};

Console.prototype.balance = function() {
    "use strict";

    this.send("$balance");
};

Console.prototype.ban = function(playerNum) {
    "use strict";

    if (typeof playerNum !== "number" || playerNum < 0 || playerNum > 31 || playerNum % 1 !== 0) {
        this.emit("error", "Invalid setting for playerNum.  Valid values are integers between 0 and 31.");
        return;
    }
    this.send("$ban " + playerNum.toString());
};

Console.prototype.banList = function() {
    "use strict";

    this.send("$banlist");
};

Console.prototype.changeTeam = function(playerNum, team) {
    "use strict";

    if (typeof playerNum !== "number" || playerNum < 0 || playerNum > 31 || playerNum % 1 !== 0) {
        this.emit("error", "Invalid setting for playerNum.  Valid values are integers between 0 and 31.");
        return;
    }
    if (typeof team !== "string" || team.length === 0) {
        this.emit("error", "Invalid setting for team.  You must enter the name of the team to change teams to.");
        return;
    }
    this.send("$changeteam " + playerNum.toString() + " " + team);
};

Console.prototype.kick = function(playerNum) {
    "use strict";

    if (typeof playerNum !== "number" || playerNum < 0 || playerNum > 31 || playerNum % 1 !== 0) {
        this.emit("error", "Invalid setting for playerNum.  Valid values are integers between 0 and 31.");
        return;
    }
    this.send("$kick " + playerNum.toString());
};

Console.prototype.killMsgFilter = function(killMsgFilter) {
    "use strict";

    if (typeof killMsgFilter !== "string" || ["none", "simple", "full"].indexOf(killMsgFilter) === -1) {
        this.emit("error", "Invalid setting for killMsgFilter.  Valid values are none, simple, and full.");
        return;
    }
    this.send("$killmsgfilter " + killMsgFilter);
};

Console.prototype.playerInfo = function(playerNum) {
    "use strict";

    if (typeof playerNum !== "number" || playerNum < 0 || playerNum > 31 || playerNum % 1 !== 0) {
        this.emit("error", "Invalid setting for playerNum.  Valid values are integers between 0 and 31.");
        return;
    }
    this.send("$playerinfo " + playerNum.toString());
};

Console.prototype.players = function() {
    "use strict";

    this.send("$players");
};

Console.prototype.rehash = function() {
    "use strict";

    this.send("$rehash");
};

Console.prototype.remoteAdmin = function(remoteAdmin) {
    "use strict";

    if (typeof remoteAdmin !== "boolean") {
        this.emit("error", "Invalid setting for remoteAdmin.  Valid values are true and false.");
        return;
    }
    this.send("$remoteadmin " + (remoteAdmin ? "on" : "off"));
};

Console.prototype.remoteAdminLogout = function(loginId) {
    "use strict";

    if (loginId !== null && loginId !== undefined) {
        if (typeof loginId !== "number" || loginId < 0 || loginId % 1 !== 0) {
            this.emit("error", "Invalid setting for loginId.  Valid values are positive integers.");
            return;
        }
    }
    this.send("$remoteadminlogout" + (loginId ? " " + loginId.toString() : ""));
};

Console.prototype.remoteAdminPass = function(password) {
    "use strict";

    if (typeof password !== "string" || password.length === 0) {
        this.emit("error", "Invalid option password.  Set this to the password you want to use for remote login.");
        return;
    }
    this.send("$remoteadminpass " + password);
};

Console.prototype.removeBan = function(banNum) {
    "use strict";

    if (typeof banNum !== "number" || banNum < 0 || banNum % 1 !== 0) {
        this.emit("error", "Invalid setting for banNum.  Valid values are positive integers.");
        return;
    }
    this.send("$removeban " + banNum);
};

Console.prototype.saveStats = function() {
    "use strict";

    this.send("$savestats");
};

Console.prototype.scores = function() {
    "use strict";

    this.send("$scores");
};

Console.prototype.serverHudNames = function(serverHudNames) {
    "use strict";

    if (typeof serverHudNames !== "string" || ["none", "team", "full"].indexOf(serverHudNames) === -1) {
        this.emit("error", "Invalid setting for serverHudNames.  Valid values are none, team, and full.");
        return;
    }

    this.send("$serverhudnames " + serverHudNames);
};

Console.prototype.setGoalLimit = function(goalLimit) {
    "use strict";

    if (goalLimit === null) {
        this.send("$setgoallimit 0");
        return;
    }

    if (typeof goalLimit !== "number" || goalLimit < 1 || goalLimit % 1 !== 0) {
        this.emit("error", "Invalid setting for goalLimit.  Valid values are null to turn off the limit, or positive integers.");
        return;
    }
    this.send("$setgoallimit " + goalLimit.toString());
};

Console.prototype.setMaxPlayers = function(maxPlayers) {
    "use strict";

    if (typeof maxPlayers !== "number" || maxPlayers < 2 || maxPlayers > 32 || maxPlayers % 1 !== 0) {
        this.emit("error", "Invalid setting for maxPlayers.  Valid values are integers between 2 and 32.");
        return;
    }
    this.send("$setmaxplayers " + maxPlayers.toString());
};

Console.prototype.setPps = function(maxPps) {
    "use strict";

    if (typeof maxPps !== "number" || maxPps < 1 || maxPps > 20 || maxPps % 1 !== 0) {
        this.emit("error", "Invalid setting for maxPps.  Valid values are integers between 1 and 20.");
        return;
    }
    this.send("$setmaxplayers " + maxPps.toString());
};

Console.prototype.setRespawnTime = function(respawnTime) {
    "use strict";

    if (typeof respawnTime !== "number" || respawnTime < 1 || respawnTime % 1 !== 0) {
        this.emit("error", "Invalid setting for respawnTime.  Valid values are positive integers.");
        return;
    }
    this.send("$setRespawnTime " + respawnTime.toString());
};

Console.prototype.setTeamName = function(teamNum, teamName) {
    "use strict";

    if (typeof teamNum !== "number" || teamNum < 0 || teamNum > 3 || teamNum % 1 !== 0) {
        this.emit("error", "Invalid setting for teamNum.  Valid values are integers between 0 and 3.");
        return;
    }
    if (typeof teamName !== "string" || teamName.length === 0) {
        this.emit("error", "Invalid setting for teamName.  Set this to the name that you want to make for the team.");
        return;
    }
    this.send("$setteamname " + teamNum.toString() + " " + teamName);
};

Console.prototype.setTimeLimit = function(timeLimit) {
    "use strict";

    if (timeLimit === null) {
        this.send("$settimelimit 0");
        return;
    }

    if (typeof timeLimit !== "number" || timeLimit < 1 || timeLimit % 1 !== 0) {
        this.emit("error", "Invalid setting for timeLimit.  Valid values are null to turn off the limit, or positive integers.");
        return;
    }
    this.send("$settimelimit " + timeLimit.toString());
};

Console.prototype.statMsgs = function(statMsgs) {
    "use strict";

    if (typeof statMsgs !== "boolean") {
        this.emit("error", "Invalid setting for statMsgs.  Valid values are true and false.");
        return;
    }
    this.send("$statmsgs " + (statMsgs ? "on" : "off"));
};

Console.prototype.wait = function(time) {
    "use strict";

    if ((typeof time !== "boolean" && typeof time !== "number") || (typeof time === "number" && time < 0)) {
        this.emit("error", "Invalid setting for time.  Valid values are true and false, or a positive decimal number.");
        return;
    }

    this.send("$wait " + (typeof time === "boolean" ? (time ? "on" : "off") : time.toString()));
};

Console.prototype.warp = function(level) {
    "use strict";

    if (typeof level !== "number" || level < 1 || level % 1 !== 0) {
        this.emit("error", "Invalid setting for level.  Valid values are positive integers.");
        return;
    }
    this.send("$warp " + level.toString());
};

Console.prototype.say = function(text) {
    "use strict";

    if (typeof text !== "string" || text.length === 0) {
        this.emit("error", "Invalid setting for text.  Enter the text you wish to say as the server.");
        return;
    }

    this.send("say " + text);
};

Console.prototype.quit = function() {
    "use strict";

    this.send("quit");
};

Console.getColorString = function(red, green, blue) {
    "use strict";

    if (typeof red !== "number" || red < 1 || red > 255 || red % 1 !== 0) {
        throw new Error("Invalid setting for red.  Valid values are integers between 1 and 255.");
    }
    if (typeof green !== "number" || green < 1 || green > 255 || green % 1 !== 0) {
        throw new Error("Invalid setting for green.  Valid values are integers between 1 and 255.");
    }
    if (typeof blue !== "number" || blue < 1 || blue > 255 || blue % 1 !== 0) {
        throw new Error("Invalid setting for blue.  Valid values are integers between 1 and 255.");
    }

    return String.fromCharCode(1) + String.fromCharCode(red) + String.fromCharCode(green) + String.fromCharCode(blue);
};

module.exports = Console;
