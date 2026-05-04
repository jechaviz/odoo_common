$ErrorActionPreference = "Stop"

$CatalogDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $CatalogDir
$Errors = New-Object System.Collections.Generic.List[string]

function Read-JsonFile {
  param([string] $Path)
  return Get-Content $Path -Raw | ConvertFrom-Json
}

function As-Array {
  param($Value)
  if ($null -eq $Value) {
    return @()
  }
  if ($Value -is [array]) {
    return $Value
  }
  return @($Value)
}

$ComponentsPath = Join-Path $CatalogDir "components.json"
$ProfilesPath = Join-Path $CatalogDir "assembly_profiles.json"
$Components = As-Array (Read-JsonFile $ComponentsPath)
$Profiles = As-Array (Read-JsonFile $ProfilesPath)

$ManifestByKey = @{}
$PackageManifestFiles = Get-ChildItem (Join-Path $Root "packages") -Recurse -Filter manifest.json |
  Where-Object { $_.FullName -notmatch "\\sources\\" }

foreach ($ManifestFile in $PackageManifestFiles) {
  $Manifest = Read-JsonFile $ManifestFile.FullName
  if (-not $Manifest.key) {
    $Errors.Add("manifest without key: $($ManifestFile.FullName)")
    continue
  }
  if ($ManifestByKey.ContainsKey($Manifest.key)) {
    $Errors.Add("duplicate manifest key: $($Manifest.key)")
    continue
  }
  $ManifestByKey[$Manifest.key] = [pscustomobject]@{
    manifest = $Manifest
    path = $ManifestFile.FullName
  }
}

$ComponentByKey = @{}
foreach ($Component in $Components) {
  if (-not $Component.key) {
    $Errors.Add("catalog component without key")
    continue
  }
  if ($ComponentByKey.ContainsKey($Component.key)) {
    $Errors.Add("duplicate catalog component key: $($Component.key)")
    continue
  }
  $ComponentByKey[$Component.key] = $Component

  if (-not $ManifestByKey.ContainsKey($Component.key)) {
    $Errors.Add("catalog component missing package manifest: $($Component.key)")
    continue
  }

  $ManifestEntry = $ManifestByKey[$Component.key]
  $Manifest = $ManifestEntry.manifest
  if ($Manifest.status -and $Component.status -and $Manifest.status -ne $Component.status) {
    $Errors.Add("status mismatch for $($Component.key): manifest=$($Manifest.status), catalog=$($Component.status)")
  }

  $PackagePath = Join-Path $Root $Component.package_path
  if ($Component.package_path -and -not (Test-Path $PackagePath)) {
    $Errors.Add("catalog package_path does not exist for $($Component.key): $($Component.package_path)")
  }

  $OriginProjects = As-Array $Component.origins | ForEach-Object { $_.project } | Select-Object -Unique
  if ($Manifest.origin_project -and $OriginProjects.Count -and ($OriginProjects -notcontains $Manifest.origin_project)) {
    $Errors.Add("origin mismatch for $($Component.key): manifest=$($Manifest.origin_project), catalog=$($OriginProjects -join ',')")
  }

  $CatalogReplacements = As-Array $Component.replacement_components
  $ManifestReplacements = As-Array $Manifest.replacement_components
  if ($CatalogReplacements.Count -and -not $ManifestReplacements.Count) {
    $Errors.Add("manifest missing replacement_components for $($Component.key)")
  }
}

foreach ($ManifestKey in $ManifestByKey.Keys) {
  if (-not $ComponentByKey.ContainsKey($ManifestKey)) {
    $Errors.Add("package manifest missing catalog component: $ManifestKey")
  }

  $Manifest = $ManifestByKey[$ManifestKey].manifest
  foreach ($DependencyKey in (As-Array $Manifest.dependencies)) {
    if (-not $ManifestByKey.ContainsKey($DependencyKey)) {
      $Errors.Add("unknown dependency for ${ManifestKey}: $DependencyKey")
    }
  }

  foreach ($ReplacementKey in (As-Array $Manifest.replacement_components)) {
    if (-not $ManifestByKey.ContainsKey($ReplacementKey)) {
      $Errors.Add("unknown replacement component for ${ManifestKey}: $ReplacementKey")
    }
  }
}

foreach ($Profile in $Profiles) {
  $ProfileComponents = As-Array $Profile.components
  foreach ($ComponentKey in (As-Array $Profile.components)) {
    if (-not $ManifestByKey.ContainsKey($ComponentKey)) {
      $Errors.Add("assembly profile $($Profile.key) references unknown component: $ComponentKey")
      continue
    }
    $Manifest = $ManifestByKey[$ComponentKey].manifest
    foreach ($DependencyKey in (As-Array $Manifest.dependencies)) {
      if ($ProfileComponents -notcontains $DependencyKey) {
        $Errors.Add("assembly profile $($Profile.key) missing dependency for ${ComponentKey}: $DependencyKey")
      }
    }
  }
}

$ConsumerDefinitionsDir = Join-Path $CatalogDir "consumer_definitions"
$ConsumerDefinitionKeys = @{}
if (Test-Path $ConsumerDefinitionsDir) {
  $ConsumerDefinitionFiles = Get-ChildItem $ConsumerDefinitionsDir -Filter *.json
  foreach ($ConsumerDefinitionFile in $ConsumerDefinitionFiles) {
    $Definition = Read-JsonFile $ConsumerDefinitionFile.FullName
    $DefinitionKey = [string] $Definition.key
    if (-not $DefinitionKey.Trim()) {
      $Errors.Add("consumer definition without key: $($ConsumerDefinitionFile.FullName)")
      continue
    }
    if ($ConsumerDefinitionKeys.ContainsKey($DefinitionKey)) {
      $Errors.Add("duplicate consumer definition key: $DefinitionKey")
      continue
    }
    $ConsumerDefinitionKeys[$DefinitionKey] = $true

    $SyncToolComponent = [string] $Definition.sync_tool_component
    if ($SyncToolComponent.Trim()) {
      if (-not $ComponentByKey.ContainsKey($SyncToolComponent)) {
        $Errors.Add("consumer definition $DefinitionKey references unknown sync_tool_component: $SyncToolComponent")
      } elseif ($ComponentByKey[$SyncToolComponent].status -ne "canonical") {
        $Errors.Add("consumer definition $DefinitionKey sync_tool_component is not canonical: $SyncToolComponent")
      }
    }

    $EntryComponentKeys = New-Object System.Collections.Generic.HashSet[string]
    foreach ($Entry in (As-Array $Definition.entries)) {
      $ComponentKey = [string] $Entry.component_key
      if (-not $ComponentKey.Trim()) {
        $Errors.Add("consumer definition $DefinitionKey has entry without component_key")
        continue
      }
      if (-not $EntryComponentKeys.Add($ComponentKey)) {
        $Errors.Add("consumer definition $DefinitionKey has duplicate entry: $ComponentKey")
      }
      if (-not $ComponentByKey.ContainsKey($ComponentKey)) {
        $Errors.Add("consumer definition $DefinitionKey references unknown component: $ComponentKey")
        continue
      }
      if ($ComponentByKey[$ComponentKey].status -ne "canonical") {
        $Errors.Add("consumer definition $DefinitionKey references non-canonical component: $ComponentKey")
      }
      $TargetRelative = ([string] $Entry.target_relative).Replace("\", "/").Trim()
      if (-not $TargetRelative) {
        $Errors.Add("consumer definition $DefinitionKey entry $ComponentKey has empty target_relative")
      }
      if ($TargetRelative.StartsWith("/") -or $TargetRelative.Contains(":") -or $TargetRelative.Split("/") -contains "..") {
        $Errors.Add("consumer definition $DefinitionKey entry $ComponentKey has unsafe target_relative: $TargetRelative")
      }
    }
  }
}

if ($Errors.Count) {
  $Errors | ForEach-Object { Write-Output "ERROR: $_" }
  exit 1
}

Write-Output "OK: catalog validation passed"
