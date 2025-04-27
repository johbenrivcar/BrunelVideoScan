<script setup>
import {nonoid } from "nanoid";
import ToDoItem from "./components/ToDoItem.vue"
</script>

<script>
  export default{

    name: "app",
    components: {
      ToDoItem,
    },

    data() {
        return {
          ToDoItems: [
            { id: "todo-" + nanoid(), label: "Learn Vue", done: false },
            { id: "todo-" + nanoid(), label: "Create a Vue project with the CLI", done: true },
            { id: "todo-" + nanoid(), label: "Have fun", done: true },
            { id: "todo-" + nanoid(), label: "Create a to-do list", done: false }
          ],
        };
      },
  }
</script>

<template>
  <div id="app">
    <h1>To-Do List</h1>
      <ul>
        <li v-for=" item in ToDoItems" :key="item.id">
          <to-do-item :label="item.label" :done="item.done"></to-do-item>
        </li>
      </ul>
  </div>
</template>


<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
