import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceBase = path.join(__dirname, 'icons', 'android', 'res');
const destBase = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');

const densities = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];

console.log('🔄 Copiando ícones do app Android...\n');
console.log(`Origem: ${sourceBase}`);
console.log(`Destino: ${destBase}\n`);

// Função para renomear arquivos de ic_laucher para ic_launcher
function renameIconFile(filename) {
    return filename.replace(/ic_laucher/g, 'ic_launcher');
}

// Copiar arquivos de cada densidade
densities.forEach(density => {
    const sourceDir = path.join(sourceBase, `mipmap-${density}`);
    const destDir = path.join(destBase, `mipmap-${density}`);
    
    if (fs.existsSync(sourceDir)) {
        console.log(`📁 Copiando arquivos de mipmap-${density}...`);
        
        // Garantir que a pasta de destino existe
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        
        const files = fs.readdirSync(sourceDir);
        files.forEach(file => {
            const sourceFile = path.join(sourceDir, file);
            const destFileName = renameIconFile(file);
            const destFile = path.join(destDir, destFileName);
            
            if (fs.statSync(sourceFile).isFile()) {
                fs.copyFileSync(sourceFile, destFile);
                if (file !== destFileName) {
                    console.log(`  ✓ ${file} → ${destFileName}`);
                } else {
                    console.log(`  ✓ ${file}`);
                }
            }
        });
    } else {
        console.log(`  ⚠️ Pasta mipmap-${density} não encontrada na origem`);
    }
});

// Copiar e atualizar arquivo XML
const xmlSource = path.join(sourceBase, 'mipmap-anydpi-v26', 'ic_laucher.xml');
const xmlDest = path.join(destBase, 'mipmap-anydpi-v26', 'ic_launcher.xml');

if (fs.existsSync(xmlSource)) {
    console.log('\n📄 Copiando e atualizando ic_launcher.xml...');
    
    // Garantir que a pasta de destino existe
    const xmlDestDir = path.dirname(xmlDest);
    if (!fs.existsSync(xmlDestDir)) {
        fs.mkdirSync(xmlDestDir, { recursive: true });
    }
    
    // Ler o conteúdo do XML e ajustar os nomes
    let xmlContent = fs.readFileSync(xmlSource, 'utf8');
    
    // Substituir ic_laucher por ic_launcher no XML
    xmlContent = xmlContent.replace(/ic_laucher/g, 'ic_launcher');
    
    // Salvar o XML atualizado
    fs.writeFileSync(xmlDest, xmlContent, 'utf8');
    console.log('  ✓ ic_launcher.xml copiado e atualizado');
} else {
    console.log('\n⚠️ Arquivo XML não encontrado na origem');
}

console.log('\n✅ Todos os ícones foram copiados com sucesso!');
console.log('📝 Arquivos renomeados de "ic_laucher" para "ic_launcher" para compatibilidade.');

