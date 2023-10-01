import { LightningElement, api, wire } from 'lwc';
import BOOKCHANNEL from '@salesforce/messageChannel/BooksChannel__c';
import { MessageContext, APPLICATION_SCOPE, publish, subscribe } from 'lightning/messageService';

export default class AddBook extends LightningElement {
    @api selectedRowData;
    @api isEditing;
    subscription;

    title = '';
    author = '';
    status = 'Not Read';

    @wire(MessageContext)
    context;

    statusOptions = [
        { label: 'Read', value: 'Read' },
        { label: 'Not Read', value: 'Not Read' }
    ];

    get formTitle() {
        return this.isEditing ? 'Edit Book' : 'Add a Book';
    }

    get saveButtonLabel() {
        return this.isEditing ? 'Update' : 'Add Book';
    }

    handleTitleChange(event) {
        this.title = event.target.value;
    }

    handleAuthorChange(event) {
        this.author = event.target.value;
    }

    handleStatusChange(event) {
        this.status = event.detail.value;
    }

    // handleSubmit() {
    //     const message = {
    //         lmsData: {
    //             id: this.isEditing ? this.selectedRowData.id : Date.now(),
    //             title: { value: this.title },
    //             author: { value: this.author },
    //             status: { value: this.status }
    //         }
    //     };
    //     publish(this.context, BOOKCHANNEL, message);
    //     this.resetFormFields();
    // }

    handleSubmit() {
        console.log('handleSubmit method called');
        if (this.isEditing) {
            this.updateRow();
        } else {
            this.addNewRow();
        }
    }
    
    updateRow() {
        console.log('updateRow method called'); 
        const message = {
            lmsData: {
                id: this.selectedRowData.id,
                title: { value: this.title },
                author: { value: this.author },
                status: { value: this.status }
            }
        };
        publish(this.context, BOOKCHANNEL, message);
        this.resetFormFields();
    }
    
    addNewRow() {
        const message = {
            lmsData: {
                title: { value: this.title },
                author: { value: this.author },
                status: { value: this.status }
            }
        };
        publish(this.context, BOOKCHANNEL, message);
        this.resetFormFields();
    }    

    resetFormFields() {
        this.title = '';
        this.author = '';
        this.status = 'Not Read';
        this.isEditing = false;
    }

    connectedCallback() {
        // Subscribe to  message channel to receive selected row data from table component
        this.subscription = subscribe(this.context, BOOKCHANNEL, (message) => {
            if (message && message.lmsData) {
                this.title = message.lmsData.title.value || '';
                this.author = message.lmsData.author.value || '';
                this.status = message.lmsData.status.value || 'Not Read';
                this.isEditing = message.lmsData.id ? true : false;
            }
        }, { scope: APPLICATION_SCOPE });
    }
}
