//"use strict";
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");
// @ts-ignore
const firebaseApp = firebase.initializeApp({
    apiKey: "AIzaSyDd6Uaqe2FaUc8W5JiVyWKy1StTfWK6I_4",
    authDomain: "netguards-1c84b.firebaseapp.com",
    projectId: "netguards-1c84b",
    storageBucket: "netguards-1c84b.appspot.com",
    messagingSenderId: "289160473467",
    appId: "1:289160473467:web:2f208e0c101be51100abde",
    measurementId: "G-N34ECMV5Z2"
});
const originalUrl = "https://netliinks.github.io/netguardTest/";
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    // fcp_options.link field from the FCM backend service goes there, but as the host differ, it not handled by Firebase JS Client sdk, so custom handling
    if (event.notification && event.notification.data && event.notification.data.FCM_MSG && event.notification.data.FCM_MSG.notification) {
        const url = event.notification.data.FCM_MSG.notification.click_action;
        //console.log(url)
        event.waitUntil(
            self.clients.matchAll({type: 'window'}).then( windowClients => {
                return originalUrl; //.focus();
            })
        )
    }
}, false);
// @ts-ignore
const messaging = firebase.messaging();
