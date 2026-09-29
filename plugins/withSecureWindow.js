// Activa FLAG_SECURE en la ventana principal desde el primer instante:
// bloquea capturas y grabación de pantalla, y la vista previa en
// "apps recientes" sale en blanco. No necesita ningún permiso.
const { withMainActivity } = require('expo/config-plugins');

const MARKER = 'WindowManager.LayoutParams.FLAG_SECURE';

module.exports = function withSecureWindow(config) {
  return withMainActivity(config, (cfg) => {
    let src = cfg.modResults.contents;
    if (cfg.modResults.language !== 'kt') {
      throw new Error('withSecureWindow: se esperaba MainActivity en Kotlin');
    }
    if (src.includes(MARKER)) return cfg;

    const onCreate = /override fun onCreate\(savedInstanceState: Bundle\?\) \{\n/;
    if (!onCreate.test(src)) {
      throw new Error('withSecureWindow: no se encontró onCreate en MainActivity');
    }
    src = src.replace(
      onCreate,
      (m) =>
        m +
        '    window.setFlags(\n' +
        '      android.view.WindowManager.LayoutParams.FLAG_SECURE,\n' +
        '      android.view.WindowManager.LayoutParams.FLAG_SECURE\n' +
        '    )\n',
    );
    cfg.modResults.contents = src;
    return cfg;
  });
};
