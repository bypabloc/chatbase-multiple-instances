# Chatbase - Plataforma de Asesores Financieros IA

Una aplicación web moderna que permite a los usuarios interactuar con múltiples asesores financieros impulsados por inteligencia artificial a través de la plataforma Chatbase.co.

## 🚀 Características

- **Múltiples Asesores IA**: Gestiona y alterna entre diferentes bots especializados en asesoría financiera
- **Interfaz Responsiva**: Diseño optimizado para dispositivos móviles y desktop
- **Configuración Personalizable**: Importa/exporta configuraciones de bots en formato JSON
- **Persistencia Local**: Las configuraciones se guardan automáticamente en el navegador
- **Integración Chatbase**: Soporte completo para widgets e iframes de Chatbase.co
- **Modo Flotante**: Chat flotante con funcionalidad de minimizar/restaurar

## 📋 Requisitos

- **Node.js**: Versión 22 o superior
- **pnpm**: Versión 10 o superior
- Navegador moderno con soporte para ES6+

## 🛠️ Instalación

1. **Clona el repositorio**:
   ```bash
   git clone <url-del-repositorio>
   cd chatbase
   ```

2. **Instala las dependencias**:
   ```bash
   pnpm install
   ```

3. **Inicia el servidor de desarrollo**:
   ```bash
   pnpm run dev
   ```

4. **Abre tu navegador** en `http://localhost:3000`

## 📖 Uso

### Configuración Inicial

1. **Accede a la Configuración**: Haz clic en el botón "Configurar Bots" en la página principal
2. **Agrega un Nuevo Bot**: 
   - Haz clic en "Agregar Bot"
   - Completa los campos requeridos:
     - **ID del Bot**: ID único de tu bot de Chatbase
     - **Nombre**: Nombre descriptivo del asesor
     - **Descripción**: Breve descripción de la especialidad
     - **URL del Avatar**: Imagen del asesor (opcional)
     - **Área de Expertise**: Especialización financiera

### Ejemplo de Configuración de Bot

```json
{
  "id": "tu-bot-id-chatbase",
  "name": "María Fernández",
  "description": "Especialista en inversiones y planificación financiera personal",
  "avatarUrl": "https://example.com/avatar-maria.jpg",
  "expertise": "Inversiones y Ahorro"
}
```

### Importar Configuración desde JSON

Puedes importar múltiples bots desde un archivo JSON:

```json
[
  {
    "id": "bot-inversiones-123",
    "name": "Carlos Ruiz",
    "description": "Experto en inversiones de renta variable y fija",
    "avatarUrl": "https://example.com/carlos.jpg",
    "expertise": "Inversiones"
  },
  {
    "id": "bot-deudas-456",
    "name": "Ana López",
    "description": "Especialista en manejo de deudas y reestructuración financiera",
    "avatarUrl": "https://example.com/ana.jpg",
    "expertise": "Gestión de Deudas"
  }
]
```

### Uso de la Aplicación

1. **Selecciona un Asesor**: Haz clic en cualquier tarjeta de asesor para iniciar la conversación
2. **Chat Interactivo**: Interactúa con el asesor IA a través de la interfaz de chat
3. **Cambiar de Asesor**: Haz clic en otro asesor para cambiar de conversación
4. **Modo Flotante**: Usa el botón flotante para minimizar/restaurar el chat

## 🔧 Configuración Avanzada

### Modo de Integración

La aplicación usa **modo iframe** por defecto para evitar conflictos entre bots. Si necesitas cambiar a modo widget, modifica la variable en `script.js`:

```javascript
let useIframeMode = false; // Cambiar a false para modo widget
```

### Personalización de Estilos

Los estilos se encuentran en `styles.css` y están organizados en secciones:
- Estilos generales
- Tarjetas de asesores
- Modal de configuración
- Chat flotante
- Responsive design

## 🧪 Comandos de Desarrollo

```bash
# Servidor de desarrollo con recarga automática (Vite)
pnpm run dev

# Compilar para producción (optimizado con Vite)
pnpm run build

# Previsualizar build de producción
pnpm run preview
```

## 📱 Uso en Producción

Para desplegar en producción:

1. **Construye la aplicación con Vite**:
   ```bash
   pnpm run build
   ```

2. **Los archivos optimizados** se generan en el directorio `dist/`:
   - `index.html` - HTML optimizado con referencias de hashes
   - `assets/[name].[hash].js` - JavaScript optimizado y tree-shaken
   - `assets/[name].[hash].css` - CSS optimizado y minificado

3. **Sube el contenido del directorio `dist/`** a tu servidor web

4. **Configura tu servidor** para servir archivos estáticos

5. **Asegúrate** de que tu servidor soporte HTTPS para la integración con Chatbase

### Optimizaciones de Vite

Vite proporciona optimizaciones avanzadas:
- **Tree Shaking**: Elimina código no utilizado automáticamente
- **Code Splitting**: División inteligente de código para carga óptima
- **Asset Hashing**: Versionado automático para cache busting
- **Minificación Terser**: Compresión avanzada con eliminación de console.logs
- **CSS Optimization**: Minificación y optimización de CSS automática
- **ES Modules**: Soporte nativo para módulos modernos

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/amazing_feature`)
3. Commit tus cambios (`git commit -m 'feat(module): add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si encuentras algún problema o tienes preguntas:

1. Revisa la documentación en `CLAUDE.md`
2. Verifica que tu bot de Chatbase esté configurado correctamente
3. Asegúrate de que el ID del bot sea correcto
4. Comprueba la consola del navegador para errores

## 🎯 Próximas Características

- [ ] Soporte para temas personalizados
- [ ] Exportación de conversaciones
- [ ] Integración con más plataformas de IA
- [ ] Dashboard de analytics
- [ ] Modo offline

---

**Desarrollado con ❤️ por Pablo Contreras**
