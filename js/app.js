var requestResult = '';
(function () {
	// console.log('here2..a');
	// //https://jsonplaceholder.typicode.com/comments/1
	// ajaxGetRequest('https://devserver/auth/1', true, function(result, statusCode) {
	// 	if (!result.startsWith('GET')){
	// 		requestResult = JSON.parse(result);
	// 		document.getElementById('result').innerHTML += '<h2>'+requestResult['id']+'. '+requestResult['name']+'</h2><p>'+requestResult['body']+'</p><br/>';
	// 		document.getElementById('status').className = 'hidden';
	// 	}
	// 	else {
	// 		console.log(result);
	// 		document.getElementById('status').className = 'alert critical';
	// 	}
	// });

	if ('serviceWorker' in navigator) {
		Notification.requestPermission(function (status) {
			console.log('Notification permission status:', status);
		});

		navigator.serviceWorker
			.register('./service-worker.js')
			.then(function (reg) {
				console.log('Registered service worker!');

				// bgsync:
				if ('sync' in reg) {
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

							return reg.sync.register('outbox');
						}).catch(function (err) {
							// something went wrong with the database or the sync registration, log and submit the form
							console.error(err);
							// form.submit();
							document.getElementById('result').innerHTML += 'Service Worker not supported, fallback to using AJAX request';
						});
					});
				}



				// debugger;
				// reg.pushManager.getSubscription().then(function(sub) {
				// 	if (sub === null) {
				// 		// Update UI to ask user to register for Push
				// 		console.log('+++++ Not subscribed to push service!');
				// 	} else {
				// 		// We have a subscription, update the database
				// 		console.log('+++++ Subscription object: ', sub);
				// 	}
				// });
			})
			.catch(function (err) {
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


	// subscribeUser();
	// function subscribeUser() {
	// if ('serviceWorker' in navigator) {
	// 	navigator.serviceWorker.ready.then(function(reg) {

	// 	reg.pushManager.subscribe({
	// 		userVisibleOnly: true
	// 	}).then(function(sub) {
	// 		console.log('Endpoint URL: ', sub.endpoint);
	// 	}).catch(function(e) {
	// 		if (Notification.permission === 'denied') {
	// 		console.warn('Permission for notifications was denied');
	// 		} else {
	// 		console.error('Unable to subscribe to push', e);
	// 		}
	// 	});
	// 	})
	// }
	// }
})();

// // Connection Status
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
// displayNotification();

function syncOutbox() {
	// 	store.outbox('readonly').then(function(outbox) {
	//       return outbox.getAll();
	//     }).then(function(messages) {
	//       // send the messages
	// 		console.log('*** SYNC MESSAGES');
	// 		console.log(JSON.stringify(messages));
	// 		return Promise.all(messages.map(function(message) {
	//         return fetch('https://devserver/api/messagestest', {
	//           method: 'POST',
	//           body: JSON.stringify(message),
	// 					credentials: 'include',
	// 					mode: 'no-cors', // 'cors',
	//           headers: {
	//             'Accept': 'application/json',
	//             'X-Requested-With': 'XMLHttpRequest',
	//             'content-type': 'application/json; charset=utf-8',
	// 						'Access-Control-Allow-Origin': "http://localhost:8084"
	//           }
	//         }).then(function(response) {  
	// //           return response.json();
	// 					return response.text().then(function(text) {
	// 						return text ? JSON.parse(text) : {}
	// 					})
	//         }).then(function(data) {
	//           // if (data.result === 'success') {
	//             return store.outbox('readwrite').then(function(outbox) {
	//               return outbox.delete(message.id);
	//             });
	//           // }
	//         });
	// 		}));
	// 	});
}

function displayNotification() {
	if (Notification.permission == 'granted') {
		console.log('permission granted');
		navigator.serviceWorker.getRegistration().then(function (registration) {
			// registration.showNotification('Hello world!');
			registration.showNotification('Push Notification', {
				body: 'this is a test pushing message...',
				// icon: '../images/touch/chrome-touch-icon-192x192.png',
				vibrate: [200, 100, 200, 100, 200, 100, 200],
				tag: 'vibration-sample'
			});
		});
	} else {
		console.log('permission not accepted');
	}
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


function getNewRequestInternet(requestId) {
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

function getNewRequest(requestId) {
	// https://jsonplaceholder.typicode.com/comments/
	ajaxGetRequest('https://devserver/auth/' + requestId, true, function (result, statusCode) {
		if (statusCode == 401) {
			document.getElementById('result').innerHTML = '';
			document.getElementById('status').className = 'alert critical';
			document.getElementById('errorMessage').innerHTML = '401 unauthorized';
		}
		else if (statusCode != 500) {
			requestResult = JSON.parse(result);
			document.getElementById('result').innerHTML += '<h2>' + requestResult['MRN'] + '. ' + requestResult['MRNAction'] + '</h2><p>' + requestResult['NonAddressableLocation'] + '</p><br/>';
			document.getElementById('status').className = 'hidden';
		}
		else {
			console.log(result + ', statusCode' + statusCode);
			document.getElementById('status').className = 'alert critical';
			document.getElementById('errorMessage').innerHTML = statusCode + ' error: ' + result;
		}
	});
}


function getNewRequestNoAuth(requestId) {
	// https://jsonplaceholder.typicode.com/comments/
	ajaxGetRequest('https://devserver/noauth/' + requestId, true, function (result, statusCode) {
		if (statusCode == 401) {
			document.getElementById('result').innerHTML = '';
			document.getElementById('status').className = 'alert critical';
			document.getElementById('errorMessage').innerHTML = '401 unauthorized';
		}
		else if (statusCode != 500) {
			requestResult = JSON.parse(result);
			document.getElementById('result').innerHTML += '<h2>' + requestResult['MRN'] + '. ' + requestResult['MRNAction'] + '</h2><p>' + requestResult['NonAddressableLocation'] + '</p><br/>';
			document.getElementById('status').className = 'hidden';
		}
		else {
			console.log(result + ', statusCode' + statusCode);
			document.getElementById('status').className = 'alert critical';
			document.getElementById('errorMessage').innerHTML = statusCode + ' error: ' + result;
		}
	});
}


function getRoles() {
	// https://jsonplaceholder.typicode.com/comments/
	ajaxGetRequest('https://devserver/userroles', true, function (result, statusCode) {
		if (statusCode == 401) {
			document.getElementById('result').innerHTML = '';
			document.getElementById('status').className = 'alert critical';
			document.getElementById('errorMessage').innerHTML = '401 unauthorized';
		}
		else if (statusCode != 500) {
			requestResult = JSON.parse(result);
			document.getElementById('result').innerHTML += '<p>' + requestResult + '</p><br/>';
			document.getElementById('status').className = 'hidden';
		}
		else {
			console.log(result + ', statusCode' + statusCode);
			document.getElementById('status').className = 'alert critical';
			document.getElementById('errorMessage').innerHTML = statusCode + ' error: ' + result;
		}
	});
}

function clearResults() {
	document.getElementById('result').innerHTML = '';
}
