document.addEventListener('alpine:init', () => {
    Alpine.store('chat', {
        async init() {
            this.newChatName = ''
            this.newMessage = ''
            this.chats = [
                {
                    id: 1, name: 'Пользователь 1', messages: [
                        {id: 1, author: 'Пользователь 1', content: 'Привет!'},
                        {id: 2, author: 'Пользователь 2', content: 'Привет world!'},
                        {
                            id: 3,
                            author: 'Пользователь 2',
                            content: 'В приведенном выше примере мы создаем переменную  isOpen  в объекте  x-data . Затем мы используем директиву  x-on:click  для привязки функции-обработчика к событию клика на кнопке. Внутри функции мы меняем значение переменной  isOpen  на противоположное значение, чтобы переключать ее между  true  и  false . '
                        }
                    ]
                },
                {id: 2, name: 'Пользователь 2', messages: []},
            ]
            this.selectedChat = null
        },
        data() {
            return this
        },

        createChat() {
            let newChat = {
                id: this.chats.length + 1,
                name: this.newChatName,
                messages: []
            };
            this.chats.push(newChat);
            this.newChatName = '';
        },
        selectChat(chat) {
            this.selectedChat = Object.assign({}, chat)
        },

        sendMessage() {
            if (this.selectedChat && this.newMessage.trim() !== '') {
                this.selectedChat.messages.push({
                    id: this.selectedChat.messages.length + 1,
                    author: 'Вы',
                    content: this.newMessage
                });
                this.newMessage = '';
            }
        },
        editMessage(message) {
            // Здесь будет логика редактирования сообщения
        },
        deleteMessage(message) {
            // Здесь будет логика удаления сообщения
        }

    })
})
