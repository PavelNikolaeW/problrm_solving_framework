function getCookie(name) {
    var cookieValue = null;

    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim()
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function setHeightTextarea() {
    document.querySelectorAll('div>textarea').forEach(el => {
        if (el.scrollHeight) el.style.height = el.scrollHeight + 'px';
    })
}

async function loadProblem(key) {
    return await api.wrapperFetch(`${key}/`, 'GET')
        .then((res) => {
            setTimeout(() => {
                setHeightTextarea()
            }, 50)
            return res
        })
        .catch(handleError)
}
async function loadFromServer(key) {
    return await api.wrapperFetch(`${key}/`, 'GET')
        .then((res) => res)
        .catch(handleError)
}

const l = (value) => console.log(value)

const STORAGE_ACTIV_PROBLEM = USER.id + 'activeProblemId'
const STORAGE_IS_SHOW_TOOLTIP = USER.id + 'tooltip'
const STORAGE_SHOW_INPUT_PARTS = USER.id + 'showInputParts'
const STORAGE_SHOW_INPUT_PREF = USER.id + 'showInputPreferences'
const STORAGE_SHOW_INPUT_REQ = USER.id + 'showInputRequirements'
const STORAGE_SHOW_INPUT_SOL = USER.id + 'showInputSolutionSearch'

const NEW_TAB = 'tab-new'
const HOST = location.origin
const TOKEN = getCookie("csrftoken")
const DEFAULT_SHOW_COL = location.href.indexOf('todo') !== -1 ? USER.id + "deafaultShowColTodo" : USER.id + "defaultShowCol"
const FILTER = USER.id + 'filter'
const eventClick = new Event('click')
const today = new Date()
today.setDate((new Date()).getDate() + 1)
const DEFAULT_DUE_DATE = today.toISOString().split('T')[0]
const TODAY = new Date().toISOString().split('T')[0]
const COLORS_CHART = [
    "rgb(220, 53, 69)", // danger
    "rgb(32, 201, 151)", // info
    "rgb(111, 66, 193)", // purple
    "rgb(13, 202, 240)", // cyan
    "rgb(214,51,132)", // pink
    "rgb(255, 193, 7)", // yellow
    "rgb(25, 135, 84)", // success
    "rgb(13, 110, 253)", // primary
    "rgb(253, 126, 20)", // orange
    "rgb(102, 16, 242)", // indigo
]

const EXPLORE_CHARTS = {}

const CATEGORIES = {
    success: 7,
    danger: 0,

}

const settingsGetShowCol = () => {
    const deafaultSettings = JSON.parse(localStorage.getItem(DEFAULT_SHOW_COL))
    if (!deafaultSettings) {
        localStorage.setItem(DEFAULT_SHOW_COL, JSON.stringify({
            id: false,
            title: true,
            content: true,
            created: false,
            due_date: true,
            category: true,
            problem: true,
        }))
        return JSON.parse(localStorage.getItem(DEFAULT_SHOW_COL))
    }
    return deafaultSettings
}
const settingsGetFilter = () => {
    const filter = JSON.parse(localStorage.getItem(FILTER))
    if (filter === null) {
        localStorage.setItem(FILTER, JSON.stringify({
            problem: "",
            category: "",
            completed: "",
            ordering: "",
        }))
        return JSON.parse(localStorage.getItem(FILTER))
    }
    return filter
}
const getFilterString = () => {
    const filter = settingsGetFilter()
    let result = "?"
    for (const [key, value] of Object.entries(filter)) {
        if (value !== "") {
            result += `${key}=${value}&`
        }
    }
    return result
}
const setValue = (obj, value) => {
    // установить все поля к единому знчению
    return Object.keys(obj).reduce((acc, curr) => ({
        ...acc,
        [curr]: value
    }), {})
}

const handleError = (err) => {
    console.log(err)
}

class Api {
    constructor(version) {
        this.host = location.origin
        this.baseUrl = this.host + '/api/' + version
        this.headers = new Headers({
            "Content-Type": 'application/json',
            "X-CSRFTOKEN": TOKEN,
            // "Authorization": 'Bearer ' + '',
        })
    }

    _checkResponse(res) {
        if (res.status === 204) return res
        if (res.ok) return res.json()
        else if (!res.ok) return res.text().then(text => {
            throw new Error(text)
        })
    }

    wrapperFetch(url, method, body) {
        console.log(url)
        console.log(body)
        return fetch(this.baseUrl + url, {
            method: method,
            headers: this.headers,
            body: body
        }).then(this._checkResponse)
    }
}

const api = new Api('v1/')