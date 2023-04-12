//
//  login.ts
//
//  Generated by Poll Castillo on 15/02/2023.
//
import { getUserInfo, _userAgent } from "./endpoints.js";
//import { RenderApplicationUI } from "./layout/interface.js";
import { SelectCustomer } from "./layout/selectCustomer/selectCustomer.js";
const loginContainer = document.getElementById('login-container');
const app = document.getElementById('app');
const connectionHeader = {
    Accept: "application/json",
    "User-agent": _userAgent,
    Authorization: "Basic YzNjMDM1MzQ2MjoyZmM5ZjFiZTVkN2IwZDE4ZjI1YmU2NDJiM2FmMWU1Yg==",
    "Content-Type": "application/x-www-form-urlencoded",
    Cookie: "JSESSIONID=CDD208A868EAABD1F523BB6F3C8946AF",
};
const platformSystem = 'guards';
const reqOP = {
    url: 'https://backend.netliinks.com:443/oauth/token',
    method: 'POST'
};
export class SignIn {
    async checkSignIn() {
        const accessToken = localStorage.getItem('access_token');
        const checkUser = async () => {
            let currentUser = await getUserInfo();
            if (currentUser.error === 'invalid_token') {
                this.signOut();
            }
            console.log(currentUser);
            if (currentUser.attributes.isSuper === true && currentUser.attributes.userType === 'GUARD') {
                //new RenderApplicationUI().render();
                new SelectCustomer.render()
            }
            else {
                this.signOut();
            }
        };
        if (accessToken) {
            checkUser();
        }
        else{
            this.showLogin();
            console.info('You need login');
        }
    }
    showLogin() {
        loginContainer.style.display = 'flex !important';
        loginContainer.innerHTML = `
        <div class="login_window">
        <div class="login_header">
          <img src="./public/src/assets/pictures/app_logo.png">
          <h1 class="login_title">Iniciar Sesión</h1>
          <p>Inicie sesión con los datos proporcionados por el proveedor.</p>
        </div>
        <div class="login_content">
          <form id="login-form">
            <div class="input">
              <label for="username">
                <i class="fa-regular fa-user"></i>
              </label>
              <input type="text" id="username"
                placeholder="johndoe@mail.com">
            </div>

            <div class="input">
              <label for="password">
                <i class="fa-regular fa-key"></i>
              </label>
              <input type="password" id="password"
                placeholder="••••••••••••">
            </div>
            <button class="btn btn_primary" id="login">Iniciar Sesión</button>
          </form>
        </div>

        <div class="login_footer">
          <div class="login_icons">
            <i class="fa-regular fa-house"></i>
            <i class="fa-regular fa-user"></i>
            <i class="fa-regular fa-inbox"></i>
            <i class="fa-regular fa-file"></i>
            <i class="fa-regular fa-computer"></i>
            <i class="fa-regular fa-mobile"></i>
          </div>
          <p>Accede a todas nuestras herramientas</p>

          <div class="foot_brief">
            <p>Desarrollado por</p>
            <img src="./public/src/assets/pictures/login_logo.png">
          </div>
        </div>
      </div>
        `;
        this.signIn();
    }
    signIn() {
        const form = document.querySelector('#login-form');
        const password = form.querySelector('#password');
        const userName = form.querySelector('#username');
        const trigger = form.querySelector('#login');
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            if (userName.value.trim() == '') {
                console.error('El campo nombre de usuario no puede estar vacío.');
            }
            else if (password.value.trim() == '') {
                console.log('El campo contraseña no puede estar vacío');
            }
            else {
                connect(userName.value, password.value);
            }
        });
        async function connect(user, password) {
            const reqOptions = {
                method: reqOP.method,
                body: `grant_type=password&username=${user}&password=${password}`,
                headers: connectionHeader
            };
            fetch(reqOP.url, reqOptions)
                .then((res) => res.json())
                .then((res) => {
                if (res.error == 'Bad credentials') {
                    console.error('error en las credenciales');
                }
                else {
                    const connectionData = {
                        token: res.access_token,
                        expiresIn: res.expires_in,
                        refreshToken: res.refresh_token,
                        scope: res.scope,
                        tokenType: res.token_type
                    };
                    localStorage.setItem('access_token', connectionData.token);
                    window.location.reload();
                }
            });
        }
    }
    signOut() {
        localStorage.removeItem('access_token');
        this.checkSignIn();
        window.location.reload();
    }
}
