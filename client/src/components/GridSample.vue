<template>
  <!--<div class="dropdown">
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
-->
    <div v-if="rowData.length" style="height: 500px; width: 100%;">
      <div class="d-flex justify-content-center mb-3">  
      <div class="w-25">  
        <div class="label label-secondary mb-3">Filter by Tag</div>
        <multiselect
        id="tagging"
        v-model="filterSelection"
        tag-placeholder="Filter by Steam Tags" 
        placeholder="Search for tag" 
        label="name"
        @update:model-value="filterChange"
        track-by="code" :options="filterOptions" :multiple="true" :taggable="true" ></multiselect>
      </div>
      <div class="ms-5">  
          <div class="label label-secondary mb-3">Filter Options</div>
          <div class="form-check">
            <input class="form-check-input" v-model="matchAll" @change="filterChange" type="checkbox" value="" id="flexCheckDefault">
            <label class="form-check-label" for="flexCheckDefault" title="If checked, game must have all selected tags. If unchecked, game can have any selected tag.">
               Match all tags
            </label>
          </div>
          <div class="form-check">
            <input class="form-check-input" v-model="excludeClaimed" @change="filterChange" type="checkbox" value="" id="excludeClaimed">
            <label class="form-check-label" for="excludeClaimed">
              Exclude Claimed
            </label>
          </div>
          <div class="form-check">
            <input class="form-check-input" v-model="excludeunClaimed" @change="filterChange" type="checkbox" value="" id="excludeunClaimed">
            <label class="form-check-label" for="flexCheckDefault" >
               Exclude Unclaimed
            </label>
        </div>
        </div>
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
    <div v-else>
      Please use the 'Get Game Data' button above to pull your data from Humble bundle.
    </div>
  </template>
  <style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
  <script>
  import { AgGridVue } from 'ag-grid-vue3';
  import Multiselect from 'vue-multiselect'
  // import 'ag-grid-community/styles/ag-grid.css';
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
        matchAll:false,
        excludeunClaimed:false,
        excludeClaimed:false,
        rowData: [],
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
        return this.filterSelection.length!=0 || this.excludeClaimed || this.excludeunClaimed;
      },
      doesExternalFilterPass(node){
        console.log(node.data)
        // Match on claimed/unclaimed first
        if (node.data.claimed===1 && this.excludeClaimed) return false;
        if (node.data.claimed==0 && this.excludeunClaimed) return false;
        if (this.filterSelection.length > 0){
          let allMatchedSoFar=true;
          // Simple filtering for now. If the node has any of the tags in the filtered list, allow it.
          for (let selFilter of this.filterSelection){
            // Check if this filter is contained in the nodes
              let filterMatched=node.data.tags?.includes(selFilter.code);
              allMatchedSoFar &= filterMatched;
              if (this.matchAll){
                // If one did not match, stop looking new
                if (!allMatchedSoFar){
                  return false;
                }
              }else if (filterMatched){
                return true;
              }
          }
          // Match all would have quit early if a tag was missed
          if (this.matchAll){
            return true;
          }else{
            // Match any would have quit early if a tag was found
            return false;
          }
        }
        return true
        
        
      },
      async onGridReady(params) {
        console.log('Grid is ready');
        this.gridApi = params.api;
        this.gridColumnApi = params.columnApi;
        this.$emit('grid-ready',params);
        return;
        // const response = await fetch('http://localhost:3000/api/getGridData');
        // const data = await response.json();
        
        // //console.log(response);
        // this.rowData=data.gridData;

        // this.filterOptions = data.allTags.map((tag) => {return {'name':tag,'code':tag}});
        // this.gridApi.sizeColumnsToFit();

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
  