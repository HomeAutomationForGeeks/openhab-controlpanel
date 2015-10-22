var socket = $.atmosphere;
var secondsSinceLoad = 0;

function Start()
{
	BuildWidgets();
	
	CheckStates();
	
	GetWeather();
	
	CheckTrashDay();
	
	StartTime();
}

function StartTime() {
	var today = new Date();

	$("div.clock").html(today.getHours() + ":" + ToDoubleDigits(today.getMinutes()));
	$("div.date").html(today.toDateString());
	
	if (today.getHours() == reloadHour && today.getMinutes() == 0 && secondsSinceLoad > 600) {	// The extra checks besides reloadHour are to make sure we don't reload every second when we hit reloadHour
		window.location.reload(true);
	}
	
	secondsSinceLoad++;

	setTimeout(function(){ StartTime() }, 1000);
}

// Called once when the page is first loaded
// Creates the HTML for the various widgets depending on type
function BuildWidgets()
{
	$("widget").each(function() {
		var widget = $(this);
		
		Log("[BuildWidgets] " + widget.data("title"), 2);
		
		var icon = widget.data("icon") || "lightbulb-o";
		
		switch (widget.data("type")) {
			case "switch":
				widget.html("<span class=\"icon fa-" + icon + "\"></span><h3>" + widget.data("title") + "</h3>");
				break;
			case "openclose":
				widget.html("<span class=\"icon fa-lock\"></span><h3>" + widget.data("title") + "</h3>");
				break;
			case "sensor":
				widget.html("<span class=\"icon\">?</span><h3>" + widget.data("title") + "</h3>");
				break;
		}
	});
}

function CheckStates()
{
	$("widget").each(function() {
		try
		{
			var widget = $(this);
			
			// Skip widgets in history mode - logic is in GetHistory
			var widgetmode = widget.data("mode") || "main";
			if (widgetmode === "history") {
				return;
			}
			
			// Skip trash widgets - OpenHAB has nothing to do with those
			if (widget.data("type") === "trash") {
				return;
			}
			
			// Send a simple GET request to OpenHAB to get the item's CURRENT state
			$.ajax({
				type: "GET",
				url: "http://" + openhabURL + widget.data("item") + "/state"
			})
			.done(function(data) {
				Log("[CheckStates] Initial state of " + widget.data("item") + ": " + data, 3);
				DisplayItemState(widget, data);
			}).fail( function(jqXHR, data) { 
				Log("Error getting state: " + data, 1);
			});
			
			// Now open a socket to be alerted of FUTURE state updates
			Log('[socket] Opening socket...', 3)
			
			var request = { 
				url: "ws://" + openhabURL + widget.data("item"),
				maxRequest : 256,
				timeout: 59000,
				attachHeadersAsQueryString : true,
				executeCallbackBeforeReconnect : false,
				transport : 'websocket' ,
				fallbackTransport: 'long-polling',
				headers: { 'Accept': 'application/json' }
			};
			
			request.onOpen = function(response) {
				Log('[socket] Socket opened (' + response.transport + ')', 2);
			};

			request.onClose = function(response) {
				Log('[socket] Socket closed', 2);
			};

			request.onError = function(response) {
				Log('[socket] Something went wrong', 1);
			};

			request.onMessage = function (response) {
				if (response.status == 200) {
					// response.responseBody looks like this: 
					// { "type": "SwitchItem", "name": "ItemName", "state": "ON", "link": "http://192.168.1.80:8080/rest/items/ItemName" }
					var message = $.parseJSON(response.responseBody);
					DisplayItemState(widget, message.state);
				}
			}
			
			socket.subscribe(request);
		}
		catch (exception) {
			Log('[socket] Error:' + exception, 1);
		}	
	});	// end each
}

function DisplayItemState(widget, state)
{
	// How to display state information depends on the widget type
	switch (widget.data("type")) {
		case "switch":
			if (state === "ON") {
				widget.children("span:first").addClass("switchon");
				widget.data("onclick", "OFF");
			} else {
				widget.children("span:first").removeClass("switchon");
				widget.data("onclick", "ON");
			}
			break;
		case "sensor":
			if (isNaN(state)) {
				state = "-";
			}
			if (widget.data("format")) {
				state = widget.data("format").format(state);
			}
			widget.children("span:first").html("<span class=\"sensor\">" + state + "</span>");
			break;
		case "openclose":
			if (state === "OPEN") {
				widget.children("span:first").addClass("dooropen");
			} else {
				widget.children("span:first").removeClass("dooropen");
			}
			break;
	}
}

function CheckTrashDay()
{
	// Look for a widget defined as type "trash"
	var trashWidget = $("widget[data-type='trash']");
	if (!trashWidget.length) return;	// no trash widget found
	
	// Get the days defined as trash and recycle days 
	// These variables will have value NaN if the data attribute is not found, which is fine
	var trashDay = parseInt(trashWidget.data("trashday"));
	var recycleDay = parseInt(trashWidget.data("recycleday"));

	// See if we need to show a trash icon, recycle icon, or hide the widget
	var now = new Date();
	switch (now.getDay()) {
		case trashDay:
			trashWidget.show();
			trashWidget.html("<span class=\"icon fa-trash trash\"></span><h3>Trash Day</h3>");
			break;
		case recycleDay:
			trashWidget.show();
			trashWidget.html("<span class=\"icon fa-recycle trash\"></span><h3>Recycle Day</h3>");
			break;
		default:
			// No trash today
			trashWidget.hide();
			break;
	}
	
	// Check again at 4 AM (forever, every day)
	var millisTo4AM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 4, 0, 0, 0) - now;
	if (millisTo4AM < 0) {
		millisTo4AM += 86400000; // it's after 4 AM, try 4 AM tomorrow.
	}
	setTimeout("CheckTrashDay()", millisTo4AM);
}

function GetHistory(widget)
{
	// Query the page that gives us history data for the widget
	$.ajax({
		type: "GET",
		url: logURL + widget.data("item"),
		dataType: "json"
	})
	.done(function(data) {
		Log("Response: " + data, 3);
		// We're showing ALL the data returned - we assume the data service has limited the data for us
		var logdata = "";
		$.each(data, function (i, value) {
			logdata += "<div class=\"logrow\">" + data[i].timestamp + ": <b>" + data[i].value + "</b></div>";
		});
		widget.html("<span class=\"sensor\">" + logdata + "</span>");
	}).fail( function(jqXHR, data) { 
		Log("Error getting state: " + data, 1);
	});
}

function GetWeather()
{
	if ($("div.weatherbar").length) {
		GetWeatherConditions();
		GetWeatherForecast()
	}
}

function GetWeatherConditions()
{
	Log("Updating weather conditions", 2);
	
	// Send a request to the weather service for this location
	$.ajax({
		type: "GET",
		url: weatherURL,
		dataType: "jsonp"
	})
	.done(function(data) {
		Log(data, 4);
		// The weather service sends back a lot of data, but we'll only use some
		$("#observation_icon").attr("src", "weather/" + data.current_observation.icon + ".png");
		$("#observation_weather").html(ParseWeatherConditions(data.current_observation.weather));
		$("#observation_temperature").html(data.current_observation.temperature_string);
		$("#observation_feelslike").html("feels like: " + data.current_observation.feelslike_string);
		$("#observation_time").html(data.current_observation.observation_time);
	}).fail( function(jqXHR, data) { 
		Log("Error getting weather: " + data, 1);
	});
	
	setTimeout(GetWeatherConditions, weatherFrequency);
}

function GetWeatherForecast()
{
	Log("Updating weather forecast", 2);
	
	// Send a request to the weather service for this location
	$.ajax({
		type: "GET",
		url: forecastURL,
		dataType: "jsonp"
	})
	.done(function(data) {
		Log(data, 4);
		
		// The weather service sends back a lot of data, but we'll only use some
		$("#forecast_title", "#weather_today").html(data.forecast.simpleforecast.forecastday[0].date.weekday);
		$("#forecast_icon", "#weather_today").attr("src", "weather/" + data.forecast.simpleforecast.forecastday[0].icon + ".png");
		$("#forecast_conditions", "#weather_today").html(ParseWeatherConditions(data.forecast.simpleforecast.forecastday[0].conditions));
		$("#forecast_high", "#weather_today").html(data.forecast.simpleforecast.forecastday[0].high.fahrenheit + "F (" + data.forecast.simpleforecast.forecastday[0].high.celsius + "C)");
		$("#forecast_low", "#weather_today").html(data.forecast.simpleforecast.forecastday[0].low.fahrenheit + "F (" + data.forecast.simpleforecast.forecastday[0].low.celsius + "C)");
		
		$("#forecast_title", "#weather_tomorrow").html(data.forecast.simpleforecast.forecastday[1].date.weekday);
		$("#forecast_icon", "#weather_tomorrow").attr("src", "weather/" + data.forecast.simpleforecast.forecastday[1].icon + ".png");
		$("#forecast_conditions", "#weather_tomorrow").html(ParseWeatherConditions(data.forecast.simpleforecast.forecastday[1].conditions));
		$("#forecast_high", "#weather_tomorrow").html(data.forecast.simpleforecast.forecastday[1].high.fahrenheit + "F (" + data.forecast.simpleforecast.forecastday[1].high.celsius + "C)");
		$("#forecast_low", "#weather_tomorrow").html(data.forecast.simpleforecast.forecastday[1].low.fahrenheit + "F (" + data.forecast.simpleforecast.forecastday[1].low.celsius + "C)");
		
		$("#forecast_time").html("Forecast Time: " + data.forecast.txt_forecast.date);
		
		// After 5 PM: show tomorrow's forecast. Before 5 PM: show today's.
		var today = new Date();
		if (today.getHours() >= 17){
			$("#weather_today").hide();
			$("#weather_tomorrow").show();
		} else {
			$("#weather_today").show();
			$("#weather_tomorrow").hide();
		}
	}).fail( function(jqXHR, data) { 
		Log("Error getting weather: " + data, 1);
	});
	
	setTimeout(GetWeatherForecast, forecastFrequency);
}

// Some descriptions are a bit too long, so we replace them with something a little shorter
function ParseWeatherConditions(conditions) {
	switch (conditions.toLowerCase()) {
		case "chance of a thunderstorm":
			return "Chance of Storm"
		default:
			return conditions;
	}
}

// Capture clicks: Weather Bar
$(document).on("mousedown", "div.weather_forecast", function(){
	// Switch between today & tomorrow
	if ($("#weather_today").is(":visible")) {
		$("#weather_today").hide();
		$("#weather_tomorrow").show();
	} else {
		$("#weather_today").show();
		$("#weather_tomorrow").hide();
	}
});

// Capture clicks: Widgets
$(document).on("mousedown", "widget", function(){
	var widget = $(this);
	
	Log("Clicked widget: " + widget.data("title") + " of type '" + widget.data("type") + "'", 2);
	
	if (widget.data("type") === "switch") {
		// Clicked on a switch: send command to OpenHAB
		$.ajax({
			type: "POST",
			url: "http://" + openhabURL + widget.data("item"),
			data: widget.data("onclick"), 
			headers: { "Content-Type": "text/plain" }
		})
		.done(function(data) {
			Log("Command sent", 2);
		}).fail( function(jqXHR, data) { 
			Log("Error on tap: " + data, 1);
		});
	} else if (widget.data("history")) {
		// Clicked on a widget that has history data: toggle between main mode and history mode
		var widgetmode = widget.data("mode") || "main";
		
		if (widgetmode === "main") {
			// Switch to history mode
			widget.data("mode", "history");
			GetHistory(widget);
		}
		else if (widgetmode === "history") {
			// Switch to main mode: rebuild the original widget
			switch (widget.data("type")) {
				case "sensor":
					widget.html("<span class=\"icon\">?</span><h3>" + widget.data("title") + "</h3>");
					break;
				case "openclose":
					widget.html("<span class=\"icon fa-lock\"></span><h3>" + widget.data("title") + "</h3>");
					break;
			}
			widget.data("mode", "main");
		}
	}
} );


// Helper Functions

// Add a zero in front of numbers < 10
function ToDoubleDigits(i) {
	if (i < 10) {i = "0" + i};  
	return i;
}

// Write to the console, but only when logging at a level below our loggingLevel
function Log(text, level) {
	if (loggingLevel >= level) {
		console.log(text);
	}
}

// Very simple Format function - just replaces {0}, {1} etc in the given string
String.prototype.format = function() {
    var s = this,
        i = arguments.length;

    while (i--) {
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }
    return s;
};