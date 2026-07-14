using System.Diagnostics;
using System.Text;

namespace StartPosLauncher;

internal static class Program
{
    private const string LauncherLogFileName = "launcher.log";

    [STAThread]
    private static int Main()
    {
        var launcherDirectory = AppContext.BaseDirectory;
        var logsDirectory = Path.Combine(launcherDirectory, "logs");
        var launcherLogPath = Path.Combine(logsDirectory, LauncherLogFileName);

        Directory.CreateDirectory(logsDirectory);

        Process? mongoProcess = null;
        Process? serverProcess = null;

        try
        {
            // ✅ Kill any lingering processes first
            KillProcess("mongod");
            KillProcess("server");
            KillProcess("chrome");
            KillProcess("msedge");
            AppendLog(launcherLogPath, "Startup cleanup: killed old MongoDB, server, and browser processes.");

            // Start MongoDB
            mongoProcess = StartProcess("mongod.exe",
                "--dbpath data --bind_ip 127.0.0.1 --port 27017 --logpath logs\\mongodb.log --logappend",
                launcherDirectory);

            // Start server
            serverProcess = StartProcess("server.exe", "", launcherDirectory);

            // Wait until server responds before launching browser
            if (!WaitForServerReady("http://127.0.0.1:5000/api/health", 60))
            {
                AppendLog(launcherLogPath, "ERROR: Server did not start within timeout.");
                mongoProcess?.Kill();
                serverProcess?.Kill();
                return 1;
            }

            AppendLog(launcherLogPath, "Server is healthy. Launching browser...");

            var browserProcess = LaunchBrowser();
            if (browserProcess != null)
            {
                browserProcess.EnableRaisingEvents = true;
                browserProcess.Exited += (s, e) =>
                {
                    mongoProcess?.Kill();
                    serverProcess?.Kill();
                    AppendLog(launcherLogPath, "Browser closed. MongoDB and server terminated.");
                    Environment.Exit(0);
                };

                browserProcess.WaitForExit();
            }

            return 0;
        }
        catch (Exception ex)
        {
            AppendLog(launcherLogPath, $"Launcher failed: {ex}");
            mongoProcess?.Kill();
            serverProcess?.Kill();
            return 1;
        }
    }

    private static Process StartProcess(string fileName, string args, string workingDir)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = Path.Combine(workingDir, fileName),
            Arguments = args,
            WorkingDirectory = workingDir,
            UseShellExecute = false,
            CreateNoWindow = false
        };
        return Process.Start(startInfo)
            ?? throw new InvalidOperationException($"Failed to start {fileName}");
    }

    private static bool WaitForServerReady(string url, int maxAttempts)
    {
        using var client = new HttpClient();
        for (int i = 0; i < maxAttempts; i++)
        {
            try
            {
                var response = client.GetAsync(url).Result;
                if (response.IsSuccessStatusCode) return true;
            }
            catch
            {
                // server not ready yet
            }
            Thread.Sleep(2000); // wait 2s before retry
        }
        return false;
    }

    private static Process? LaunchBrowser()
    {
        string chromePath = @"C:\Program Files\Google\Chrome\Application\chrome.exe";
        string chromePathX86 = @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe";
        string edgePath = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
        string edgePath64 = @"C:\Program Files\Microsoft\Edge\Application\msedge.exe";

        if (File.Exists(chromePath))
            return Process.Start(chromePath, "--app=\"http://127.0.0.1:5000\" --start-fullscreen --kiosk");
        if (File.Exists(chromePathX86))
            return Process.Start(chromePathX86, "--app=\"http://127.0.0.1:5000\" --start-fullscreen --kiosk");
        if (File.Exists(edgePath))
            return Process.Start(edgePath, "--app=\"http://127.0.0.1:5000\" --start-fullscreen --kiosk");
        if (File.Exists(edgePath64))
            return Process.Start(edgePath64, "--app=\"http://127.0.0.1:5000\" --start-fullscreen --kiosk");

        Process.Start(new ProcessStartInfo("cmd", "/c start http://127.0.0.1:5000") { CreateNoWindow = false });
        return null;
    }

    private static void KillProcess(string name)
    {
        foreach (var proc in Process.GetProcessesByName(name))
        {
            try { proc.Kill(); }
            catch { /* ignore */ }
        }
    }

    private static void AppendLog(string path, string message)
    {
        var logMessage = new StringBuilder()
            .AppendLine($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] {message}")
            .AppendLine();
        File.AppendAllText(path, logMessage.ToString());
    }
}
