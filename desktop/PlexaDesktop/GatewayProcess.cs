using System.ComponentModel;
using System.Diagnostics;
using System.Net;
using System.Net.Http.Json;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Security.Cryptography;

namespace PlexaDesktop;

/// Runs the bundled Plexa DB gateway (PyInstaller build + Java runtime for IBM i).
public sealed class GatewayProcess : IDisposable
{
    private const int PreferredPort = 8787;

    private readonly string _dataDir;
    private readonly string _appDir = AppContext.BaseDirectory;
    private readonly string _token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
    private readonly HttpClient _http = new() { Timeout = TimeSpan.FromSeconds(5) };
    private readonly IntPtr _job = CreateKillOnCloseJob();
    private Process? _process;

    public int Port { get; private set; }
    public string Url => $"http://127.0.0.1:{Port}/";
    public bool ListensOnNetwork { get; private set; }

    public GatewayProcess(string dataDir) => _dataDir = dataDir;

    public async Task StartAsync(bool listenOnNetwork)
    {
        Stop();
        ListensOnNetwork = listenOnNetwork;
        Port = PortIsFree(PreferredPort) ? PreferredPort : FreePort();

        var info = new ProcessStartInfo(Path.Combine(_appDir, "gateway", "plexa-gateway.exe"))
        {
            UseShellExecute = false,
            CreateNoWindow = true,
            WorkingDirectory = _dataDir,
        };
        var env = info.Environment;
        env["PLEXA_STORE_MODE"] = "1";
        env["PLEXA_SHELL_TOKEN"] = _token;
        env["PLEXA_HOST"] = listenOnNetwork ? "0.0.0.0" : "127.0.0.1";
        env["PLEXA_PORT"] = Port.ToString();
        env["PLEXA_DATA_DIR"] = _dataDir;
        env["PLEXA_WEB_DIST"] = Path.Combine(_appDir, "web");
        env["PLEXA_JT400_JAR"] = Path.Combine(_appDir, "gateway-lib", "jt400.jar");
        env["JAVA_HOME"] = Path.Combine(_appDir, "jre");

        _process = Process.Start(info) ?? throw new InvalidOperationException("The gateway did not start.");
        AssignProcessToJobObject(_job, _process.Handle);
        await WaitUntilReadyAsync();
    }

    public async Task PushAsync(Entitlement entitlement)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, $"{Url}api/internal/store-license")
        {
            Content = JsonContent.Create(new { plan = entitlement.Plan, expires = entitlement.Expires }),
        };
        request.Headers.Add("X-Plexa-Shell-Token", _token);
        (await _http.SendAsync(request)).EnsureSuccessStatusCode();
    }

    private async Task WaitUntilReadyAsync()
    {
        for (var i = 0; i < 240; i++)
        {
            if (_process is { HasExited: true })
                throw new InvalidOperationException($"The gateway stopped with code {_process.ExitCode}.");
            try
            {
                if ((await _http.GetAsync($"{Url}api/health")).IsSuccessStatusCode) return;
            }
            catch (HttpRequestException) { }
            catch (TaskCanceledException) { }
            await Task.Delay(250);
        }
        throw new TimeoutException("The gateway did not answer within 60 seconds.");
    }

    private void Stop()
    {
        if (_process is { HasExited: false })
        {
            _process.Kill(entireProcessTree: true);
            _process.WaitForExit(5000);
        }
        _process?.Dispose();
        _process = null;
    }

    public void Dispose()
    {
        Stop();
        _http.Dispose();
    }

    // Checked on both addresses: another program may hold the port on 127.0.0.1 only,
    // and Windows would still let us bind 0.0.0.0.
    private static bool PortIsFree(int port) => CanBind(IPAddress.Loopback, port) && CanBind(IPAddress.Any, port);

    private static bool CanBind(IPAddress address, int port)
    {
        try
        {
            var listener = new TcpListener(address, port);
            listener.Start();
            listener.Stop();
            return true;
        }
        catch (SocketException)
        {
            return false;
        }
    }

    private static int FreePort()
    {
        var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        var port = ((IPEndPoint)listener.LocalEndpoint).Port;
        listener.Stop();
        return port;
    }

    // ── Job object: Windows ends the gateway even if this app crashes ──────────

    private static IntPtr CreateKillOnCloseJob()
    {
        var job = CreateJobObject(IntPtr.Zero, null);
        if (job == IntPtr.Zero) throw new Win32Exception();
        var limits = new JOBOBJECT_EXTENDED_LIMIT_INFORMATION();
        limits.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
        var size = Marshal.SizeOf(limits);
        var ptr = Marshal.AllocHGlobal(size);
        try
        {
            Marshal.StructureToPtr(limits, ptr, false);
            if (!SetInformationJobObject(job, JobObjectExtendedLimitInformation, ptr, (uint)size)) throw new Win32Exception();
        }
        finally
        {
            Marshal.FreeHGlobal(ptr);
        }
        return job;
    }

    private const int JobObjectExtendedLimitInformation = 9;
    private const uint JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE = 0x2000;

    [StructLayout(LayoutKind.Sequential)]
    private struct JOBOBJECT_BASIC_LIMIT_INFORMATION
    {
        public long PerProcessUserTimeLimit, PerJobUserTimeLimit;
        public uint LimitFlags;
        public UIntPtr MinimumWorkingSetSize, MaximumWorkingSetSize;
        public uint ActiveProcessLimit;
        public UIntPtr Affinity;
        public uint PriorityClass, SchedulingClass;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct IO_COUNTERS
    {
        public ulong ReadOperationCount, WriteOperationCount, OtherOperationCount, ReadTransferCount, WriteTransferCount, OtherTransferCount;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct JOBOBJECT_EXTENDED_LIMIT_INFORMATION
    {
        public JOBOBJECT_BASIC_LIMIT_INFORMATION BasicLimitInformation;
        public IO_COUNTERS IoInfo;
        public UIntPtr ProcessMemoryLimit, JobMemoryLimit, PeakProcessMemoryUsed, PeakJobMemoryUsed;
    }

    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    private static extern IntPtr CreateJobObject(IntPtr attributes, string? name);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool SetInformationJobObject(IntPtr job, int infoClass, IntPtr info, uint length);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool AssignProcessToJobObject(IntPtr job, IntPtr process);
}
