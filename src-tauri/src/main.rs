// Prevents additional console window on Windows in release, DO NOT REMOVE!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Arc;
use std::sync::Mutex;
use std::path::PathBuf;
use std::fs;
use sha2::{Sha256, Digest};
use std::io::Read;
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

fn verify_binary_integrity(binary_path: &PathBuf, expected_hash: &str) -> Result<bool, String> {
    // Read the binary file
    let mut file = fs::File::open(binary_path)
        .map_err(|e| format!("Failed to open binary: {}", e))?;
    
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer)
        .map_err(|e| format!("Failed to read binary: {}", e))?;
    
    // Calculate SHA256 hash
    let mut hasher = Sha256::new();
    hasher.update(&buffer);
    let result = hasher.finalize();
    let calculated_hash = format!("{:x}", result);
    
    Ok(calculated_hash == expected_hash)
}

fn find_free_port() -> u16 {
    // Try to bind to port 0 to get a random free port
    match std::net::TcpListener::bind("127.0.0.1:0") {
        Ok(listener) => {
            let port = listener.local_addr().unwrap().port();
            drop(listener); // Release the port
            port
        }
        Err(_) => 3000, // Fallback to default
    }
}

fn main() {
    let sidecar_state = Arc::new(Mutex::new(SidecarState { port: None }));

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(sidecar_state.clone())
        .setup(move |app| {
            let sidecar_state_clone = sidecar_state.clone();
            let window = app.get_window("main").unwrap();
            
            // Get binary path for validation
            let resource_path = app.path().resource_dir()
                .expect("Failed to get resource directory");
            
            #[cfg(target_os = "windows")]
            let binary_name = "sequb-server-x86_64-pc-windows-msvc.exe";
            #[cfg(target_os = "macos")]
            let binary_name = "sequb-server-x86_64-apple-darwin";
            #[cfg(target_os = "linux")]
            let binary_name = "sequb-server-x86_64-unknown-linux-gnu";
            
            let binary_path = resource_path.join("binaries").join(binary_name);
            
            // TODO: In production, store these hashes securely
            // These should be generated during build and stored in a secure location
            #[cfg(target_os = "windows")]
            let expected_hash = "YOUR_WINDOWS_BINARY_SHA256_HASH";
            #[cfg(target_os = "macos")]
            let expected_hash = "YOUR_MACOS_BINARY_SHA256_HASH";
            #[cfg(target_os = "linux")]
            let expected_hash = "YOUR_LINUX_BINARY_SHA256_HASH";
            
            // Verify binary integrity in production builds
            #[cfg(not(debug_assertions))]
            {
                match verify_binary_integrity(&binary_path, expected_hash) {
                    Ok(true) => println!("Binary integrity verified"),
                    Ok(false) => {
                        eprintln!("Binary integrity check failed!");
                        return Err("Binary integrity verification failed".into());
                    }
                    Err(e) => {
                        eprintln!("Failed to verify binary: {}", e);
                        return Err(e.into());
                    }
                }
            }
            
            // Find a free port dynamically
            let port = find_free_port();
            println!("Using port: {}", port);
            
            // Spawn the sidecar with security restrictions
            let sidecar_command = app.shell()
                .sidecar("sequb-server")
                .unwrap()
                .env("PORT", port.to_string())
                .env("SEQUB_ENV", "production")
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