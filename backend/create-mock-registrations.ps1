$base='http://localhost:4000/api'
$token='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItcmVxdWVzdGVyIiwiZW1haWwiOiJyZXF1ZXN0ZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoiUkVRVUVTVEVSIiwiY2hhbm5lbElkcyI6W10sImlhdCI6MTc3ODAwNDc5MSwiZXhwIjoxNzc4MDQ3OTkxfQ.KZSlChQyfRw0wvuYS1pz2yNFaSpCv7s679TYbAuJ75I'
$headers=@{ Authorization = "Bearer $token" }

try {
  $channels = Invoke-RestMethod -Uri "$base/master/channels" -Headers $headers -UseBasicParsing
  $locations = Invoke-RestMethod -Uri "$base/master/locations" -Headers $headers -UseBasicParsing
  $categories = Invoke-RestMethod -Uri "$base/master/categories" -Headers $headers -UseBasicParsing
  $items = Invoke-RestMethod -Uri "$base/physical-items" -Headers $headers -UseBasicParsing
} catch {
  Write-Host ('Failed to fetch master data: {0}' -f $_)
  exit 1
}

$ch = $channels[0].id
$loc = $locations[0].id
$cat = $categories[0].id
$candidates = $items | Where-Object { $_.channel_id -eq $ch -and $_.location_id -eq $loc -and $_.category_id -eq $cat }
if (-not $candidates -or $candidates.Count -eq 0) { $candidates = $items | Where-Object { $_.channel_id -eq $ch } }

for ($i=0; $i -lt 3; $i++) {
  $sel = @()
  if ($candidates -and $candidates.Count -gt 0) { $sel = $candidates | Select-Object -First 2 | ForEach-Object { $_.id } }
  else { $sel = $items | Select-Object -First 1 | ForEach-Object { $_.id } }

  $body = @{
    campaignName = "Mock Campaign $i $(Get-Random -Maximum 99999)"
    budgetEstimate = 1000000 + $i*100000
    startDate = (Get-Date).ToString('yyyy-MM-dd')
    endDate = (Get-Date).AddDays(7).ToString('yyyy-MM-dd')
    documentKey = "MOCK-$i"
    representativeName = "Auto Tester"
    representativePhone = "0123456789"
    contentMode = "NEW"
    newContent = @{
      channelId = $ch
      categoryId = $cat
      name = "Auto Content $i"
      startDate = (Get-Date).ToString('yyyy-MM-dd')
      endDate = (Get-Date).AddDays(7).ToString('yyyy-MM-dd')
      imageKeys = @()
    }
    selectedItemIds = $sel
  }

  try {
    Invoke-RestMethod -Uri "$base/registrations" -Method Post -Headers $headers -Body (ConvertTo-Json $body -Depth 5) -ContentType 'application/json' -UseBasicParsing
    Write-Host "Created mock registration $i"
  } catch {
    Write-Host ('Failed to create mock registration {0}: {1}' -f $i, $_)
  }
}

Write-Host "Done"
