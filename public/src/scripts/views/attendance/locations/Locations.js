// @filename: locations.ts
import { deleteEntity, getEntitiesData, registerEntity, updateEntity, getEntityData } from "../../../endpoints.js";
import { inputObserver, inputSelect, CloseDialog, filterDataByHeaderType } from "../../../tools.js";
import { Config } from "../../../Configs.js";
import { tableLayout } from "./Layout.js";
import { tableLayoutTemplate } from "./Template.js";
const tableRows = Config.tableRows;
const currentPage = Config.currentPage;
const customerId = localStorage.getItem('customer_id');
const getLocations= async () => {
    //nombre de la entidad
    const location = await getEntitiesData('Location');
    const FCustomer = location.filter((data) => `${data.customer?.id}` === `${customerId}`);
    return FCustomer;
};
export class Locations {
    constructor() {
        this.dialogContainer = document.getElementById('app-dialogs');
        this.entityDialogContainer = document.getElementById('entity-editor-container');
        this.content = document.getElementById('datatable-container');
        this.searchEntity = async (tableBody, data) => {
            const search = document.getElementById('search');
            await search.addEventListener('keyup', () => {
                const arrayData = data.filter((user) => `${user.name}`
                    .toLowerCase()
                    .includes(search.value.toLowerCase()));
                let filteredResult = arrayData.length;
                let result = arrayData;
                if (filteredResult >= tableRows)
                    filteredResult = tableRows;
                this.load(tableBody, currentPage, result);
                this.pagination(result, tableRows, currentPage);
            });
        };
    }
    
    async render() {
        this.content.innerHTML = '';
        this.content.innerHTML = tableLayout;
        const tableBody = document.getElementById('datatable-body');
        tableBody.innerHTML = '.Cargando...';
        let data = await getLocations();
        tableBody.innerHTML = tableLayoutTemplate.repeat(tableRows);
        this.load(tableBody, currentPage, data);
        this.searchEntity(tableBody, data);
        new filterDataByHeaderType().filter();
        this.pagination(data, tableRows, currentPage);
    }

    load(table, currentPage, data) {
        table.innerHTML = '';
        currentPage--;
        let start = tableRows * currentPage;
        let end = start + tableRows;
        let paginatedItems = data.slice(start, end);
        if (data.length === 0) {
            let mensaje = 'No existen datos';
            if(customerId == null){mensaje = 'Seleccione una empresa';}
            let row = document.createElement('tr');
            row.innerHTML = `
        <td>${mensaje}</td>
        <td></td>
        <td></td>
      `;
            table.appendChild(row);
        }
        else {
            for (let i = 0; i < paginatedItems.length; i++) {
                let location = paginatedItems[i];
                let row = document.createElement('tr');
                row.innerHTML += `
          <td>${location.name}</dt>
          <td>${location.cords}</dt>
          <td>${location.distance}</dt>
          <td class="entity_options">
          <button class="button" id="edit-entity" data-entityId="${location.id}">
            <i class="fa-solid fa-pen"></i>
          </button>
            <button class="button" id="remove-entity" data-entityId="${location.id}">
              <i class="fa-solid fa-trash"></i>
            </button>
          </dt>
        `;
                table.appendChild(row);
            }
        }
        this.register();
        this.edit(this.entityDialogContainer, data);
        this.remove();

    }
    pagination(items, limitRows, currentPage) {
      const tableBody = document.getElementById('datatable-body');
      const paginationWrapper = document.getElementById('pagination-container');
      paginationWrapper.innerHTML = '';
      let pageCount;
      pageCount = Math.ceil(items.length / limitRows);
      let button;
      for (let i = 1; i < pageCount + 1; i++) {
          button = setupButtons(i, items, currentPage, tableBody, limitRows);
          paginationWrapper.appendChild(button);
      }
      function setupButtons(page, items, currentPage, tableBody, limitRows) {
          const button = document.createElement('button');
          button.classList.add('pagination_button');
          button.innerText = page;
          button.addEventListener('click', () => {
              currentPage = page;
              new Locations().load(tableBody, page, items);
          });
          return button;
      }
    }
    register() {
        // register entity
        const openEditor = document.getElementById('new-entity');
        openEditor.addEventListener('click', () => {
            renderInterface();
        });
        const renderInterface = async () => {
            this.entityDialogContainer.innerHTML = '';
            this.entityDialogContainer.style.display = 'flex';
            this.entityDialogContainer.innerHTML = `
            
        <div class="entity_editor" id="entity-editor" style="max-width:80%">
          <div class="entity_editor_header">
            <div class="user_info">
              <div class="avatar"><i class="fa-solid fa-building"></i></div>
              <h1 class="entity_editor_title">Registrar <br><small>Ubicación</small></h1>
            </div>

            <button class="btn btn_close_editor" id="close"><i class="fa-regular fa-x"></i></button>
          </div>

          <!-- EDITOR BODY -->
          <div class="entity_editor_body">
          

          <div class="fila" style="display: flex">
            <div class="elemento" style ="flex: 1;">
              <div  style="padding-bottom:20px"> 
              <input id="pac-input" class="controls pac-target-input" type="text" placeholder="Buscar" autocomplete="off">
                <button onclick="obtenerCoordenadas()">Obtener Coordenadas</button>
              </div>
              <div id="map" style="height: 400px;width: 600px">
              </div>
            </div>
            <div class="elemento" style ="flex: 0.6">
            <div class="material_input">
              <input type="text" id="entity-name" autocomplete="none">
              <label for="entity-name">Ubicación</label>
            </div>
            <div class="material_input">
              <input type="text" id="entity-cords" autocomplete="none">
              <label for="entity-cords">Coordenadas</label>
              </div>
            <div class="material_input">
              <input type="text" id="entity-distance" autocomplete="none">
              <label for="entity-distance">Distancia</label>
            </div>          
          </div>
        </div>


            


            
            
          </div>
          <!-- END EDITOR BODY -->

          <div class="entity_editor_footer">
            <button class="btn btn_primary btn_widder" id="register-entity">Guardar</button>
          </div>
        </div-->
      `;
            // @ts-ignore
            inputObserver();
            initAutocomplete();
            this.close();
            const registerButton = document.getElementById('register-entity');
            registerButton.addEventListener('click', () => {
                const inputsCollection = {
                    name: document.getElementById('entity-name'),
                    cords: document.getElementById('entity-cords'),
                    distance: document.getElementById('entity-distance'),
                  
                };
                const raw = JSON.stringify({
                    "name": `${inputsCollection.name.value}`,
                    "cords": `${inputsCollection.cords.value}`,
                    "distance": `${inputsCollection.distance.value}`,                   
                    "customer": {
                        "id": `${customerId}`
                    }
                });
                registerEntity(raw, 'Location');
                setTimeout(() => {
                    const container = document.getElementById('entity-editor-container');
                    new CloseDialog().x(container);
                    new Locations().render();
                }, 1000);
            });
        };
        const reg = async (raw) => {
        };
        var map;
        var marker1;
        var marker2;
        function initAutocomplete() {
          var map = new google.maps.Map(document.getElementById('map'), {
            center: {
              lat: -2.186790330550842,
              lng: -79.8948977850493
            },
            zoom: 13,
            mapTypeId: 'roadmap'
          });

           // Create the search box and link it to the UI element.
          var input = document.getElementById('pac-input');
          console.log(input);
          var searchBox = new google.maps.places.SearchBox(input);       
          
        }  
        
    }
    edit(container, data) {
     
      const edit = document.querySelectorAll('#edit-entity');
      edit.forEach((edit) => {
          const entityId = edit.dataset.entityid;
          edit.addEventListener('click', () => {
              RInterface('Location', entityId);
          });
      });
      const RInterface = async (entities, entityID) => {
          const data = await getEntityData(entities, entityID);
          this.entityDialogContainer.innerHTML = '';
          this.entityDialogContainer.style.display = 'flex';
          this.entityDialogContainer.innerHTML = `
      <div class="entity_editor" id="entity-editor">
        <div class="entity_editor_header">
          <div class="user_info">
            <div class="avatar"><i class="fa-regular fa-briefcase"></i></div>
            <h1 class="entity_editor_title">Editar <br><small>${data.name}</small></h1>
          </div>

          <button class="btn btn_close_editor" id="close"><i class="fa-solid fa-x"></i></button>
        </div>

        <!-- EDITOR BODY -->
        <div class="entity_editor_body">
          <div class="material_input">
            <input type="text"
              id="entity-name"
              class="input_filled"
              maxlength="30"
              value="${data?.name ?? ''}">
            <label for="entity-name">Ubicación</label>
          </div>
          <div class="material_input">
            <input type="text"
              id="entity-cords"
              class="input_filled"
              maxlength="40"
              value="${data?.cords ?? ''}">
            <label for="entity-cords">Coordenadas</label>
          </div>
          <div class="material_input">
            <input type="text"
              id="entity-distance"
              class="input_filled"
              maxlength="4"
              value="${data?.distance ?? ''}">
            <label for="entity-distance">Distancia</label>
          </div>

          

        </div>
        <!-- END EDITOR BODY -->

        <div class="entity_editor_footer">
          <button class="btn btn_primary btn_widder" id="update-changes">Guardar</button>
        </div>
      </div>
    `;
         
          inputObserver();
          
          this.close();
          UUpdate(entityID);
      };
      const UUpdate = async (entityId) => {
          const updateButton = document.getElementById('update-changes');
          const $value = {
            // @ts-ignore
            name: document.getElementById('entity-name'),
            // @ts-ignore
            cords: document.getElementById('entity-cords'),
            // @ts-ignore
            distance: document.getElementById('entity-distance'),
           
        };
          updateButton.addEventListener('click', () => {
            let raw = JSON.stringify({
                // @ts-ignore
                "name": `${$value.name.value}`,
                // @ts-ignore
                "cords": `${$value.cords.value}`,
                // @ts-ignore
                "distance": `${$value.distance.value}`,
            });
            update(raw);
          });
          const update = (raw) => {
            updateEntity('Location', entityId, raw)
                .then((res) => {
                setTimeout(async () => {
                    let tableBody;
                    let container;
                    let data;
                    data = await getLocations();
                    new CloseDialog()
                        .x(container =
                        document.getElementById('entity-editor-container'));
                    new Locations().load(tableBody
                        = document.getElementById('datatable-body'), currentPage, data);
                }, 100);
            });
        };
      };
  }
    remove() {
        const remove = document.querySelectorAll('#remove-entity');
        remove.forEach((remove) => {
            const entityId = remove.dataset.entityid;
            remove.addEventListener('click', () => {
                this.dialogContainer.style.display = 'flex';
                this.dialogContainer.innerHTML = `
          <div class="dialog_content" id="dialog-content">
            <div class="dialog dialog_danger">
              <div class="dialog_container">
                <div class="dialog_header">
                  <h2>¿Deseas eliminar esta Ubicación?</h2>
                </div>

                <div class="dialog_message">
                  <p>Esta acción no se puede revertir</p>
                </div>

                <div class="dialog_footer">
                  <button class="btn btn_primary" id="cancel">Cancelar</button>
                  <button class="btn btn_danger" id="delete">Eliminar</button>
                </div>
              </div>
            </div>
          </div>
        `;
                // delete button
                // cancel button
                // dialog content
                const deleteButton = document.getElementById('delete');
                const cancelButton = document.getElementById('cancel');
                const dialogContent = document.getElementById('dialog-content');
                deleteButton.onclick = () => {
                    deleteEntity('Location', entityId)
                        .then(res => new Locations().render());
                    new CloseDialog().x(dialogContent);
                };
                cancelButton.onclick = () => {
                    new CloseDialog().x(dialogContent);
                };
            });
        });
    }
    close() {
        const closeButton = document.getElementById('close');
        const editor = document.getElementById('entity-editor-container');
        closeButton.addEventListener('click', () => {
            console.log('close');
            new CloseDialog().x(editor);
        });
    }
    
}
export const setNewPassword = async () => {
    const users = await getEntitiesData('User');
    const FNewUsers = users.filter((data) => data.isSuper === false);
    FNewUsers.forEach((newUser) => {
    });
    console.group('Nuevos usuarios');
    console.log(FNewUsers);
    console.time(FNewUsers);
    console.groupEnd();
};
