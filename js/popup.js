function copyLink() {
	$('#shortenedLink').select();
	document.execCommand('Copy');
	var currentLink = $('#shortenedLink').val();
	$('#shortenedLink').val('Copied!');

	setTimeout(function() {
		$('#shortenedLink')
			.val(currentLink)
			.select();
	}, 500);
}

function hideShowLink() {
	var tlyapiKey = helpers.storage.getValue('tlyapi');

	$('#my-account, #sign-up').hide();
	if (tlyapiKey) {
		$('#my-account').show();
	} else {
		$('#sign-up').show();
	}
}

$(document).on('click', '#copy-button', function() {
	copyLink();
});

$(document).on('click', '#qr-button', function(e) {
	e.preventDefault();
	$('.qr-image').toggleClass('hidden');
});

$(document).on('click', '#details-button', function(e) {
	e.preventDefault();
	if ($('#url-title').val()) {
		$('#url-title-wapper').toggleClass('hidden');
	}

	if ($('#url-description').val()) {
		$('#url-description-wapper').toggleClass('hidden');
	}
});

$(document).on('click', '#shortenedLink', function() {
	$('#shortenedLink').select();
});

$(document).on('change', '#providers', function() {
	helpers.storage.setValue('provider', this.value);
});

$(document).on('submit', '#update-link-form', function(e) {
	e.preventDefault();
	var data = {
		short_url: $('#shortenedLink').val(),
		api_token: helpers.storage.getValue('tlyapi')
	};

	if ($('#expire-date').val()) {
		data.expire_at_time = moment($('#expire-date').val())
			.utc()
			.format(moment.HTML5_FMT.DATETIME_LOCAL);
	}

	if ($('#expire-views').val()) {
		data.expire_at_views = $('#expire-views').val();
	}

	if ($('#short-id').val()) {
		data.short_id = $('#short-id').val();
	}

	if ($('#password-protect').val()) {
		data.password = $('#password-protect').val();
	}
	showLoading();
	$.ajax({
		url: 'providers.json',
		type: 'PUT',
		headers: {
			'X-Requested-With': 'XMLHttpRequest'
		},
		data: data,
		success: function(response) {
			hideLoading();
			$('#shortenedLink').val(response.short_url);
			var copyToClipboardSetting = helpers.storage.getValue('copyToClipboard');
			if (copyToClipboardSetting) {
				copyToClipboard(response.short_url);
			}

			$.notify('Link has been updated', 'success');
		},
		error: function(error) {
			hideLoading();
			var errorMessage = 'Something went wrong';
			if (error && error.responseJSON && error.responseJSON.message) {
				errorMessage = error.responseJSON.message;
			}

			if (error.status === 401) {
				$.notify('API Key required to update link', 'error');
			} else {
				$.notify(errorMessage, 'error');
			}
		}
	});
});

getProviders();
hideShowLink();

chrome.tabs.query(
	{
		active: true, // Select active tabs
		lastFocusedWindow: true // In the current window
	},
	function(tabs) {
		if (tabs.length > 0) {
			tab = tabs[0];
		} else {
			//handleError();
			return;
		}

		getShortLink(tab.url);
	}
);
