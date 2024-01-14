document.addEventListener('alpine:init', () => {
    Alpine.store('chat', {
        async init() {
            this.newChatName = ''
            this.newMessage = ''
            this.chats = await loadChats('chat')
            this.selectedChat = null
        },
        data() {
            return this
        },
        setChats() {

        },

        createChat(userid) {
            console.log('kek')
            api.wrapperFetch('chat/', 'POST', JSON.stringify({
                members: [USER.id, userid]
            })).then((res) => {
                console.log(res)
                this.chats.push(res)
                this.newChatName = res.id;
            })
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
