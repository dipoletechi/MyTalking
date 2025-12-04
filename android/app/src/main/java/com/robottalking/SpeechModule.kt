package com.robottalking

import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class SpeechModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    private var speechRecognizer: SpeechRecognizer? = null
    private var speechPromise: Promise? = null
    private var isListening = false
    private var audioManager: AudioManager? = null
    private var wasMuted = false
    private var lastPartialResult: String = ""

    override fun getName(): String = "SpeechModule"

    private fun sendEvent(eventName: String, params: String) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    private fun muteAllSounds() {
        try {
            audioManager = reactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            wasMuted = audioManager?.ringerMode == AudioManager.RINGER_MODE_SILENT
            
            if (!wasMuted) {
                audioManager?.adjustStreamVolume(AudioManager.STREAM_NOTIFICATION, AudioManager.ADJUST_MUTE, 0)
                audioManager?.adjustStreamVolume(AudioManager.STREAM_SYSTEM, AudioManager.ADJUST_MUTE, 0)
                audioManager?.adjustStreamVolume(AudioManager.STREAM_RING, AudioManager.ADJUST_MUTE, 0)
                audioManager?.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_MUTE, 0)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun restoreSounds() {
        Handler(Looper.getMainLooper()).postDelayed({
            try {
                if (!wasMuted) {
                    audioManager?.adjustStreamVolume(AudioManager.STREAM_NOTIFICATION, AudioManager.ADJUST_UNMUTE, 0)
                    audioManager?.adjustStreamVolume(AudioManager.STREAM_SYSTEM, AudioManager.ADJUST_UNMUTE, 0)
                    audioManager?.adjustStreamVolume(AudioManager.STREAM_RING, AudioManager.ADJUST_UNMUTE, 0)
                    audioManager?.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_UNMUTE, 0)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }, 500)
    }

    @ReactMethod
    fun startSpeechToText(language: String, promise: Promise) {
        if (isListening) {
            promise.reject("ALREADY_LISTENING", "Already listening")
            return
        }

        speechPromise = promise
        lastPartialResult = ""
        
        reactContext.currentActivity?.runOnUiThread {
            try {
                muteAllSounds()

                speechRecognizer?.destroy()
                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(reactContext)

                speechRecognizer?.setRecognitionListener(object : RecognitionListener {
                    override fun onReadyForSpeech(params: Bundle?) {
                        isListening = true
                        restoreSounds()
                        sendEvent("onSpeechStart", "")
                    }

                    override fun onBeginningOfSpeech() {
                        sendEvent("onBeginningOfSpeech", "")
                    }

                    override fun onRmsChanged(rmsdB: Float) {}

                    override fun onBufferReceived(buffer: ByteArray?) {}

                    override fun onEndOfSpeech() {
                        isListening = false
                        // Mute before end sound plays
                        muteAllSounds()
                        sendEvent("onSpeechEnd", "")
                        // Restore after a delay
                        restoreSounds()
                    }

                    override fun onError(error: Int) {
                        isListening = false
                        // Mute error sound
                        muteAllSounds()
                        restoreSounds()
                        
                        if (lastPartialResult.isNotEmpty()) {
                            speechPromise?.resolve(lastPartialResult)
                            speechPromise = null
                            lastPartialResult = ""
                            return
                        }
                        
                        val errorMsg = when (error) {
                            SpeechRecognizer.ERROR_NO_MATCH -> "Kuch bolo! Awaaz nahi aayi"
                            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "Time out! Jaldi bolo"
                            SpeechRecognizer.ERROR_AUDIO -> "Audio error"
                            SpeechRecognizer.ERROR_CLIENT -> "Client error"
                            SpeechRecognizer.ERROR_NETWORK -> "Internet check karo"
                            SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Internet slow hai"
                            SpeechRecognizer.ERROR_SERVER -> "Server error"
                            SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Busy hai, retry karo"
                            SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Mic permission do"
                            else -> "Error: $error"
                        }
                        speechPromise?.reject("SPEECH_ERROR", errorMsg)
                        speechPromise = null
                        lastPartialResult = ""
                    }

                    override fun onResults(results: Bundle?) {
                        isListening = false
                        // Mute result sound
                        muteAllSounds()
                        restoreSounds()
                        
                        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        if (!matches.isNullOrEmpty()) {
                            speechPromise?.resolve(matches[0])
                        } else if (lastPartialResult.isNotEmpty()) {
                            speechPromise?.resolve(lastPartialResult)
                        } else {
                            speechPromise?.reject("NO_RESULTS", "Kuch bolo!")
                        }
                        speechPromise = null
                        lastPartialResult = ""
                    }

                    override fun onPartialResults(partialResults: Bundle?) {
                        val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        if (!matches.isNullOrEmpty() && matches[0].isNotEmpty()) {
                            lastPartialResult = matches[0]
                            sendEvent("onSpeechPartial", matches[0])
                        }
                    }

                    override fun onEvent(eventType: Int, params: Bundle?) {}
                })

                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, language)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, language)
                    putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                    putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
                    putExtra("android.speech.extra.DICTATION_MODE", true)
                    putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 5000L)
                    putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 5000L)
                    putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 3000L)
                }

                speechRecognizer?.startListening(intent)

            } catch (e: Exception) {
                restoreSounds()
                promise.reject("SPEECH_ERROR", "Failed: ${e.message}")
                speechPromise = null
            }
        }
    }

    @ReactMethod
    fun stopSpeechToText() {
        reactContext.currentActivity?.runOnUiThread {
            try {
                // Mute before stopping
                muteAllSounds()
                speechRecognizer?.stopListening()
                isListening = false
                // Restore after delay
                restoreSounds()
            } catch (e: Exception) {}
        }
    }

    @ReactMethod
    fun cancelSpeechToText() {
        reactContext.currentActivity?.runOnUiThread {
            try {
                // Mute before cancelling
                muteAllSounds()
                speechRecognizer?.cancel()
                isListening = false
                speechPromise?.reject("CANCELLED", "Cancelled")
                speechPromise = null
                lastPartialResult = ""
                // Restore after delay
                restoreSounds()
            } catch (e: Exception) {}
        }
    }

    @ReactMethod
    fun destroy() {
        reactContext.currentActivity?.runOnUiThread {
            try {
                muteAllSounds()
                speechRecognizer?.destroy()
                speechRecognizer = null
                isListening = false
                lastPartialResult = ""
                restoreSounds()
            } catch (e: Exception) {}
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
