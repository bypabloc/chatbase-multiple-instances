// Este script usa el modo iframe por defecto para evitar conflictos al cambiar entre bots
// Puedes cambiar useIframeMode a false si prefieres el widget, pero puede causar errores

// Configuración inicial de bots
let bots = [
    {
        id: 'sofi',
        name: 'Sofi',
        description: 'Necesitas conversar con alguien que te entienda.',
        chatbaseId: 'GR66sR8t9ryra-9i1K5Ri',
        avatar: null
    },
    {
        id: 'cami',
        name: 'Cami',
        description: 'Quieres un estrategia para negociar tus deudas.',
        chatbaseId: 'SriqJSZWPW_Xkfws0rwKl',
        avatar: null
    },
    {
        id: 'lucas',
        name: 'Lucas',
        description: 'Tu plata no te está alcanzando hasta fin de mes.',
        chatbaseId: 'GR66sR8t9ryra-9i1K5Ri',
        avatar: null
    },
    {
        id: 'carmen',
        name: 'Carmen',
        description: 'No sabes qué necesitas, partamos por ahí.',
        chatbaseId: 'SriqJSZWPW_Xkfws0rwKl',
        avatar: null
    }
];

// Variable para rastrear la instancia actual de Chatbase
let currentChatbaseInstance = null;
let currentBotId = null;
let isTransitioning = false;
let useIframeMode = true; // Usar iframe por defecto para evitar conflictos

// Cargar bots guardados del localStorage
function loadBots() {
    const savedBots = localStorage.getItem('chatbaseBots');
    if (savedBots) {
        bots = JSON.parse(savedBots);
    }
    renderExperts();
}

// Guardar bots en localStorage
function saveBots() {
    localStorage.setItem('chatbaseBots', JSON.stringify(bots));
}

// Renderizar expertos
function renderExperts() {
    const grid = document.getElementById('expertsGrid');
    grid.innerHTML = '';

    bots.forEach(bot => {
        const card = document.createElement('div');
        card.className = 'expert-card';
        
        // Función para obtener las iniciales del nombre
        const getInitials = (name) => {
            return name.split(' ').map(word => word[0]).join('').slice(0, 2);
        };
        
        card.innerHTML = `
            <div class="avatar-container">
                <div id="avatar-${bot.id}" class="avatar-fallback">${getInitials(bot.name)}</div>
            </div>
            <h3 class="expert-name">${bot.name}</h3>
            <p class="expert-description">${bot.description}</p>
            <button class="talk-button" id="btn-${bot.id}" onclick="openChatbase('${bot.chatbaseId}', '${bot.id}')">
                HABLAR CON ${bot.name.toUpperCase()}
            </button>
        `;
        grid.appendChild(card);
        
        // Intentar cargar la imagen del avatar
        if (bot.avatar) {
            const img = new Image();
            img.onload = function() {
                const avatarDiv = document.getElementById(`avatar-${bot.id}`);
                if (avatarDiv) {
                    avatarDiv.outerHTML = `<img src="${bot.avatar}" alt="${bot.name}" class="avatar">`;
                }
            };
            img.onerror = function() {
                // Si falla la carga, mantener el fallback con iniciales
                console.log(`No se pudo cargar el avatar para ${bot.name}`);
            };
            img.src = bot.avatar;
        }
    });
}

// Abrir Chatbase
function openChatbase(chatbotId, botId) {
    // Evitar clicks durante la transición
    if (isTransitioning) return;

    // Si hay una instancia activa y es diferente, cerrarla
    if (currentChatbaseInstance && currentBotId !== botId) {
        isTransitioning = true;
        closeChatbase();
        
        // Pequeño delay para asegurar limpieza
        setTimeout(() => {
            openChatbaseInstance(chatbotId, botId);
            isTransitioning = false;
        }, 200);
        return;
    }

    // Si es el mismo bot, alternar (cerrar/abrir)
    if (currentBotId === botId) {
        closeChatbase();
        return;
    }

    openChatbaseInstance(chatbotId, botId);
}

// Función auxiliar para abrir la instancia de Chatbase
function openChatbaseInstance(chatbotId, botId) {
    try {
        // Actualizar el botón activo
        document.querySelectorAll('.talk-button').forEach(btn => {
            btn.classList.remove('active');
            btn.textContent = btn.textContent.replace('CERRAR CHAT CON', 'HABLAR CON');
        });

        const activeButton = document.getElementById(`btn-${botId}`);
        if (activeButton) {
            activeButton.classList.add('active');
            const botName = bots.find(b => b.id === botId).name.toUpperCase();
            activeButton.textContent = `CERRAR CHAT CON ${botName}`;
        }

        if (useIframeMode) {
            // Método iframe (más estable)
            const isMobile = window.innerWidth <= 768;
            const chatContainer = document.createElement('div');
            chatContainer.id = 'chatbase-chat-container';
            
            const iframeContainer = document.createElement('div');
            iframeContainer.id = 'chatbase-iframe-container';
            
            if (isMobile) {
                // Estilo móvil
                chatContainer.style.cssText = `
                    position: fixed;
                    bottom: 10px;
                    right: 10px;
                    left: 10px;
                    width: calc(100vw - 20px);
                    height: calc(100vh - 100px);
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                `;
                
                iframeContainer.style.cssText = `
                    width: 100%;
                    height: calc(100% - 60px);
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                    background: white;
                `;
            } else {
                // Estilo desktop
                chatContainer.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 400px;
                    height: 650px;
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                `;
                
                iframeContainer.style.cssText = `
                    width: 100%;
                    height: calc(100% - 60px);
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                    background: white;
                `;
            }

            // Botón bubble debajo del chat - alineado a la derecha
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '×';
            closeBtn.style.cssText = `
                margin-top: 10px;
                background: #ef4444;
                color: white;
                border: none;
                width: 45px;
                height: 45px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 24px;
                font-weight: bold;
                box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                z-index: 10;
            `;
            
            // Hover effect
            closeBtn.addEventListener('mouseenter', () => {
                closeBtn.style.background = '#dc2626';
                closeBtn.style.transform = 'scale(1.1)';
                closeBtn.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
            });
            
            closeBtn.addEventListener('mouseleave', () => {
                closeBtn.style.background = '#ef4444';
                closeBtn.style.transform = 'scale(1)';
                closeBtn.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3)';
            });
            
            closeBtn.onclick = () => closeChatbase();

            const iframe = document.createElement('iframe');
            iframe.src = `https://www.chatbase.co/chatbot-iframe/${chatbotId}`;
            iframe.style.cssText = `
                width: 100%;
                height: 100%;
                border: none;
            `;
            iframe.allow = "microphone";

            iframeContainer.appendChild(iframe);
            chatContainer.appendChild(iframeContainer);
            chatContainer.appendChild(closeBtn);
            document.body.appendChild(chatContainer);

            currentChatbaseInstance = chatContainer;
        } else {
            // Método widget (puede tener conflictos)
            const chatbaseNamespace = `chatbase_${Date.now()}`;
            
            window[chatbaseNamespace] = {
                chatbotId: chatbotId,
                domain: "www.chatbase.co"
            };
            
            window.embeddedChatbotConfig = window[chatbaseNamespace];

            const script = document.createElement('script');
            script.src = "https://www.chatbase.co/embed.min.js?" + Date.now();
            script.setAttribute('chatbotId', chatbotId);
            script.setAttribute('domain', 'www.chatbase.co');
            script.defer = true;
            script.id = 'chatbase-script-' + Date.now();
            
            script.onerror = function() {
                console.error('Error al cargar Chatbase - cambiando a modo iframe');
                useIframeMode = true;
                closeChatbase();
                setTimeout(() => openChatbaseInstance(chatbotId, botId), 100);
            };
            
            document.body.appendChild(script);
            currentChatbaseInstance = script;
        }

        currentBotId = botId;
        isTransitioning = false;
        
    } catch (error) {
        console.error('Error al abrir Chatbase:', error);
        isTransitioning = false;
    }
}

// Cerrar Chatbase
function closeChatbase() {
    try {
        // Remover el contenedor principal del chat si existe
        const chatContainer = document.getElementById('chatbase-chat-container');
        if (chatContainer) {
            chatContainer.remove();
        }
        
        // También remover el contenedor del iframe si existe por separado
        const iframeContainer = document.getElementById('chatbase-iframe-container');
        if (iframeContainer) {
            iframeContainer.remove();
        }

        // Remover el script principal si existe
        if (currentChatbaseInstance && currentChatbaseInstance.tagName === 'SCRIPT') {
            currentChatbaseInstance.remove();
        }

        // Limpiar TODOS los elementos de Chatbase
        const selectorsToClean = [
            '#chatbase-chat-container',
            '#chatbase-iframe-container',
            '[id*="chatbase"]',
            '[id*="cb-"]',
            '[class*="chatbase"]',
            '[class*="cb-"]',
            'iframe[src*="chatbase.co"]',
            'script[src*="chatbase.co"]',
            'div[data-chatbase]',
            'button[data-chatbase]'
        ];

        selectorsToClean.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                if (el.tagName === 'IFRAME') {
                    el.src = 'about:blank';
                }
                el.remove();
            });
        });

        // Limpiar propiedades globales
        Object.keys(window).forEach(key => {
            if (key.toLowerCase().includes('chatbase') || key.toLowerCase().includes('cb')) {
                try {
                    delete window[key];
                } catch (e) {
                    window[key] = undefined;
                }
            }
        });

        // Resetear botones
        document.querySelectorAll('.talk-button').forEach(btn => {
            btn.classList.remove('active');
            const botId = btn.id.replace('btn-', '');
            const bot = bots.find(b => b.id === botId);
            if (bot) {
                btn.textContent = `HABLAR CON ${bot.name.toUpperCase()}`;
            }
        });

        currentChatbaseInstance = null;
        currentBotId = null;
        
    } catch (error) {
        console.error('Error al cerrar Chatbase:', error);
    }
}

// Abrir modal de configuración
function openConfig() {
    document.getElementById('configModal').classList.add('active');
    renderBotList();
}

// Cerrar modal de configuración
function closeConfig() {
    document.getElementById('configModal').classList.remove('active');
}

// Renderizar lista de bots en configuración
function renderBotList() {
    const botList = document.getElementById('botList');
    botList.innerHTML = '<h3 style="margin-bottom: 10px; font-size: 18px; color: #1e293b;">Bots actuales</h3>';

    bots.forEach((bot, index) => {
        const botItem = document.createElement('div');
        botItem.className = 'bot-item';
        botItem.innerHTML = `
            <div class="bot-info">
                <div class="bot-name">${bot.name}</div>
                <div class="bot-id">ID: ${bot.chatbaseId}</div>
                ${bot.avatar ? '<div class="bot-id">Avatar: Personalizado</div>' : '<div class="bot-id">Avatar: Iniciales</div>'}
            </div>
            <button class="delete-bot" onclick="deleteBot(${index})">Eliminar</button>
        `;
        botList.appendChild(botItem);
    });
}

// Agregar nuevo bot
function addBot() {
    const name = document.getElementById('botName').value.trim();
    const description = document.getElementById('botDescription').value.trim();
    const avatar = document.getElementById('botAvatar').value.trim();
    const chatbaseId = document.getElementById('botId').value.trim();

    if (!name || !description || !chatbaseId) {
        alert('Por favor, completa todos los campos obligatorios');
        return;
    }

    const newBot = {
        id: name.toLowerCase().replace(/\s/g, '-'),
        name: name,
        description: description,
        chatbaseId: chatbaseId,
        avatar: avatar || null // Si no hay avatar, usar null
    };

    bots.push(newBot);
    saveBots();
    renderExperts();
    renderBotList();

    // Limpiar formulario
    document.getElementById('botName').value = '';
    document.getElementById('botDescription').value = '';
    document.getElementById('botAvatar').value = '';
    document.getElementById('botId').value = '';
}

// Eliminar bot
function deleteBot(index) {
    if (confirm('¿Estás seguro de que quieres eliminar este bot?')) {
        bots.splice(index, 1);
        saveBots();
        renderExperts();
        renderBotList();
    }
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    const modal = document.getElementById('configModal');
    if (event.target === modal) {
        closeConfig();
    }
}

// Limpiar Chatbase al salir de la página
window.addEventListener('beforeunload', function() {
    if (currentChatbaseInstance) {
        closeChatbase();
    }
});

// Hacer funciones globales para los onclick
window.openChatbase = openChatbase;
window.openConfig = openConfig;
window.closeConfig = closeConfig;
window.addBot = addBot;
window.deleteBot = deleteBot;

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    loadBots();
});