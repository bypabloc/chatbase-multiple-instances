// Este script usa el modo iframe por defecto para evitar conflictos al cambiar entre bots
// Puedes cambiar useIframeMode a false si prefieres el widget, pero puede causar errores

// Configuración actual de bots (se carga desde localStorage)
let bots = [];

// Variable para rastrear las instancias de Chatbase
let chatInstances = {}; // Almacena las instancias por botId
let currentBotId = null;
let lastMinimizedBotId = null; // Última instancia minimizada
let isTransitioning = false;
let useIframeMode = true; // Usar iframe por defecto para evitar conflictos


// Cargar bots guardados del localStorage
function loadBots() {
    try {
        const savedBots = localStorage.getItem('chatbaseBots');
        if (savedBots) {
            bots = JSON.parse(savedBots);
        } else {
            bots = [];
        }
        
        // Solo renderizar después de que bots esté cargado
        renderExperts();
        updateFloatingChatButton();
    } catch (error) {
        console.error('Error cargando bots:', error);
        bots = [];
        renderExperts();
        updateFloatingChatButton();
    }
}

// Guardar bots en localStorage
function saveBots() {
    localStorage.setItem('chatbaseBots', JSON.stringify(bots));
}

// Limpiar todos los bots
function clearAllBots() {
    if (confirm('¿Estás seguro de que quieres eliminar todos los bots? Esta acción no se puede deshacer.')) {
        try {
            // Limpiar todas las instancias de chat existentes
            cleanupAllInstances();
            
            // Limpiar bots
            bots = [];
            saveBots();
            renderExperts();
            renderBotList();
            updateFloatingChatButton();
            
            console.log('Todos los bots eliminados');
        } catch (error) {
            console.error('Error eliminando bots:', error);
        }
    }
}

// Importar configuración desde archivo JSON
function importFromFile() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Por favor selecciona un archivo JSON');
        return;
    }
    
    if (!file.name.toLowerCase().endsWith('.json')) {
        alert('El archivo debe ser de tipo JSON');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validar que sea un array
            if (!Array.isArray(importedData)) {
                alert('El archivo JSON debe contener un array de bots');
                return;
            }
            
            // Validar estructura de cada bot
            const isValidData = importedData.every(bot => {
                return bot && 
                       typeof bot === 'object' &&
                       typeof bot.id === 'string' &&
                       typeof bot.name === 'string' &&
                       typeof bot.description === 'string' &&
                       typeof bot.chatbaseId === 'string' &&
                       (bot.avatar === null || typeof bot.avatar === 'string') &&
                       typeof bot.isDefault === 'boolean';
            });
            
            if (!isValidData) {
                alert('El archivo JSON no tiene el formato correcto. Cada bot debe tener: id, name, description, chatbaseId, avatar, isDefault');
                return;
            }
            
            if (confirm(`¿Estás seguro de que quieres importar ${importedData.length} bot(s)? Esto reemplazará la configuración actual.`)) {
                // Limpiar todas las instancias de chat existentes
                cleanupAllInstances();
                
                // Importar nuevos datos
                bots = importedData;
                saveBots();
                renderExperts();
                renderBotList();
                updateFloatingChatButton();
                
                // Limpiar el input de archivo
                fileInput.value = '';
                
                alert(`Se importaron ${importedData.length} bot(s) correctamente`);
                console.log('Datos importados correctamente:', importedData);
            }
            
        } catch (error) {
            console.error('Error importando archivo:', error);
            alert('Error al procesar el archivo JSON. Verifica que el formato sea válido.');
        }
    };
    
    reader.readAsText(file);
}

// Obtener el bot por defecto
function getDefaultBot() {
    if (!bots || bots.length === 0) {
        return null;
    }
    return bots.find(bot => bot.isDefault) || bots[0];
}

// Establecer bot por defecto
function setDefaultBot(botId) {
    bots.forEach(bot => {
        bot.isDefault = (bot.id === botId);
    });
    saveBots();
    updateFloatingChatButton();
}

// Crear/actualizar el bubble button flotante
function updateFloatingChatButton() {
    // Remover bubble button existente si existe
    const existingButton = document.getElementById('floating-chat-button');
    if (existingButton) {
        existingButton.remove();
    }
    
    // Si hay una instancia activa/visible, no mostrar el botón
    if (currentBotId) {
        return;
    }
    
    // Si no hay bots cargados, no hacer nada
    if (!bots || bots.length === 0) {
        return;
    }
    
    // Determinar qué mostrar
    let targetBot = null;
    let buttonText = '';
    
    if (lastMinimizedBotId && chatInstances[lastMinimizedBotId]) {
        // Mostrar la última instancia minimizada
        targetBot = bots.find(b => b.id === lastMinimizedBotId);
        if (targetBot) {
            buttonText = `Abrir ${targetBot.name}`;
        }
    } else {
        // No hay chat activo, mostrar el bot por defecto
        targetBot = getDefaultBot();
        if (targetBot) {
            buttonText = `Abrir ${targetBot.name}`;
        }
    }
    
    if (targetBot) {
        createFloatingChatButton(targetBot, buttonText);
    }
}


// Crear el bubble button flotante
function createFloatingChatButton(bot, buttonText) {
    const floatingButton = document.createElement('button');
    floatingButton.id = 'floating-chat-button';
    floatingButton.title = buttonText;
    
    // SVG icono de chat
    floatingButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
    
    // El botón siempre aparece a la derecha
    floatingButton.className = 'floating-chat-button floating-chat-button-right';
    
    // Click handler
    floatingButton.onclick = () => {
        if (floatingButton.disabled) return; // No hacer nada si está deshabilitado
        
        if (lastMinimizedBotId && chatInstances[lastMinimizedBotId]) {
            // Restaurar la última instancia minimizada
            restoreChatInstance(lastMinimizedBotId);
        } else {
            // Abrir el bot por defecto
            openChatbase(bot.chatbaseId, bot.id);
        }
    };
    
    document.body.appendChild(floatingButton);
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
            // Si está minimizado, restaurarlo y minimizar cualquier otra instancia visible
            console.log('Restaurando instancia minimizada');
            restoreChatInstance(botId);
        }
        return;
    }

    console.log('No existe instancia, creando nueva');
    
    // Si hay otra instancia visible de un bot diferente, minimizarla (no destruirla)
    if (currentBotId && currentBotId !== botId && chatInstances[currentBotId] && chatInstances[currentBotId].isVisible) {
        console.log(`Minimizando instancia anterior: ${currentBotId}`);
        minimizeChatInstance(currentBotId);
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
            // Cuando se minimiza, volver al estado original
            button.textContent = `HABLAR CON ${bot.name.toUpperCase()}`;
            console.log(`Botón actualizado a HABLAR CON (minimizado) para ${bot.name}`);
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
    
    // Remover event listener de click fuera cuando se minimiza
    if (instance.outsideClickHandler) {
        document.removeEventListener('click', instance.outsideClickHandler);
    }
    
    console.log(`Ocultando container para bot ${botId}`);
    instance.container.style.display = 'none';
    instance.isVisible = false;
    
    updateButtonState(botId, 'minimized');
    currentBotId = null;
    lastMinimizedBotId = botId;
    updateFloatingChatButton();
    console.log(`Bot ${botId} minimizado exitosamente`);
}

// Función para restaurar instancia
function restoreChatInstance(botId) {
    console.log(`restoreChatInstance llamado para bot: ${botId}`);
    
    if (!chatInstances[botId]) {
        console.error(`No existe instancia para bot: ${botId}`);
        return;
    }
    
    // Remover floating button inmediatamente al iniciar la restauración
    const existingFloatingButton = document.getElementById('floating-chat-button');
    if (existingFloatingButton) {
        existingFloatingButton.remove();
    }
    
    // Si hay otra instancia visible de un bot diferente, minimizarla
    if (currentBotId && currentBotId !== botId && chatInstances[currentBotId] && chatInstances[currentBotId].isVisible) {
        console.log(`Minimizando instancia visible anterior: ${currentBotId}`);
        minimizeChatInstance(currentBotId);
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
    if (lastMinimizedBotId === botId) {
        lastMinimizedBotId = null;
    }
    
    // Reactivar event listener de click fuera cuando se restaura
    if (instance.outsideClickHandler) {
        setTimeout(() => {
            document.addEventListener('click', instance.outsideClickHandler);
        }, 100);
    }
    
    updateFloatingChatButton();
    console.log(`Bot ${botId} restaurado exitosamente`);
}

// Función auxiliar para abrir la instancia de Chatbase
function openChatbaseInstance(chatbotId, botId) {
    try {
        // Remover floating button inmediatamente al iniciar la carga
        const existingFloatingButton = document.getElementById('floating-chat-button');
        if (existingFloatingButton) {
            existingFloatingButton.remove();
        }

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
            closeBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
            closeBtn.style.cssText = `
                margin-top: 10px;
                background: #2563eb;
                color: white;
                border: none;
                width: 45px;
                height: 45px;
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                z-index: 10;
                padding: 0;
            `;
            
            // Hover effect
            closeBtn.addEventListener('mouseenter', () => {
                closeBtn.style.background = '#1d4ed8';
                closeBtn.style.transform = 'scale(1.1)';
                closeBtn.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.4)';
            });
            
            closeBtn.addEventListener('mouseleave', () => {
                closeBtn.style.background = '#2563eb';
                closeBtn.style.transform = 'scale(1)';
                closeBtn.style.boxShadow = '0 4px 15px rgba(37, 99, 235, 0.3)';
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
                updateFloatingChatButton();
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

            // Agregar event listener para click fuera del container
            const handleOutsideClick = (event) => {
                if (!chatContainer.contains(event.target)) {
                    minimizeChatInstance(botId);
                    document.removeEventListener('click', handleOutsideClick);
                }
            };
            
            // Agregar el listener después de un pequeño delay para evitar que se active inmediatamente
            setTimeout(() => {
                document.addEventListener('click', handleOutsideClick);
            }, 100);

            // Guardar la instancia
            chatInstances[botId] = {
                container: chatContainer,
                iframe: iframe,
                isVisible: true,
                chatbotId: chatbotId,
                outsideClickHandler: handleOutsideClick
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
    
    // Remover event listener de click fuera si existe
    if (instance.outsideClickHandler) {
        document.removeEventListener('click', instance.outsideClickHandler);
    }
    
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
                } catch {
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
            <div class="bot-controls">
                <label class="default-radio-label">
                    <input type="radio" name="defaultBot" value="${bot.id}" ${bot.isDefault ? 'checked' : ''} 
                           onchange="setDefaultBot('${bot.id}')" class="default-radio">
                    <span class="radio-text">Por defecto</span>
                </label>
                <button class="delete-bot" onclick="deleteBot(${index})">Eliminar</button>
            </div>
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
        avatar: avatar || null, // Si no hay avatar, usar null
        isDefault: false // Los nuevos bots no son por defecto
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


// Hacer funciones globales para los onclick
window.openChatbase = openChatbase;
window.openConfig = openConfig;
window.closeConfig = closeConfig;
window.addBot = addBot;
window.deleteBot = deleteBot;
window.setDefaultBot = setDefaultBot;
window.clearAllBots = clearAllBots;
window.importFromFile = importFromFile;
window.debugChatInstances = debugChatInstances;

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    loadBots();
});