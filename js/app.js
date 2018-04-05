var requestResult = '';
(function () {
	// hack to view the error in browser
	window.onerror = function (error) {
		alert(error);
	};

	
	// Connection Status
	function isOnline() {
		var connectionStatus = document.getElementById('onlineStatus');

		if (navigator.onLine) {
			connectionStatus.innerHTML = 'Online';
		}
		else {
			connectionStatus.innerHTML = 'Offline. Any requests will be delivered from Cache Storage if they exist.';
		}
	}

	window.addEventListener('online', isOnline);
	window.addEventListener('offline', isOnline);

	isOnline();

	if ('serviceWorker' in navigator) {
		// Notification.requestPermission(function (status) {
		// 	console.log('Notification permission status:', status);
		// });

		navigator.serviceWorker
			.register('./service-worker.js')
			.then(function (reg) {
				console.log('Registered service worker!');


				var form = document.querySelector('.js-background-sync');
				var fullnameField = form.querySelector('#fullname');
				var bodyField = form.querySelector('#body');

				form.addEventListener('submit', function (event) {
					event.preventDefault();
					var message = {
						Fullname: fullnameField.value,
						Body: bodyField.value
					};

					// do more stuff here
					store.outbox('readwrite').then(function (outbox) {
						return outbox.put(message);
					}).then(function () {
						// register for sync and clean up the form
						bodyField.value = '';
						if (fullnameField.getAttribute('type') !== 'hidden') {
							fullnameField.value = '';
						}

						if (navigator.onLine) {
							document.getElementById('result').innerHTML += '<p>added to outbox:' + JSON.stringify(message) + '</p><br/>';
						} else {
							document.getElementById('result').innerHTML += '<p>added to outbox <span style="color: red">(will be sent when online)</span>:' + JSON.stringify(message) + '</p><br/>';
						}
						document.getElementById('status').className = 'hidden';

						if ('sync' in reg) {
							return reg.sync.register('outbox');
						} else {
							document.getElementById('result').innerHTML += 'Background Sync not supported, fallback to using AJAX request';
							return;
						}
					}).catch(function (err) {
						// something went wrong with the database or the sync registration, log and submit the form
						console.error(err);
						// form.submit();
						document.getElementById('result').innerHTML += 'Service Worker not supported, fallback to using AJAX request';
					});
				});
			})
			.catch (function (err) {
		console.log('Service Worker registration failed: ', err);
	});
} else {
	console.log('SERVICE WORKERS NOT SUPPORTED BY YOUR BROWSER *****');
	document.getElementById('status').className = 'alert critical';
	document.getElementById('errorMessage').innerHTML = 'Service workers not supported by this browser';
	var form = document.querySelector('.js-background-sync');

	form.addEventListener('submit', function (event) {
		event.preventDefault();
		document.getElementById('result').innerHTML += '<p><span style="color: red;">Service Worker not supported, fallback to using xmlHttpRequest or Fetch</span></p>';
	});
}

}) ();


function syncOutbox() {
	// todo..
	console.log('trigger the sync event');
}

function ajaxGetRequest(url, async, callback) {
	var request = new XMLHttpRequest();
	request.open('GET', url, async);
	request.onload = function () {
		if (this.status >= 200 && this.status < 400) {
			callback(this.response, this.status);
		}
		else {
			callback('GET request from ' + url + ' returned an error.', this.status);
		}
	};
	request.onerror = function () {
		callback('Request from ' + url + ' returned an error.', 500);
	};
	request.withCredentials = true;
	request.send();
}

function getData(requestId) {
	ajaxGetRequest('https://jsonplaceholder.typicode.com/comments/' + requestId, true, function (result, statusCode) {
		if (statusCode == 401) {
			document.getElementById('result').innerHTML = '';
			document.getElementById('status').className = 'alert critical';
			document.getElementById('errorMessage').innerHTML = '401 unauthorized';
		}
		else if (statusCode != 500) {
			requestResult = JSON.parse(result);
			document.getElementById('result').innerHTML += '<p>' + result + '</p><br/>';
			document.getElementById('status').className = 'hidden';
		}
		else {
			console.log(result + ', statusCode' + statusCode);
			document.getElementById('status').className = 'alert critical';
			document.getElementById('errorMessage').innerHTML = '500 error, ensure you are online';
		}
	});
}

function clearResults() {
	document.getElementById('result').innerHTML = '';
}
