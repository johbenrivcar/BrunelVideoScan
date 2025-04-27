<template>
    <div>
        <input type="checkbox" :id ="id" :checked = "isDone" />
        <label for="todo-item">{{ label }}</label>
    </div>
</template>
<script>
    export default{
        props: {
            label: {
                required: true,
                type: String
            },
            done:{
                default: false,
                type: Boolean
            },
        },
        data(){
            return {
                isDone: this.done,
                id: "todo-" + crypto.randomUUID(),
            };
        },
    }
</script>
