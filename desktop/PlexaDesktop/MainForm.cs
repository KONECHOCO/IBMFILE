using System.Text.Json;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace PlexaDesktop;

public sealed class MainForm : Form
{
    private readonly WebView2 _web = new() { Dock = DockStyle.Fill, DefaultBackgroundColor = Color.FromArgb(22, 22, 22) };
    private readonly string _dataDir;
    private readonly GatewayProcess _gateway;
    private StoreLicense? _store;

    public MainForm()
    {
        _dataDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PlexaDB");
        Directory.CreateDirectory(_dataDir);
        _gateway = new GatewayProcess(_dataDir);

        Text = "Plexa DB";
        Icon = Icon.ExtractAssociatedIcon(Environment.ProcessPath!);
        BackColor = Color.FromArgb(22, 22, 22);
        ClientSize = new Size(1280, 800);
        MinimumSize = new Size(640, 480);
        StartPosition = FormStartPosition.CenterScreen;
        Controls.Add(_web);
        Shown += async (_, _) => await StartAsync();
        FormClosed += (_, _) => _gateway.Dispose();
    }

    private async Task StartAsync()
    {
        try
        {
            var env = await CoreWebView2Environment.CreateAsync(null, Path.Combine(_dataDir, "WebView2"));
            await _web.EnsureCoreWebView2Async(env);
            _web.CoreWebView2.Settings.AreDevToolsEnabled = false;
            _web.CoreWebView2.WebMessageReceived += OnWebMessage;

            _store = new StoreLicense(Handle, _dataDir);
            var entitlement = await _store.ReadAsync();
            await _gateway.StartAsync(entitlement.ListensOnNetwork);
            await _gateway.PushAsync(entitlement);
            _web.CoreWebView2.Navigate(_gateway.Url);
        }
        catch (Exception ex)
        {
            MessageBox.Show(this, ex.Message, "Plexa DB", MessageBoxButtons.OK, MessageBoxIcon.Error);
            Close();
        }
    }

    private async void OnWebMessage(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        using var doc = JsonDocument.Parse(e.WebMessageAsJson);
        var root = doc.RootElement;
        if (root.GetProperty("type").GetString() != "purchase" || _store == null) return;

        var sku = root.GetProperty("sku").GetString() ?? "";
        var status = await _store.PurchaseAsync(sku);
        if (status == "succeeded")
        {
            await ApplyPurchaseAsync();
            return;
        }
        _web.CoreWebView2.PostWebMessageAsJson(JsonSerializer.Serialize(new { type = "purchase-result", sku, status }));
    }

    private async Task ApplyPurchaseAsync()
    {
        var entitlement = await _store!.ReadAsync();
        // Moving between "this PC" and "office network" needs the gateway restarted.
        if (entitlement.ListensOnNetwork != _gateway.ListensOnNetwork)
            await _gateway.StartAsync(entitlement.ListensOnNetwork);
        await _gateway.PushAsync(entitlement);
        _web.CoreWebView2.Navigate(_gateway.Url);
    }
}
