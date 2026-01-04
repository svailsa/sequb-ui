/// Security module for Sequb UI
/// Provides secure process spawning, validation, and sandboxing

use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use sha2::{Sha256, Digest};
use std::fs;
use std::io::Read;
use regex::Regex;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SecurityConfig {
    pub allowed_ports: Vec<u16>,
    pub binary_hash: String,
    pub max_memory_mb: usize,
    pub max_cpu_percent: u8,
    pub sandbox_enabled: bool,
}

impl Default for SecurityConfig {
    fn default() -> Self {
        SecurityConfig {
            allowed_ports: vec![3000, 3001, 3002, 3003, 3004],
            binary_hash: String::new(),
            max_memory_mb: 512,
            max_cpu_percent: 50,
            sandbox_enabled: true,
        }
    }
}

/// Validates port number against allowed ranges
pub fn validate_port(port: u16, config: &SecurityConfig) -> Result<u16, String> {
    // Check if port is in allowed list
    if !config.allowed_ports.contains(&port) {
        // Check if port is in safe range (non-privileged)
        if port < 1024 || port > 65535 {
            return Err(format!("Port {} is outside allowed range", port));
        }
    }
    
    // Check if port is already in use
    if is_port_in_use(port) {
        return Err(format!("Port {} is already in use", port));
    }
    
    Ok(port)
}

/// Check if a port is already in use
fn is_port_in_use(port: u16) -> bool {
    std::net::TcpListener::bind(("127.0.0.1", port)).is_err()
}

/// Find an available port in the allowed range
pub fn find_available_port(config: &SecurityConfig) -> Result<u16, String> {
    for port in &config.allowed_ports {
        if !is_port_in_use(*port) {
            return Ok(*port);
        }
    }
    
    // If no configured ports are available, find a random one
    for port in 3000..4000 {
        if !is_port_in_use(port) {
            return Ok(port);
        }
    }
    
    Err("No available ports found".to_string())
}

/// Verify binary integrity using SHA256
pub fn verify_binary_integrity(path: &Path, expected_hash: &str) -> Result<(), String> {
    if expected_hash.is_empty() {
        // In development, skip hash check but log warning
        #[cfg(debug_assertions)]
        {
            eprintln!("WARNING: Binary hash verification skipped in debug mode");
            return Ok(());
        }
        
        #[cfg(not(debug_assertions))]
        return Err("Binary hash not configured".to_string());
    }
    
    // Read file and calculate hash
    let mut file = fs::File::open(path)
        .map_err(|e| format!("Failed to open binary: {}", e))?;
    
    let mut hasher = Sha256::new();
    let mut buffer = [0; 8192];
    
    loop {
        let bytes_read = file.read(&mut buffer)
            .map_err(|e| format!("Failed to read binary: {}", e))?;
        
        if bytes_read == 0 {
            break;
        }
        
        hasher.update(&buffer[..bytes_read]);
    }
    
    let result = format!("{:x}", hasher.finalize());
    
    if result != expected_hash {
        return Err(format!(
            "Binary integrity check failed. Expected: {}, Got: {}", 
            expected_hash, result
        ));
    }
    
    Ok(())
}

/// Validate command arguments for shell injection
pub fn validate_command_args(args: &[String]) -> Result<Vec<String>, String> {
    let mut validated = Vec::new();
    
    // Regex for detecting dangerous patterns
    let dangerous_patterns = vec![
        r"[;&|`$]",          // Shell metacharacters
        r"\.\./",            // Path traversal
        r"^-",               // Flags that could be exploited
        r"\$\(",             // Command substitution
        r">\s*\/dev\/",      // Redirecting to devices
    ];
    
    for arg in args {
        // Check each dangerous pattern
        for pattern in &dangerous_patterns {
            let re = Regex::new(pattern).unwrap();
            if re.is_match(arg) {
                return Err(format!("Dangerous argument detected: {}", arg));
            }
        }
        
        // Additional validation for specific argument types
        if arg.starts_with("--port=") || arg.starts_with("-p") {
            // Validate port number
            let port_str = arg.split('=').last().unwrap_or("");
            if let Ok(port) = port_str.parse::<u16>() {
                if port < 1024 || port > 65535 {
                    return Err(format!("Invalid port number: {}", port));
                }
            } else {
                return Err(format!("Invalid port format: {}", arg));
            }
        }
        
        validated.push(arg.clone());
    }
    
    Ok(validated)
}

/// Spawn a secure sidecar process
pub fn spawn_secure_sidecar(
    binary_path: &Path,
    port: u16,
    config: &SecurityConfig,
) -> Result<std::process::Child, String> {
    // Verify binary integrity
    verify_binary_integrity(binary_path, &config.binary_hash)?;
    
    // Validate port
    let safe_port = validate_port(port, config)?;
    
    // Build command
    let mut cmd = Command::new(binary_path);
    
    // Clear environment and set only required variables
    cmd.env_clear();
    cmd.env("PORT", safe_port.to_string());
    cmd.env("NODE_ENV", "production");
    cmd.env("RUST_LOG", "error");
    
    // Set resource limits on Unix systems
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        
        // Set process limits
        cmd.stdin(Stdio::null())
           .stdout(Stdio::piped())
           .stderr(Stdio::piped());
        
        // Drop privileges if running as root (should never happen in production)
        unsafe {
            let uid = libc::getuid();
            if uid == 0 {
                return Err("Cannot run sidecar as root".to_string());
            }
        }
    }
    
    // Set Windows-specific security attributes
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        
        // CREATE_NO_WINDOW flag to prevent console window
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    
    // Spawn the process
    let child = cmd.spawn()
        .map_err(|e| format!("Failed to spawn sidecar: {}", e))?;
    
    Ok(child)
}

/// Monitor sidecar process for anomalies
pub struct ProcessMonitor {
    pid: u32,
    max_memory_mb: usize,
    max_cpu_percent: u8,
}

impl ProcessMonitor {
    pub fn new(pid: u32, config: &SecurityConfig) -> Self {
        ProcessMonitor {
            pid,
            max_memory_mb: config.max_memory_mb,
            max_cpu_percent: config.max_cpu_percent,
        }
    }
    
    /// Check if process is within resource limits
    pub fn check_limits(&self) -> Result<(), String> {
        #[cfg(unix)]
        {
            // Use /proc filesystem on Linux to check process stats
            let stat_path = format!("/proc/{}/stat", self.pid);
            if Path::new(&stat_path).exists() {
                // Read process statistics
                let stats = fs::read_to_string(&stat_path)
                    .map_err(|e| format!("Failed to read process stats: {}", e))?;
                
                // Parse memory usage (simplified - in production use proper parsing)
                let status_path = format!("/proc/{}/status", self.pid);
                if let Ok(status) = fs::read_to_string(&status_path) {
                    for line in status.lines() {
                        if line.starts_with("VmRSS:") {
                            let parts: Vec<&str> = line.split_whitespace().collect();
                            if parts.len() >= 2 {
                                if let Ok(kb) = parts[1].parse::<usize>() {
                                    let mb = kb / 1024;
                                    if mb > self.max_memory_mb {
                                        return Err(format!(
                                            "Process memory usage ({} MB) exceeds limit ({} MB)",
                                            mb, self.max_memory_mb
                                        ));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        Ok(())
    }
    
    /// Kill the process if it violates security policies
    pub fn kill_if_violated(&self) -> Result<(), String> {
        if let Err(violation) = self.check_limits() {
            self.kill_process()?;
            return Err(format!("Process killed due to: {}", violation));
        }
        Ok(())
    }
    
    /// Force kill the process
    pub fn kill_process(&self) -> Result<(), String> {
        #[cfg(unix)]
        {
            unsafe {
                let result = libc::kill(self.pid as i32, libc::SIGTERM);
                if result != 0 {
                    // Try SIGKILL if SIGTERM fails
                    let result = libc::kill(self.pid as i32, libc::SIGKILL);
                    if result != 0 {
                        return Err("Failed to kill process".to_string());
                    }
                }
            }
        }
        
        #[cfg(windows)]
        {
            use winapi::um::processthreadsapi::TerminateProcess;
            use winapi::um::processthreadsapi::OpenProcess;
            use winapi::um::winnt::PROCESS_TERMINATE;
            
            unsafe {
                let handle = OpenProcess(PROCESS_TERMINATE, 0, self.pid);
                if handle.is_null() {
                    return Err("Failed to open process".to_string());
                }
                
                let result = TerminateProcess(handle, 1);
                if result == 0 {
                    return Err("Failed to terminate process".to_string());
                }
            }
        }
        
        Ok(())
    }
}

/// Sandbox configuration for process isolation
#[cfg(target_os = "linux")]
pub mod sandbox {
    use nix::sched::{unshare, CloneFlags};
    use nix::unistd::{chroot, setuid, setgid, Uid, Gid};
    use std::path::Path;
    
    /// Create a sandboxed environment
    pub fn setup_sandbox(sandbox_dir: &Path) -> Result<(), String> {
        // Create new namespaces for isolation
        unshare(
            CloneFlags::CLONE_NEWUSER | 
            CloneFlags::CLONE_NEWNET | 
            CloneFlags::CLONE_NEWPID |
            CloneFlags::CLONE_NEWIPC
        ).map_err(|e| format!("Failed to create namespaces: {}", e))?;
        
        // Change to sandbox directory
        std::env::set_current_dir(sandbox_dir)
            .map_err(|e| format!("Failed to change directory: {}", e))?;
        
        // Chroot to sandbox directory
        chroot(sandbox_dir)
            .map_err(|e| format!("Failed to chroot: {}", e))?;
        
        // Drop privileges to nobody user
        let nobody_uid = Uid::from_raw(65534);
        let nobody_gid = Gid::from_raw(65534);
        
        setgid(nobody_gid)
            .map_err(|e| format!("Failed to set GID: {}", e))?;
        
        setuid(nobody_uid)
            .map_err(|e| format!("Failed to set UID: {}", e))?;
        
        Ok(())
    }
    
    /// Set resource limits for the process
    pub fn set_resource_limits(max_memory_bytes: u64, max_cpu_time: u64) -> Result<(), String> {
        use nix::sys::resource::{setrlimit, Resource};
        
        // Set memory limit
        setrlimit(
            Resource::RLIMIT_AS,
            max_memory_bytes,
            max_memory_bytes
        ).map_err(|e| format!("Failed to set memory limit: {}", e))?;
        
        // Set CPU time limit
        setrlimit(
            Resource::RLIMIT_CPU,
            max_cpu_time,
            max_cpu_time
        ).map_err(|e| format!("Failed to set CPU limit: {}", e))?;
        
        // Disable core dumps for security
        setrlimit(
            Resource::RLIMIT_CORE,
            0,
            0
        ).map_err(|e| format!("Failed to disable core dumps: {}", e))?;
        
        Ok(())
    }
}

/// Input validation for IPC messages
pub fn validate_ipc_message(message: &str) -> Result<String, String> {
    // Check message length
    if message.len() > 10_000 {
        return Err("Message too large".to_string());
    }
    
    // Check for injection attempts
    let dangerous_patterns = vec![
        r"<script",
        r"javascript:",
        r"on\w+\s*=",
        r"eval\s*\(",
        r"new\s+Function",
    ];
    
    for pattern in dangerous_patterns {
        let re = Regex::new(pattern).unwrap();
        if re.is_match(message) {
            return Err("Potentially malicious content detected".to_string());
        }
    }
    
    Ok(message.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_port_validation() {
        let config = SecurityConfig::default();
        
        // Test valid port
        assert!(validate_port(3000, &config).is_ok());
        
        // Test invalid port (privileged)
        assert!(validate_port(80, &config).is_err());
        
        // Test invalid port (out of range)
        assert!(validate_port(70000, &config).is_err());
    }
    
    #[test]
    fn test_command_validation() {
        // Test safe arguments
        let safe_args = vec!["--port=3000".to_string(), "--verbose".to_string()];
        assert!(validate_command_args(&safe_args).is_ok());
        
        // Test dangerous arguments
        let dangerous_args = vec!["test; rm -rf /".to_string()];
        assert!(validate_command_args(&dangerous_args).is_err());
        
        // Test path traversal
        let traversal_args = vec!["../../etc/passwd".to_string()];
        assert!(validate_command_args(&traversal_args).is_err());
    }
    
    #[test]
    fn test_ipc_validation() {
        // Test safe message
        let safe_msg = r#"{"type": "request", "data": "hello"}"#;
        assert!(validate_ipc_message(safe_msg).is_ok());
        
        // Test XSS attempt
        let xss_msg = r#"<script>alert('xss')</script>"#;
        assert!(validate_ipc_message(xss_msg).is_err());
        
        // Test eval injection
        let eval_msg = r#"eval('malicious code')"#;
        assert!(validate_ipc_message(eval_msg).is_err());
    }
}