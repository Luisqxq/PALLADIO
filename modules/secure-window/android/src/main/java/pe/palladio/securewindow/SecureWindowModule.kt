package pe.palladio.securewindow

import android.view.WindowManager
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Activa o desactiva FLAG_SECURE (bloqueo de capturas y de la vista previa en
// "apps recientes"). No registra detectores de capturas ni pide permisos.
class SecureWindowModule : Module() {
  private val currentActivity
    get() = appContext.currentActivity ?: throw Exceptions.MissingActivity()

  override fun definition() = ModuleDefinition {
    Name("SecureWindow")

    AsyncFunction("setSecure") { secure: Boolean ->
      val window = currentActivity.window
      if (secure) {
        window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
      } else {
        window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
      }
    }.runOnQueue(Queues.MAIN)
  }
}
