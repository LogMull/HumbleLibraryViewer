<template >
  <div class=" w-100 vh-100" >
    <div  class="h1">Humble Bundle Game Vuer </div>
        <div class="dropdown">
      <button
        class="btn btn-secondary dropdown-toggle"
        type="button"
        id="dropdownMenuButton1"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        Actions
      </button>
      <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton1">
        <li><a class="dropdown-item" @click="loadGameData" href="#">Get Game Data</a></li>
        <li><a class="dropdown-item" href="#" @click="onclickMetadata('all')">Update All Metadata</a></li>
        <li><a class="dropdown-item" href="#">Something else here</a></li>
      </ul>
    </div>
    <div class="d-flex flex-column"> 
    <!-- <button class="btn btn-primary" caption="Get Game Data" @click="loadGameData">Get Game Data</button>
    <button class="btn btn-secondary" caption="Update All Metadata" @click="onclickMetadata('all')">Update All Metadata</button> -->
  </div>
    <GridSample  @grid-ready="ongridReady" :rowData="rowData"/>
  </div>
  

</template>

<script>
// import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import {ModuleRegistry, ClientSideRowModelModule} from 'ag-grid-community';
import GridSample from './components/GridSample.vue';
import { useToast } from 'vue-toast-notification';
ModuleRegistry.registerModules([
    ClientSideRowModelModule,
]);
export default {
  name: 'App',
  components: {
    GridSample
  },
  data(){
    return {
      socket:null,
      toastStepCount:0,
      gridParams:null,
      gridReady:false,
      socketReady:false,
      rowData:[],
      testStr:'123'
    }
  },
  async mounted(){
    console.log('Mounting')
    const $toast = useToast();
    let instance = $toast.success(this.testStr);
    instance.dismiss()
    this.testStr='567'
    instance = $toast.success(this.testStr);
    
    this.socket = new WebSocket('ws://localhost:8080');
    this.socket.onopen = () => {
        console.log("WebSocket connected");
        this.socketReady = true;
        this.fetchData()
        
      };

    this.socket.onmessage = (event) => {

      console.log("Received ")
      const data = JSON.parse(event.data);
      if (data.type=='selenium') {
        if (data.message == 'done'){
          this.fetchData();
          return;
        }
        const toast = useToast();
        toast.success(`Data Getter: ${data.message}`, {
        position: 'bottom-right',
        duration: 10000
      });
  
      }else if (data.type=='getGridData'){
        this.gridParams.api.setGridOption("rowData",data.data.gridData);
        //this.rowData = [...data.data.gridData];
        //this.rowData = data.data.gridData
        console.log(this.rowData);
      }else if (data.type=='metadata'){

      }
      console.log(event);
      // Handle received message
    };

    this.socket.onclose = function(event) {
  // Handle connection close
      console.log("socket closed!")
    };
    
    
  },
  methods:{
    async loadGameData(){
      //  Start the data collection process via websocket
      this.toastStepCount=0
      this.socket.send("selenium");

    },
    ongridReady(params){
      this.gridReady=true;
      this.gridParams = params;
      this.fetchData();
    },
    fetchData(){
      if (this.gridReady && this.socketReady){
        console.log('Grid is ready');
        this.socket.send("getGridData")
      }
      return;
      // const response = await fetch('http://localhost:3000/api/getGridData');
      // const data = await response.json();
      
      // //console.log(response);
      // this.rowData=data.gridData;
      // gridApi.sizeColumnsToFit();

        // this.filterOptions = data.allTags.map((tag) => {return {'name':tag,'code':tag}});
    },
    onclickMetadata(){
      this.socket.send("metadata")
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  /* color: #2c3e50; */
  min-height: 100vh;
  /* margin-top: 60px; */
}
</style>
