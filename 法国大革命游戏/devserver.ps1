$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$port = 5173

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "Serving $root at http://localhost:$port/"

$contentTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".mp3"  = "audio/mpeg"
  ".json" = "application/json; charset=utf-8"
  ".md"   = "text/markdown; charset=utf-8"
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  try {
    $rawPath = $ctx.Request.Url.AbsolutePath.TrimStart("/")
    $path = [System.Uri]::UnescapeDataString($rawPath)
    if ([string]::IsNullOrWhiteSpace($path)) { $path = "index.html" }
    if ($path -like "*..*") { throw "Bad Request" }

    $file = Join-Path $root $path

    if (Test-Path $file -PathType Leaf) {
      $ext = [IO.Path]::GetExtension($file).ToLowerInvariant()
      if ($contentTypes.ContainsKey($ext)) { $ctx.Response.ContentType = $contentTypes[$ext] }
      else { $ctx.Response.ContentType = "application/octet-stream" }

      $bytes = [IO.File]::ReadAllBytes($file)
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
      $bytes = [Text.Encoding]::UTF8.GetBytes("Not Found")
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    }
  } catch {
    $ctx.Response.StatusCode = 500
    $bytes = [Text.Encoding]::UTF8.GetBytes("Server Error")
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } finally {
    $ctx.Response.OutputStream.Close()
    $ctx.Response.Close()
  }
}

