// WhatsApp Management System
class WhatsAppManager {
    constructor() {
        this.conversations = [];
        this.activeConversation = null;
        this.isTyping = false;
        this.init();
    }

    init() {
        this.loadMockData();
        this.setupEventListeners();
        this.renderConversationsList();
    }

    setupEventListeners() {
        // New message button
        const newMessageBtn = document.getElementById('newMessageBtn');
        if (newMessageBtn) {
            newMessageBtn.addEventListener('click', () => this.showNewMessageModal());
        }

        // Message input
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            messageInput.addEventListener('input', () => {
                this.handleTyping();
            });
        }

        // Send message button
        const sendButton = document.getElementById('sendMessage');
        if (sendButton) {
            sendButton.addEventListener('click', () => this.sendMessage());
        }

        // File attachment
        const attachFile = document.getElementById('attachFile');
        if (attachFile) {
            attachFile.addEventListener('click', () => this.showFileAttachment());
        }
    }

    loadMockData() {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        this.conversations = [
            {
                id: 1,
                patientId: 1,
                name: 'María García López',
                avatar: 'MG',
                lastMessage: 'Gracias doctor, nos vemos mañana',
                lastMessageTime: this.formatTime(today),
                unreadCount: 0,
                isOnline: false,
                messages: [
                    {
                        id: 1,
                        sender: 'patient',
                        content: 'Hola doctor, tengo una cita mañana a las 10:30',
                        timestamp: this.formatTime(new Date(today.getTime() - 2 * 60 * 60 * 1000)),
                        status: 'read'
                    },
                    {
                        id: 2,
                        sender: 'clinic',
                        content: 'Hola María, perfecto. Te esperamos mañana. ¿Hay algo específico que te preocupe?',
                        timestamp: this.formatTime(new Date(today.getTime() - 1 * 60 * 60 * 1000)),
                        status: 'delivered'
                    },
                    {
                        id: 3,
                        sender: 'patient',
                        content: 'No, solo es una revisión de rutina',
                        timestamp: this.formatTime(new Date(today.getTime() - 30 * 60 * 1000)),
                        status: 'read'
                    },
                    {
                        id: 4,
                        sender: 'patient',
                        content: 'Gracias doctor, nos vemos mañana',
                        timestamp: this.formatTime(today),
                        status: 'read'
                    }
                ]
            },
            {
                id: 2,
                patientId: 2,
                name: 'Carlos Ruiz',
                avatar: 'CR',
                lastMessage: '¿Puedo reprogramar mi cita?',
                lastMessageTime: this.formatTime(yesterday),
                unreadCount: 1,
                isOnline: true,
                messages: [
                    {
                        id: 5,
                        sender: 'patient',
                        content: 'Buenos días, ¿podría reprogramar mi cita del viernes?',
                        timestamp: this.formatTime(new Date(yesterday.getTime() + 9 * 60 * 60 * 1000)),
                        status: 'read'
                    },
                    {
                        id: 6,
                        sender: 'clinic',
                        content: 'Hola Carlos, claro que sí. ¿Qué día te viene mejor?',
                        timestamp: this.formatTime(new Date(yesterday.getTime() + 10 * 60 * 60 * 1000)),
                        status: 'delivered'
                    },
                    {
                        id: 7,
                        sender: 'patient',
                        content: '¿Podría ser el lunes por la tarde?',
                        timestamp: this.formatTime(yesterday),
                        status: 'read'
                    }
                ]
            },
            {
                id: 3,
                patientId: 3,
                name: 'Ana Martín',
                avatar: 'AM',
                lastMessage: 'Me duele mucho el molar',
                lastMessageTime: '11:45',
                unreadCount: 2,
                isOnline: false,
                messages: [
                    {
                        id: 8,
                        sender: 'patient',
                        content: 'Doctor, tengo un dolor muy fuerte en el molar derecho',
                        timestamp: '11:30',
                        status: 'read'
                    },
                    {
                        id: 9,
                        sender: 'patient',
                        content: '¿Puedo ir hoy mismo?',
                        timestamp: '11:45',
                        status: 'delivered'
                    }
                ]
            },
            {
                id: 4,
                patientId: 4,
                name: 'Pedro Santos',
                avatar: 'PS',
                lastMessage: 'Perfecto, muchas gracias',
                lastMessageTime: '14:20',
                unreadCount: 0,
                isOnline: false,
                messages: [
                    {
                        id: 10,
                        sender: 'patient',
                        content: '¿Cuáles son los cuidados después del implante?',
                        timestamp: '14:00',
                        status: 'read'
                    },
                    {
                        id: 11,
                        sender: 'clinic',
                        content: 'Hola Pedro, después del implante debes evitar comidas muy calientes los primeros días, no hacer ejercicio intenso y tomar la medicación que te hemos prescrito. Si tienes alguna duda, no dudes en contactarnos.',
                        timestamp: '14:10',
                        status: 'delivered'
                    },
                    {
                        id: 12,
                        sender: 'patient',
                        content: 'Perfecto, muchas gracias',
                        timestamp: '14:20',
                        status: 'read'
                    }
                ]
            }
        ];
    }

    renderConversationsList() {
        const container = document.getElementById('chatList');
        if (!container) return;

        // Sort by last message time
        const sortedConversations = [...this.conversations].sort((a, b) => {
            return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
        });

        container.innerHTML = sortedConversations.map(conv => `
            <div class="chat-item ${conv.id === this.activeConversation ? 'active' : ''}" 
                 data-conversation="${conv.id}">
                <div class="chat-avatar">
                    ${conv.avatar}
                </div>
                <div class="chat-info">
                    <div class="chat-name">${conv.name}</div>
                    <div class="chat-preview">${conv.lastMessage}</div>
                </div>
                <div class="chat-time">${this.formatTimeForList(conv.lastMessageTime)}</div>
                ${conv.unreadCount > 0 ? `<div class="chat-badge">${conv.unreadCount}</div>` : ''}
                ${conv.isOnline ? '<div class="online-indicator"></div>' : ''}
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.chat-item').forEach(item => {
            item.addEventListener('click', () => {
                const conversationId = parseInt(item.dataset.conversation);
                this.selectConversation(conversationId);
            });
        });
    }

    selectConversation(conversationId) {
        this.activeConversation = conversationId;
        
        // Update conversation list
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-conversation="${conversationId}"]`).classList.add('active');

        // Update chat header
        this.updateChatHeader(conversationId);
        
        // Display messages
        this.displayMessages(conversationId);
        
        // Show input container
        const inputContainer = document.getElementById('chatInputContainer');
        if (inputContainer) {
            inputContainer.style.display = 'block';
        }

        // Mark as read
        this.markAsRead(conversationId);
    }

    updateChatHeader(conversationId) {
        const conversation = this.conversations.find(c => c.id === conversationId);
        const header = document.getElementById('chatHeader');
        
        if (!conversation || !header) return;

        header.innerHTML = `
            <div class="chat-info">
                <h3>${conversation.name}</h3>
                <p class="chat-status">
                    ${conversation.isOnline ? 'En línea' : 'Última vez: ' + this.formatTimeForList(conversation.lastMessageTime)}
                </p>
            </div>
            <div class="chat-actions">
                <button class="chat-action-btn" onclick="whatsAppManager.viewPatientProfile(${conversation.patientId})">
                    <i class="fas fa-user"></i>
                </button>
                <button class="chat-action-btn" onclick="whatsAppManager.sendQuickResponse('${conversation.name}')">
                    <i class="fas fa-bolt"></i>
                </button>
                <button class="chat-action-btn" onclick="whatsAppManager.scheduleAppointment(${conversation.patientId})">
                    <i class="fas fa-calendar"></i>
                </button>
            </div>
        `;
    }

    displayMessages(conversationId) {
        const conversation = this.conversations.find(c => c.id === conversationId);
        const container = document.getElementById('chatMessages');
        
        if (!conversation || !container) return;

        const messagesHtml = conversation.messages.map(msg => `
            <div class="message ${msg.sender}">
                <div class="message-content">
                    ${this.formatMessageContent(msg.content, msg.type)}
                    <div class="message-time">${msg.timestamp}</div>
                </div>
            </div>
        `).join('');

        container.innerHTML = messagesHtml;
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;

        // Show "no chat" message if no conversation selected
        if (messagesHtml === '') {
            container.innerHTML = `
                <div class="no-chat-selected">
                    <i class="fab fa-whatsapp"></i>
                    <h3>Selecciona una conversación para empezar</h3>
                    <p>Elige un paciente de la lista para ver el historial de mensajes</p>
                </div>
            `;
        }
    }

    formatMessageContent(content, type = 'text') {
        if (type === 'image') {
            return `<img src="${content}" alt="Imagen" style="max-width: 200px; border-radius: 8px;">`;
        } else if (type === 'document') {
            return `
                <div style="background: white; padding: 12px; border-radius: 8px; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-file-pdf" style="color: #ff4444;"></i>
                    <span>${content}</span>
                </div>
            `;
        }
        return content.replace(/\n/g, '<br>');
    }

    sendMessage() {
        const input = document.getElementById('messageInput');
        const content = input.value.trim();
        
        if (!content || !this.activeConversation) return;

        const conversation = this.conversations.find(c => c.id === this.activeConversation);
        if (!conversation) return;

        // Add message to conversation
        const newMessage = {
            id: Math.max(...conversation.messages.map(m => m.id), 0) + 1,
            sender: 'clinic',
            content: content,
            timestamp: this.formatTime(new Date()),
            status: 'sent'
        };

        conversation.messages.push(newMessage);
        conversation.lastMessage = content;
        conversation.lastMessageTime = newMessage.timestamp;

        // Clear input
        input.value = '';

        // Update display
        this.displayMessages(this.activeConversation);
        this.renderConversationsList();

        // Simulate AI response
        this.simulateAIResponse(conversation);
    }

    simulateAIResponse(conversation) {
        const aiResponses = [
            "Gracias por su mensaje. ¿En qué más puedo ayudarle?",
            "Entendido. Le contactaremos pronto.",
            "¿Podría proporcionarnos más detalles?",
            "Le enviaremos la información por este medio.",
            "¿Desea agendar una cita?",
            "Estamos aquí para ayudarle con cualquier consulta."
        ];

        setTimeout(() => {
            const aiMessage = {
                id: Math.max(...conversation.messages.map(m => m.id), 0) + 1,
                sender: 'ai',
                content: aiResponses[Math.floor(Math.random() * aiResponses.length)],
                timestamp: this.formatTime(new Date()),
                status: 'delivered'
            };

            conversation.messages.push(aiMessage);
            conversation.lastMessage = aiMessage.content;
            conversation.lastMessageTime = aiMessage.timestamp;

            // Update display if still in same conversation
            if (this.activeConversation === conversation.id) {
                this.displayMessages(conversation.id);
                this.renderConversationsList();
            }
        }, 2000 + Math.random() * 3000); // Random delay between 2-5 seconds
    }

    markAsRead(conversationId) {
        const conversation = this.conversations.find(c => c.id === conversationId);
        if (conversation) {
            conversation.unreadCount = 0;
            
            // Update message statuses
            conversation.messages.forEach(msg => {
                if (msg.sender === 'patient' && msg.status === 'delivered') {
                    msg.status = 'read';
                }
            });

            this.renderConversationsList();
        }
    }

    handleTyping() {
        // This would typically send typing indicators to the other party
        // For now, we'll just simulate it locally
        const input = document.getElementById('messageInput');
        const isTyping = input.value.length > 0;
        
        if (isTyping && !this.isTyping) {
            this.isTyping = true;
            // Simulate typing indicator
        } else if (!isTyping && this.isTyping) {
            this.isTyping = false;
            // Stop typing indicator
        }
    }

    showFileAttachment() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,.pdf,.doc,.docx';
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.sendFile(file);
            }
        });
        
        input.click();
    }

    sendFile(file) {
        if (!this.activeConversation) return;

        const conversation = this.conversations.find(c => c.id === this.activeConversation);
        if (!conversation) return;

        let content, type;
        
        if (file.type.startsWith('image/')) {
            content = URL.createObjectURL(file);
            type = 'image';
        } else {
            content = file.name;
            type = 'document';
        }

        const newMessage = {
            id: Math.max(...conversation.messages.map(m => m.id), 0) + 1,
            sender: 'clinic',
            content: content,
            type: type,
            timestamp: this.formatTime(new Date()),
            status: 'sent'
        };

        conversation.messages.push(newMessage);
        conversation.lastMessage = `Envió ${type === 'image' ? 'una imagen' : 'un archivo'}`;
        conversation.lastMessageTime = newMessage.timestamp;

        // Update display
        this.displayMessages(this.activeConversation);
        this.renderConversationsList();
    }

    showNewMessageModal() {
        // Simple prompt for new message (in a real app, this would be a proper modal)
        const patientName = prompt('Nombre del paciente:');
        if (patientName) {
            // Create new conversation
            const newConversation = {
                id: Math.max(...this.conversations.map(c => c.id), 0) + 1,
                patientId: Math.max(...this.conversations.map(c => c.patientId), 0) + 1,
                name: patientName,
                avatar: patientName.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase(),
                lastMessage: 'Conversación iniciada',
                lastMessageTime: this.formatTime(new Date()),
                unreadCount: 0,
                isOnline: false,
                messages: []
            };

            this.conversations.push(newConversation);
            this.renderConversationsList();
            this.selectConversation(newConversation.id);
        }
    }

    viewPatientProfile(patientId) {
        // Navigate to patient profile
        if (window.dentalApp) {
            window.dentalApp.navigateToSection('pacientes');
            // Additional logic to open specific patient
        }
    }

    sendQuickResponse(patientName) {
        const quickResponses = [
            'Su cita ha sido confirmada para ',
            'Le contactaremos pronto para confirmar',
            'Gracias por contactarnos. Su consulta es importante para nosotros.',
            '¿Podría proporcionarnos más detalles sobre su consulta?',
            'Le hemos enviado la información por email.'
        ];

        const response = quickResponses[Math.floor(Math.random() * quickResponses.length)];
        
        const input = document.getElementById('messageInput');
        if (input) {
            input.value = response;
            input.focus();
        }
    }

    scheduleAppointment(patientId) {
        // Open appointment modal with patient pre-selected
        if (window.dentalApp) {
            window.dentalApp.openModal('appointmentModal');
            
            // Pre-select patient if possible
            const patientSelect = document.querySelector('#appointmentForm select[name="patient"]');
            if (patientSelect) {
                patientSelect.value = patientId;
            }
        }
    }

    // Utility methods
    formatTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    formatTimeForList(timeString) {
        const time = new Date(timeString);
        const now = new Date();
        const diffInHours = (now - time) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            const minutes = Math.floor(diffInHours * 60);
            return `${minutes}min`;
        } else if (diffInHours < 24) {
            return this.formatTime(time);
        } else {
            return time.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        }
    }

    getTotalUnreadCount() {
        return this.conversations.reduce((total, conv) => total + conv.unreadCount, 0);
    }

    searchConversations(query) {
        return this.conversations.filter(conv => 
            conv.name.toLowerCase().includes(query.toLowerCase()) ||
            conv.lastMessage.toLowerCase().includes(query.toLowerCase())
        );
    }

    exportConversation(conversationId) {
        const conversation = this.conversations.find(c => c.id === conversationId);
        if (!conversation) return null;

        const exportData = {
            patient: conversation.name,
            messages: conversation.messages,
            exportDate: new Date().toISOString()
        };

        return JSON.stringify(exportData, null, 2);
    }
}

// Initialize WhatsApp when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.whatsAppManager = new WhatsAppManager();
});