import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceIcon = path.join(__dirname, 'icons', 'web', 'icon-512.png');
const appIconDir = path.join(
  __dirname,
  'ios',
  'App',
  'App',
  'Assets.xcassets',
  'AppIcon.appiconset',
);
const splashDir = path.join(
  __dirname,
  'ios',
  'App',
  'App',
  'Assets.xcassets',
  'Splash.imageset',
);

async function generateIcons() {
  if (!fs.existsSync(sourceIcon)) {
    console.error('❌ Ícone base não encontrado:', sourceIcon);
    process.exit(1);
  }

  fs.mkdirSync(appIconDir, { recursive: true });
  fs.mkdirSync(splashDir, { recursive: true });

  const appIconPath = path.join(appIconDir, 'AppIcon-512@2x.png');
  await sharp(sourceIcon)
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .png()
    .toFile(appIconPath);

  const splashPath = path.join(splashDir, 'splash-2732x2732.png');
  await sharp(sourceIcon)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .extend({
      top: 1110,
      bottom: 1110,
      left: 1110,
      right: 1110,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .png()
    .toFile(splashPath);

  for (const suffix of ['-1', '-2']) {
    fs.copyFileSync(
      splashPath,
      path.join(splashDir, `splash-2732x2732${suffix}.png`),
    );
  }

  console.log('✅ Ícone iOS gerado:', appIconPath);
  console.log('✅ Splash iOS gerado:', splashPath);
}

generateIcons().catch((error) => {
  console.error('❌ Erro ao gerar ícones iOS:', error);
  process.exit(1);
});
