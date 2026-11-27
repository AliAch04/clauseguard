package com.example.myapplication

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.myapplication.ai.ClauseGuardAI // <--- Updated import
import com.example.myapplication.ui.theme.MyApplicationTheme

import com.google.firebase.Firebase
import com.google.firebase.initialize
import com.google.firebase.appcheck.appCheck
import com.google.firebase.appcheck.debug.DebugAppCheckProviderFactory

import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Firebase.initialize(context = this)
        Firebase.appCheck.installAppCheckProviderFactory(
            DebugAppCheckProviderFactory.getInstance(),
        )
        enableEdgeToEdge()
        setContent {
            MyApplicationTheme {
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    ClauseGuardScreen(
                        modifier = Modifier.padding(innerPadding),
                    )
                }
            }
        }
    }
}

@Composable
fun ClauseGuardScreen(modifier: Modifier = Modifier) {
    val ai = remember { ClauseGuardAI() }
    val scope = rememberCoroutineScope()

    var result by remember { mutableStateOf("Tap the button to analyze a clause.") }
    var isLoading by remember { mutableStateOf(false) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Button(
            enabled = !isLoading,
            onClick = {
                isLoading = true
                result = "Analyzing…"

                scope.launch {
                    try {
                        val response = ai.scanClause(
                            clauseText = "The contract auto-renews annually unless cancelled 90 days prior."
                        )
                        result = response
                    } catch (e: Exception) {
                        result = "Error: ${e.message}"
                    } finally {
                        isLoading = false
                    }
                }
            },
        ) {
            Text(if (isLoading) "Analyzing…" else "Scan Clause")
        }

        Text(text = result)
    }
}