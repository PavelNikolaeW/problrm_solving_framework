document.addEventListener('alpine:init', () => {
    Alpine.store('observer', {
        async init() {
            await api.wrapperFetch('observer')
                .then(res => {
                    this.observer = res[0]
                    this.scales = this.observer?.scales
                    this.createChart()
                })
                .catch(handleError)
            this.modal = document.getElementById('scaleModal')
            this.modalBody = document.getElementById('scaleModalBoddy')
        },
        data() {
            return this
        },
        handlerModal() {},
        openModal(id) {
            if (!this.scales) return
            const scale = this.scales.find(sc => sc.id === id)

            const text = this._getProblem(this.activeProblemId).title
            const handler = this.getHandlerDeleteProblem(this.activeProblemId)

            this.modalBody.innerText = `Удалить ${text}?`
            MODAL_DELETE_BTN.addEventListener('click', handler)
            MODAL_DIALOG.addEventListener('hidden.bs.modal', () => {
                MODAL_DELETE_BTN.removeEventListener('click', handler)
            })
        },

        _getData(metrics, type) {
            const preparedData = [...Array(24).keys()]
            preparedData.forEach((el, i) => {
                preparedData[i] = {c: 0, value: 0, hour: 0}
            })
            metrics.forEach(el => {
                obj = preparedData[el.hour - 1]
                obj.c++
                obj.value += el.value
                obj.hour = el.hour
            })
            if (type === 'range')
                return preparedData.map(el => el.value / el.c)
            return preparedData.map(el => {
                if (el.c > 0)
                    return {
                        x: el.hour,
                        y: el.c,
                        // r: el.c + 5,
                    }
                return {}
            })
        },
        _getDataSet() {
            return this.scales.map((scale, i) => {
                const type = scale.type
                return {
                    label: scale.title,
                    data: this._getData(scale.metrics, type),
                    type: type === 'range' ? 'bar' : 'bubble',
                    yAxisID: type === 'range' ? 'y' : 'count',
                }
            })
        },
        createChart() {
            if (this.observer) {
                const chart = document.getElementById('observer')
                new Chart(chart, {
                    type: 'bar',
                    data: {
                        labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
                        datasets: this._getDataSet()
                    },
                    options: {
                        scales: {
                            y: {
                                min: 0,
                                max: 5,
                            },
                            x: {
                                min: 7,
                                max: 22
                            },
                            count: {
                                position: 'right',
                                min: 0,
                                max: 10,
                            },
                        }
                    }
                })
            }

        },
    })
})
