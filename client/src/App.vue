<template >
  <div class=" w-100 vh-100" >
    <div  class="h1">Humble Bundle Game Vuer </div>
    <button class="btn btn-primary" caption="Get Game Data" @click="loadGameData">Get Game Data</button>
    <GridSample  @grid-ready="ongridReady" :rowData="gridRows"/>
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
      gridRows:[]
    }
  },
  async mounted(){
    console.log('Mounting')

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
          return;
        }
        const toast = useToast();
        toast.success(`Data Getter: ${data.message}`, {
        position: 'bottom-right',
        duration: 10000
      });
  
      }else if (data.type=='getGridData'){
        this.gridParams.api.setGridOption("rowData",data.data.gridData);
        this.gridRows = [...data.data.gridData];
        //this.gridRows = data.data.gridData
        console.log(this.gridRows);
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

        // this.filterOptions = data.allTags.map((tag) => {return {'name':tag,'code':tag}});
        // gridApi.sizeColumnsToFit();
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
