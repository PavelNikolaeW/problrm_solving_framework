document.addEventListener('alpine:init', () => {
    Alpine.store('todo', {
        async init() {
            this.todos = await loadFromServer('todos')
            this.problems = await loadFromServer('problemList')
        },

        todos: [],
        problems: [],
        filterBody: {},
        showCol: settingsGetShowCol(),
        error: false,
        cols: {
            id: false,
            title: true,
            content: true,
            created: false,
            due_date: true,
            category: true,
            problem: true,
        },
        categories: [
            {key: 'danger', value: 0},
            {key: 'info', value: 1},
            {key: 'purple', value: 2},
            {key: 'cyan', value: 3},
            {key: 'pink', value: 4},
            {key: 'yellow', value: 5},
            {key: 'success', value:6},
            {key: 'primary', value: 7},
            {key: 'orange', value: 8},
            {key: 'indigo', value: 9},
        ],
        done: HOST + '/static/icons/todo/done.png',
        make: HOST + '/static/icons/todo/make.png',


        toggleTodo(id) {
            const todo = this.todos.find((todo) => todo.id === id);
            api.wrapperFetch(`todos/${id}/`, 'PATCH', JSON.stringify({
                "completed": !todo.completed
            })).then(() => todo.completed = !todo.completed)
                .catch(err => console.log(err))
        },

        taskUpdate(newTask) {
            const id = newTask.id
            if (newTask.title === "") {
                this.error = true
                return;
            }
            const url = id !== 'undefined' ? `todos/${getFilterString()}` : `todos/${id}/`
            const method = id !== 'undefined' ? "POST" : "PATCH"
            api.wrapperFetch(url, method, JSON.stringify(newTask))
                .then(res => {
                    if (id !== "") {
                        this.todos = [res, ...this.todos.filter((todo) => todo.id !== id)]
                    } else {
                        this.todos.unshift(res)
                    }
                    this.resetForm(newTask)
                }).catch(err => console.log(err))
            this.error = false
        },

        deleteTodo(id) {
            api.wrapperFetch(`todos/${id}`, "DELETE").then(res => {
                if (res.ok) this.todos = this.todos.filter((todo) => todo.id !== id);
            }).catch(err => console.log(err))
        },

        toggleColumn(col) {
            this.cols[col] = !this.cols[col]
            localStorage.setItem(DEFAULT_SHOW_COL, JSON.stringify(this.cols))
            console.log(this.cols)
        },

        openChangeForm(taskId, newTask, el) {
            console.log(taskId, newTask)
            const task = this.todos.find(({id}) => id === taskId)
            Object.entries(task).forEach(([key, value]) => newTask[key] = value)
            if (el.getAttribute('aria-expanded') === 'false') {
                el.dispatchEvent(eventClick)
            }
        },

        resetForm(newTask) {
            newTask.title = ''
            newTask.content = ''
            newTask.created = TODAY
            newTask.due_date = DEFAULT_DUE_DATE
            newTask.category = 0
            newTask.problem = null
            newTask.completed = false
            newTask.id = undefined
        },

        filterTodos(param, value) {
            if (param === 'ordering') {
                if (this.filterBody[param][0] === "-") this.filterBody[param] = value
                else this.filterBody[param] = '-' + value
            } else this.filterBody[param] = value
            localStorage.setItem(FILTER, JSON.stringify(this.filterBody))
            api.wrapperFetch('todos/' + getFilterString(), 'GET')
                .then(res => this.todos = [...res]).catch(err => console.log(err))
        },
    });
})
const input = {
    id: "",
    title: "",
    content: "",
    created: "",
    due_date: DEFAULT_DUE_DATE,
    category: {},
    problem: {},
}

document.addEventListener('alpine:init', () => {
    Alpine.store('todoInputValue', input)
})
