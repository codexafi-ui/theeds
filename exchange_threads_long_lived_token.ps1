param(
    [string]$ShortLivedAccessToken = "",
    [string]$ClientSecret = ""
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ShortLivedAccessToken)) {
    $ShortLivedAccessToken = Read-Host "Paste current short-lived THREADS_ACCESS_TOKEN"
}
if ([string]::IsNullOrWhiteSpace($ClientSecret)) {
    $ClientSecret = Read-Host "Paste Threads app secret"
}

$response = Invoke-RestMethod -Method Get -Uri "https://graph.threads.net/access_token" -Body @{
    grant_type = "th_exchange_token"
    client_secret = $ClientSecret.Trim()
    access_token = $ShortLivedAccessToken.Trim()
}

Write-Host ""
Write-Host "Long-lived token response:"
Write-Host ("expires_in: " + $response.expires_in)
Write-Host ""
Write-Host "Copy this value into GitHub Secret THREADS_ACCESS_TOKEN:"
Write-Host $response.access_token
Write-Host ""
Write-Host "Keep THREADS_USER_ID unchanged unless your account changed."
