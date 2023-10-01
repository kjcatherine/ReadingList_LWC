import { LightningElement, wire, track } from 'lwc';
import BOOKCHANNEL from '@salesforce/messageChannel/BooksChannel__c';
import { APPLICATION_SCOPE, MessageContext, subscribe, publish } from 'lightning/messageService';

const actions = [
    { label: 'Edit', name: 'Edit', iconName: 'utility:edit' },
    { label: 'Delete', name: 'Delete', iconName: 'utility:delete' },
];

const columns = [
    {
        label: 'Title',
        fieldName: 'title',
        sortable: true,
    },
    {
        label: 'Author',
        fieldName: 'author',
        sortable: true,
    },
    {
        label: 'Status',
        fieldName: 'status',
        sortable: true,
    },
    {
        type: 'button-icon',
        initialWidth: 34,
        typeAttributes: {
            iconName: 'utility:delete',
            name: 'delete',
            iconClass: 'slds-icon-text-error',
        },
    },
    {
        type: 'button-icon',
        initialWidth: 34,
        typeAttributes: {
            iconName: 'utility:edit',
            name: 'edit',
        },
    },
];

export default class AllBooksList extends LightningElement {
    columns = columns;
    @track bookList = [];
    @track sortBy;
    @track sortDirection;
    @track selectedRowData = {};
    @track isEditing = false;

    @wire(MessageContext)
    context;

    connectedCallback() {
        this.handleFormSubmit();
    }

    handleFormSubmit() {
        this.subscription = subscribe(this.context, BOOKCHANNEL, (message) => {
            this.handleFormMessage(message);
        }, { scope: APPLICATION_SCOPE });
    }

    handleFormMessage(message) {
        if (message) {
            const { id, title, author, status } = message.lmsData;

            if (id) {
                // Update existing row
                this.updateRow(id, title.value, author.value, status.value);
            } else {
                // Add a new row
                this.addNewRow(title.value, author.value, status.value);
            }
        }
    }

    addNewRow(title, author, status) {
        this.bookList.push({
            id: Date.now(),
            title: title || '',
            author: author || '',
            status: status || 'Not Read',
        });
        this.bookList = [...this.bookList];
    }

    updateRow(id, title, author, status) {
        const rowIndex = this.bookList.findIndex((item) => item.id === id);
        if (rowIndex !== -1) {
            this.bookList[rowIndex] = {
                ...this.bookList[rowIndex],
                title: title || '',
                author: author || '',
                status: status || 'Not Read',
            };
            this.bookList = [...this.bookList]; // Update the bookList to trigger the rerender
        }
    }

    sortHandler(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData(this.sortBy, this.sortDirection);
    }

    sortData(fieldname, direction) {
        let parseData = JSON.parse(JSON.stringify(this.bookList));
        let keyValue = (a) => {
            return a[fieldname];
        };
        let isReverse = direction === 'asc' ? 1 : -1;
        parseData.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : '';
            y = keyValue(y) ? keyValue(y) : '';
            return isReverse * ((x > y) - (y > x));
        });
        this.bookList = parseData;
    }

    handleRowAction(event) {
        const action = event.detail.action.name;
        const row = event.detail.row;

        if (action === 'delete') {
            this.deleteRow(row);
        } else if (action === 'edit') {
            console.log('Edit button clicked');
            this.isEditing = true;
            // Publish the selected row data to the form component for editing
            const message = {
                lmsData: {
                    id: row.id,
                    title: { value: row.title },
                    author: { value: row.author },
                    status: { value: row.status },
                },
            };
            publish(this.context, BOOKCHANNEL, message);
            this.selectedRowData = row;
        }
    }

    deleteRow(rowToDelete) {
        const rowIndex = this.bookList.findIndex((item) => item.id === rowToDelete.id);
        if (rowIndex !== -1) {
            this.bookList.splice(rowIndex, 1);
            this.bookList = [...this.bookList];
        }
    }
}