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

// Variable para rastrear las instancias de Chatbase
let chatInstances = {}; // Almacena las instancias por botId
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

// Abrir/Minimizar/Restaurar Chatbase
function openChatbase(chatbotId, botId) {
    console.log(`openChatbase llamado para bot: ${botId}, chatbotId: ${chatbotId}`);
    
    // Evitar clicks durante la transición
    if (isTransitioning) {
        console.log('Transición en progreso, ignorando click');
        return;
    }

    const button = document.getElementById(`btn-${botId}`);
    console.log('Botón encontrado:', !!button);
    
    // Si ya existe una instancia para este bot
    if (chatInstances[botId]) {
        const instance = chatInstances[botId];
        console.log(`Instancia existente encontrada. Visible: ${instance.isVisible}`);
        
        if (instance.isVisible) {
            // Si está visible, minimizarlo
            console.log('Minimizando instancia visible');
            minimizeChatInstance(botId);
        } else {
            // Si está minimizado, restaurarlo
            console.log('Restaurando instancia minimizada');
            restoreChatInstance(botId);
        }
        return;
    }

    console.log('No existe instancia, creando nueva');
    
    // Si hay otra instancia de un bot diferente, destruirla completamente
    if (currentBotId && currentBotId !== botId && chatInstances[currentBotId]) {
        console.log(`Destruyendo instancia anterior: ${currentBotId}`);
        destroyChatInstance(currentBotId);
    }

    // Crear nueva instancia
    setButtonLoading(button, true);
    openChatbaseInstance(chatbotId, botId);
}

// Función para establecer estado de loading en botón
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
        button.textContent = 'CARGANDO...';
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

// Función para actualizar estado del botón
function updateButtonState(botId, state) {
    console.log(`updateButtonState llamado para bot: ${botId}, estado: ${state}`);
    
    const button = document.getElementById(`btn-${botId}`);
    const bot = bots.find(b => b.id === botId);
    
    if (!button || !bot) {
        console.error(`Botón o bot no encontrado. Botón: ${!!button}, Bot: ${!!bot}`);
        return;
    }
    
    // Limpiar todas las clases de estado
    button.classList.remove('active', 'loading', 'minimized');
    button.disabled = false;
    
    switch(state) {
        case 'active':
            button.classList.add('active');
            button.textContent = `MINIMIZAR ${bot.name.toUpperCase()}`;
            console.log(`Botón actualizado a MINIMIZAR para ${bot.name}`);
            break;
        case 'minimized':
            button.classList.add('minimized');
            button.textContent = `RESTAURAR ${bot.name.toUpperCase()}`;
            console.log(`Botón actualizado a RESTAURAR para ${bot.name}`);
            break;
        case 'loading':
            button.classList.add('loading');
            button.textContent = 'CARGANDO...';
            button.disabled = true;
            console.log(`Botón actualizado a CARGANDO para ${bot.name}`);
            break;
        default:
            button.textContent = `HABLAR CON ${bot.name.toUpperCase()}`;
            console.log(`Botón actualizado a HABLAR CON para ${bot.name}`);
    }
}

// Función para minimizar instancia
function minimizeChatInstance(botId) {
    console.log(`minimizeChatInstance llamado para bot: ${botId}`);
    
    if (!chatInstances[botId]) {
        console.error(`No existe instancia para bot: ${botId}`);
        return;
    }
    
    const instance = chatInstances[botId];
    console.log('Instance container:', !!instance.container);
    
    // Verificar que el container existe antes de minimizar
    if (!instance.container || !document.body.contains(instance.container)) {
        console.error(`Container for bot ${botId} not found in DOM during minimize`);
        return;
    }
    
    console.log(`Ocultando container para bot ${botId}`);
    instance.container.style.display = 'none';
    instance.isVisible = false;
    
    updateButtonState(botId, 'minimized');
    currentBotId = null;
    console.log(`Bot ${botId} minimizado exitosamente`);
}

// Función para restaurar instancia
function restoreChatInstance(botId) {
    console.log(`restoreChatInstance llamado para bot: ${botId}`);
    
    if (!chatInstances[botId]) {
        console.error(`No existe instancia para bot: ${botId}`);
        return;
    }
    
    // Si hay otra instancia visible de un bot diferente, destruirla
    if (currentBotId && currentBotId !== botId && chatInstances[currentBotId]) {
        console.log(`Destruyendo instancia visible anterior: ${currentBotId}`);
        destroyChatInstance(currentBotId);
    }
    
    const instance = chatInstances[botId];
    console.log('Instance antes de restaurar:', {
        hasContainer: !!instance.container,
        isVisible: instance.isVisible,
        containerInDOM: instance.container ? document.body.contains(instance.container) : false,
        currentDisplay: instance.container ? instance.container.style.display : 'N/A'
    });
    
    // Verificar que el container aún existe en el DOM
    if (!instance.container || !document.body.contains(instance.container)) {
        console.error(`Container for bot ${botId} no longer exists in DOM. Recreating...`);
        // Si el container no existe, destruir la instancia y crear una nueva
        delete chatInstances[botId];
        const bot = bots.find(b => b.id === botId);
        if (bot) {
            console.log(`Recreando instancia para bot: ${botId}`);
            openChatbaseInstance(bot.chatbaseId, botId);
        }
        return;
    }
    
    // Restaurar la visibilidad del container
    console.log(`Restaurando bot ${botId}, display antes:`, instance.container.style.display);
    instance.container.style.display = 'flex';
    instance.container.style.visibility = 'visible';
    instance.isVisible = true;
    
    // Verificar que efectivamente se aplicó el cambio
    console.log(`Display después del cambio:`, instance.container.style.display);
    console.log(`Container visible en pantalla:`, instance.container.offsetWidth > 0 && instance.container.offsetHeight > 0);
    
    updateButtonState(botId, 'active');
    currentBotId = botId;
    console.log(`Bot ${botId} restaurado exitosamente`);
}

// Función auxiliar para abrir la instancia de Chatbase
function openChatbaseInstance(chatbotId, botId) {
    try {

        if (useIframeMode) {
            // Método iframe (más estable)
            const isMobile = window.innerWidth <= 768;
            const chatContainer = document.createElement('div');
            chatContainer.id = `chatbase-chat-container-${botId}`;
            
            const iframeContainer = document.createElement('div');
            iframeContainer.id = `chatbase-iframe-container-${botId}`;
            
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
            
            // Botón X solo minimiza, no destruye
            closeBtn.onclick = () => minimizeChatInstance(botId);

            const iframe = document.createElement('iframe');
            iframe.src = `https://www.chatbase.co/chatbot-iframe/${chatbotId}`;
            iframe.style.cssText = `
                width: 100%;
                height: 100%;
                border: none;
            `;
            iframe.allow = "microphone";

            // Manejar cuando el iframe termine de cargar
            iframe.onload = () => {
                updateButtonState(botId, 'active');
                isTransitioning = false;
            };

            // Manejar errores de carga
            iframe.onerror = () => {
                updateButtonState(botId, 'default');
                isTransitioning = false;
                console.error('Error al cargar el iframe de Chatbase');
            };

            iframeContainer.appendChild(iframe);
            chatContainer.appendChild(iframeContainer);
            chatContainer.appendChild(closeBtn);
            document.body.appendChild(chatContainer);

            // Guardar la instancia
            chatInstances[botId] = {
                container: chatContainer,
                iframe: iframe,
                isVisible: true,
                chatbotId: chatbotId
            };
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
            script.id = `chatbase-script-${botId}`;
            
            script.onload = () => {
                updateButtonState(botId, 'active');
                isTransitioning = false;
            };
            
            script.onerror = function() {
                console.error('Error al cargar Chatbase - cambiando a modo iframe');
                useIframeMode = true;
                updateButtonState(botId, 'default');
                isTransitioning = false;
            };
            
            document.body.appendChild(script);
            
            // Guardar la instancia (para widget mode)
            chatInstances[botId] = {
                script: script,
                isVisible: true,
                chatbotId: chatbotId
            };
        }

        currentBotId = botId;
        
    } catch (error) {
        console.error('Error al abrir Chatbase:', error);
        updateButtonState(botId, 'default');
        isTransitioning = false;
    }
}

// Función para limpiar completamente una instancia
function destroyChatInstance(botId) {
    if (!chatInstances[botId]) return;
    
    const instance = chatInstances[botId];
    
    if (instance.container) {
        instance.container.remove();
    }
    
    if (instance.script) {
        instance.script.remove();
    }
    
    if (instance.iframe) {
        instance.iframe.src = 'about:blank';
    }
    
    // Limpiar elementos específicos del bot si es modo widget
    if (!useIframeMode) {
        const widgetSelectors = [
            `#chatbase-script-${botId}`,
            `[data-chatbot-id="${instance.chatbotId}"]`
        ];
        
        widgetSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => el.remove());
        });
    }
    
    delete chatInstances[botId];
    updateButtonState(botId, 'default');
    
    if (currentBotId === botId) {
        currentBotId = null;
    }
}

// Función para limpiar todas las instancias (usado al salir de la página)
function cleanupAllInstances() {
    try {
        Object.keys(chatInstances).forEach(botId => {
            destroyChatInstance(botId);
        });

        // Limpiar elementos huérfanos
        const selectorsToClean = [
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
                } catch (error) {
                    window[key] = undefined;
                }
            }
        });

        chatInstances = {};
        currentBotId = null;
        
    } catch (error) {
        console.error('Error al limpiar instancias:', error);
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
        const botToDelete = bots[index];
        
        // Limpiar la instancia de chat si existe
        if (botToDelete && chatInstances[botToDelete.id]) {
            destroyChatInstance(botToDelete.id);
        }
        
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
    cleanupAllInstances();
});

// Función de debug para inspeccionar el estado de las instancias
function debugChatInstances() {
    console.log('=== Chat Instances Debug ===');
    console.log('Current Bot ID:', currentBotId);
    console.log('Use Iframe Mode:', useIframeMode);
    console.log('Chat Instances:', Object.keys(chatInstances));
    
    Object.entries(chatInstances).forEach(([botId, instance]) => {
        console.log(`\nBot ${botId}:`);
        console.log('- Is Visible:', instance.isVisible);
        console.log('- Has Container:', !!instance.container);
        console.log('- Container in DOM:', instance.container ? document.body.contains(instance.container) : false);
        console.log('- Container Display:', instance.container ? instance.container.style.display : 'N/A');
        console.log('- Chatbot ID:', instance.chatbotId);
    });
    console.log('=======================');
}

// Función de debug para verificar el estado de las instancias
function debugChatInstances() {
    console.log('=== Estado de Chat Instances ===');
    console.log('Total instancias:', Object.keys(chatInstances).length);
    console.log('Bot actual:', currentBotId);
    
    Object.keys(chatInstances).forEach(botId => {
        const instance = chatInstances[botId];
        console.log(`\nBot: ${botId}`);
        console.log('- Visible:', instance.isVisible);
        console.log('- Container existe:', !!instance.container);
        console.log('- Container en DOM:', instance.container ? document.body.contains(instance.container) : false);
        console.log('- Display style:', instance.container ? instance.container.style.display : 'N/A');
    });
}

// Hacer funciones globales para los onclick
window.openChatbase = openChatbase;
window.openConfig = openConfig;
window.closeConfig = closeConfig;
window.addBot = addBot;
window.deleteBot = deleteBot;
window.debugChatInstances = debugChatInstances;

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    loadBots();
});