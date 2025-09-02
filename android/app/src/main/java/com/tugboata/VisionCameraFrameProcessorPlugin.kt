package com.tugboata

import android.util.Base64
import android.util.Log
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy

class VisionCameraFrameProcessorPlugin(proxy: VisionCameraProxy, options: Map<String, Any>?) : FrameProcessorPlugin() {

    private var lastProcessedTime = 0L
    private val frameIntervalMs = 500L // ⏱️ 500ms에 한 번만 처리

    init {
        Log.d("ExampleKotlinPlugin", "Plugin initialized with options: ${options?.toString()}")
    }

   override fun callback(frame: Frame, params: Map<String, Any>?): Any? {
    val now = System.currentTimeMillis()
    if (now - lastProcessedTime < frameIntervalMs) return null
    lastProcessedTime = now

    val image = frame.image ?: return null

    val planes = image.planes


    if (planes.size < 3) {
        Log.w("VisionCameraPlugin", "⛔ Not enough planes: ${planes.size}")
        return null
    }

    val yPlane = planes[0].buffer
    val uPlane = planes[1].buffer
    val vPlane = planes[2].buffer


    val y = yPlane.get(0).toInt() and 0xFF
    val u = uPlane.get(0).toInt() and 0xFF
    val v = vPlane.get(0).toInt() and 0xFF

    val yBuffer = yPlane.duplicate()
    val yBytes = ByteArray(yBuffer.remaining()).apply { yBuffer.get(this) }

    val floatData = FloatArray(yBytes.size) { idx ->
        (yBytes[idx].toInt() and 0xFF) / 255f
    }
    val floatList = floatData.map { it.toDouble() }

    val uBytes = ByteArray(uPlane.remaining()).apply { uPlane.get(this) }
    val vBytes = ByteArray(vPlane.remaining()).apply { vPlane.get(this) }

    val (r, g, b) = yuvToRgb(y, u, v)

    val width = image.width
    val height = image.height

    val base64Data = Base64.encodeToString(yBytes, Base64.NO_WRAP)

    return hashMapOf<String, Any>(
        "y" to y,
        "u" to u,
        "v" to v,
        "r" to r,
        "g" to g,
        "b" to b,
        "width" to width,
        "height" to height,
        "floatData" to floatList,
        "base64" to base64Data
    )
}

    private fun yuvToRgb(y: Int, u: Int, v: Int): Triple<Int, Int, Int> {
        val y_ = y - 16
        val u_ = u - 128
        val v_ = v - 128

        val r = (1.164f * y_ + 1.596f * v_).toInt().coerceIn(0, 255)
        val g = (1.164f * y_ - 0.392f * u_ - 0.813f * v_).toInt().coerceIn(0, 255)
        val b = (1.164f * y_ + 2.017f * u_).toInt().coerceIn(0, 255)

        return Triple(r, g, b)
    }

}