import { firebaseConfig, applicationServerKey } from "../firebaseConfig.js";
// @ts-ignore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
// @ts-ignore
import { getMessaging, getToken, isSupported } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";
export class FirebaseCtrl {
    constructor() {
        // @ts-ignore
        this.token = undefined;
        // @ts-ignore
        this.onRecieveNotificationCb = undefined;
        // @ts-ignore
        this.onErrorCb = undefined;
        // @ts-ignore
        this.onGetTokenCb = undefined;
    }
    async initApp() {
        const savedToken = window.localStorage.getItem("libreriasjs-notification-token");
        if (savedToken) {
            // @ts-ignore
            this.enableWebNotifications();
        }
    }
    async enableWebNotifications() {
        const permission = await Notification.requestPermission();
        if(permission==="granted"){
            const supported = await isSupported();
            // @ts-ignore
            if (!supported && typeof this.onErrorCb === "function") {
                // @ts-ignore
                this.onErrorCb("This browser does not support the API's required to use the Firebase SDK");
                return;
            }
            //navigator.serviceWorker.register("./public/src/scripts/services/firebase-messaging-sw.js");
            if ("serviceWorker" in navigator) {
                const serviceWorkerRegistration = await navigator.serviceWorker.register('/netguardTest/firebase-messaging-sw.js', {scope: "/netguardTest/"}).catch((error) => {
                    console.error(`Service worker registration failed: ${error}`);
                });
    
                await navigator.serviceWorker.ready;
    
                const serviceWorkerSuscription = await serviceWorkerRegistration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey,
                }).catch((error) => {
                    console.error(`Service worker suscription failed: ${error}`);
                });
                serviceWorkerSuscription;
                const app = initializeApp(firebaseConfig);
                const messaging = getMessaging(app);
                try {
                    // @ts-ignore
                    this.token = await getToken(messaging, {
                        serviceWorkerRegistration: serviceWorkerRegistration,
                        vapidKey: applicationServerKey,
                    });
                }
                catch (err) {
                    console.log("An error occurred while retrieving token. ", err);
                    // @ts-ignore
                    if (typeof this.onErrorCb === "function") {
                        // @ts-ignore
                        this.onErrorCb(err.message);
                    }
                    return;
                }
                // @ts-ignore
                if (!this.token) {
                    const error = "No registration token available. Request permission to generate one.";
                    console.log(error);
                    // @ts-ignore
                    if (typeof this.onErrorCb === "function") {
                        // @ts-ignore
                        this.onErrorCb(error);
                    }
                    return;
                }
                // @ts-ignore
                //console.log(this.token);
                // @ts-ignore
                if (typeof this.onGetTokenCb === "function") {
                    // @ts-ignore
                    window.localStorage.setItem("libreriasjs-notification-token", this.token);
                    // @ts-ignore
                    this.onGetTokenCb(this.token);
                }
                navigator.serviceWorker.ready.then((serviceWorkerRegistration1) => {
                    const options = {
                        userVisibleOnly: true,
                        applicationServerKey: applicationServerKey,
                    };
                    serviceWorkerRegistration1.pushManager.subscribe(options).then(
                        (pushSubscription) => {
                        //console.log(pushSubscription.endpoint);
                        // The push subscription details needed by the application
                        // server are now available, and can be sent to it using,
                        // for example, the fetch() API.
                        },
                        (error) => {
                        // During development it often helps to log errors to the
                        // console. In a production environment it might make sense to
                        // also report information about errors back to the
                        // application server.
                        console.error(error);
                        },
                    );
                });
                navigator.serviceWorker.addEventListener("message", (event) => {
                    console.log("FROM ON SERVICEWORKER MESSAGE", event);
                    // @ts-ignore
                    if (typeof this.onRecieveNotificationCb === "function") {
                        // @ts-ignore
                        this.onRecieveNotificationCb(event.data);
                    }
                });
            }else{
                console.error("Service workers are not supported.");
            }
        }
    }
    onGetToken(cb) {
        if (typeof cb === "function") {
            // @ts-ignore
            this.onGetTokenCb = cb;
        }
    }
    onRecieveNotification(cb) {
        if (typeof cb === "function") {
            // @ts-ignore
            this.onRecieveNotificationCb = cb;
        }
    }
    onError(cb) {
        if (typeof cb === "function") {
            // @ts-ignore
            this.onErrorCb = (err) => {
                window.localStorage.removeItem("libreriasjs-notification-token");
                cb(err);
            };
        }
    }
}
