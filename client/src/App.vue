<template >
  <div class=" w-100 vh-100" >
    <div  class="h1">Humble Bundle Game Vuer </div>
    <button caption="selenium" @click="buttonClick">Selenium please</button>
    <GridSample />
    <div>test</div>
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
      toastMessage:'',
      toastName:'',
      toastSubText:'',
      toastStepCount:0
    }
  },
  mounted(){
    //this.$toast.open('You did it!');

    this.socket = new WebSocket('ws://localhost:8080');

    this.socket.onopen = function(event) {
      // Handle connection open
    };

    this.socket.onmessage = function(event) {
      
   
      console.log("Received ")
      const data = JSON.parse(event.data);
      if (data.type=='selenium') {
        if (data.message == 'done'){
          
          return;
        }
        this.toastStepCount++;
        this.toastMessage=data.message
        const toast = useToast();
        toast.success(`Data Getter: ${data.message}`, {
        position: 'bottom-right',
        duration: 10000
      });
        //toast.add({ severity: 'info', summary: 'Step '+this.toastStepCount, detail: data.message, life: 3000, group: 'br' });
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
    async buttonClick(){
      console.log("Clicked!")
      this.toastName='Data Getter';
      this.toastStepCount=0
      this.socket.send("selenium");
      //const data = await fetch("http://localhost:3000/selenium/");
      // console.log(data);
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
