importScripts('./js/idb.js');
importScripts('./js/store.js');

var cacheName = 'dbcoderainPWADemo-v5';
var filesToCache = [
	'./',
	'./index.html',
	'./js/app.js',
	'./icons/pwa-256x256.png',
	'./css/mini-default.min.css'
];

self.addEventListener('install', function (e) {
	console.log('[demoPWA - ServiceWorker] Install event fired.');
	e.waitUntil(
		// pre-cache application shell files
		caches.open(cacheName).then(function (cache) {
			console.log('[demoPWA - ServiceWorker] Caching app shell...');
			return cache.addAll(filesToCache).then(function () {
				self.skipWaiting();
			});
		})
	);
});

self.addEventListener('activate', function (e) {
	console.log('[demoPWA - ServiceWorker] Activate event fired.');
	e.waitUntil(
		caches.keys().then(function (keyList) {
			return Promise.all(keyList.map(function (key) {
				if (key !== cacheName) {
					console.log('[demoPWA - ServiceWorker] Removing old cache...', key);
					return caches.delete(key);
				}
			}));
		})
	);
	return self.clients.claim();
});

self.addEventListener('fetch', function (e) {
	console.log('[demoPWA - ServiceWorker] Fetch event fired.', e.request.url);
	e.respondWith(
		caches.open(cacheName).then(function (cache) {
			return cache.match(e.request).then(function (response) {
				if (response) {
					console.log('[demoPWA - ServiceWorker] Retrieving from cache...');
					return response;
				}
				console.log('[demoPWA - ServiceWorker] Retrieving from URL...');
				return fetch(e.request).then(function (networkResponse) {
					if (e.request.method != 'POST') {
						// Cannot cache POST methods...
						cache.put(e.request, networkResponse.clone());
					}
					return networkResponse;
				});
			});
		}).catch(function (error) {
			console.log('[demoPWA - ServiceWorker] Fetch request failed!');
		})
	);
});

self.addEventListener('push', function (e) {

	if (!(self.Notification && self.Notification.permission === 'granted')) {
		return;
	}

	var data = {};
	if (e.data) {
		try {
			data = e.data.json();
		}
		catch (err) {
			data = e.data.text();
		}

	}
	var title = data.title || data || "Something Has Happened";
	var message = data.message || data || "Here's something you might want to check out.";
	var icon = "images/new-notification.png";


	var options = {
		body: 'This notification was generated from a push!',
		// icon: 'images/example.png',
		vibrate: [100, 50, 100],
		data: {
			dateOfArrival: Date.now(),
			primaryKey: '2'
		},
		actions: [
			{ action: 'explore', title: 'Explore this new world' },
			{ action: 'close', title: 'Close' },
		]
	};
	e.waitUntil(
		self.registration.showNotification(title, options)
	);

	// var notification = new self.Notification(title, {
	//   body: message,
	//   tag: 'simple-push-demo-notification'
	//   //icon: icon
	// });

	// notification.addEventListener('click', function() {
	//   if (clients.openWindow) {
	//     clients.openWindow('https://example.blog.com/2015/03/04/something-new.html');
	//   }
	// });


});

self.addEventListener('sync', function (event) {
	console.log('**************sync***************')
	console.log('TAG: ' + event.tag);
	event.waitUntil(
		store.outbox('readonly').then(function (outbox) {
			return outbox.getAll();
		}).then(function (messages) {
			// send the messages
			console.log('*** SYNC MESSAGES');
			console.log(JSON.stringify(messages));
			return Promise.all(messages.map(function (message) {
				return fetch('https://dbcoderainendpoint.herokuapp.com/notes', {
					method: 'POST',
					body: JSON.stringify(message),
					// credentials: 'include',
					mode: 'cors',
					headers: {
						'Accept': 'application/json',
						'X-Requested-With': 'XMLHttpRequest',
						'Content-Type': 'application/json',
					}
				}).then(function (response) {
					return response.json().then(function (text) {
						return text
					})
				}).then(function (data) {
					if (data && data.success) {
						return store.outbox('readwrite').then(function (outbox) {
							return outbox.delete(message.id);
						});
					}
				});
			}))
		}).catch(function (err) {
			console.log(err);
		})
	);
});

