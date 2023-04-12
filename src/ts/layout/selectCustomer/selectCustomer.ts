//
//  VisitsView.ts
//
//  Generated by Poll Castillo on 09/03/2023.
//
import { Config } from "../../Configs.js"
import { getEntityData, getEntitiesData, getUserInfo } from "../../endpoints.js"
import { CloseDialog, FixStatusElement, drawTagsIntoTables, fixDate, renderRightSidebar } from "../../tools.js"
import { InterfaceElement, InterfaceElementCollection } from "../../types.js"
import { tableLayout, tableLayoutTemplate } from "./Layout.js"

// Local configs
const tableRows = Config.tableRows
let currentPage = Config.currentPage
const pageName = 'Empresas'
const currentBusiness = async() => {
    const currentUser = await getUserInfo()
    const business = await getEntityData('User', `${currentUser.attributes.id}`)
    return business
  }
const GetCustomers = async (): Promise<void> => {
    const businessData = await currentBusiness()
    const customers = await getEntitiesData('Customer')
    const FCustomer = customers.filter((data: any) => data.business.id === `${businessData.business.id}`)
    return FCustomer
}

export class SelectCustomer {
    private dialogContainer: InterfaceElement = document.getElementById('app-dialogs')
    private siebarDialogContainer: InterfaceElement = document.getElementById('entity-editor-container')
    private appContainer: InterfaceElement = document.getElementById('datatable-container')

    public render = async (): Promise<void> => {
        let customersArray: any = await GetCustomers()
        this.appContainer.innerHTML = ''
        this.appContainer.innerHTML = tableLayout

        // Getting interface elements
        const viewTitle: InterfaceElement = document.getElementById('view-title')
        const tableBody: InterfaceElement = document.getElementById('datatable-body')

        // Changing interface element content
        viewTitle.innerText = pageName
        tableBody.innerHTML = tableLayoutTemplate.repeat(tableRows)

        // Exec functions
        this.load(tableBody, currentPage, customersArray)
        this.searchCustomer(tableBody, customersArray)

        // Rendering icons
    }

    public load = (tableBody: InterfaceElement, currentPage: number, customers: any): void => {
        tableBody.innerHTML = '' // clean table

        // configuring max table row size
        currentPage--
        let start: number = tableRows * currentPage
        let end: number = start + tableRows
        let paginatedItems: any = customers.slice(start, end)

        // Show message if page is empty
        if (customers.length === 0) {
            let row: InterfaceElement = document.createElement('TR')
            row.innerHTML = `
            <td>No existen datos<td>
            <td></td>
            <td></td>
            `

            tableBody.appendChild(row)
        }
        else {
            for (let i = 0; i < paginatedItems.length; i++) {
                let customer = paginatedItems[i] // getting visit items
                let row: InterfaceElement = document.createElement('TR')
                row.innerHTML += `
                    <td style="white-space: nowrap">${customer.name}</td>
                    <td>${customer.ruc}</td>
                    <td class="tag"><span>${customer.state.name}</span></td>
                    <td>${customer.permitMarcation ? 'Si' : 'No'}</td>
                    <td>${customer.permitVehicular ? 'Si' : 'No'}</td>
                    <td>
                        <button class="button" id="entity-details" data-entityId="${customer.id}">
                            <i class="table_icon fa-regular fa-magnifying-glass"></i>
                        </button>
                    </td>
                `
                tableBody.appendChild(row)
                drawTagsIntoTables()
            }
            this.previewVisit()
        }
    }

    private searchCustomer = async (tableBody: InterfaceElement, customers: any) => {
        const search: InterfaceElement = document.getElementById('search')

        await search.addEventListener('keyup', () => {
            const arrayCustomers: any = customers.filter((customer: any) =>
                `${customer.name}${customer.ruc}${customer.ruc}${customer.permitMarcation ? 'Si' : 'No'}${customer.permitVehicular ? 'Si' : 'No'}`
                    .toLowerCase()
                    .includes(search.value.toLowerCase())
            )

            let filteredCustomer = arrayCustomers.length
            let result = arrayCustomers

            if (filteredCustomer >= Config.tableRows) filteredCustomer = Config.tableRows

            this.load(tableBody, currentPage, result)
        })
    }

    private previewVisit = async (): Promise<void> => {
        const openButtons: InterfaceElement = document.querySelectorAll('#entity-details')
        openButtons.forEach((openButton: InterfaceElement) => {
            const entityId: string = openButton.dataset.entityid
            openButton.addEventListener('click', (): void => {
                
            })
        })

    }
}