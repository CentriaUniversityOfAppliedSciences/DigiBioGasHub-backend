import path from 'path';
import { fileURLToPath } from 'url';
import i18nPkg from 'i18n';

const { configure } = i18nPkg;
const i18n = i18nPkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

configure({
  locales: ['en', 'fi', 'sv'],
  defaultLocale: 'en',
  directory: path.join(__dirname, 'locales'),
  objectNotation: true,
  register: global,
});

export default i18n;
