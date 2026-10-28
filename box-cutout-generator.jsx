// =============================================
// PACKDORA BOX GENERATOR v2.3
// Générateur de boîtes pour Adobe Illustrator
// Auteur : Illustrator Script Smith
// Version : 2.3.0
// Date : 28/10/2026
// Compatibilité : Illustrator CC 2020+
// =============================================

#target illustrator

// ===== CONSTANTES =====
var BOX_TYPES = {
    "rectangular": { name: "Boîte rectangulaire", hasFlaps: true, hasLid: false },
    "cube": { name: "Boîte cube", hasFlaps: true, hasLid: false },
    "rectangular_lid": { name: "Boîte + couvercle", hasFlaps: true, hasLid: true },
    "window_box": { name: "Boîte à fenêtre", hasFlaps: true, hasWindow: true }
};

var MATERIALS = {
    "kraft_2mm": { name: "Kraft 2mm", thickness: 2, color: [150, 100, 50] },
    "white_cardboard_1.5mm": { name: "Carton blanc 1.5mm", thickness: 1.5, color: [240, 240, 240] },
    "corrugated_3mm": { name: "Ondulé 3mm", thickness: 3, color: [200, 180, 150] }
};

var FLAP_TYPES = {
    "none": { name: "Aucun", factor: 0 },
    "simple": { name: "Rabats simples", factor: 1 },
    "double_flap": { name: "Rabats doubles", factor: 2 },
    "auto_lock": { name: "Auto-verrouillant", factor: 1.5 }
};

// ===== FONCTIONS UTILITAIRES =====
function mmToPt(mm) {
    return mm * 2.83464567;
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

// ===== GÉNÉRATION DES BOÎTES =====
function generateRectangularBox(cutLayer, foldLayer, length, width, height, thickness, flapType) {
    // Base
    drawRect(cutLayer, 0, 0, length, width, [255, 0, 0]);

    // Côtés
    drawRect(cutLayer, 0, width, length, height, [255, 0, 0]); // Avant
    drawRect(cutLayer, length, 0, height, width, [255, 0, 0]); // Droite
    drawRect(cutLayer, 0, -height, length, height, [255, 0, 0]); // Arrière
    drawRect(cutLayer, -height, 0, height, width, [255, 0, 0]); // Gauche

    // Rabats
    if (flapType !== "none") {
        var flapHeight = flapType.factor * thickness;
        drawRect(foldLayer, 0, width + height, length, flapHeight, [0, 0, 255]); // Rabat avant
        drawRect(foldLayer, 0, -height - flapHeight, length, flapHeight, [0, 0, 255]); // Rabat arrière
        drawRect(foldLayer, length, 0, flapHeight, width, [0, 0, 255]); // Rabat droite
        drawRect(foldLayer, -height - flapHeight, 0, flapHeight, width, [0, 0, 255]); // Rabat gauche
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
    var typeDropdown = typeGroup.add("dropdownlist", undefined, ["Boîte rectangulaire", "Boîte cube", "Boîte + couvercle", "Boîte à fenêtre"]);
    typeDropdown.selection = 0;

    // Matériau
    var materialGroup = dialog.add("group");
    materialGroup.add("statictext", undefined, "Matériau:");
    var materialDropdown = materialGroup.add("dropdownlist", undefined, ["Kraft 2mm", "Carton blanc 1.5mm", "Ondulé 3mm"]);
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
    var flapDropdown = flapGroup.add("dropdownlist", undefined, ["Aucun", "Rabats simples", "Rabats doubles", "Auto-verrouillant"]);
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
                alert("Aucun document ouvert!");
                return;
            }

            var boxTypeKey = Object.keys(BOX_TYPES)[typeDropdown.selection.index];
            var materialKey = Object.keys(MATERIALS)[materialDropdown.selection.index];
            var flapTypeKey = Object.keys(FLAP_TYPES)[flapDropdown.selection.index];

            var dimensions = {
                length: parseFloat(lengthInput.text) || 100,
                width: parseFloat(widthInput.text) || 100,
                height: parseFloat(heightInput.text) || 50
            };

            var material = MATERIALS[materialKey];
            var thickness = mmToPt(material.thickness);

            // Créer les calques
            var cutLayer = createLayer(doc, "Découpe", [255, 0, 0]);
            var foldLayer = createLayer(doc, "Pliage", [0, 0, 255]);

            // Générer la boîte
            generateRectangularBox(
                cutLayer,
                foldLayer,
                mmToPt(dimensions.length),
                mmToPt(dimensions.width),
                mmToPt(dimensions.height),
                thickness,
                FLAP_TYPES[flapTypeKey]
            );

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
function main() {
    if (app.documents.length === 0) {
        alert("Veuillez ouvrir un document dans Illustrator.");
        return;
    }
    showDialog();
}

// Exécuter le script
main();
