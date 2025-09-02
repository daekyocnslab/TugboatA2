package com.daekyocnslab.tugboata2

import android.app.Application
import android.content.res.Configuration
import com.facebook.react.*
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

// ✅ 플러그인 등록 import
import com.mrousavy.camera.frameprocessors.FrameProcessorPluginRegistry

import com.daekyocnslab.tugboata2.VisionCameraFrameProcessorPlugin  // ← 정확한 클래스명으로 수정


class MainApplication : Application(), ReactApplication {

  // ✅ 플러그인 등록은 companion object 안에서
  companion object {
    init {
     FrameProcessorPluginRegistry.addFrameProcessorPlugin("my_yuv_plugin") { proxy, options ->VisionCameraFrameProcessorPlugin(proxy, options)}
    }
  }

  // ✅ 아래는 클래스 본문에 위치해야 함
  override val reactNativeHost: ReactNativeHost =
    ReactNativeHostWrapper(this, object : DefaultReactNativeHost(this) {
      override fun getPackages(): List<ReactPackage> =
        PackageList(this).packages

      override fun getJSMainModuleName(): String = "index"
      override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG
      override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
    })

  override val reactHost: ReactHost
    get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, OpenSourceMergedSoMapping)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      load()
    }
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}