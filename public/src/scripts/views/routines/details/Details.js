//
//  NotesView.ts
//
//  Generated by Poll Castillo on 09/03/2023.
//
import { Config } from "../../../Configs.js";
import { getEntityData, getFile, getFilterEntityData, getFilterEntityCount } from "../../../endpoints.js";
import { CloseDialog, renderRightSidebar, filterDataByHeaderType, inputObserver, pageNumbers, fillBtnPagination } from "../../../tools.js";
import { UIContentLayout, UIRightSidebar } from "./Layout.js";
import { UITableSkeletonTemplate } from "./Template.js";
import { exportReportCsv, exportReportPdf, exportReportXls } from "../../../exportFiles/reports.js";
// Local configs
const tableRows = Config.tableRows;
let currentPage = Config.currentPage;
const pageName = 'Registros de Rutinas';
const customerId = localStorage.getItem('customer_id');
let infoPage = {
    count: 0,
    offset: Config.offset,
    currentPage: currentPage,
    search: ""
};
let dataPage;
const GetRoutinesDetails = async () => {
    //const notesRaw = await getEntitiesData('RoutineRegister');
    //const notes = notesRaw.filter((data) => data.customer?.id === `${customerId}`);
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
                                "property": "user.username",
                                "operator": "contains",
                                "value": `${infoPage.search.toLowerCase()}`
                            },
                            {
                                "property": "routine.name",
                                "operator": "contains",
                                "value": `${infoPage.search.toLowerCase()}`
                            },
                            ,
                            {
                                "property": "routineSchedule.name",
                                "operator": "contains",
                                "value": `${infoPage.search.toLowerCase()}`
                            },
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
    infoPage.count = await getFilterEntityCount("RoutineRegister", raw);
    dataPage = await getFilterEntityData("RoutineRegister", raw);
    return dataPage;
};
export class RoutineRegisters {
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
            let notesArray = await GetRoutinesDetails();
            tableBody.innerHTML = UITableSkeletonTemplate.repeat(tableRows);
            // Exec functions
            this.load(tableBody, currentPage, notesArray);
            this.searchNotes(tableBody /*, notesArray*/);
            new filterDataByHeaderType().filter();
            this.pagination(notesArray, tableRows, infoPage.currentPage);
            //this.export();
            // Rendering icons
        };
        this.load = (tableBody, currentPage, notes) => {
            tableBody.innerHTML = ''; // clean table
            // configuring max table row size
            currentPage--;
            let start = tableRows * currentPage;
            let end = start + tableRows;
            let paginatedItems = notes.slice(start, end);
            // Show message if page is empty
            if (notes.length === 0) {
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
                    let register = paginatedItems[i]; // getting note items
                    let row = document.createElement('TR');
                    row.innerHTML += `
                    <td>${register?.routine?.name ?? ''}</td>
                    <td>${register?.routineSchedule?.name ?? ''}</td>
                    <td>${register?.user?.username ?? ''}</td>
                    <td>${register?.cords ?? ''}</td>
                    <td id="table-date">${register?.creationDate ?? ''} ${register?.creationTime ?? ''}</td>
                    <td>
                        <button class="button" id="entity-details" data-entityId="${register.id}">
                            <i class="fa-solid fa-magnifying-glass"></i>
                        </button>
                    </td>
                `;
                    tableBody.appendChild(row);
                    //this.previewNote(note.id);
                    
                    // TODO: Corret this fixer
                    // fixDate()
                }
            }
            this.previewNote();
        };
        this.searchNotes = async (tableBody /*, notes: any*/) => {
            const search = document.getElementById('search');
            const btnSearch = document.getElementById('btnSearch');
            search.value = infoPage.search;
            await search.addEventListener('keyup', () => {
                /*const arrayNotes = notes.filter((note) => `${note.title}
                ${note.content}
                ${note.creationDate}`
                    .toLowerCase()
                    .includes(search.value.toLowerCase()));
                let filteredNotes = arrayNotes.length;
                let result = arrayNotes;
                if (filteredNotes >= Config.tableRows)
                    filteredNotes = Config.tableRows;
                this.load(tableBody, currentPage, result);
                this.pagination(result, tableRows, currentPage);
                // Rendering icons*/
            });
            btnSearch.addEventListener('click', async () => {
                new RoutineRegisters().render(Config.offset, Config.currentPage, search.value.toLowerCase().trim());
            });
        };
        this.previewNote = async () => {
            const openPreview = document.querySelectorAll('#entity-details');
            openPreview.forEach((preview) => {
                let currentNoteId = preview.dataset.entityid;
                preview.addEventListener('click', () => {
                    previewBox(currentNoteId);
                });
            });
            const previewBox = async (noteId) => {
                const note = await getEntityData('RoutineRegister', noteId);
                renderRightSidebar(UIRightSidebar);
                const sidebarContainer = document.getElementById('entity-editor-container');
                const closeSidebar = document.getElementById('close');
                closeSidebar.addEventListener('click', () => {
                    new CloseDialog().x(sidebarContainer);
                });
                // RoutineRegister details
                const _details = {
                    picture: document.getElementById('note-picture-placeholder'),
                    title: document.getElementById('note-title'),
                    content: document.getElementById('note-content'),
                    author: document.getElementById('note-author'),
                    authorId: document.getElementById('note-author-id'),
                    date: document.getElementById('creation-date'),
                    time: document.getElementById('creation-time')
                };
                //const image = await getFile(note.attachment);
                const noteCreationDateAndTime = note.creationDate.split('T');
                const noteCreationTime = noteCreationDateAndTime[1];
                const noteCreationDate = noteCreationDateAndTime[0];
                _details.title.innerText = note.title;
                _details.content.innerText = note.content;
                _details.author.value = `${note.user.firstName} ${note.user.lastName}`;
                _details.authorId.value = note.createdBy;
                _details.date.value = noteCreationDate;
                _details.time.value = noteCreationTime;
                if (note.attachment !== undefined) {
                    const image = await getFile(note.attachment);
                    _details.picture.innerHTML = `
                    <img id="note-picture" width="100%" class="note_picture margin_b_8" src="${image}">
                `;
                this.zoom(note);
                }
            };
        };
        this.closeRightSidebar = () => {
            const closeButton = document.getElementById('close');
            const editor = document.getElementById('entity-editor-container');
            closeButton.addEventListener('click', () => {
                new CloseDialog().x(editor);
            });
        };
        this.zoom = (note) => {
            const picture = document.getElementById('note-picture');
            const close = document.getElementById("close-modalZoom");
            const modalZoom = document.getElementById('modalZoom');
            picture.addEventListener('click', () => {
                //this.dialogContainer.style.display = 'block'
                //this.dialogContainer.innerHTML = modalZoomImage
                const editor = document.getElementById('entity-editor-container');
                editor.style.display = 'none';
                const img01 = document.getElementById('img01');
                const caption = document.getElementById('caption');
                modalZoom.style.display = 'block';
                img01.src = picture.src;
                caption.innerHTML = `${note?.title ?? ''}`;
            });
            close.addEventListener('click', () => {
                modalZoom.style.display = 'none';
                const editor = document.getElementById('entity-editor-container');
                editor.style.display = 'flex';
            });
        };
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
                        //console.log(_values.start.value)
                        //console.log(_values.end.value)
                        //const headers = ['Título', 'Contenido', 'Autor', 'Fecha', 'Hora']
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
                                        "value": `${_values.start.value}T00:00:00`
                                    },
                                    {
                                        "property": "creationDate",
                                        "operator": "<=",
                                        "value": `${_values.end.value}T23:59:59`
                                    }
                                ],
                            },
                            sort: "-createdDate",
                            fetchPlan: 'full',
                        });
                        const notes = await getFilterEntityData("RoutineRegister", rawExport); //await GetNotes();
                        for (let i = 0; i < _values.exportOption.length; i++) {
                            let ele = _values.exportOption[i];
                            if (ele.type = "radio") {
                                if (ele.checked) {
                                    if (ele.value == "xls") {
                                        // @ts-ignore
                                        exportReportXls(notes, _values.start.value, _values.end.value);
                                    }
                                    else if (ele.value == "csv") {
                                        // @ts-ignore
                                        exportReportCsv(notes, _values.start.value, _values.end.value);
                                    }
                                    else if (ele.value == "pdf") {
                                        let rows = [];
                                        for (let i = 0; i < notes.length; i++) {
                                            let note = notes[i];
                                            let noteCreationDateAndTime = note.creationDate.split('T');
                                            let noteCreationDate = noteCreationDateAndTime[0];
                                            let noteCreationTime = noteCreationDateAndTime[1];
                                            // @ts-ignore
                                            //if (noteCreationDate >= _values.start.value && noteCreationDate <= _values.end.value) {
                                                let image = '';
                                                if (note.attachment !== undefined) {
                                                    image = await getFile(note.attachment);
                                                }
                                                let obj = {
                                                    "titulo": `${note.title.split("\n").join(". ").replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2580-\u27BF]|\uD83E[\uDD10-\uDDFF]/g, '').trim()}`,
                                                    "fecha": `${noteCreationDate}`,
                                                    "hora": `${noteCreationTime}`,
                                                    "usuario": `${note.user?.firstName ?? ''} ${note.user?.lastName ?? ''}`,
                                                    "contenido": `${note.content.split("\n").join(". ").replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2580-\u27BF]|\uD83E[\uDD10-\uDDFF]/g, '').trim()}`,
                                                    "imagen": `${image}`
                                                };
                                                rows.push(obj);
                                            //}
                                        }
                                        // @ts-ignore
                                        exportReportPdf(rows, _values.start.value, _values.end.value);
                                    }
                                }
                            }
                        }
                    });
                    _closeButton.onclick = () => {
                        new CloseDialog().x(_dialog);
                    };
                    /*const getFilteredNote = async(_values) =>{
                        const notes = await getEntitiesData('RoutineRegister');
                        const FCustomer = notes.filter(async (data) => {
                            let userCustomer = await getEntityData('User', `${data.user.id}`);
                            userCustomer.customer.id === `${currentUserInfo.customer.id}`
                        });
                        //console.log(`_values.start.value ${_values.start.value}`)
                            const Fdesde = FCustomer.filter((data) => {
                            let noteCreationDateAndTime = data.creationDate.split('T');
                            let noteCreationDate = noteCreationDateAndTime[0];
                            //console.log(`noteCreationDate ${noteCreationDate}`)
                            noteCreationDate >= _values.start.value
                        });/*
                        console.log(`Fdesde ${Fdesde}`)
                        const Fhasta = Fdesde.filter((data) => {
                            let noteCreationDateAndTime = data.creationDate.split('T');
                            let noteCreationDate = noteCreationDateAndTime[0];
                            noteCreationDate <= `${_values.end.value}`
                        });
                        //console.log(Fdesde)
                        return FCustomer;
                    }*/
                        
                    
                });
        };
        this.close = () => {
            const closeButton = document.getElementById('close');
            const editor = document.getElementById('entity-editor-container');
            closeButton.addEventListener('click', () => {
                new CloseDialog().x(editor);
            }, false);
        }
    }
    pagination(items, limitRows, currentPage) {
        const tableBody = document.getElementById('datatable-body');
        const paginationWrapper = document.getElementById('pagination-container');
        paginationWrapper.innerHTML = '';
        let pageCount;
        pageCount = Math.ceil(infoPage.count / limitRows); //items.length
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
                new RoutineRegisters().render(infoPage.offset, currentPage, infoPage.search); //new RoutineRegisters().load(tableBody, page, items)
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
                new RoutineRegisters().render(Config.offset, Config.currentPage, infoPage.search);
            });
            nextButton.addEventListener('click', () => {
                infoPage.offset = Config.tableRows * (pageCount - 1);
                new RoutineRegisters().render(infoPage.offset, pageCount, infoPage.search);
            });
        }
    };
    
}
