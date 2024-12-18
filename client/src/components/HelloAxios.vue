<template>
    <div>
      <h1>{{ message }}</h1>
    </div>
  </template>

<script>
import axios from 'axios';
export default {
  data() {
    return {
      message: '123'
    };
  },
  mounted() {
    this.fetchMessage();
  },
  methods: {
    async fetchMessage() {
      try {
        console.log("fetching...")
        //const response = await axios.get('http://192.168.1.24:3000/api/message');
        const response = await axios.get('http://192.168.1.24:3000/sample');
        console.log("Done! " + response.data)
        this.message = response.data;
      } catch (error) {
        console.error('Error fetching message:', error);
      }
    }
  }
};
</script>
<style scoped>
h1 {
  color: #42b983;
}
</style>