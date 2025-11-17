import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, 'icons', 'web');
const destBase = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');

// Tamanhos corretos para cada densidade (em pixels)
const densities = {
    mdpi: { launcher: 48, foreground: 108 },
    hdpi: { launcher: 72, foreground: 162 },
    xhdpi: { launcher: 96, foreground: 216 },
    xxhdpi: { launcher: 144, foreground: 324 },
    xxxhdpi: { launcher: 192, foreground: 432 }
};

// Ícone base
const sourceIcon = path.join(sourceDir, 'icon-512.png');

console.log('🧹 Removendo ícones antigos...\n');

// Função para remover arquivos de ícones
function removeOldIcons() {
    const iconFiles = ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png'];
    
    for (const density of Object.keys(densities)) {
        const mipmapDir = path.join(destBase, `mipmap-${density}`);
        if (fs.existsSync(mipmapDir)) {
            iconFiles.forEach(file => {
                const filePath = path.join(mipmapDir, file);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`  🗑️  Removido: mipmap-${density}/${file}`);
                }
            });
        }
    }
}

// Função para garantir que o diretório existe
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Gerar ícones para cada densidade
async function generateIcons() {
    if (!fs.existsSync(sourceIcon)) {
        console.error('❌ Erro: Ícone base não encontrado em', sourceIcon);
        process.exit(1);
    }

    console.log('\n🔄 Gerando novos ícones nos tamanhos corretos...\n');

    for (const [density, sizes] of Object.entries(densities)) {
        const mipmapDir = path.join(destBase, `mipmap-${density}`);
        ensureDir(mipmapDir);

        console.log(`📁 Gerando ícones para mipmap-${density}...`);

        try {
            // Ícone launcher padrão - mantém proporção e espaço em branco original
            await sharp(sourceIcon)
                .resize(sizes.launcher, sizes.launcher, { 
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .toFile(path.join(mipmapDir, 'ic_launcher.png'));

            // Ícone launcher round - mesmo tamanho
            await sharp(sourceIcon)
                .resize(sizes.launcher, sizes.launcher, { 
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .toFile(path.join(mipmapDir, 'ic_launcher_round.png'));

            // Ícone foreground (para adaptive icon) - mantém proporção e espaço em branco original
            await sharp(sourceIcon)
                .resize(sizes.foreground, sizes.foreground, { 
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .toFile(path.join(mipmapDir, 'ic_launcher_foreground.png'));

            console.log(`  ✓ ic_launcher.png (${sizes.launcher}x${sizes.launcher})`);
            console.log(`  ✓ ic_launcher_round.png (${sizes.launcher}x${sizes.launcher})`);
            console.log(`  ✓ ic_launcher_foreground.png (${sizes.foreground}x${sizes.foreground})`);
        } catch (error) {
            console.error(`  ❌ Erro ao gerar ícones para ${density}:`, error.message);
        }
    }

    // Criar/atualizar arquivos XML para adaptive icons
    console.log('\n📄 Criando arquivos XML para adaptive icons...');
    
    const anydpiDir = path.join(destBase, 'mipmap-anydpi-v26');
    ensureDir(anydpiDir);

    // ic_launcher.xml
    const icLauncherXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;

    fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), icLauncherXml);
    console.log('  ✓ ic_launcher.xml');

    // ic_launcher_round.xml (mesmo conteúdo)
    fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), icLauncherXml);
    console.log('  ✓ ic_launcher_round.xml');

    console.log('\n✅ Todos os ícones foram gerados com sucesso!');
}

try {
    removeOldIcons();
    await generateIcons();
    console.log('\n✅ Processo concluído com sucesso!');
} catch (error) {
    console.error('❌ Erro ao processar ícones:', error);
    process.exit(1);
}
