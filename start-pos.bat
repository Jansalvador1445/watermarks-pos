using System.Diagnostics;
using System.Reflection;
using System.Text;

namespace StartPosLauncher;

internal static class Program
{
    private const string EmbeddedBatchName = "start-pos.bat";
    private const string HelperBatchFileName = ".start-pos.runtime.bat";
    private const string WrapperCmdFileName = ".start-pos.launcher.cmd";
    private const string LauncherLogFileName = "launcher.log";

    [STAThread]
    private static int Main()
    {
        var launcherDirectory = AppContext.BaseDirectory;
        var logsDirectory = Path.Combine(launcherDirectory, "logs");
        var helperBatchPath = Path.Combine(launcherDirectory, HelperBatchFileName);
        var wrapperCmdPath = Path.Combine(launcherDirectory, WrapperCmdFileName);
        var launcherLogPath = Path.Combine(logsDirectory, LauncherLogFileName);

        try
        {
            Directory.CreateDirectory(logsDirectory);

            // Startup cleanup
            KillProcess("mongod");
            KillProcess("server");
            AppendLog(launcherLogPath, "Startup cleanup: killed old MongoDB/server processes.");

            WriteEmbeddedBatchIfNeeded(helperBatchPath);
            WriteWrapperCommand(wrapperCmdPath);

            // Run batch visibly and wait for it to finish
            RunBatchVisibleAndWait(wrapperCmdPath, launcherDirectory);

            // Launch browser after batch exits
            var browserProcess = LaunchBrowser();

            if (browserProcess != null)
            {
                browserProcess.EnableRaisingEvents = true;
                browserProcess.Exited += (s, e) =>
                {
                    KillProcess("mongod");
                    KillProcess("server");
                    AppendLog(launcherLogPath, "Browser closed. MongoDB and server terminated.");
                    Environment.Exit(0);
                };

                browserProcess.WaitForExit();
            }

            return 0;
        }
        catch (Exception exception)
        {
            AppendLog(launcherLogPath, $"Launcher failed to start: {exception}");
            return 1;
        }
    }

    private static void WriteEmbeddedBatchIfNeeded(string helperBatchPath)
    {
        var embeddedBatch = ReadEmbeddedBatch();

        if (File.Exists(helperBatchPath))
        {
            var existingBatch = File.ReadAllBytes(helperBatchPath);
            if (existingBatch.AsSpan().SequenceEqual(embeddedBatch))
            {
                return;
            }
        }

        File.WriteAllBytes(helperBatchPath, embeddedBatch);
    }

    private static byte[] ReadEmbeddedBatch()
    {
        var assembly = Assembly.GetExecutingAssembly();
        var resourceName = assembly.GetManifestResourceNames()
            .FirstOrDefault(name => name.EndsWith(EmbeddedBatchName, StringComparison.OrdinalIgnoreCase));

        if (resourceName is null)
        {
            throw new InvalidOperationException("Embedded launcher batch file was not found.");
        }

        using var resourceStream = assembly.GetManifestResourceStream(resourceName)
            ?? throw new InvalidOperationException("Embedded launcher batch file could not be opened.");

        using var memoryStream = new MemoryStream();
        resourceStream.CopyTo(memoryStream);
        return memoryStream.ToArray();
    }

    private static void WriteWrapperCommand(string wrapperCmdPath)
    {
        var wrapperScript = new StringBuilder()
            .AppendLine("@echo off")
            .AppendLine("set \"STARTPOS_SILENT=1\"")
            .AppendLine("call \".start-pos.runtime.bat\" >> \"logs\\launcher.log\" 2>&1")
            .AppendLine("exit /b %errorlevel%");

        File.WriteAllText(wrapperCmdPath, wrapperScript.ToString(), Encoding.ASCII);
    }

    private static void RunBatchVisibleAndWait(string wrapperCmdPath, string workingDirectory)
    {
        var command = $"/d /c \"\"{wrapperCmdPath}\"\"";

        var startInfo = new ProcessStartInfo
        {
            FileName = "cmd.exe",
            Arguments = command,
            WorkingDirectory = workingDirectory,
            UseShellExecute = false,
            CreateNoWindow = false,   // show window
            WindowStyle = ProcessWindowStyle.Normal
        };

        using var process = Process.Start(startInfo)
            ?? throw new InvalidOperationException("Failed to start the desktop launcher.");

        process.WaitForExit();   // block until batch finishes
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

        // fallback: default browser
        Process.Start(new ProcessStartInfo("cmd", "/c start http://127.0.0.1:5000") { CreateNoWindow = false });
        return null;
    }

    private static void AppendLog(string launcherLogPath, string message)
    {
        var logMessage = new StringBuilder()
            .AppendLine($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] {message}")
            .AppendLine();

        File.AppendAllText(launcherLogPath, logMessage.ToString());
    }

    private static void KillProcess(string name)
    {
        foreach (var proc in Process.GetProcessesByName(name))
        {
            try { proc.Kill(); }
            catch { /* ignore */ }
        }
    }
}
