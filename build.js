#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DIST_DIR = join(__dirname, 'dist');
const SRC_DIR = __dirname;

console.log('🚀 Iniciando build de producción...\n');

// Crear directorio dist si no existe
if (!existsSync(DIST_DIR)) {
    mkdirSync(DIST_DIR, { recursive: true });
    console.log('✅ Directorio dist creado');
}

// Limpiar dist
try {
    execSync(`rm -rf ${DIST_DIR}/*`, { stdio: 'inherit' });
    console.log('🧹 Directorio dist limpiado');
} catch (error) {
    console.log('📁 Directorio dist inicializado');
}

// Minificar JavaScript
console.log('\n📦 Minificando JavaScript...');
try {
    execSync(`npx terser ${join(SRC_DIR, 'script.js')} -o ${join(DIST_DIR, 'script.min.js')} --compress --mangle --toplevel`, { stdio: 'inherit' });
    console.log('✅ JavaScript minificado');
} catch (error) {
    console.error('❌ Error minificando JavaScript:', error.message);
    process.exit(1);
}

// Minificar CSS
console.log('\n🎨 Minificando CSS...');
try {
    execSync(`npx cleancss ${join(SRC_DIR, 'styles.css')} -o ${join(DIST_DIR, 'styles.min.css')}`, { stdio: 'inherit' });
    console.log('✅ CSS minificado');
} catch (error) {
    console.error('❌ Error minificando CSS:', error.message);
    process.exit(1);
}

// Procesar y minificar HTML
console.log('\n📄 Procesando HTML...');
try {
    let htmlContent = readFileSync(join(SRC_DIR, 'index.html'), 'utf8');
    
    // Reemplazar referencias a archivos originales con minificados
    htmlContent = htmlContent.replace('script.js', 'script.min.js');
    htmlContent = htmlContent.replace('styles.css', 'styles.min.css');
    
    // Guardar HTML temporal
    const tempHtmlPath = join(DIST_DIR, 'index.temp.html');
    writeFileSync(tempHtmlPath, htmlContent);
    
    // Minificar HTML
    execSync(`npx html-minifier-terser ${tempHtmlPath} --output ${join(DIST_DIR, 'index.html')} --remove-comments --collapse-whitespace --minify-css --minify-js`, { stdio: 'inherit' });
    
    // Eliminar archivo temporal
    execSync(`rm ${tempHtmlPath}`);
    
    console.log('✅ HTML procesado y minificado');
} catch (error) {
    console.error('❌ Error procesando HTML:', error.message);
    process.exit(1);
}

// Copiar archivos adicionales si existen
const additionalFiles = ['favicon.ico', 'robots.txt', 'sitemap.xml'];
additionalFiles.forEach(file => {
    const srcPath = join(SRC_DIR, file);
    const destPath = join(DIST_DIR, file);
    
    if (existsSync(srcPath)) {
        copyFileSync(srcPath, destPath);
        console.log(`📋 Copiado: ${file}`);
    }
});

// Mostrar estadísticas de archivos
console.log('\n📊 Estadísticas de build:');
try {
    const originalJS = readFileSync(join(SRC_DIR, 'script.js'), 'utf8').length;
    const minifiedJS = readFileSync(join(DIST_DIR, 'script.min.js'), 'utf8').length;
    const jsReduction = ((originalJS - minifiedJS) / originalJS * 100).toFixed(1);
    
    const originalCSS = readFileSync(join(SRC_DIR, 'styles.css'), 'utf8').length;
    const minifiedCSS = readFileSync(join(DIST_DIR, 'styles.min.css'), 'utf8').length;
    const cssReduction = ((originalCSS - minifiedCSS) / originalCSS * 100).toFixed(1);
    
    const originalHTML = readFileSync(join(SRC_DIR, 'index.html'), 'utf8').length;
    const minifiedHTML = readFileSync(join(DIST_DIR, 'index.html'), 'utf8').length;
    const htmlReduction = ((originalHTML - minifiedHTML) / originalHTML * 100).toFixed(1);
    
    console.log(`📜 JavaScript: ${originalJS} → ${minifiedJS} bytes (-${jsReduction}%)`);
    console.log(`🎨 CSS: ${originalCSS} → ${minifiedCSS} bytes (-${cssReduction}%)`);
    console.log(`📄 HTML: ${originalHTML} → ${minifiedHTML} bytes (-${htmlReduction}%)`);
} catch (error) {
    console.log('📊 No se pudieron calcular las estadísticas');
}

console.log('\n🎉 Build completado exitosamente!');
console.log(`📁 Archivos de producción en: ${DIST_DIR}`);
console.log('🚀 Listo para deploy!\n');