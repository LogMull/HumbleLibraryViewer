<template >
  <div class=" w-100 vh-100" >
    <div  class="h1">Humble Bundle Game Vuer </div>
    <button  @click="buttonClick"></button>
    <GridSample />
    <div>test</div>
  </div>
  

</template>

<script>
// import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';


// import HelloAxios from './components/HelloAxios.vue';
// import HelloWorld from './components/HelloWorld.vue'
//import { AgGridVue } from "ag-grid-vue3"; // Vue Data Grid Component
import {
    ModuleRegistry,
    ClientSideRowModelModule,
    
} from 'ag-grid-community';
import GridSample from './components/GridSample.vue';

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
]);
export default {
  name: 'App',
  components: {
    // HelloWorld, 
    // HelloAxios,
    
    GridSample
    
  },
  methods:{
    buttonClick(){
      console.log("Clicked!")
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
