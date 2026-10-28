// =============================================
// PACKDORA BOX GENERATOR v2.2
// Générateur de boîtes pour Adobe Illustrator
// Auteur : Illustrator Script Smith
// Version : 2.2.0
// Date : 28/10/2026
// Compatibilité : Illustrator CC 2020+
// =============================================

#target illustrator

// ===== CONSTANTES =====
var BOX_TYPES = {
    "rectangular": { name: "Boîte rectangulaire", hasFlaps: true, hasLid: false },
    "cube": { name: "Boîte cube", hasFlaps: true, hasLid: false },
    "rectangular_lid": { name: "Boîte + couvercle", hasFlaps: true, hasLid: true },
    "window_box": { name: "Boîte à fenêtre", hasFlaps: true, hasWindow: true },
    "gable": { name: "Boîte à anses", hasHandle: true },
    "compartments_4": { name: "Boîte 4 compartiments", compartments: 4 }
};

var MATERIALS = {
    "kraft_2mm": { name: "Kraft 2mm", thickness: 2, color: [150, 100, 50] },
    "white_cardboard_1.5mm": { name: "Carton blanc 1.5mm", thickness: 1.5, color: [240, 240, 240] },
    "corrugated_3mm": { name: "Ondulé 3mm", thickness: 3, color: [200, 180, 150] },
    "acrylic_2mm": { name: "Acrylique 2mm", thickness: 2, color: [200, 220, 255] }
};

var FLAP_TYPES = {
    "none": { name: "Aucun", factor: 0 },
    "simple": { name: "Rabats simples", factor: 1 },
    "double_flap": { name: "Rabats doubles", factor: 2 },
    "auto_lock": { name: "Auto-verrouillant", factor: 1.5 }
};

var WINDOW_SHAPES = {
    "none": "Aucune",
    "square": "Carrée",
    "circle": "Ronde"
};

// ===== FONCTIONS UTILITAIRES =====
function mmToPt(mm) {
    return mm * 2.83464567; // Conversion mm → pt
}

function createLayer(doc, name, color) {
    var layer = doc.layers.add();
    layer.name = name;
    layer.color.rgb = color;
    return layer;
}

function drawRect(layer, x, y, width, height, strokeColor, fillColor) {
    var rect = layer.pathItems.rectangle(y, x, width, height);
    rect.stroked = true;
    rect.strokeColor.rgb = strokeColor;
    rect.filled = (fillColor !== undefined);
    if (fillColor) rect.fillColor.rgb = fillColor;
    return rect;
}

function drawCircle(layer, cx, cy, radius, strokeColor) {
    var circle = layer.pathItems.ellipse(cy, cx, radius * 2, radius * 2);
    circle.stroked = true;
    circle.strokeColor.rgb = strokeColor;
    circle.filled = false;
    return circle;
}

// ===== GÉNÉRATION DES BOÎTES =====
function generateBox(doc, boxType, material, dimensions, flapType, options) {
    var length = mmToPt(dimensions.length);
    var width = mmToPt(dimensions.width);
    var height = mmToPt(dimensions.height);
    var thickness = mmToPt(material.thickness);

    // Créer les calques
    var cutLayer = createLayer(doc, "Découpe", [255, 0, 0]);    // Rouge
    var foldLayer = createLayer(doc, "Pliage", [0, 0, 255]);    // Bleu
    var guideLayer = createLayer(doc, "Guides", [0, 255, 0]);   // Vert

    // Générer selon le type de boîte
    switch (boxType) {
        case "rectangular":
        case "rectangular_lid":
            generateRectangularBox(cutLayer, foldLayer, guideLayer, length, width, height, thickness, flapType, options);
            if (boxType === "rectangular_lid") {
                generateLid(cutLayer, foldLayer, length, width, height, thickness, flapType);
            }
            break;
        case "cube":
            generateRectangularBox(cutLayer, foldLayer, guideLayer, length, length, height, thickness, flapType, options);
            break;
        case "window_box":
            generateWindowBox(cutLayer, foldLayer, guideLayer, length, width, height, thickness, flapType, options);
            break;
    }
}

// Génère une boîte rectangulaire
function generateRectangularBox(cutLayer, foldLayer, guideLayer, length, width, height, thickness, flapType, options) {
    // Base
    drawRect(cutLayer, 0, 0, length, width, [255, 0, 0], null);

    // Côtés (avant, droite, arrière, gauche)
    var sideHeight = height;
    drawRect(cutLayer, 0, width, length, sideHeight, [255, 0, 0], null);          // Avant
    drawRect(cutLayer, length, 0, sideHeight, width, [255, 0, 0], null);         // Droite
    drawRect(cutLayer, 0, -sideHeight, length, sideHeight, [255, 0, 0], null);   // Arrière
    drawRect(cutLayer, -sideHeight, 0, sideHeight, width, [255, 0, 0], null);  // Gauche

    // Rabats (si activé)
    if (flapType !== "none") {
        var flapHeight = flapType.factor * thickness;
        // Rabats avant/arrière
        drawRect(foldLayer, 0, width + sideHeight, length, flapHeight, [0, 0, 255], null);
        drawRect(foldLayer, 0, -sideHeight - flapHeight, length, flapHeight, [0, 0, 255], null);
        // Rabats gauche/droite
        drawRect(foldLayer, length, 0, flapHeight, width, [0, 0, 255], null);
        drawRect(foldLayer, -sideHeight - flapHeight, 0, flapHeight, width, [0, 0, 255], null);
    }
}

// Génère un couvercle
function generateLid(cutLayer, foldLayer, length, width, height, thickness, flapType) {
    var lidLength = length + 2 * thickness;
    var lidWidth = width + 2 * thickness;
    var lidHeight = height * 0.3; // Hauteur du couvercle (30% de la boîte)

    // Base du couvercle
    drawRect(cutLayer, length + 10, width + 10, lidLength, lidWidth, [255, 0, 0], null);

    // Côtés du couvercle
    drawRect(cutLayer, length + 10, width + 10 + lidWidth, lidLength, lidHeight, [255, 0, 0], null); // Avant
    drawRect(cutLayer, length + 10 + lidLength, width + 10, lidHeight, lidWidth, [255, 0, 0], null); // Droite
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
    typeGroup.add("statictext", undefined, "Type de boîte :");
    var typeDropdown = typeGroup.add("dropdownlist", undefined, ["Boîte rectangulaire", "Boîte cube", "Boîte + couvercle", "Boîte à fenêtre
