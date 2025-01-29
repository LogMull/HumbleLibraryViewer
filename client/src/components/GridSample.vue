<template>
  <div class="dropdown">
    <button
      class="btn btn-secondary dropdown-toggle"
      type="button"
      id="dropdownMenuButton1"
      data-bs-toggle="dropdown"
      aria-expanded="false"
    >
      Check Bootstrap
    </button>
    <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton1">
      <li><a class="dropdown-item" href="#">Action</a></li>
      <li><a class="dropdown-item" href="#">Another action</a></li>
      <li><a class="dropdown-item" href="#">Something else here</a></li>
    </ul>
  </div>
    <div v-if="rowData.length" style="height: 500px; width: 100%;">
      <div class="w-50 mb-3"> 
        <span class="label label-secondary">Filter by Tag</span>
      <multiselect
        id="tagging"
        v-model="filterSelection"
        tag-placeholder="Filter by Steam Tags" 
        placeholder="Search for tag" 
        label="name"
        @update:model-value="filterChange"
        track-by="code" :options="filterOptions" :multiple="true" :taggable="true" ></multiselect>
      </div>
      <ag-grid-vue
        class="ag-grid ag-theme-alpine"
        :rowData="rowData"
        :isExternalFilterPresent="isExternalFilterPresent"
        :columnDefs="columnDefs"
        :defaultColDef="defaultColDef"
        :animateRows="true"
        @grid-ready="onGridReady"
        :doesExternalFilterPass="doesExternalFilterPass"
        :theme="gridTheme"
      />
    </div>
  </template>
  <style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
  <script>
  import { AgGridVue } from 'ag-grid-vue3';
  import Multiselect from 'vue-multiselect'
  import 'ag-grid-community/styles/ag-grid.css';
  import 'ag-grid-community/styles/ag-theme-alpine.css';
  import "bootstrap/dist/css/bootstrap.min.css"
  import "bootstrap"
  import { colorSchemeDark,themeQuartz   } from 'ag-grid-community';

  import {
    ModuleRegistry,
    ColumnAutoSizeModule,
    CellStyleModule,
    TooltipModule,
    ExternalFilterModule,
    RowSelectionModule,
    ClientSideRowModelModule,
    ValidationModule,
    CustomFilterModule 
} from 'ag-grid-community';

ModuleRegistry.registerModules([
    ColumnAutoSizeModule,
    CellStyleModule,
    TooltipModule,
    ExternalFilterModule,
    RowSelectionModule,
    ClientSideRowModelModule,
    ValidationModule,
    CustomFilterModule 
]);
  // ModuleRegistry.registerModules([ ExternalFilterModule,ValidationModule,ColumnAutoSizeModule,CellStyleModule  ]);
  //const myTheme = 
  export default {
    name: 'DataGrid',
    components: {
      AgGridVue, // Register the AG Grid Vue component
      Multiselect,
      
        
    },
    data() {
      return {
        filterSelection:[],
        filterOptions:[],
        rowData: [
          { name: 'temp', age: 0, status: '0' },
         
        ],
        columnDefs: [
          { headerName:'Game', field: 'game', width:375, cellClass: 'leftAlign',
            cellRenderer: params => {
              //(params)
                if (params.data.appId!=-1){
                  return `<a class="btn btn-primary" target="_blank" href="https://store.steampowered.com/app/${params.data.appId}/">${params.value}</a>`
                }else{
                  return params.value
                }
                
            }
          },
          { field: 'bundle',width:500 },
          { headerName: 'Positive Rating %', field: 'positivePercent',width:150 },
          { headerName: 'Claimed',width:150, field: 'claimed',
            cellRenderer: params => {
                return `<input class="disabled" disabled="true" type='checkbox' ${params.value ? 'checked' : ''} />`;
            }
          },
          { headerName: 'Tags',width:150, field: 'tags',
            // cellRenderer: params => {
            //     //return params.value
            // }
          },

        ],
        defaultColDef: {
          sortable: true,
          filter: true,
          resizable: true,
          editable:false,
          
          cellStyle: { textAlign: 'left' }, // Default left alignment for all columns
        },
        gridTheme: themeQuartz.withPart(colorSchemeDark)
      };
    },
    mounted() {
      
  console.log(this.rowData); // Check if data is available
},
    methods: {
      filterChange(){
        console.log('Filter change!')
        this.gridApi.onFilterChanged()
      },
      isExternalFilterPresent(){
        console.log(`Is filter present ${this.filterSelection.length!=0}`);
        return this.filterSelection.length!=0;
      },
      doesExternalFilterPass(node){
        console.log(node)
        // Simple filtering for now. If the node has any of the tags in the filtered list, allow it.
        for (let selFilter of this.filterSelection){
          if (node.data.tags?.includes(selFilter.code)) return true;
        }
        return false;
        
        
      },
      async onGridReady(params) {
        console.log('Grid is ready');
        this.gridApi = params.api;
        this.gridColumnApi = params.columnApi;

        const response = await fetch('http://192.168.1.24:3000/api/getGridData');
        const data = await response.json();
        
        //console.log(response);
        this.rowData=data.gridData;

        this.filterOptions = data.allTags.map((tag) => {return {'name':tag,'code':tag}});
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
  