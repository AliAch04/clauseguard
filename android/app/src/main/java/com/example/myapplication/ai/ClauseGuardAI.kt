package com.example.myapplication.ai

import android.graphics.Bitmap
import com.google.firebase.Firebase
import com.google.firebase.ai.InferenceMode
import com.google.firebase.ai.OnDeviceConfig
import com.google.firebase.ai.ai
import com.google.firebase.ai.type.GenerativeBackend
import com.google.firebase.ai.type.PublicPreviewAPI
import com.google.firebase.ai.type.content

class ClauseGuardAI {

    private val cloudModelName = "gemini-2.5-flash"

    /**
     * 1. SCAN CLAUSE (Hybrid: On-Device First, Cloud Fallback)
     * Uses Gemini Nano via Android AICore when supported; falls back to Cloud automatically.
     */
    @OptIn(PublicPreviewAPI::class)
    private val hybridModel = Firebase.ai(backend = GenerativeBackend.googleAI())
        .generativeModel(
            modelName = cloudModelName,
            onDeviceConfig = OnDeviceConfig(mode = InferenceMode.PREFER_ON_DEVICE),
        )

    /**
     * 2. NEGOTIATE / COUNTER-DRAFT (Explicit Cloud Escalation)
     */
    @OptIn(PublicPreviewAPI::class)
    private val cloudOnlyModel = Firebase.ai(backend = GenerativeBackend.googleAI())
        .generativeModel(
            modelName = cloudModelName,
            onDeviceConfig = OnDeviceConfig(mode = InferenceMode.ONLY_IN_CLOUD),
        )

    suspend fun scanClause(clauseText: String? = null, photo: Bitmap? = null): String {
        val prompt = """
            You are ClauseGuard, a contract analyzer.
            Identify red flags (auto-renewals, hidden fees, IP transfer, liability waivers)
            and translate the legalese into plain, concise bullet points.
        """.trimIndent()

        val inputContent = content {
            text(prompt)
            clauseText?.let { text(it) }
            photo?.let { image(it) }
        }

        val response = hybridModel.generateContent(inputContent)
        return response.text ?: "No analysis returned."
    }

    suspend fun draftCounterProposal(clauseText: String, context: String): String {
        val prompt = """
            Context: $context
            Original Clause:
            "$clauseText"

            Draft a polite, formal redline counter-proposal that protects the signer
            and aligns with standard fair market norms.
        """.trimIndent()

        val response = cloudOnlyModel.generateContent(prompt)
        return response.text ?: "Could not generate counter-proposal."
    }
}
