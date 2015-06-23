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

## Options

* `d3console.options.server` - This is the IP address of the server you wish to connect to.
* `d3console.options.port` - This is the port number of the server you wish to connect to, defaulting to 2092.
* `d3console.options.password` - This is the password required to connect to the server.

## Events

There are many events you can listen to which will be documented in a later release.  Here is a sample event listener:

```
d3console.once("loggedin", function(ip) {
    d3console.say("The server operator has logged in, so be on your best behavior!");
});
```

## Instance Methods

There are many methods that mirror the commands available to a Descent 3 dedicated server that will be documented in a later release.

## Static Methods

* `Console.getColorString(red, green, blue)` - Get the four character string required to change the color of the console line.  `red`, `green`, and `blue` must each be an integer between 1 and 255. 

## History

### Version 0.1 - 6/22/2015

* Initial version.
