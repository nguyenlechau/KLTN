$baseUrl = "http://localhost:4000/api"

# Step 1: Create a test user
Write-Host "=== Step 1: Creating test user ===" -ForegroundColor Cyan
$createUserUrl = "$baseUrl/users"
$userPayload = @{
    email = "frank@example.com"
    fullName = "Frank Test"
    password = "test1234"
    role = "REQUESTER"
} | ConvertTo-Json

Write-Host "POST $createUserUrl"
Write-Host "Payload: $userPayload"

try {
    $createResponse = Invoke-WebRequest -Uri $createUserUrl -Method POST 
        -ContentType "application/json" 
        -Body $userPayload -ErrorAction Stop
    
    Write-Host "Status Code: $($createResponse.StatusCode)" -ForegroundColor Green
    $createData = $createResponse.Content | ConvertFrom-Json
    Write-Host "Response:
$($createData | ConvertTo-Json)" -ForegroundColor Green
    
    # Extract token if available
    $token = $createData.token
    Write-Host "Token: $token" -ForegroundColor Yellow
}
catch {
    Write-Host "Error creating user: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response.Content)" -ForegroundColor Red
    exit 1
}

# Step 2: Get all users
Write-Host "
=== Step 2: Retrieving all users ===" -ForegroundColor Cyan
$getUsersUrl = "$baseUrl/users"
Write-Host "GET $getUsersUrl"

try {
    $headers = @{}
    if ($token) {
        $headers["Authorization"] = "Bearer $token"
        Write-Host "Using token for authentication" -ForegroundColor Yellow
    }
    
    $getResponse = Invoke-WebRequest -Uri $getUsersUrl -Method GET 
        -Headers $headers -ErrorAction Stop
    
    Write-Host "Status Code: $($getResponse.StatusCode)" -ForegroundColor Green
    $getData = $getResponse.Content | ConvertFrom-Json
    Write-Host "Response:
$($getData | ConvertTo-Json -Depth 10)" -ForegroundColor Green
    
    # Count users
    if ($getData -is [array]) {
        Write-Host "Total users: $($getData.Count)" -ForegroundColor Cyan
    } else {
        Write-Host "Total users: 1" -ForegroundColor Cyan
    }
}
catch {
    Write-Host "Error retrieving users: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response.Content)" -ForegroundColor Red
    exit 1
}

Write-Host "
=== Test completed successfully ===" -ForegroundColor Green
