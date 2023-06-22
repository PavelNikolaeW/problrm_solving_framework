document.addEventListener('alpine:init', () => {
    Alpine.store('problem', {
        async init() {
            this.problems = await loadProblem('problems')
            this.problems = this._setProblemId()
            this.firstId = this.problems.length > 0 ? this.problems[0].id : false
            this.activeProblemId = localStorage.getItem(STORAGE_ACTIV_PROBLEM) || this.firstId
            this.showTooltip = JSON.parse(
                localStorage.getItem(STORAGE_IS_SHOW_TOOLTIP) || 'true')
            this.showInputParts = JSON.parse(
                localStorage.getItem(STORAGE_SHOW_INPUT_PARTS) || 'true')
            this.initShowVars()
        },
        problems: [],
        firstId: null,
        activeProblemId: null,

        data() {
            return this
        },
        problemUpdate(id, body) {
            return api.wrapperFetch(`problems/${id}/`, 'PATCH', JSON.stringify(body))
        },
        newProblem(newProblem, el) {
            api.wrapperFetch(`problems/`, 'POST', JSON.stringify(newProblem))
                .then((res) => {
                    this.problems.push(res)
                    this.firstId = res.id
                    el.value = null
                    setTimeout(() => {
                        document.getElementById('tab-' + res.id).dispatchEvent(eventClick)
                    }, 50)
                })
                .catch(handleError)
        },
        getHandlerDeleteProblem(id) {
            return () => {
                api.wrapperFetch(`problems/${id}`, 'DELETE')
                    .then(() => {
                        const index = this.problems.findIndex(item => item.id === id)
                        if (index !== -1) this.problems.splice(index, 1)
                        document.getElementById(NEW_TAB).dispatchEvent(eventClick)
                        document.getElementById('new-problem-titile').focus()
                    })
                    .catch(handleError)
            }
        },
        openModalDialog() {
            if (!this.activeProblemId) return
            const text = this._getProblem(this.activeProblemId).title
            const handler = this.getHandlerDeleteProblem(this.activeProblemId)
            MODAL_BODY.innerText = `Удалить ${text}?`
            MODAL_DELETE_BTN.addEventListener('click', handler)
            MODAL_DIALOG.addEventListener('hidden.bs.modal', () => {
                MODAL_DELETE_BTN.removeEventListener('click', handler)
            })
        },
        _getProblem(id) {
            return this.problems.find(p => p.id == id)
        },
        _setProblemId() {
            return this.problems.map((problem) => {
                const id = problem.id
                problem.solutions = problem.solutions.map((sol) => {
                    return {problem_id: id, ...sol}
                })
                problem.criterion = problem.criterion.map((crit) => {
                    return {problem_id: id, ...crit}
                })
                return problem
            })
        },
        // обрабатываем список решений
        solutionCreate(newSolution, solutions, el) {
            api.wrapperFetch(`solutions/`, 'POST', JSON.stringify(newSolution))
                .then((res) => {
                    solutions.push(res)
                    el.value = ''
                })
                .catch(handleError)
        },
        solutionUpdate(solution, el) {
            l(solution)
            api.wrapperFetch(`solutions/${solution.id}/`, 'PATCH', JSON.stringify(solution))
                .then(() => {
                    if (el) el.value = null
                })
                .catch(handleError)
        },
        solutionDelete(solution, solutions, index) {
            api.wrapperFetch(`solutions/${solution.id}/`, 'DELETE').then(() => {
                solutions.splice(index, 1)
            }).catch(handleError)
        },
        changeSettingsSolution(solution, setting) {
            solution.settings[setting] = !solution.settings[setting]
            this.solutionUpdate(solution)
        },
        addStepSolution(newStep, solution, el) {
            solution.steps.push(newStep)
            this.solutionUpdate(solution, el)
        },
        deleteStepSolution(solution, indexStep) {
            solution.steps.splice(indexStep, 1)
            this.solutionUpdate(solution)
        },
        getSumm(solution, criterion) {
            let summary = 0
            criterion.forEach(({id, weight}) => {
                summary += solution.weight_critery[id] * weight
            })
            return summary
        },
        // работа с критериями
        newCritery(newCrit, criterion, el) {
            api.wrapperFetch(`criterion/`, 'POST', JSON.stringify(newCrit))
                .then((res) => {
                    criterion.push(res)
                    el.value = ''
                })
                .catch(handleError)
        },
        criteryUpdate(critery) {
            api.wrapperFetch(`criterion/${critery.id}/`, 'PATCH', JSON.stringify(critery))
                .catch(handleError)
        },
        // показывать \ скрывать подсказки
        tooltipToggle() {
            this.showTooltip = !this.showTooltip
            localStorage.setItem(STORAGE_IS_SHOW_TOOLTIP, this.showTooltip)
        },
        // показывать \ скрывать форму ввода частей проблемы
        InputPartsToggle(id) {
            this.showInputParts = !this.showInputParts
            localStorage.setItem(STORAGE_SHOW_INPUT_PARTS, this.showInputParts)
            this.loadChart(id)
        },
        // какую страницу с проблемой сейчас показывать
        isActiveButton(id) {
            if (this.activeProblemId == id) return 'active'
        },
        isActiveTab(id) {
            if (this.activeProblemId == id) return 'show active'
        },
        // переключение между проблемами
        handleClickOnTabProblem(id) {
            this.activeProblemId = id
            this.setHeightTextareaProblem(id)
            this.loadChart(id)
            localStorage.setItem(STORAGE_ACTIV_PROBLEM, id)
            this.initShowVars()
        },
        // переключение видимости секций
        initShowVars() {
            LIST_SHOWN_VARS.forEach((nameVar, id) => {
                const storageVar = LIST_STORAGE_VARS[id]
                this[storageVar] = `${USER.id}_${this.activeProblemId}_${nameVar}`
                this[nameVar] = JSON.parse(localStorage.getItem(
                    this[storageVar]) || (id === 0 ? 'true' : 'false')
                )
            })
            // тут происходит следующие только для вссего списка переменных
            // this.SHOW_SEARCH = `${USER.id}_${this.activeProblemId}_isShownSearch`
            // this.isShownSearch = JSON.parse(localStorage.getItem(this.SHOW_SEARCH) || 'true')
        },
        // скрол до секции
        accentSection(sectionID) {
            const el = document.getElementById(sectionID)
            const titleSection = el.querySelector('h6>a')
            el.scrollIntoView({
                behavior: "smooth",
                block: "center",
            })
            titleSection.classList.add("text-primary")
            setTimeout(() => titleSection.classList.remove("text-primary"), 1000)
        },
        // переключатели секций
        nextSection(el) {
            const len = LIST_SHOWN_VARS.length - 1
            for (let i = len; i >= 0; i--) {
                if (i === len && this[LIST_SHOWN_VARS[i]]) return
                else if (this[LIST_SHOWN_VARS[i]]) {
                    const elemIndex = i + 1
                    const sectionID = `${LIST_SHOWN_VARS[elemIndex].slice(7).toLowerCase()}Section${this.activeProblemId}`
                    const elCollapse = new bootstrap.Collapse('#' + sectionID, {toggle: false})
                    elCollapse.show()
                    this[LIST_SHOWN_VARS[elemIndex]] = !this[LIST_SHOWN_VARS[elemIndex]]
                    localStorage.setItem(this[LIST_STORAGE_VARS[elemIndex]], this[LIST_SHOWN_VARS[elemIndex]])
                    return setTimeout(() => {
                        el.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                        })
                    }, 200)
                }
            }
        },
        prevSection() {
            const len = LIST_SHOWN_VARS.length - 1
            for (let i = len; i > 0; i--) {
                if (this[LIST_SHOWN_VARS[i]]) {
                    const sectionID = `#${LIST_SHOWN_VARS[i].slice(7).toLowerCase()}Section${this.activeProblemId}`
                    const elCollapse = new bootstrap.Collapse(sectionID, {toggle: false})
                    elCollapse.hide()
                    this[LIST_SHOWN_VARS[i]] = !this[LIST_SHOWN_VARS[i]]
                    return localStorage.setItem(this[LIST_STORAGE_VARS[i]], this[LIST_SHOWN_VARS[i]])
                }
            }
        },
        // загрузка \ обновление графиков
        loadChart(id) {
            if (EXPLORE_CHARTS[id]) {
                const chart = EXPLORE_CHARTS[id]
                if (this.showInputParts) {
                    chart.options.maintainAspectRatio = false
                    chart.options.rotation = 0
                    chart.options.circumference = 360
                } else {
                    chart.options.maintainAspectRatio = false
                    chart.options.rotation = -90
                    chart.options.circumference = 180
                }
                chart.update()
                chart.resize()
            } else this.createChart(id)
        },
        createChart(id) {
            const el = document.getElementById("parts-of-problem-" + id)
            const explore_problem = this._getProblem(id)?.explore_problem
            if (!el || !explore_problem) return;
            EXPLORE_CHARTS[id] = new Chart(el, {
                type: 'doughnut',
                data: {
                    labels: explore_problem?.problem_parts?.map(part => part?.key),
                    datasets: [{
                        data: explore_problem?.problem_parts?.map(part => part?.value),
                        backgroundColor: COLORS_CHART.slice(0, explore_problem?.problem_parts?.length),
                        hoverOffset: 4,
                    }],
                },
                options: this._chartOptions(),
            })
        },
        _chartOptions() {
            const isShowForm = JSON.parse(localStorage.getItem(STORAGE_SHOW_INPUT_PARTS) || 'true')
            if (isShowForm) return {
                maintainAspectRatio: false,
                rotation: 0,
                circumference: 360,
            }
            else return {
                maintainAspectRatio: false,
                rotation: -90,
                circumference: 180,
            }
        },
        // установка высоты полей ввода текста
        setHeightTextareaProblem(id) {
            const textareasId = [
                `search-problem-description-${id}`,
                `explore-problem-identify-${id}`,
                `search-problem-reasoning-${id}`,
                `formalizing_problem-${id}`,
                `criteria_opinion-${id}`,
            ]
            textareasId.forEach(id => {
                const el = document.getElementById(id)
                if (el?.scrollHeight) el.style.height = el.scrollHeight + 'px';
            })
        },
        setHeightTextarea(el) {
            if (el.scrollHeight) el.style.height = el.scrollHeight + 'px';
        },
        // обновляем список задач
        todoUpdate(id, todo) {
            api.wrapperFetch(`todos/${todo.id}/`, 'PATCH', JSON.stringify(todo))
                .catch(handleError)
        },
        deleteTodo(index, todos) {
            api.wrapperFetch(`todos/${todos[index].id}`, 'DELETE')
                .then((res) => {
                    if (res.ok) todos.splice(index, 1)
                }).catch(handleError)
        },
        todoCreate(id, newTodo, todos, el) {
            api.wrapperFetch(`todos/`, 'POST', JSON.stringify(newTodo))
                .then(res => {
                    todos.push(res)
                    el.value = null
                }).catch(handleError)
        },
        // работа с частями проблемы, обновление графика
        handleChangePartExplore(part, problem_parts, index, id) {
            if (!part.key.length) problem_parts.splice(index, 1)
            else problem_parts[index] = part
            this.problemUpdate(id, {explore_problem: {problem_parts}})
            this.exploreProblemChartUpdate(problem_parts, id)
        },
        exploreProblemChartUpdate(problem_parts, id) {
            const explore_chart = EXPLORE_CHARTS[id]
            if (explore_chart) {
                explore_chart.data.labels = problem_parts.map(part => part?.key)
                explore_chart.data.datasets[0].data = problem_parts.map(part => part?.value)
                explore_chart.data.datasets[0].backgroundColor = COLORS_CHART.slice(0, problem_parts.length)
                explore_chart.update()
            }
        },
        handleNewPartExplore(newPart, problem_parts, id, el) {
            if (!newPart.key.length) return null
            problem_parts.push({...newPart})
            this.problemUpdate(id, {explore_problem: {problem_parts}})
                .then(() => {
                    setTimeout(() => {
                        const index = `part-value-${problem_parts.length - 1}-${id}`
                        document.getElementById(index).focus()
                    }, 50)
                    el.value = ''
                }).catch(handleError)
        },
        handleChangeCauseExplore(cause, cause_and_effect, index, id) {
            if (!cause.length) cause_and_effect.splice(index, 1)
            else cause_and_effect[index] = cause
            this.problemUpdate(id, {explore_problem: {cause_and_effect}})
                .catch(handleError)
        },
        handleNewCauseExplore(cause, cause_and_effect, id, el) {
            if (!cause.length) return null
            cause_and_effect.push(cause)
            this.problemUpdate(id, {explore_problem: {cause_and_effect}})
                .then(() => el.value = '')
                .catch(handleError)
        },
        // обновление требований к результату
        handleNewRequirement(id, newReq, requirements, elValue, elKey) {
            requirements.unshift({...newReq})
            this.problemUpdate(id, {formalizing_problem: {requirements}})
                .then(() => {
                    elValue.value = null
                    elKey.value = ''
                    elKey.focus()
                }).catch(handleError)
        },
        requirementsSumm(requirements) {
            if (requirements.length) {
                let all = 0
                let completed = 0
                requirements.forEach(item => {
                    if (item.completed) completed += parseInt(item.value)
                    all += parseInt(item.value)
                })
                return `${completed}/${all}`
            }
            return '0/0'
        },
        handleDeleteReq(id, index, requirements) {
            requirements.splice(index, 1)
            this.problemUpdate(id, {formalizing_problem: {requirements}})
                .catch(handleError)
        },
        handleNewPref(id, newPref, preferences, el) {
            preferences.unshift({...newPref})
            this.problemUpdate(id, {formalizing_problem: {preferences}})
                .then(() => el.value = '')
                .catch(handleError)
        },
        handleDeletePref(id, index, preferences) {
            preferences.splice(index, 1)
            this.problemUpdate(id, {formalizing_problem: {preferences}})
                .catch(handleError)
        },
    })
})


function initChartsExploreProblem() {
    const id = Alpine.store('problem').activeProblemId
    Alpine.store('problem').createChart(id)
}

function initTooltip() {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
}

setTimeout(() => {
    // инициализация всех всплывающих подсказок после того как страница полностью загрузиться
    initTooltip()
    // инициализация графиков
    initChartsExploreProblem()
}, 300)

const MODAL_DIALOG = document.getElementById('modalDialog')
const MODAL_BODY = document.getElementById('modalBody')
const MODAL_DELETE_BTN = document.getElementById('ModalBtnDelete')

