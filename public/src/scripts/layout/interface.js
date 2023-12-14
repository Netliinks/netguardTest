//
//  interface.ts
//
//  Generated by Poll Castillo on 15/02/2023.
//
import { getEntityData, getUserInfo } from "../endpoints.js";
import { SelectCustomer } from "./selectCustomer/selectCustomer.js";
import { Dashboard } from "../views/dashboard/dashboard.js";
import { SignIn } from "../login.js";
import { Sidebar } from "./sidebar.js";
import { ChangePassword } from "./changePassword/changePassword.js";
import { CloseDialog } from "../tools.js";
import { FirebaseCtrl } from "../services/FirebaseCtrl";
export class RenderApplicationUI {
    constructor() {
        this.loginContainer = document.getElementById('login-container');
        this.APP = document.getElementById('app');
        this.sidebarContainer = document.getElementById('app-sidebar');
        this.topbar = document.getElementById('app-topbar');
    }
    render() {
      this.loginContainer.style.display = 'none';
      this.APP.style.display = 'grid';
      this.sidebarContainer.style.display = 'inline-flex';
      this.topbar.style.display = 'flex';
      this.renderTopbar();
      new Sidebar().render();
      new Dashboard().render();
      //new SelectCustomer().render();
  }
  async renderTopbar() {
    const customerId = localStorage.getItem('customer_id')
    const currentUser = await getUserInfo();
    const user = await getEntityData('User', currentUser.attributes.id);
    let customer = await getEntityData('Customer', customerId);
    let topbar = this.topbar.innerHTML = `
        <div class="user">
            <span class="welcome">Bienvenido</span>
            <div id="token-container"></div>
            <span class="separator"></span>
            <div class="userAvatar">
                <i class="fa-solid fa-user"></i>
            </div>
            <div class="nameAndCustomer">
                <p id="current-username" class="name">
                ${user.firstName} ${user.lastName}
                </p>
                <p id="current-user-customer" class="customer">${user.username}</p>
                <p >${customer.name ? customer.name : 'Seleccione una empresa'}</p>
                <div class="content"></div>
            </div>
           <div class="settings_button">
             <button id="settings-button">
               <i class="fa-solid fa-gear"></i>
             </button>
           </div>
           <div class="user_settings" id="user-settings">
             <button class="btn btn_transparent btn_widder" id="change-customer">Cambiar Empresa</button>
             <!--<button class="btn btn_transparent btn_widder">Preferencias</button>-->
             <div class="request-permission-container">
                    <button class="request-permission-btn">
                        <span class="loader hidden"></span>
                        <span class="label-btn">🔔Activar notificaciones</span>
                    </button>
                </div>
                 <div id="token-container"></div>
             <button class="btn btn_transparent btn_widder" id="change-password">Cambiar Contraseña</button>
             <br>
             <button class="btn btn_primary btn_widder" id="logout-button">Cerrar sesión</button>
           </div>
         </div>
    `;
    this.topbar.innerHTML = topbar;
    const options = document.getElementById('settings-button');
    options.addEventListener('click', () => {
        const settingOptions = document.getElementById('user-settings');
        const activeNotification = document.getElementById('activate-notification');
        const changePassword = document.getElementById('change-password');
        const changeCustomer = document.getElementById('change-customer');
        const logoutButton = document.getElementById('logout-button');
        settingOptions.classList.toggle("user_settings_visible");
        const fireBaseCtrl = new FirebaseCtrl();
            const cardsContainer = document.querySelector(".content");
            const tokenContainer = document.querySelector("#token-container");
            const requestPermissionContainer = document.querySelector(".request-permission-container");
            fireBaseCtrl.initApp();
            fireBaseCtrl.onError((errorMessage) => {
                requestPermissionContainer.classList.remove("hidden");
                tokenContainer.classList.remove("ready");
                tokenContainer.classList.add("active", "error");
                tokenContainer.innerHTML = errorMessage;
            });
            fireBaseCtrl.onGetToken((token) => {
                requestPermissionContainer.classList.add("hidden");
                tokenContainer.classList.remove("error");
                tokenContainer.classList.add("active", "ready");
                tokenContainer.innerHTML = token;
            });
            const createCard = (notificationData) => {
                const dataCard = {
                    title: "Título",
                    snap: "https://picsum.photos/1000/350",
                    subtitle: "Subtítulo",
                    excerpt: "Lorem ipsum dolor sit amet",
                    ...notificationData,
                };
                const a = document.createElement("a");
                a.classList.add("blog-post", "appear");
                a.setAttribute("href", "#");
                a.innerHTML = `
                <img src="${dataCard.snap}" alt="" />
                <div class="post-content">
                  <div class="title-wrapper">
                    <h2>${dataCard.title}</h2>
                    <h3>${dataCard.subtitle}</h3>
                  </div>
                  <p class="content-excerpt">
                    ${dataCard.excerpt}
                  </p>
                </div>`;
                return a;
            };
            fireBaseCtrl.onRecieveNotification((notificationData) => {
                const element = createCard(notificationData.data);
                cardsContainer.prepend(element);
                window.setTimeout(() => {
                    element.classList.remove("appear");
                }, 500);
            });
            requestPermissionContainer
                .querySelector(".request-permission-btn")
                .addEventListener("click", async (event) => {
                const loader = requestPermissionContainer.querySelector(".loader");
                const label = requestPermissionContainer.querySelector(".label-btn");
                label.classList.add("hidden");
                loader.classList.remove("hidden");
                try {
                    const permission = await Notification.requestPermission();
                    if (permission !== "granted") {
                        console.log("No se ha aceptado el registro de notificaciones");
                        return;
                    }
                    await fireBaseCtrl.enableWebNotifications();
                }
                catch (err) {
                    console.log("Hubo un error", err);
                }
                finally {
                    label.classList.remove("hidden");
                    loader.classList.add("hidden");
                }
            });
        changePassword.addEventListener("click", () => {
            new ChangePassword().render();
            //new CloseDialog().x(settingOptions);
        });
        activeNotification.addEventListener("click", () => {
        });
        changeCustomer.addEventListener("click", () => {
            new SelectCustomer().render(0, 1, '');
            //new CloseDialog().x(settingOptions);
        });
        logoutButton.addEventListener("click", () => {
            new SignIn().signOut();
        });
    });
}
}
const renderSetting = () => {
    const options = document.getElementById('settings-button');
    options.addEventListener('click', () => {
        const settingOptions = document.querySelector("#user-settings");
        const logoutButton = settingOptions.querySelector("#logout");
        settingOptions.classList.toggle("user_settings_visible");
        logoutButton.addEventListener("click", () => {
            new SignIn().signOut();
        });
    });
};
//new Dashboard().render();
