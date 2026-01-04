// Prevents additional console window on Windows in release, DO NOT REMOVE!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Arc;
use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::ShellExt;

struct SidecarState {
    port: Option<u16>,
}

#[tauri::command]
fn get_server_port(state: tauri::State<Arc<Mutex<SidecarState>>>) -> Result<u16, String> {
    let state = state.lock().unwrap();
    state.port.ok_or_else(|| "Server port not available yet".to_string())
}

fn main() {
    let sidecar_state = Arc::new(Mutex::new(SidecarState { port: None }));

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(sidecar_state.clone())
        .setup(move |app| {
            let sidecar_state_clone = sidecar_state.clone();
            let window = app.get_window("main").unwrap();
            
            // Find a free port or use default
            let port = 3000u16; // In production, you'd want to find a free port
            
            // Spawn the sidecar
            let sidecar_command = app.shell()
                .sidecar("sequb-server")
                .unwrap()
                .env("PORT", port.to_string())
                .spawn()
                .expect("Failed to spawn sidecar");
            
            // Update state with port
            {
                let mut state = sidecar_state_clone.lock().unwrap();
                state.port = Some(port);
            }
            
            // Handle sidecar events
            let sidecar_state_events = sidecar_state_clone.clone();
            let window_clone = window.clone();
            
            tauri::async_runtime::spawn(async move {
                let mut rx = sidecar_command.0.rx.lock().await;
                while let Some(event) = rx.recv().await {
                    match event {
                        CommandEvent::Stdout(line) => {
                            println!("Sidecar stdout: {}", String::from_utf8_lossy(&line));
                            
                            // Parse port from output if server prints it
                            let output = String::from_utf8_lossy(&line);
                            if output.contains("Server listening on") {
                                if let Some(port_str) = output.split(':').last() {
                                    if let Ok(parsed_port) = port_str.trim().parse::<u16>() {
                                        let mut state = sidecar_state_events.lock().unwrap();
                                        state.port = Some(parsed_port);
                                        
                                        // Notify frontend that server is ready
                                        window_clone.emit("server-ready", parsed_port).unwrap();
                                    }
                                }
                            }
                        }
                        CommandEvent::Stderr(line) => {
                            eprintln!("Sidecar stderr: {}", String::from_utf8_lossy(&line));
                        }
                        CommandEvent::Error(error) => {
                            eprintln!("Sidecar error: {}", error);
                        }
                        CommandEvent::Terminated(payload) => {
                            eprintln!("Sidecar terminated with: {:?}", payload);
                            break;
                        }
                        _ => {}
                    }
                }
            });
            
            // Clean up sidecar on window close
            let sidecar_kill = sidecar_command.0.clone();
            window.on_window_event(move |event| {
                if let tauri::WindowEvent::CloseRequested { .. } = event {
                    // Kill the sidecar process
                    let _ = sidecar_kill.kill();
                }
            });
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_server_port])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}