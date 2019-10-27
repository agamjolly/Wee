if (typeof browser !== 'undefined') {
	window.chrome = browser;
}

var _badgeIsLoadingTimeout, _showLoadingInterval;

var showBadgeLoading = function() {
	clearInterval(_showLoadingInterval);
	clearTimeout(_badgeIsLoadingTimeout);

	var context = document.createElement('canvas').getContext('2d');
	var start = new Date();
	var lines = 16,
		cW = 40,
		cH = 40;

	_showLoadingInterval = setInterval(function() {
		var rotation = parseInt(((new Date() - start) / 1000) * lines) / lines;
		context.save();
		context.clearRect(0, 0, cW, cH);
		context.translate(cW / 2, cH / 2);
		context.rotate(Math.PI * 2 * rotation);
		for (var i = 0; i < lines; i++) {
			context.beginPath();
			context.rotate((Math.PI * 2) / lines);
			context.moveTo(cW / 10, 0);
			context.lineTo(cW / 4, 0);
			context.lineWidth = cW / 30;
			context.strokeStyle = 'rgba(67,170,232,' + i / lines + ')';
			context.stroke();
		}

		var imageData = context.getImageData(10, 10, 19, 19);
		chrome.browserAction.setIcon({
			imageData: imageData
		});

		context.restore();
	}, 1000 / 30);

	_badgeIsLoadingTimeout = setTimeout(function() {
		hideBadgeLoading();
	}, 5000);
};

var hideBadgeLoading = function() {
	clearInterval(_showLoadingInterval);
	chrome.browserAction.setIcon({
		path: 'media/icons/icon38.png'
	});
};

var getShortLink = function(longLink) {
	showBadgeLoading();
	var rebrandlyApi = helpers.storage.getValue('rebrandlyapi');
	var provider = helpers.storage.getValue('provider');

	if (rebrandlyApi && provider === 'rebrand.ly') {
		rebrandlyShort(longLink);
	} else {
		serverShort(longLink);
	}
};

var showLoading = function() {
	$('.loading').show();
};

var hideLoading = function() {
	$('.loading').hide();
};

var serverShort = function(longLink, apiKey) {
	$.ajax({
		url: 'https://t.ly/api/v1/link/shorten',
		type: 'POST',
		headers: {
			'X-Requested-With': 'XMLHttpRequest'
		},
		data: {
			long_url: longLink,
			provider: helpers.storage.getValue('provider'),
			api_key: apiKey,
			api_token: apiKey //Needed for t.ly
		},
		success: function(response) {
			handleSuccess(response, longLink);
		},
		error: function() {
			handleError();
		}
	});
};

var rebrandlyShort = function(longLink) {
	var rebrandlyApi = helpers.storage.getValue('rebrandlyapi');

	let linkRequest = {
		destination: longLink
	};

	let requestHeaders = {
		'Content-Type': 'application/json',
		apikey: rebrandlyApi
	};

	$.ajax({
		url: 'https://api.rebrandly.com/v1/links',
		type: 'post',
		data: JSON.stringify(linkRequest),
		headers: requestHeaders,
		dataType: 'json',
		success: link => {
			if (link && link.shortUrl) {
				var newResponse = {
					short_url: link.shortUrl,
					provider_success: true
				};

				handleSuccess(newResponse);
			} else {
				handleError();
			}
		},
		error: function() {
			handleError();
		}
	});
};

var handleSuccess = function(response, longLink) {
	var shortUrl = response.short_url,
		includeHttps = helpers.storage.getValue('includeHttps'),
		copyToClipboardSetting = helpers.storage.getValue('copyToClipboard');

	if (!includeHttps) {
		shortUrl = shortUrl.replace(/(^\w+:|^)\/\//, '');
	}

	$('#shortenedLink').val(shortUrl);
	$('#short-domain').text(response.domain + '/');
	$('#short-id').val(response.short_id);
	$('#defaultShortenerFailed').toggle(!response.provider_success);

	$('#stats').attr('href', shortUrl + '+');
	var qrLink = 'http://chart.apis.google.com/chart?cht=qr&chs=500x500&choe=UTF-8&chld=H|0&chl=' + shortUrl;
	$('#qr-code').attr('src', qrLink);
	$('#qr-link').attr('href', qrLink);
	var currentLink = $('#shortenedLink').val();

	if (copyToClipboardSetting) {
		$('#shortenedLink').val('Copied!');
		copyToClipboard(shortUrl);
	}
	setTimeout(function() {
		$('#shortenedLink').val(currentLink);
	}, 700);

	if (helpers.storage.getValue('notificationSound')) {
		$('#successAudio')[0].play();
	}

	hideLoading();
	hideBadgeLoading();

	chrome.browserAction.setBadgeText({
		text: ''
	});

	chrome.browserAction.setTitle({ title: 'Short URL:\n' + response.short_url + '\n\n' + longLink + '\n\n' });

	if (response.info.description) {
		$('#url-description').val(response.info.description);
	}

	if (response.info.title) {
		$('#url-title').val(response.info.title);
	}

	if (response.info.twitter_url) {
		$('#twitter-share')
			.removeClass('hidden')
			.attr('href', response.info.twitter_url);
	}

	if (response.info.facebook_url) {
		$('#facebook-share')
			.removeClass('hidden')
			.attr('href', response.info.facebook_url);
	}

	if (response.short_url.includes('t.ly')) {
		$('#update-link-form').removeClass('hidden');
	}
};

var handleError = function() {
	hideLoading();
	hideBadgeLoading();
	$('#shortenedLink').val('Failed to shorten');

	$('#defaultShortenerFailed').hide();

	if (helpers.storage.getValue('notificationSound')) {
		$('#errorAudio')[0].play();
	}
};

var copyToClipboard = function(text) {
	const input = document.createElement('input');
	input.style.position = 'fixed';
	input.style.opacity = 0;
	input.value = text;
	document.body.appendChild(input);
	input.select();
	document.execCommand('Copy');
	document.body.removeChild(input);
};

var getProviders = function() {
	$.ajax({
		url: 'https://t.ly/api/v1/link/providers',
		type: 'GET',
		headers: {
			'X-Requested-With': 'XMLHttpRequest'
		},
		success: function(providers) {
			providers.forEach(function(provider) {
				$('#providers').append(
					$('<option>', {
						value: provider.value,
						text: provider.text,
						selected: helpers.storage.getValue('provider') == provider.value
					})
				);
			});
		}
	});
};

var openLink = function(urlToOpen) {
	chrome.tabs.create({
		url: urlToOpen
	});
};
