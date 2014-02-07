exports.getWeather = function(args) {
	if (!Ti.Network.online) {
		alert('Internet not available');
	} else {
		Ti.Geolocation.purpose = 'The application ' + args.appname + ' will access your location to get the current weather';
		if (Ti.Platform.osname == 'android') {
			Ti.Geolocation.Android.accuracy = Ti.Geolocation.ACCURACY_HIGH;
			var gpsProvider = Ti.Geolocation.Android.createLocationProvider({
				name : Ti.Geolocation.PROVIDER_GPS,
				minUpdateTime : 60,
				minUpdateDistance : 100
			});
			Ti.Geolocation.Android.addLocationProvider(gpsProvider);
		}
		
		var location = Ti.Geolocation.getCurrentPosition(function(e) {
			var lattitude = e.coords.latitude;
			var longitude = e.coords.longitude;
			var woeid = null;
			var xhr = Ti.Network.createHTTPClient();
			xhr.onload = function() {
				try {

					var xml = this.responseXML;
					var nodes = xml.documentElement.getElementsByTagName("Result");
					for (var i = 0; i < nodes.length; i++) {
						if (nodes.item(i).hasChildNodes()) {
							for (var i2 = 0; i2 < nodes.item(i).childNodes.length; i2++) {
								if (nodes.item(i).childNodes.item(i2).nodeName == 'woeid') {
									woeid = nodes.item(i).childNodes.item(i2).text;

									var innerXhr = Ti.Network.createHTTPClient();
									innerXhr.onload = function() {
										var tempMin = '';
										var tempMax = '';
										var cityName = '';
										try {
											var domCityName = this.responseXML.documentElement.getElementsByTagName('description');
											cityName = domCityName.item(0).childNodes.item(0).text.toString().replace('Yahoo! Weather for', '');

											var domTemperature = this.responseXML.documentElement.getElementsByTagName('yweather:forecast');

											var dateObj = new Date();
											var date = dateObj.getDate();
											var year = dateObj.getFullYear();
											for (var i = 0; i < domTemperature.length; i++) {
												if (domTemperature.item(i).getAttribute('date').toString().indexOf(date) != -1 && domTemperature.item(i).getAttribute('date').toString().indexOf(year) != -1) {
													tempMin = domTemperature.item(i).getAttribute('low');
													tempMax = domTemperature.item(i).getAttribute('high');
												}
											}
											var returnObject = {
												'maximumTemp' : tempMax,
												'minimumTemp' : tempMin,
												'cityName' : cityName
											};

											Ti.App.fireEvent('notifyWeather', {
												'weather' : returnObject
											});

										} catch(e) {
											alert('No Weather forecast available');

											var returnObject = {
												'maximumTemp' : '',
												'minimumTemp' : '',
												'cityName' : ''
											};

											Ti.App.fireEvent('notifyWeather', {
												'weather' : returnObject
											});

										}
									};
									innerXhr.onerror = function() {
										alert('An error occured please try again');
										Ti.API.info('error ' + this.responseText);
									};
									innerXhr.open('GET', 'http://weather.yahooapis.com/forecastrss?w=' + woeid + '&u=c');
									innerXhr.send();
								}
							}
						} else {
							alert('node length: ' + nodes.item(i).length);
							var returnObject = {
								'maximumTemp' : '',
								'minimumTemp' : '',
								'cityName' : ''
							};

							Ti.App.fireEvent('notifyWeather', {
								'weather' : returnObject
							});
						}
					}

				} catch(e) {
					alert('No Weather forecast available');

					var returnObject = {
						'maximumTemp' : '',
						'minimumTemp' : '',
						'cityName' : ''
					};

					Ti.App.fireEvent('notifyWeather', {
						'weather' : returnObject
					});

				}
			};
			xhr.onerror = function(e) {
				alert('An error occured please try again');
				Ti.API.info('error' + this.responseText);
			};
			xhr.open('GET', 'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20geo.placefinder%20where%20text%3D%22' + lattitude + '%2C' + longitude + '%22%20and%20gflags%3D%22R%22');

			xhr.send();
		});

	}
};
