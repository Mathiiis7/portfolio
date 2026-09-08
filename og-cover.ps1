# Genere og-cover.png, la banniere de partage du portfolio (1200x630).
# Utilisation :  powershell -ExecutionPolicy Bypass -File og-cover.ps1
# Puis : git add og-cover.png && git commit && git push
#
# A relancer a chaque changement de positionnement (nom, categorie, phrase),
# sinon les apercus LinkedIn continuent d afficher l ancien texte.
#
# Reconstruit le 08/09/2026 : le script d origine avait ete perdu.

Add-Type -AssemblyName System.Drawing

# mesure typographique stricte : sans elle, MeasureString ajoute des marges
# laterales qui faussent l interlettrage et collent les mots.

# ---------------------------------------------------------------- contenu
$NOM        = "Mathis Burgevin"
$CATEGORIE  = "AMÉNAGEMENT DU TERRITOIRE"
$PHRASE     = "Ingénieur en aménagement du territoire. Compétence forte en SIG et traitement de données, appliquée à l'aménagement, à la mobilité et aux réseaux."
$PHOTO      = "mathis.jpeg"
$SORTIE     = "og-cover.png"

# ---------------------------------------------------------------- palette (identique a style.css)
$FOND    = [System.Drawing.Color]::FromArgb(250,250,247)   # --bg
$CARTE   = [System.Drawing.Color]::White
$BORDURE = [System.Drawing.Color]::FromArgb(230,228,222)   # --border
$ENCRE   = [System.Drawing.Color]::FromArgb(26,26,26)      # --fg
$GRIS    = [System.Drawing.Color]::FromArgb(102,102,102)   # --muted
$TEXTE   = [System.Drawing.Color]::FromArgb(51,51,51)
$ACCENT  = [System.Drawing.Color]::FromArgb(26,79,138)     # --link
$BEIGE   = [System.Drawing.Color]::FromArgb(224,201,167)   # fond du cercle photo

# ---------------------------------------------------------------- geometrie
$L=1200; $H=630
$CARTE_X=51; $CARTE_Y=51; $CARTE_L=1096; $CARTE_H=526
$CERCLE_CX=300; $CERCLE_CY=315; $CERCLE_D=341
$COL_X=530                       # bord gauche de la colonne de texte
$NOM_Y=166                       # origine de dessin du nom
$FILET_Y=259; $FILET_L=47; $FILET_EP=2
$CAT_Y=277
$PHRASE_Y=331; $PHRASE_INTERLIGNE=32; $PHRASE_LARGEUR=480

# ---------------------------------------------------------------- rendu
$img = New-Object System.Drawing.Bitmap($L,$H)
$g = [System.Drawing.Graphics]::FromImage($img)
$g.SmoothingMode='AntiAlias'; $g.TextRenderingHint='AntiAliasGridFit'
$FMT=[System.Drawing.StringFormat]::GenericTypographic
$FMT.FormatFlags=$FMT.FormatFlags -bor [System.Drawing.StringFormatFlags]::MeasureTrailingSpaces
$g.InterpolationMode='HighQualityBicubic'; $g.PixelOffsetMode='HighQuality'

$g.Clear($FOND)
$g.FillRectangle((New-Object System.Drawing.SolidBrush($CARTE)),$CARTE_X,$CARTE_Y,$CARTE_L,$CARTE_H)
$g.DrawRectangle((New-Object System.Drawing.Pen($BORDURE,1)),$CARTE_X,$CARTE_Y,$CARTE_L,$CARTE_H)

# photo, detouree en cercle sur fond beige
$g.FillEllipse((New-Object System.Drawing.SolidBrush($BEIGE)),($CERCLE_CX-$CERCLE_D/2),($CERCLE_CY-$CERCLE_D/2),$CERCLE_D,$CERCLE_D)
if (Test-Path $PHOTO) {
  $octets=[System.IO.File]::ReadAllBytes($PHOTO); $ms=New-Object System.IO.MemoryStream(,$octets)
  $ph=[System.Drawing.Image]::FromStream($ms)
  $chemin=New-Object System.Drawing.Drawing2D.GraphicsPath
  $chemin.AddEllipse(($CERCLE_CX-$CERCLE_D/2),($CERCLE_CY-$CERCLE_D/2),$CERCLE_D,$CERCLE_D)
  $g.SetClip($chemin)
  # cadrage : on remplit le cercle en conservant les proportions
  $ech=[Math]::Max($CERCLE_D/$ph.Width,$CERCLE_D/$ph.Height)
  $pl=[int]($ph.Width*$ech); $phh=[int]($ph.Height*$ech)
  $g.DrawImage($ph,($CERCLE_CX-$pl/2),($CERCLE_CY-$phh/2),$pl,$phh)
  $g.ResetClip(); $chemin.Dispose(); $ph.Dispose(); $ms.Dispose()
} else { Write-Warning "photo introuvable : $PHOTO" }

# nom, en serif (Fraunces sur le site, Georgia en repli local)
$fNom=New-Object System.Drawing.Font("Georgia",69,[System.Drawing.FontStyle]::Regular,[System.Drawing.GraphicsUnit]::Pixel)
$g.DrawString($NOM,$fNom,(New-Object System.Drawing.SolidBrush($ENCRE)),$COL_X,$NOM_Y)

# filet d accent
$g.FillRectangle((New-Object System.Drawing.SolidBrush($ACCENT)),$COL_X,$FILET_Y,$FILET_L,$FILET_EP)

# categorie, capitales avec interlettrage manuel (GDI+ ne gere pas le tracking)
$fCat=New-Object System.Drawing.Font("Segoe UI",16,[System.Drawing.FontStyle]::Regular,[System.Drawing.GraphicsUnit]::Pixel)
$bCat=New-Object System.Drawing.SolidBrush($GRIS)
$x=$COL_X
foreach($ch in $CATEGORIE.ToCharArray()){
  $s=[string]$ch
  $g.DrawString($s,$fCat,$bCat,$x,$CAT_Y)
  $x += $g.MeasureString($s,$fCat,[System.Drawing.PointF]::Empty,$FMT).Width + 1.75   # +1.75 : interlettrage
}

# phrase, decoupee a la largeur voulue
$fTxt=New-Object System.Drawing.Font("Segoe UI",24,[System.Drawing.FontStyle]::Regular,[System.Drawing.GraphicsUnit]::Pixel)
$bTxt=New-Object System.Drawing.SolidBrush($TEXTE)
$lignes=@(); $courante=""
foreach($mot in ($PHRASE -split ' ')){
  $essai = if($courante -eq ""){$mot}else{"$courante $mot"}
  if($g.MeasureString($essai,$fTxt,[System.Drawing.PointF]::Empty,$FMT).Width -gt $PHRASE_LARGEUR -and $courante -ne ""){ $lignes+=$courante; $courante=$mot }
  else { $courante=$essai }
}
if($courante -ne ""){ $lignes+=$courante }
$y=$PHRASE_Y
foreach($l in $lignes){ $g.DrawString($l,$fTxt,$bTxt,($COL_X+1),$y); $y+=$PHRASE_INTERLIGNE }

# ---------------------------------------------------------------- ecriture
$mo=New-Object System.IO.MemoryStream
$img.Save($mo,[System.Drawing.Imaging.ImageFormat]::Png)
[System.IO.File]::WriteAllBytes((Join-Path (Get-Location) $SORTIE),$mo.ToArray())
$mo.Dispose(); $g.Dispose(); $img.Dispose()
Write-Output "$SORTIE genere ($($lignes.Count) lignes de texte)"
Write-Output "Penser a compresser sans perte :  oxipng -o max --strip safe $SORTIE"
Write-Output "Puis :  git add $SORTIE && git commit -m "Banniere de partage regeneree" && git push"
