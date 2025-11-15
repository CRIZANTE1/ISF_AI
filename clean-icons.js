import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resBase = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');
const densities = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];

// Arquivos que devem ser mantidos
const keepFiles = [
    'ic_launcher.png',
    'ic_launcher_round.png',
    'ic_launcher_background.png',
    'ic_launcher_foreground.png',
    'ic_launcher_monochrome.png'
];

// Arquivos que devem ser removidos (antigos)
const removeFiles = [
    'ic_launcher_adaptive_back.png',
    'ic_launcher_adaptive_fore.png'
];

console.log('🧹 Limpando arquivos de ícones desnecessários...\n');

let totalRemoved = 0;

// Limpar arquivos de cada densidade
densities.forEach(density => {
    const mipmapDir = path.join(resBase, `mipmap-${density}`);
    
    if (fs.existsSync(mipmapDir)) {
        console.log(`📁 Limpando mipmap-${density}...`);
        
        const files = fs.readdirSync(mipmapDir);
        let removedCount = 0;
        
        files.forEach(file => {
            if (removeFiles.includes(file)) {
                const filePath = path.join(mipmapDir, file);
                try {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log(`  🗑️  Removido: ${file}`);
                        removedCount++;
                        totalRemoved++;
                    } else {
                        console.log(`  ℹ️  Arquivo já não existe: ${file}`);
                    }
                } catch (error) {
                    console.log(`  ⚠️  Erro ao remover ${file}: ${error.message}`);
                }
            }
        });
        
        if (removedCount === 0) {
            console.log(`  ✓ Nenhum arquivo desnecessário encontrado`);
        }
    }
});

console.log(`\n✅ Limpeza concluída! ${totalRemoved} arquivo(s) removido(s).`);
console.log('\n📋 Arquivos mantidos:');
keepFiles.forEach(file => {
    console.log(`  ✓ ${file}`);
});

