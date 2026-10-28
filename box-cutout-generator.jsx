// =============================================
// PACKDORA BOX GENERATOR v3.0
// Générateur de boîtes pour Adobe Illustrator
// Auteur : Illustrator Script Smith
// Version : 3.0.0
// Date : 28/10/2026
// Compatibilité : Illustrator CC 2020+
// =============================================

#target illustrator

// ===== CONSTANTES =====
var BOX_TYPES = {
    rectangular: "Boîte rectangulaire",
    cube: "Boîte cube",
    rectangular_lid: "Boîte + couvercle",
    window_box: "Boîte à fenêtre"
};

var MATERIALS = {
    kraft_2mm: { name: "Kraft 2mm", thickness: 2 },
    white_cardboard_1_5mm: { name: "Carton blanc 1.5mm", thickness: 1.5 },
    corrugated_3mm: { name: "Ondulé 3mm", thickness: 3 }
};

var FLAP_TYPES = {
    none: "Aucun",
    simple: "Rabats simples",
    double_flap: "Rabats doubles",
    auto_lock: "Auto-verrouillant"
};

// ===== FONCTIONS UTILITAIRES =====
function mmToPt(mm) {
    return mm * 2.83464567; // 1mm = 2.83464567pt
}

function createLayer(doc, name, color) {
    var layer = doc.layers.add();
    layer.name = name;
    layer.color.rgb = color;
    return layer;
}

function drawRect(layer, x, y, width, height, strokeColor) {
    var rect = layer.pathItems.rectangle(y, x, width, height);
    rect.stroked = true;
    rect.strokeColor.rgb = strokeColor;
    rect.filled = false;
    return rect;
}

// ===== GÉNÉRATION DE LA BOÎTE =====
function generateBox(doc, boxType, material, length, width, height, flapType) {
    var thickness = mmToPt(material.thickness);
    var lengthPt = mmToPt(length);
    var widthPt = mmToPt(width);
    var heightPt = mmToPt(height);

    // Créer les calques
    var cutLayer = createLayer(doc, "Découpe", [255, 0, 0]); // Rouge
    var foldLayer = createLayer(doc, "Pliage", [0, 0, 255]); // Bleu

    // Dessiner la base
    drawRect(cutLayer, 0, 0, lengthPt, widthPt, [255, 0, 0]);

    // Dessiner les côtés
    drawRect(cutLayer, 0, widthPt, lengthPt, heightPt, [255, 0, 0]); // Avant
    drawRect(cutLayer, lengthPt, 0, heightPt, widthPt, [255, 0, 0]); // Droite
    drawRect(cutLayer, 0, -heightPt, lengthPt, heightPt, [255, 0, 0]); // Arrière
    drawRect(cutLayer, -heightPt, 0, heightPt, widthPt, [255, 0, 0]); // Gauche

    // Dessiner les rabat (si activé)
    if (flapType !== "none") {
        var flapHeight = mmToPt(20); // Hauteur fixe pour l'exemple
        drawRect(foldLayer, 0, widthPt + heightPt, lengthPt, flapHeight, [0, 0, 255]); // Rabat avant
        drawRect(foldLayer, 0, -heightPt - flapHeight, lengthPt, flapHeight, [0, 0, 255]); // Rabat arrière
        drawRect(foldLayer, lengthPt, 0, flapHeight, widthPt, [0, 0, 255]); // Rabat droite
        drawRect(foldLayer, -heightPt - flapHeight, 0, flapHeight, widthPt, [0, 0, 255]); // Rabat gauche
    }
}

// ===== INTERFACE UTILISATEUR =====
function showDialog() {
    var dialog = new Window("dialog", "Générateur de boîtes");
    dialog.orientation = "column";
    dialog.alignChildren = ["fill", "top"];
    dialog.spacing = 10;
    dialog.margins = 16;

    // Type de boîte
    var typeGroup = dialog.add("group");
    typeGroup.add("statictext", undefined, "Type de boîte:");
    var typeDropdown = typeGroup.add("dropdownlist", undefined);
    for (var key in BOX_TYPES) {
        typeDropdown.add("item", BOX_TYPES[key]);
    }
    typeDropdown.selection = 0;

    // Matériau
    var materialGroup = dialog.add("group");
    materialGroup.add("statictext", undefined, "Matériau:");
    var materialDropdown = materialGroup.add("dropdownlist", undefined);
    for (var matKey in MATERIALS) {
        materialDropdown.add("item", MATERIALS[matKey].name);
    }
    materialDropdown.selection = 0;

    // Dimensions
    var dimGroup = dialog.add("group");
    dimGroup.orientation = "column";
    dimGroup.add("statictext", undefined, "Dimensions (mm):");

    var lengthGroup = dimGroup.add("group");
    lengthGroup.add("statictext", undefined, "Longueur:");
    var lengthInput = lengthGroup.add("edittext", undefined, "100");
    lengthInput.preferredSize = [60, 20];

    var widthGroup = dimGroup.add("group");
    widthGroup.add("statictext", undefined, "Largeur:");
    var widthInput = widthGroup.add("edittext", undefined, "100");
    widthInput.preferredSize = [60, 20];

    var heightGroup = dimGroup.add("group");
    heightGroup.add("statictext", undefined, "Hauteur:");
    var heightInput = heightGroup.add("edittext", undefined, "50");
    heightInput.preferredSize = [60, 20];

    // Type de rabat
    var flapGroup = dialog.add("group");
    flapGroup.add("statictext", undefined, "Type de rabat:");
    var flapDropdown = flapGroup.add("dropdownlist", undefined);
    for (var flapKey in FLAP_TYPES) {
        flapDropdown.add("item", FLAP_TYPES[flapKey]);
    }
    flapDropdown.selection = 1;

    // Boutons
    var buttonGroup = dialog.add("group");
    buttonGroup.orientation = "row";
    buttonGroup.alignment = "right";
    var okButton = buttonGroup.add("button", undefined, "Générer");
    var cancelButton = buttonGroup.add("button", undefined, "Annuler");

    // Logique du bouton OK
    okButton.onClick = function() {
        try {
            var doc = app.activeDocument;
            if (!doc) {
                alert("Aucun document ouvert dans Illustrator.");
                return;
            }

            // Récupérer les valeurs
            var selectedBoxType = Object.keys(BOX_TYPES)[typeDropdown.selection.index];
            var selectedMaterial = Object.keys(MATERIALS)[materialDropdown.selection.index];
            var selectedFlapType = Object.keys(FLAP_TYPES)[flapDropdown.selection.index];

            var length = parseFloat(lengthInput.text) || 100;
            var width = parseFloat(widthInput.text) || 100;
            var height = parseFloat(heightInput.text) || 50;

            generateBox(doc, selectedBoxType, MATERIALS[selectedMaterial], length, width, height, selectedFlapType);
            dialog.close();
        } catch (e) {
            alert("Erreur: " + e.message);
        }
    };

    cancelButton.onClick = function() {
        dialog.close();
    };

    dialog.show();
}

// ===== POINT D'ENTRÉE =====
if (app.documents.length > 0) {
    showDialog();
} else {
    alert("Veuillez ouvrir un document dans Illustrator.");
}
