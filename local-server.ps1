param(
  [int]$Port = 8000,
  [string]$Root = "C:\Users\eisen\Spendly"
)

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add(("http://127.0.0.1:{0}/" -f $Port))
$listener.Start()

Write-Host ("LISTENING http://127.0.0.1:{0}/ (root: {1})" -f $Port, $Root)

function Get-ContentType([string]$path) {
  switch ([IO.Path]::GetExtension($path).ToLowerInvariant()) {
    ".html" { "text/html; charset=utf-8" }
    ".js"   { "text/javascript; charset=utf-8" }
    ".css"  { "text/css; charset=utf-8" }
    ".json" { "application/json; charset=utf-8" }
    ".svg"  { "image/svg+xml" }
    ".png"  { "image/png" }
    ".jpg"  { "image/jpeg" }
    ".jpeg" { "image/jpeg" }
    ".webp" { "image/webp" }
    default { "application/octet-stream" }
  }
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  try {
    $relative = $ctx.Request.Url.AbsolutePath.TrimStart("/")
    if ([string]::IsNullOrWhiteSpace($relative)) { $relative = "expense-tracker.html" }

    $filePath = Join-Path $Root $relative

    if (Test-Path -LiteralPath $filePath) {
      $bytes = [IO.File]::ReadAllBytes($filePath)
      $ctx.Response.StatusCode = 200
      $ctx.Response.ContentType = (Get-ContentType $filePath)
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
    }
  } catch {
    $ctx.Response.StatusCode = 500
  } finally {
    try { $ctx.Response.Close() } catch {}
  }
}

