# openhab-controlpanel
A simple dashboard using the OpenHAB REST services.

**GitHub users:** if you want to **fork** this project, take a look at the [advanced version](https://github.com/HomeAutomationForGeeks/openhab-controlpanel-advanced) instead. It has the config options in a separate file so you don't accidentally share your personal stuff.

### See also

http://www.homeautomationforgeeks.com/dashboard.shtml

## Table of Contents

* [Screenshots](#screenshots)
* [Features](#features)
* [Installing Prerequisitesn](#installing-prerequisites)
* [The Weather Underground API](#the-weather-underground-api)
* [Installation](#installation)
* [Included Dependencies](#included-dependencies)
* [Full Screen Mode On Your Android Tablet](#full-screen-mode-on-your-android-tablet)

## Screenshots

### Example setup

![Example setup](https://github.com/HomeAutomationForGeeks/openhab-controlpanel/raw/master/screenshots/screenshot1.png)

### Running full screen on a cheap ($50) Android tablet

![Running on an Android tablet](https://github.com/HomeAutomationForGeeks/openhab-controlpanel/raw/master/screenshots/screenshot2.png)

## Features

* **Switches**: display the on/off status of switches (green = on) + tap to toggle them
* **Open/close sensors**: display the open/close status of eg. a door sensor (red = open) + tap to view a log of recent entries
* **Data sensors**: display sensor data + tap to view a log of recent data
* **Weather data**: get up-to-date weather info from a nearby weather station
* **Trash reminder**: on trash days, a trash icon appears as a reminder. On recycle days, a recycle icon appears

## Installing Prerequisites

### Raspberry Pi / Linux

This dashboard was created on a Raspberry Pi 2 but can probably run on most systems with very little modification.

#### Apache

To install Apache on your Raspberry Pi:

`sudo apt-get install apache2`

To check if Apache works, just browse to your Pi's IP address (eg. http://192.168.1.80). If Apache installed correctly, you'll see a page saying *"It works!"*.

#### PHP

If you enabled *persistence* in OpenHAB and want to be able to view logs, you also need to install PHP, and the MySQL PHP libraries:

`sudo apt-get install php5 libapache2-mod-php5`

`sudo apt-get install php5-mysql`

### The Weather Underground API

The weather bar uses the [Weather Underground API](http://www.wunderground.com/weather/api/) to get weather data. You can remove it if you don't want this. If you keep it, you'll need:

* A (free) Weather Underground API key
* A weather station ID

#### Start by requesting an API key:

* Go to the [Weather Underground API](http://www.wunderground.com/weather/api/) and click the Sign Up button
* Create an account, and activate it using the confirmation e-mail
* Once you're logged in, you need to [request an API key](http://www.wunderground.com/weather/api/d/pricing.html): you can select the biggest (Anvil) plan and the history add-on: as long as you select the Developer option it will be $0.
* Make a note of your API key.
* Also note that the free key allows **500 calls per day**. By default, the weather refresh interval on the sample dashboard is every 10 minutes, which would make 144 calls per day. If you change it, make sure you don't go over your quota - or buy an upgrade plan.

#### The next step is to find a weather station ID:

* Go to the [Weather Underground home page](http://www.wunderground.com/).
* Search for your location - it will take you to the weather detail page for a nearby station.
  * Optional: change the default station to one closer to you by clicking on "Change Station".
* Click on the weather station name - it's right under your location name.
* On this page the station's ID will be right next to the station name - make a note of that ID.
  * **Example:** if you search for "New York, New York", the default station is "Flatiron". If you click on Flatiron, the station's page lists the ID as "KNYNEWYO118". 
  * The full URL is then *(including the "pws:" prefix for weather station codes)*: http://api.wunderground.com/api/YOUR_API_KEY_HERE/conditions/q/pws:KNYNEWYO118.json

## Installation

### Download the project files

[Download the dashboard](https://github.com/HomeAutomationForGeeks/openhab-controlpanel/archive/master.zip) and unzip it to /var/www on your Pi. It won't work out of the box: you'll need to open **index.html** and look for all the places where it says **TODO**. That's where you need to change things like insert your weather API key and configure widgets.

You'll probably want to look through the code to understand what's going on. There are comments explaining things throughout. 
The main files are:

* **index.html**: set up general configuration + add, remove and configure widgets ([HTML](http://www.w3schools.com/html/))
* **js/dashboard.js**: main logic ([javascript](http://www.w3schools.com/js/)/[jQuery](https://jquery.com/))
* **css/style.css**: widget style ([CSS](http://www.w3schools.com/css/))
* **data.php**: used to query the openhab logs in MySQL and return the last 6 entries as JSON ([PHP](http://www.w3schools.com/php/))

There's also logging: you configure the amount of logging by changing the loggingLevel value in index.html. **To see the log output**, press F12 while in your browser and make sure the "console" tab is selected.

## Included Dependencies

* [JQuery](https://jquery.com/) v1.11.1
* [JQuery Atmosphere](https://github.com/Atmosphere/atmosphere-javascript)
* [Font Awesome](https://fortawesome.github.io/Font-Awesome/)

## Full Screen Mode on your Android tablet

If you're using an Android tablet as your screen, you'll want the browser to work in full screen mode so the various tool bars don't take up precious screen space.

There are probably several ways to do it - here's one way:

1. Install the [Chrome For Android browser](https://play.google.com/store/apps/details?id=com.android.chrome), or update it to the latest version (you need at least version 39).
2. Browse to to your dashboard site, and once it's loaded open the Settings menu and click **"Add to homescreen"**. This will create a launcher icon, and allow it to start full-screen. If you're curious, [see here](https://developer.chrome.com/multidevice/android/installtohomescreen) for how that works.
3. Install the [Immersive Mode](https://play.google.com/store/apps/details?id=com.gmd.immersive) app. Once installed open the app and have it start on boot.
4. Open your dashboard site using the launcher icon you created earlier. The Chrome interface (address bar etc) should be hidden, but you can still see the Android notifications bar at the top and actions bar at the bottom.
5. Slide down the Android notifications from the top, and select the right-most icon in the Immersive Mode notification. This should hide both bars - your dashboard is now the only thing visible on the tablet.
