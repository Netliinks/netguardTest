//
//  VisitsView.ts
//
//  Generated by Poll Castillo on 09/03/2023.
//
import { Config } from "../../../Configs.js";
import { getEntityData, getFilterEntityData, getFile, getFilterEntityCount } from "../../../endpoints.js";
import { CloseDialog, drawTagsIntoTables, renderRightSidebar, filterDataByHeaderType, verifyUserType, inputObserver, pageNumbers, fillBtnPagination } from "../../../tools.js";
import { UIContentLayout, UIRightSidebar } from "./Layout.js";
import { UITableSkeletonTemplate } from "./Template.js";
import { exportVisitCsv, exportVisitPdf, exportVisitXls } from "../../../exportFiles/visits.js";
// Local configs
const tableRows = Config.tableRows;
let currentPage = Config.currentPage;
const pageName = 'Visitas';
const customerId = localStorage.getItem('customer_id');
let infoPage = {
    count: 0,
    offset: Config.offset,
    currentPage: currentPage,
    search: ""
};
let dataPage;
const GetVisits = async () => {
    //const visitsRaw = await getEntitiesData('Visit');
    //const visits = visitsRaw.filter((data) => data.customer?.id === `${customerId}`);
    let raw = JSON.stringify({
        "filter": {
            "conditions": [
                {
                    "property": "customer.id",
                    "operator": "=",
                    "value": `${customerId}`
                }
            ],
        },
        sort: "-createdDate",
        limit: Config.tableRows,
        offset: infoPage.offset,
        fetchPlan: 'full',
    });
    if (infoPage.search != "") {
        raw = JSON.stringify({
            "filter": {
                "conditions": [
                    {
                        "group": "OR",
                        "conditions": [
                            {
                                "property": "dni",
                                "operator": "contains",
                                "value": `${infoPage.search.toLowerCase()}`
                            },
                            {
                                "property": "firstName",
                                "operator": "contains",
                                "value": `${infoPage.search.toLowerCase()}`
                            },
                            {
                                "property": "firstLastName",
                                "operator": "contains",
                                "value": `${infoPage.search.toLowerCase()}`
                            },
                            {
                                "property": "secondLastName",
                                "operator": "contains",
                                "value": `${infoPage.search.toLowerCase()}`
                            },
                            {
                                "property": "visitState.name",
                                "operator": "contains",
                                "value": `${infoPage.search.toLowerCase()}`
                            }
                        ]
                    },
                    {
                        "property": "customer.id",
                        "operator": "=",
                        "value": `${customerId}`
                    }
                ]
            },
            sort: "-createdDate",
            limit: Config.tableRows,
            offset: infoPage.offset,
            fetchPlan: 'full',
        });
    }
    infoPage.count = await getFilterEntityCount("Visit", raw);
    dataPage = await getFilterEntityData("Visit", raw);
    return dataPage;
};
export class Visits {
    constructor() {
        this.dialogContainer = document.getElementById('app-dialogs');
        this.siebarDialogContainer = document.getElementById('entity-editor-container');
        this.appContainer = document.getElementById('datatable-container');
        this.render = async (offset, actualPage, search) => {
            infoPage.offset = offset;
            infoPage.currentPage = actualPage;
            infoPage.search = search;
            this.appContainer.innerHTML = '';
            this.appContainer.innerHTML = UIContentLayout;
            // Getting interface elements
            const viewTitle = document.getElementById('view-title');
            const tableBody = document.getElementById('datatable-body');
            // Changing interface element content
            viewTitle.innerText = pageName;
            tableBody.innerHTML = '.Cargando...';
            let visitsArray = await GetVisits();
            tableBody.innerHTML = UITableSkeletonTemplate.repeat(tableRows);
            // Exec functions
            this.load(tableBody, currentPage, visitsArray);
            this.searchVisit(tableBody /*, visitsArray*/);
            new filterDataByHeaderType().filter();
            this.pagination(visitsArray, tableRows, infoPage.currentPage);
            this.export();
            // Rendering icons
        };
        this.load = async (tableBody, currentPage, visits) => {
            tableBody.innerHTML = ''; // clean table
            // configuring max table row size
            currentPage--;
            let start = tableRows * currentPage;
            let end = start + tableRows;
            let paginatedItems = visits.slice(start, end);
            // Show message if page is empty
            if (visits.length === 0) {
                let mensaje = 'No existen datos';
                if(customerId == null){mensaje = 'Seleccione una empresa';}
                let row = document.createElement('TR');
                row.innerHTML = `
            <td>${mensaje}<td>
            <td></td>
            <td></td>
            `;
                tableBody.appendChild(row);
            }
            else {
                for (let i = 0; i < paginatedItems.length; i++) {
                    let visit = paginatedItems[i]; // getting visit items
                    let egressMessage = await this.egressShow(visit)
                    let row = document.createElement('TR');
                    row.innerHTML += `
                    <td style="white-space: nowrap">${visit.firstName} ${visit.firstLastName} ${visit.secondLastName}</td>
                    <td>${visit.dni}</td>
                    <td id="table-date">${visit.creationDate}</td>
                    <td id="table-time" style="white-space: nowrap">${visit.creationTime}</td>
                    <td>${egressMessage}</td>
                    <td>${verifyUserType(visit.user.userType)}</td>
                    <td class="tag"><span>${visit.visitState.name}</span></td>

                    <td>
                        <button class="button" id="entity-details" data-entityId="${visit.id}">
                            <i class="table_icon fa-regular fa-magnifying-glass"></i>
                        </button>
                    </td>
                `;
                    tableBody.appendChild(row);
                    drawTagsIntoTables();
                }
                this.previewVisit();
                //this.fixCreatedDate();
            }
        };
        this.searchVisit = async (tableBody /*, visits: any*/) => {
            const search = document.getElementById('search');
            const btnSearch = document.getElementById('btnSearch');
            search.value = infoPage.search;
            await search.addEventListener('keyup', () => {
                /*const arrayVisits = visits.filter((visit) => `${visit.dni}${visit.firstName}${visit.firstLastName}${visit.secondLastName}${visit.creationDate}${visit.visitState.name}${visit.user.userType}${visit.creationTime}`
                    .toLowerCase()
                    .includes(search.value.toLowerCase()));
                let filteredVisit = arrayVisits.length;
                let result = arrayVisits;
                if (filteredVisit >= Config.tableRows)
                    filteredVisit = Config.tableRows;
                this.load(tableBody, currentPage, result);
                this.pagination(result, tableRows, currentPage);*/
            });
            btnSearch.addEventListener('click', async () => {
                new Visits().render(Config.offset, Config.currentPage, search.value.toLowerCase().trim());
            });
        };
        this.egressShow = async (visit) =>{
            if(visit?.customer?.permitNotiVisit == true){
                if ((visit?.notificationDate ?? "" != "") && visit?.visitState?.name == 'Finalizado') {
                    let horaSalida = new Date(`${visit?.egressDate ?? ''}T${visit?.egressTime ?? ''}`);
                    let horaExpira = new Date(`${visit?.notificationDate ?? ''}T${visit?.notificationTime ?? ''}`);
                    if (horaSalida.getTime() > horaExpira.getTime()) {
                        return `${visit?.egressDate ?? ''} ${visit?.egressTime ?? ''} [Atraso]`;
                    }
                    else {
                        return `${visit?.egressDate ?? ''} ${visit?.egressTime ?? ''}`;
                    }
                }else{
                    return `${visit?.egressDate ?? ''} ${visit?.egressTime ?? ''}`;
                }
            }else{
                return `${visit?.egressDate ?? ''} ${visit?.egressTime ?? ''}`;
            }
        }
        this.previewZoom = async (arrayImages) => {
            const openButtons = document.querySelectorAll('#entity-details-zoom');
            openButtons.forEach((openButton) => {
                const entityId = openButton.dataset.entityid;
                openButton.addEventListener('click', () => {
                    renderInterfaceZoom(entityId, arrayImages);
                });
            });
            const renderInterfaceZoom = async (entity, arrayImages) => {
                let description = '';
                for (let i = 0; i < arrayImages.length; i++) {
                    if (arrayImages[i].id == entity) {
                        description = arrayImages[i].description;
                    }
                }
                const picture = document.getElementsByName(`${entity}`);
                const close = document.getElementById("close-modalZoom");
                const modalZoom = document.getElementById('modalZoom');
                const editor = document.getElementById('entity-editor-container');
                editor.style.display = 'none';
                const img01 = document.getElementById('img01');
                const caption = document.getElementById('caption');
                modalZoom.style.display = 'block';
                img01.src = picture[0].currentSrc;
                caption.innerHTML = `${description}`;
                close.addEventListener('click', () => {
                    modalZoom.style.display = 'none';
                    const editor = document.getElementById('entity-editor-container');
                    editor.style.display = 'flex';
                });
            };
        };
        this.pagination = async (items, limitRows, currentPage) => {
            const tableBody = document.getElementById('datatable-body');
            const paginationWrapper = document.getElementById('pagination-container');
            paginationWrapper.innerHTML = '';
            let pageCount;
            pageCount = Math.ceil(infoPage.count / limitRows);
            let button;
            if (pageCount <= Config.maxLimitPage) {
                for (let i = 1; i < pageCount + 1; i++) {
                    button = setupButtons(i /*, items, currentPage, tableBody, limitRows*/);
                    paginationWrapper.appendChild(button);
                }
                fillBtnPagination(currentPage, Config.colorPagination);
            }
            else {
                pagesOptions(items, currentPage);
            }
            function setupButtons(page /*, items, currentPage, tableBody, limitRows*/) {
                const button = document.createElement('button');
                button.classList.add('pagination_button');
                button.setAttribute("name", "pagination-button");
                button.setAttribute("id", "btnPag" + page);
                button.innerText = page;
                button.addEventListener('click', () => {
                    infoPage.offset = Config.tableRows * (page - 1);
                    currentPage = page;
                    new Visits().render(infoPage.offset, currentPage, infoPage.search);
                });
                return button;
            }
            function pagesOptions(items, currentPage) {
                paginationWrapper.innerHTML = '';
                let pages = pageNumbers(pageCount, Config.maxLimitPage, currentPage);
                const prevButton = document.createElement('button');
                prevButton.classList.add('pagination_button');
                prevButton.innerText = "<<";
                paginationWrapper.appendChild(prevButton);
                const nextButton = document.createElement('button');
                nextButton.classList.add('pagination_button');
                nextButton.innerText = ">>";
                for (let i = 0; i < pages.length; i++) {
                    if (pages[i] > 0 && pages[i] <= pageCount) {
                        button = setupButtons(pages[i]);
                        paginationWrapper.appendChild(button);
                    }
                }
                paginationWrapper.appendChild(nextButton);
                fillBtnPagination(currentPage, Config.colorPagination);
                setupButtonsEvents(prevButton, nextButton);
            }
            function setupButtonsEvents(prevButton, nextButton) {
                prevButton.addEventListener('click', () => {
                    new Visits().render(Config.offset, Config.currentPage, infoPage.search);
                });
                nextButton.addEventListener('click', () => {
                    infoPage.offset = Config.tableRows * (pageCount - 1);
                    new Visits().render(infoPage.offset, pageCount, infoPage.search);
                });
            }
        };
        this.previewVisit = async () => {
            const openButtons = document.querySelectorAll('#entity-details');
            openButtons.forEach((openButton) => {
                const entityId = openButton.dataset.entityid;
                openButton.addEventListener('click', () => {
                    renderInterface(entityId);
                });
            });
            const renderInterface = async (entity) => {
                let entityData = await getEntityData('Visit', entity);
                console.log(entityData);
                function calcDates(date1, date2) {
                    date1 = new Date(date1);
                    date2 = new Date(date2);
                
                    var one_second = 1000;
                    var one_minute = 1000 * 60;
                    var one_hour = 1000 * 60 * 60;
                    var one_day = 1000 * 60 * 60 * 24;
                
                    var result = {
                        seconds: (Math.floor((date2 - date1) / one_second)) % 60,
                        minutes: Math.floor((date2 - date1) / one_minute) % 60,
                        hours: Math.floor((date2 - date1) / one_hour) % 24,
                        days: Math.floor((date2 - date1) / one_day)
                    };
                
                    return result;
                }
                renderRightSidebar(UIRightSidebar);
                const controlImages = document.getElementById('galeria');
                const visitName = document.getElementById('visit-name');
                visitName.value = `${entityData.firstName} ${entityData.firstLastName}`;
                const visitReason = document.getElementById('visit-reason');
                visitReason.value = entityData.reason;
                const visitAutorizedBy = document.getElementById('visit-authorizedby');
                visitAutorizedBy.value = entityData.authorizer;
                const visitStatus = document.getElementById('visit-status');
                visitStatus.innerText = entityData.visitState.name;
                const visitCitadel = document.getElementById('visit-citadel');
                visitCitadel.value = entityData.citadel.description;
                const visitCitadelID = document.getElementById('visit-citadelid');
                visitCitadelID.value = entityData.citadel.name;
                const visitDepartment = document.getElementById('visit-department');
                visitDepartment.value = entityData.department.name;
                //console.log(entityData.citadel.name);
                // Start marking
                const ingressDate = document.getElementById('ingress-date');
                ingressDate.value = entityData?.ingressDate ?? '';
                const ingressTime = document.getElementById('ingress-time');
                ingressTime.value = entityData?.ingressTime ?? '';
                const ingressGuardId = document.getElementById('ingress-guard-id');
                ingressGuardId.value = entityData?.ingressIssuedId?.username ?? '';
                const ingressGuardName = document.getElementById('ingress-guard-name');
                ingressGuardName.value = `${entityData?.ingressIssuedId?.firstName ?? ''} ${entityData?.ingressIssuedId?.lastName ?? ''}`;
                // End marking
                const egressDate = document.getElementById('egress-date');
                egressDate.value = entityData?.egressDate ?? '';
                const egressTime = document.getElementById('egress-time');
                egressTime.value = entityData?.egressTime ?? '';
                const egressGuardId = document.getElementById('egress-guard-id');
                egressGuardId.value = entityData?.egressIssuedId?.username ?? '';
                const egressGuardName = document.getElementById('egress-guard-name');
                egressGuardName.value = `${entityData?.egressIssuedId?.firstName ?? ''} ${entityData?.egressIssuedId?.lastName ?? ''}`;
                const checkboxBlackList = document.getElementById('entity-blacklist');
                const moreInfo = document.getElementById('moreInfo');
                if(entityData?.type === "Cliente"){
                    if ((entityData?.notificationDate ?? "" != "") && entityData?.visitState?.name == 'Finalizado') {
                        let horaSalida = new Date(`${entityData?.egressDate ?? ''}T${entityData?.egressTime ?? ''}`);
                        let horaExpira = new Date(`${entityData?.notificationDate ?? ''}T${entityData?.notificationTime ?? ''}`);
                        if (horaSalida.getTime() > horaExpira.getTime()) {
                            const diff = calcDates(horaExpira, horaSalida);
                            moreInfo.innerText = `Atraso ${diff.days} día(s) ${diff.hours} hora(s) ${diff.minutes} minuto(s) ${diff.seconds} segundo(s).`;
                        }
                    }
                }
                if (entityData?.checkBlacklist === true) {
                    checkboxBlackList?.setAttribute('checked', 'true');
                }
                if (entityData?.image !== undefined || entityData?.camera1 !== undefined || entityData?.camera2 !== undefined || entityData?.camera3 !== undefined || entityData?.camera4 !== undefined) {
                    let images = [];
                    if (entityData?.image !== undefined) {
                        let details = {
                            "image": `${await getFile(entityData.image)}`,
                            "description": `Adjunto - ${entityData?.dni ?? ''}`,
                            "icon": "mobile",
                            "id": "image"
                        };
                        images.push(details);
                    }
                    if (entityData?.camera1 !== undefined) {
                        let details = {
                            "image": `${await getFile(entityData.camera1)}`,
                            "description": `Cámara 1 - ${entityData?.dni ?? ''}`,
                            "icon": "camera",
                            "id": "camera1"
                        };
                        images.push(details);
                    }
                    if (entityData?.camera2 !== undefined) {
                        let details = {
                            "image": `${await getFile(entityData.camera2)}`,
                            "description": `Cámara 2 - ${entityData?.dni ?? ''}`,
                            "icon": "camera",
                            "id": "camera2"
                        };
                        images.push(details);
                    }
                    if (entityData?.camera3 !== undefined) {
                        let details = {
                            "image": `${await getFile(entityData.camera3)}`,
                            "description": `Cámara 3 - ${entityData?.dni ?? ''}`,
                            "icon": "camera",
                            "id": "camera3"
                        };
                        images.push(details);
                    }
                    if (entityData?.camera4 !== undefined) {
                        let details = {
                            "image": `${await getFile(entityData.camera4)}`,
                            "description": `Cámara 4 - ${entityData?.dni ?? ''}`,
                            "icon": "camera",
                            "id": "camera4"
                        };
                        images.push(details);
                    }
                    for (let i = 0; i < images.length; i++) {
                        controlImages.innerHTML += `
                            <label><i class="fa-solid fa-${images[i].icon}"></i> ${images[i].description}</label>
                            <img width="100%" class="note_picture margin_b_8" src="${images[i].image}" id="entity-details-zoom" data-entityId="${images[i].id}" name="${images[i].id}">
                        `;
                    }
                    this.previewZoom(images);
                }
                else {
                    controlImages.innerHTML += `
                        <div class="input_detail">
                            <label><i class="fa-solid fa-info-circle"></i> No hay imágenes</label>
                        </div>
                    `;
                }
                this.closeRightSidebar();
                //drawTagsIntoTables();
            };
        };
        this.closeRightSidebar = () => {
            const closeButton = document.getElementById('close');
            const editor = document.getElementById('entity-editor-container');
            closeButton.addEventListener('click', () => {
                new CloseDialog().x(editor);
            });
        };
        /*this.fixCreatedDate = () => {
            const tableDate = document.querySelectorAll('#table-date');
            tableDate.forEach((date) => {
                const separateDateAndTime = date.innerText.split('T');
                date.innerText = separateDateAndTime[0];
            });
        };*/
        this.export = () => {
            const exportNotes = document.getElementById('export-entities');
            exportNotes.addEventListener('click', async() => {
                this.dialogContainer.style.display = 'block';
                this.dialogContainer.innerHTML = `
                    <div class="dialog_content" id="dialog-content">
                        <div class="dialog">
                            <div class="dialog_container padding_8">
                                <div class="dialog_header">
                                    <h2>Seleccionar la fecha</h2>
                                </div>

                                <div class="dialog_message padding_8">
                                    <div class="form_group">
                                        <div class="form_input">
                                            <label class="form_label" for="start-date">Desde:</label>
                                            <input type="date" class="input_date input_date-start" id="start-date" name="start-date">
                                        </div>
                        
                                        <div class="form_input">
                                            <label class="form_label" for="end-date">Hasta:</label>
                                            <input type="date" class="input_date input_date-end" id="end-date" name="end-date">
                                        </div>

                                        <label for="exportCsv">
                                            <input type="radio" id="exportCsv" name="exportOption" value="csv" /> CSV
                                        </label>

                                        <label for="exportXls">
                                            <input type="radio" id="exportXls" name="exportOption" value="xls" checked /> XLS
                                        </label>

                                        <label for="exportPdf">
                                            <input type="radio" id="exportPdf" name="exportOption" value="pdf" /> PDF
                                        </label>
                                    </div>
                                </div>

                                <div class="dialog_footer">
                                    <button class="btn btn_primary" id="cancel">Cancelar</button>
                                    <button class="btn btn_danger" id="export-data">Exportar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                let fecha = new Date(); //Fecha actual
                let mes = fecha.getMonth()+1; //obteniendo mes
                let dia = fecha.getDate(); //obteniendo dia
                let anio = fecha.getFullYear(); //obteniendo año
                if(dia<10)
                    dia='0'+dia; //agrega cero si el menor de 10
                if(mes<10)
                    mes='0'+mes //agrega cero si el menor de 10

                document.getElementById("start-date").value = anio+"-"+mes+"-"+dia;
                document.getElementById("end-date").value = anio+"-"+mes+"-"+dia;
                inputObserver();
                const _closeButton = document.getElementById('cancel');
                const exportButton = document.getElementById('export-data');
                const _dialog = document.getElementById('dialog-content');
                exportButton.addEventListener('click', async() => {
                    const _values = {
                        start: document.getElementById('start-date'),
                        end: document.getElementById('end-date'),
                        exportOption: document.getElementsByName('exportOption')
                    }
                    let rawExport = JSON.stringify({
                        "filter": {
                            "conditions": [
                                {
                                    "property": "customer.id",
                                    "operator": "=",
                                    "value": `${customerId}`
                                },
                                {
                                    "property": "creationDate",
                                    "operator": ">=",
                                    "value": `${_values.start.value}`
                                },
                                {
                                    "property": "creationDate",
                                    "operator": "<=",
                                    "value": `${_values.end.value}`
                                }
                            ],
                        },
                        sort: "-createdDate",
                        fetchPlan: 'full',
                    });
                    const visits = await getFilterEntityData("Visit", rawExport); //await GetVisits();
                    for (let i = 0; i < _values.exportOption.length; i++) {
                        let ele = _values.exportOption[i];
                        if (ele.type = "radio") {
                            if (ele.checked) {
                                if (ele.value == "xls") {
                                    // @ts-ignore
                                    exportVisitXls(visits, _values.start.value, _values.end.value);
                                }
                                else if (ele.value == "csv") {
                                    // @ts-ignore
                                    exportVisitCsv(visits, _values.start.value, _values.end.value);
                                }
                                else if (ele.value == "pdf") {
                                    // @ts-ignore
                                    exportVisitPdf(visits, _values.start.value, _values.end.value);
                                }
                            }
                        }
                    }
                });
                _closeButton.onclick = () => {
                    new CloseDialog().x(_dialog);
                };
            });
        };
    }
}
