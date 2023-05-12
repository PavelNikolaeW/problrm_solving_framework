// TODO: скрывать незаполненые формы? как тогда их заполнять?
// TODO: 1 отказаться от сложной таблицы в пользу простой с полем джейсон строкой? плюс в том что может быть любое количество полей, минусы?...
// TODO: 2 минимальная версия должна включать шаги с брейн штормингом где нужно будет придумать
//  варианты решения и + сделать оценку по тjму какие части проблемы она решает.
//  тоесть буквально таблица с сопоставлением способ решения напротив какие части проблемы он решает.
// TODO:
// TODO: полоска загруски. нажимаеш галочку(выполнено требование к результату)  и полоса загрузки увеличивается
//  полосу загрузки разместить в оглавлении таблицы
// TODO: модальное окно с подтверждением, при удалении чего либо


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

        },
        problems: [],
        firstId: null,
        activeProblemId: null,
        showTooltip: null,
        showInputParts: null,

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
        openModalDialog(id, text) {
            const handler = this.getHandlerDeleteProblem(id)
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
        // каку страницу с проблемой сейчас показывать
        isActiveButton(id) {
            if (this.activeProblemId == id) return 'active'
        },
        isActiveTab(id) {
            if (this.activeProblemId == id) return 'show active'
        },
        // переключение между проблемами
        handleClickOnTabProblem(id) {
            this.setHeightTextareaProblem(id)
            this.loadChart(id)
            this.activeProblemId = id
            localStorage.setItem(STORAGE_ACTIV_PROBLEM, id)
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
                return
            }
            this.createChart(id)
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
            return {
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
        handleChangePartExplore(part, index, id) {
            const problem_parts = this._getProblem(id).explore_problem.problem_parts
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
        handleNewPartExplore(key, id) {
            if (!key.length) return null
            const explore_p = this._getProblem(id).explore_problem
            if (!explore_p?.problem_parts) explore_p.problem_parts = [{key: key, value: null}]
            else explore_p.problem_parts.push({key, value: null})
            this.problemUpdate(id, {explore_problem: {problem_parts: explore_p.problem_parts}})
            // фокус на новом элементе
            setTimeout(() => {
                const index = `part-value-${explore_p.problem_parts.length - 1}-${id}`
                document.getElementById(index).focus()
            }, 50)
            // очистка ввода
            const formPart = document.getElementById('new-part' + id)
            formPart.value = ''
        },
        handleChangeCauseExplore(cause, index, id) {
            const cause_and_effect = this._getProblem(id).explore_problem.cause_and_effect
            if (!cause.length) cause_and_effect.splice(index, 1)
            else cause_and_effect[index] = cause
            this.problemUpdate(id, {explore_problem: {cause_and_effect}})
        },
        handleNewCauseExplore(cause, id) {
            if (!cause.length) return null
            const explore_p = this._getProblem(id).explore_problem
            if (!explore_p?.cause_and_effect) explore_p.cause_and_effect = [cause]
            else explore_p.cause_and_effect.push(cause)
            this.problemUpdate(id, {explore_problem: {cause_and_effect: explore_p.cause_and_effect}})
                .then(() => {
                    document.getElementById('NewCauseExplore' + id).value = ''
                })
        },
        // обновление требований к результату
        handleNewRequirement(id, newReq, requirements, elValue, elKey) {
            const formalizing_problem = this._getProblem(id).formalizing_problem
            if (!formalizing_problem.requirements) formalizing_problem.requirements = [newReq]
            else formalizing_problem.requirements.unshift({...newReq})
            this.problemUpdate(id, {formalizing_problem: {requirements: formalizing_problem.requirements}})
                .then(() => {
                    elValue.value = null
                    elKey.value = ''
                    elKey.focus()
                }).catch(handleError)
        },
        requirementsSumm(id) {
            const requirements = this._getProblem(id)?.formalizing_problem?.requirements
            if (requirements) {
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
        },
        handleNewPref(id, newPref, el) {
            const formalizing_problem = this._getProblem(id).formalizing_problem
            if (!formalizing_problem.preferences) formalizing_problem.preferences = [newPref]
            else formalizing_problem.preferences.unshift({...newPref})
            this.problemUpdate(id, {
                formalizing_problem:
                    {preferences: formalizing_problem.preferences}
            }).then(() => el.value = '').catch(handleError)
        },
        handleDeletePref(id, index, preferences) {
            preferences.splice(index, 1)
            this.problemUpdate(id, {formalizing_problem: {preferences}})
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