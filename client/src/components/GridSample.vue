<template>
    <div v-if="rowData.length" style="height: 500px; width: 100%;">
      <ag-grid-vue
      
        class="ag-grid ag-theme-alpine"
        :rowData="rowData"
        :columnDefs="columnDefs"
        :defaultColDef="defaultColDef"
        :animateRows="true"
        @grid-ready="onGridReady"
      />
    </div>
  </template>
  
  <script>
  import { AgGridVue } from 'ag-grid-vue3';
  import axios from 'axios';

  import 'ag-grid-community/styles/ag-grid.css';
  import 'ag-grid-community/styles/ag-theme-alpine.css';


  export default {
    name: 'DataGrid',
    components: {
      AgGridVue, // Register the AG Grid Vue component
    },
    data() {
      return {
        rowData: [
          { name: 'temp', age: 0, status: '0' },
         
        ],
        columnDefs: [
          { field: 'name', width:375, cellClass: 'leftAlign'},
          { field: 'bundle',width:500 },
          { headerName: 'Claimed',width:150, field: 'claimed',
            cellRenderer: params => {
                return `<input type='checkbox' ${params.value ? 'checked' : ''} />`;
            }
          },

        ],
        defaultColDef: {
          sortable: true,
          filter: true,
          resizable: true,
          editable:false,
          
          cellStyle: { textAlign: 'left' }, // Default left alignment for all columns
        }
        
      };
    },
    mounted() {
  console.log(this.rowData); // Check if data is available
},
    methods: {
      async onGridReady(params) {
        console.log('Grid is ready');
        this.gridApi = params.api;
        this.gridColumnApi = params.columnApi;

        const response = await axios.get('http://192.168.1.24:3000/sample');
        
        console.log(response);
        this.rowData=response.data;
        this.gridApi.sizeColumnsToFit();

      },
    },
  };
  </script>
  
  <style>
  .ag-theme-alpine {
    height: 500px;
    width: 100%;
    background-color: lightgray; /* Add this to help visually inspect */

  }
  .ag-cell{
    text-align:left !important;
  }
  </style>
  